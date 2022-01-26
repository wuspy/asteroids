import { ISize } from "@pixi/math";
import { InputState, createEmptyInput } from "./InputProvider";

export type InputLogConfig<Controls extends readonly string[]> = {
    [Key in Controls[number]]: {
        code: string;
        type: "action" | "momentary" | "analog";
    };
};

export class GameLog<Controls extends readonly string[]> {
    private _lastElapsed100uS: number;
    private _lastElapsedCount: number;
    private _lastAnalogInputs: { [Key in string]: number };
    private _lastMomentaryInputs: { [Key in string]: number };
    private _lastWorldSize: ISize;
    private _log: string;
    private _inputLogConfig: InputLogConfig<Controls>;

    constructor(initialWorldSize: Readonly<ISize>, inputLogConfig: InputLogConfig<Controls>) {
        validateInputCodes(inputLogConfig);
        this._lastWorldSize = { width: 0, height: 0 };
        this._lastElapsed100uS = 0;
        this._lastElapsedCount = 0;
        this._lastAnalogInputs = {};
        this._lastMomentaryInputs = {};
        this._log = "";
        this._inputLogConfig = inputLogConfig;

        const initialInput = createEmptyInput(Object.keys(inputLogConfig) as any as Controls);
        this.logFrame(0, initialInput, initialWorldSize);
    }

    logFrame(elapsedMS: number, input: InputState<Controls>, worldSize: Readonly<ISize>): [number, InputState<Controls>] {
        const elapsed100uS = Math.min(1295, Math.round(elapsedMS * 10));
        if (this._lastElapsed100uS !== elapsed100uS) {
            this.writeElapsed();
        }
        this._lastElapsedCount++;
        this._lastElapsed100uS = elapsed100uS;

        this.logWorldSize(worldSize);

        for (const [control, { code, type }] of Object.entries(this._inputLogConfig) as [Controls[number], InputLogConfig<Controls>[Controls[number]]][]) {
            if (type === "action") {
                this.logActionInput(code, input[control]);
            } else if (type === "analog") {
                this.logAnalogInput(code, input[control]);
            } else if (type === "momentary") {
                this.logMomentaryInput(code, input[control]);
            }
        }

        return [elapsed100uS / 10, input];
    }

    flush(): void {
        this.writeElapsed();
    }

    get log(): string {
        return this._log;
    }

    private logWorldSize(size: ISize): void {
        if (this._lastWorldSize.width !== size.width || this._lastWorldSize.height !== size.height) {
            this.writeElapsed();
            this._log += `[${size.width.toString(36)},${size.height.toString(36)}]`;
            this._lastWorldSize = { ...size };
        }
    }

    private logAnalogInput(inputCode: string, value: number): number {
        const clampedValue = Math.round(value * 17) + 17;
        if (clampedValue !== this._lastAnalogInputs[inputCode] || 0) {
            this.writeElapsed();
            this._log += `${inputCode}${clampedValue.toString(36)}`;
            this._lastAnalogInputs[inputCode] = clampedValue;
        }
        return (clampedValue - 17) / 17;
    }

    private logActionInput(inputCode: string, value: number): void {
        if (value) {
            this.writeElapsed();
            this._log += inputCode;
        }
    }

    private logMomentaryInput(inputCode: string, value: number): void {
        if (value !== this._lastMomentaryInputs[inputCode] || 0) {
            this.writeElapsed();
            this._log += inputCode;
            this._lastMomentaryInputs[inputCode] = value;
        }
    }

    private writeElapsed(): void {
        if (this._lastElapsedCount) {
            this._log += this._lastElapsed100uS.toString(36).padStart(2, "0");
            if (this._lastElapsedCount > 1) {
                this._log += `*${Math.min(35, this._lastElapsedCount).toString(36)}`;
                this._lastElapsedCount = Math.max(0, this._lastElapsedCount - 35);
                this.writeElapsed();
            } else {
                this._lastElapsedCount = 0;
            }
        }
    }
}

export function* parseGameLog<Controls extends readonly string[]>(
    log: string,
    inputLogConfig: InputLogConfig<Controls>,
): Generator<[number, Readonly<ISize>, Readonly<InputState<Controls>>, number]> {
    validateInputCodes(inputLogConfig);
    const input = createEmptyInput(Object.keys(inputLogConfig) as any as Controls);
    const worldSize: ISize = { width: 0, height: 0 };
    for (let i = 0; i < log.length;) {
        // Parse time elapsed
        let token = log.slice(i++, ++i);
        if (!isBase36Digit(token.charCodeAt(0)) || !isBase36Digit(token.charCodeAt(1))) {
            throw new Error(`Expected a 2-digit base-36 number, got '${token}' at position ${i - 2}`);
        }
        const elapsed = parseInt(token, 36) / 10000;
        // Parse multiplier
        if (log.charAt(i) === "*") {
            i++;
            token = log.charAt(i++);
            if (!isBase36Digit(token.charCodeAt(0))) {
                throw new Error(`Expected a base-36 digit, got '${token}' at position ${i - 1}`);
            }
            const frames = parseInt(token, 36);
            for (let f = 1; f < frames; f++) {
                yield [elapsed, worldSize, input, i];
            }
        }
        // Parse world size
        i = consumeWorldSize(log, i, worldSize);
        // Parse input
        i = consumeInput(log, i, input, inputLogConfig);
        yield [elapsed, worldSize, input, i];
        // Reset actions
        for (const control in inputLogConfig) {
            if (inputLogConfig[control as Controls[number]].type === "action") {
                input[control as Controls[number]] = 0;
            }
        }
    }
}

const consumeWorldSize = (log: string, i: number, worldSize: ISize): number => {
    if (i < log.length && log.charAt(i) === "[") {
        i++;
        [worldSize.width, i] = parseNumberUntil(log, i, ",");
        [worldSize.height, i] = parseNumberUntil(log, i, "]");
    }
    return i;
}

const parseNumberUntil = (log: string, i: number, char: string): [number, number] => {
    let result = "";
    while (i < log.length && isBase36Digit(log.charCodeAt(i))) {
        result += log[i++];
    }
    if (result === "") {
        throw new Error(`Expected a base-36 number, got '${log.charAt(i)}' at position ${i}`);
    }
    if (log.charAt(i) !== char) {
        throw new Error(`Expected '${char}', got '${log.charAt(i)}' at position ${i}`);
    }
    return [parseInt(result, 36), ++i];
}

const consumeInput = <Controls extends readonly string[]>(
    log: string,
    i: number,
    input: InputState<Controls>,
    inputLogConfig: InputLogConfig<Controls>,
): number => {
    while (i < log.length && !isBase36Digit(log.charCodeAt(i))) {
        const token = log.charAt(i++);
        let found = false;
        for (const [control, { code, type }] of Object.entries(inputLogConfig) as [Controls[number], InputLogConfig<Controls>[Controls[number]]][]) {
            if (token === code) {
                if (type === "action") {
                    input[control] = 1;
                } else if (type === "momentary") {
                    input[control] = Number(!input[control]);
                } else {
                    input[control] = parseAnalogInput(log.charAt(i++), i - 1);
                }
                found = true;
                break;
            }
        }
        if (!found) {
            throw new Error(`Expected an input code or base-36 digit, got '${token}' at position ${i - 1}`);
        }
    }
    return i;
}

const parseAnalogInput = (token: string, position: number): number => {
    if (!isBase36Digit(token.charCodeAt(0))) {
        throw new Error(`Expected a base-36 digit, got '${token}' at position ${position}`);
    }
    return (parseInt(token, 36) - 17) / 17;
}

// Matches 0-9a-z, lowercase
const isBase36Digit = (charCode: number): boolean => (charCode > 47 && charCode < 58) || (charCode > 96 && charCode < 123);

const isReservedChar = (char: string) => isBase36Digit(char.charCodeAt(0)) || "*[],".includes(char);

const validateInputCodes = (map: InputLogConfig<any>) =>
    Object.values(map).forEach(({ code }) => {
        if (code.length !== 1 || isReservedChar(code)) {
            throw new Error(`Invalid input code '${code}'`);
        }
    });

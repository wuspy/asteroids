import { ISize } from "@pixi/math";
import { InputMappingType } from ".";
import { InputState, createEmptyInput } from "./InputProvider";

export type InputLogConfig<Controls extends readonly string[]> = {
    [Key in Controls[number]]: {
        code: number;
        type: InputMappingType;
    }
}

const MAX_ELAPSED_VALUE_PER_BYTE = 240;
const FRAME_MULTIPLIER = 241;
const WORLD_SIZE_CHANGE = 242;
const INPUT_START = 243;

export class GameLog<Controls extends readonly string[]> {
    private _lastElapsed100uS: number;
    private _lastElapsedCount: number;
    private _lastInput: InputState<Controls>;
    private _lastWorldSize: ISize;
    private _inputLogConfig: InputLogConfig<Controls>;
    private _buffer: Uint8Array;
    private _i: number;

    constructor(initialWorldSize: Readonly<ISize>, inputLogConfig: InputLogConfig<Controls>) {
        validateInputCodes(inputLogConfig);
        this._lastWorldSize = { width: 0, height: 0 };
        this._lastElapsed100uS = 0;
        this._lastElapsedCount = 0;
        this._lastInput = createEmptyInput(Object.keys(inputLogConfig) as any as Controls);
        this._inputLogConfig = inputLogConfig;
        this._buffer = new Uint8Array(10000);
        this._i = 0;

        this.logFrame(0, this._lastInput, initialWorldSize);
    }

    private writeU16(val: number): void {
        this._buffer[this._i++] = val >> 8 & 0xff;
        this._buffer[this._i++] = val & 0xff;
    }

    logFrame(elapsedMs: number, input: InputState<Controls>, worldSize: Readonly<ISize>): [number, InputState<Controls>] {
        if (this._buffer.length - this._i < 100) {
            const old = this._buffer;
            this._buffer = new Uint8Array(old.length + 10000);
            this._buffer.set(old);
        }

        const elapsed100uS = Math.round(elapsedMs * 10);
        if (this._lastElapsed100uS !== elapsed100uS) {
            this.writeElapsed();
        }
        this._lastElapsedCount++;
        this._lastElapsed100uS = elapsed100uS;

        this.logWorldSize(worldSize);

        for (const [control, { type }] of Object.entries(this._inputLogConfig) as [Controls[number], InputLogConfig<Controls>[Controls[number]]][]) {
            if (type === InputMappingType.Digital) {
                this.logDigitalInput(control, input[control]);
            } else {
                this.logAnalogInput(control, input[control]);
            }
        }

        return [elapsed100uS / 10, input];
    }

    flush(): void {
        this.writeElapsed();
    }

    get log(): Uint8Array {
        return this._buffer.slice(0, this._i);
    }

    private logWorldSize(size: ISize): void {
        if (this._lastWorldSize.width !== size.width || this._lastWorldSize.height !== size.height) {
            this.writeElapsed();
            this._buffer[this._i++] = WORLD_SIZE_CHANGE;
            this.writeU16(size.width);
            this.writeU16(size.height);
            this._lastWorldSize.width = size.width;
            this._lastWorldSize.height = size.height;
        }
    }

    private logAnalogInput(control: Controls[number], value: number): number {
        const clampedValue = Math.round(value * 127) + 128;
        if (clampedValue !== (this._lastInput[control] || 0)) {
            this.writeElapsed();
            this._buffer[this._i++] = this._inputLogConfig[control].code;
            this._buffer[this._i++] = clampedValue;
            this._lastInput[control] = clampedValue;
        }
        return (clampedValue - 128) / 127;
    }

    private logDigitalInput(control: Controls[number], value: number): void {
        if (value !== (this._lastInput[control] || 0)) {
            this.writeElapsed();
            this._buffer[this._i++] = this._inputLogConfig[control].code;
            this._lastInput[control] = value;
        }
    }

    private writeElapsed(): void {
        if (this._lastElapsedCount) {
            let elapsed = this._lastElapsed100uS;
            while (elapsed > -1) {
                this._buffer[this._i++] = Math.min(MAX_ELAPSED_VALUE_PER_BYTE, elapsed);
                elapsed -= MAX_ELAPSED_VALUE_PER_BYTE;
            }
            if (this._lastElapsedCount > 2) {
                this._buffer[this._i++] = FRAME_MULTIPLIER;
                this._buffer[this._i++] = Math.min(255, this._lastElapsedCount);
                this._lastElapsedCount = Math.max(0, this._lastElapsedCount - 255);
            } else {
                --this._lastElapsedCount;
            }
            this.writeElapsed();
        }
    }
}

export function* parseGameLog<Controls extends readonly string[]>(
    log: Uint8Array,
    inputLogConfig: InputLogConfig<Controls>,
): Generator<[number, Readonly<ISize>, Readonly<InputState<Controls>>]> {
    validateInputCodes(inputLogConfig);
    const input = createEmptyInput(Object.keys(inputLogConfig) as any as Controls);
    const worldSize: ISize = { width: 0, height: 0 };

    // Parse header
    let i = consumeWorldSize(log, 1, worldSize);
    if (log[0] !== 0 || worldSize.width === 0 || worldSize.height === 0) {
        throw new Error("Invalid header");
    }
    i = consumeInput(log, i, input, inputLogConfig);
    yield [0, worldSize, input];

    while (i < log.length) {
        let elapsed = 0;
        // Parse time elapsed
        while (i < log.length && log[i] === MAX_ELAPSED_VALUE_PER_BYTE) {
            ++i;
            elapsed += MAX_ELAPSED_VALUE_PER_BYTE;
        }
        if (i < log.length && log[i] < MAX_ELAPSED_VALUE_PER_BYTE) {
            elapsed += log[i++];
        } else if (elapsed) {
            throw new Error(`Invalid token ${log[i]} at position ${i}`);
        }
        if (elapsed <= 0) {
            throw new Error(`Invalid token ${log[i]} at position ${i}`);
        }
        elapsed /= 10;
        // Parse frame multiplier
        if (i < log.length - 1 && log[i] === FRAME_MULTIPLIER) {
            ++i;
            const frames = log[i++];
            for (let f = 1; f < frames; ++f) {
                yield [elapsed, worldSize, input];
            }
        }
        i = consumeWorldSize(log, i, worldSize);
        i = consumeInput(log, i, input, inputLogConfig);
        yield [elapsed, worldSize, input];
    }
}

const consumeU16 = (log: Uint8Array, i: number): [number, number] => {
    if (log.length - i <= 2) {
        throw new Error("Premature end of log");
    }
    return [(log[i++] << 8) + log[i++], i];
}

const consumeWorldSize = (log: Uint8Array, i: number, worldSize: ISize): number => {
    if (i < log.length && log[i] === WORLD_SIZE_CHANGE) {
        [worldSize.width, i] = consumeU16(log, ++i);
        [worldSize.height, i] = consumeU16(log, i);
        if (worldSize.width === 0 || worldSize.height === 0) {
            throw new Error("Invalid world size");
        }
    }
    return i;
}

const consumeInput = <Controls extends readonly string[]>(
    log: Uint8Array,
    i: number,
    input: InputState<Controls>,
    inputLogConfig: InputLogConfig<Controls>,
): number => {
    while (i < log.length && log[i] >= INPUT_START) {
        const code = log[i++];
        let found = false;
        for (const [control, { code: currentCode, type }] of Object.entries(inputLogConfig) as [Controls[number], InputLogConfig<Controls>[Controls[number]]][]) {
            if (code === currentCode) {
                if (type === InputMappingType.Digital) {
                    input[control] = +!input[control];
                } else {
                    if (i >= log.length) {
                        throw new Error("Premature end of log");
                    }
                    input[control] = (log[i++] - 128) / 127;
                }
                found = true;
                break;
            }
        }
        if (!found) {
            throw new Error(`Invalid token ${log[i]} at position ${i - 1}`);
        }
    }
    return i;
}

const validateInputCodes = (map: InputLogConfig<any>) =>
    Object.values(map).forEach(({ code }) => {
        if (code < INPUT_START) {
            throw new Error(`Invalid input code '${code}'`);
        }
    });

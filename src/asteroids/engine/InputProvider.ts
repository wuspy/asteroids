import { EventManager } from "./EventManager";

export const DEFAULT_DEADZONE = 0.3;

export type GamepadButtonName =
    | "A"
    | "B"
    | "X"
    | "Y"
    | "LT"
    | "LB"
    | "RT"
    | "RB"
    | "Start"
    | "Back"
    | "Home"
    | "LS"
    | "RS"
    | "DpadUp"
    | "DpadLeft"
    | "DpadDown"
    | "DpadRight";

export type GamepadAxisName =
    | "LsHorizontal"
    | "LsVertical"
    | "RsHorizontal"
    | "RsVertical";

export type InputState<Controls extends readonly string[]> = { [Key in Controls[number]]: number };

export type DigitalInputMapping<Controls extends readonly string[]> = {
    control: Controls[number];
    type: "action" | "momentary";
} | {
    control: Controls[number];
    type: "analog";
    value: number;
};

export type AnalogInputMapping<Controls extends readonly string[]> = {
    control: Controls[number];
    type: "action" | "momentary";
    threshold: number;
} | {
    control: Controls[number];
    type: "analog";
    invert?: boolean;
};

export interface InputMapping<Controls extends readonly string[]> {
    keys?: { [Key in string]: DigitalInputMapping<Controls> };
    buttons?: Partial<{ [Key in GamepadButtonName]: DigitalInputMapping<Controls> }>;
    axes?: Partial<{ [Key in GamepadAxisName]: AnalogInputMapping<Controls> }>;
}

const gamepadButtonPressed = (b: GamepadButton | number) => typeof (b) === "object" ? b.pressed : b === 1.0;

// These map to the W3C standard gamepad specification
// https://w3c.github.io/gamepad/#remapping

const GAMEPAD_BUTTON_INDEX: { [Key in GamepadButtonName]: number } = {
    A: 0,
    B: 1,
    X: 2,
    Y: 3,
    LB: 4,
    RB: 5,
    LT: 6,
    RT: 7,
    Back: 8,
    Start: 9,
    LS: 10,
    RS: 11,
    DpadUp: 12,
    DpadDown: 13,
    DpadLeft: 14,
    DpadRight: 15,
    Home: 16,
};

const GAMEPAD_AXIS_INDEX: { [Key in GamepadAxisName]: number } = {
    LsHorizontal: 0,
    LsVertical: 1,
    RsHorizontal: 2,
    RsVertical: 3,
};

export interface InputProviderEvents<Controls extends readonly string[]> {
    gamepadConnected: (gamepad: Gamepad) => void;
    gamepadDisconnected: (gamepad: Gamepad) => void;
    mappingChanged: (mapping: InputMapping<Controls>) => void;
}

export const createEmptyInput = <Controls extends readonly string[]>(controls: Controls): InputState<Controls> =>
    controls.reduce((o, name) => ({ ...o, [name]: 0 }), {}) as InputState<Controls>;

export class InputProvider<Controls extends readonly string[]> {
    deadzone: number;
    private _initialState: InputState<Controls>;
    private _keyState: { [Key in string]: boolean };
    private _lastKeyState: { [Key in string]: boolean };
    private _lastButtonState: Partial<{ [Key in GamepadButtonName]: boolean }>;
    private _lastAnalogState: Partial<{ [Key in GamepadAxisName]: boolean }>;
    private _gamepad: Gamepad | null;
    private _mapping: InputMapping<Controls>;
    private _events: EventManager<InputProviderEvents<Controls>>;

    constructor(controls: Controls, deadzone?: number) {
        this.deadzone = deadzone ?? DEFAULT_DEADZONE;
        this._mapping = {};
        this._keyState = {};
        this._lastKeyState = {};
        this._lastButtonState = {};
        this._lastAnalogState = {};
        this._gamepad = null;
        this._initialState = createEmptyInput(controls);
        this._events = new EventManager();
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
    }

    destroy(): void {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
    }

    findGamepad(): void {
        if (this._gamepad && !this._gamepad.connected) {
            this._events.trigger("gamepadDisconnected", this._gamepad);
            this._gamepad = null;
        }
        if (!this._gamepad && navigator.getGamepads) {
            for (const gamepad of navigator.getGamepads()) {
                if (gamepad && gamepad.connected && gamepad.mapping === "standard") {
                    this._gamepad = gamepad;
                    this._events.trigger("gamepadConnected", this._gamepad);
                    break;
                }
            }
        }
    }

    get mapping(): InputMapping<Controls> {
        return this._mapping;
    }

    set mapping(mapping: InputMapping<Controls>) {
        this._mapping = mapping;
        this._events.trigger("mappingChanged", mapping);
    }

    get gamepad(): Gamepad | null {
        return this._gamepad;
    }

    get gamepadConnected(): boolean {
        return !!this._gamepad && this._gamepad.connected;
    }

    get events(): EventManager<InputProviderEvents<Controls>> {
        return this._events;
    }

    poll(): InputState<Controls> {
        const state: InputState<Controls> = { ...this._initialState };
        if (this._gamepad && this._gamepad.connected) {
            if (this._mapping.buttons) {
                for (const [button, mapping] of Object.entries(this._mapping.buttons)) {
                    const pressed = gamepadButtonPressed(this._gamepad.buttons[GAMEPAD_BUTTON_INDEX[button as GamepadButtonName]]);
                    this.applyDigitalInput(button, mapping, pressed, state, this._lastButtonState);
                }
            }
            if (this._mapping.axes) {
                for (const [axis, mapping] of Object.entries(this._mapping.axes)) {
                    const value = this.clampDeadzone(this._gamepad.axes[GAMEPAD_AXIS_INDEX[axis as GamepadAxisName]]);
                    if (mapping.type === "analog") {
                        state[mapping.control] = value * (mapping.invert ? -1 : 1);
                    } else {
                        const pressed = Math.sign(mapping.threshold) === Math.sign(value) && Math.abs(value) >= Math.abs(mapping.threshold);
                        if (pressed) {
                            if (mapping.type === "action") {
                                if (!this._lastAnalogState[axis as GamepadAxisName]) {
                                    state[mapping.control] = 1;
                                }
                            } else if (mapping.type === "momentary") {
                                state[mapping.control] = 1;
                            }
                        }
                        this._lastAnalogState[axis as GamepadAxisName] = pressed;
                    }
                }
            }
        }
        if (this._mapping.keys) {
            for (const [key, mapping] of Object.entries(this._mapping.keys)) {
                const pressed = this._keyState[key] || false;
                this.applyDigitalInput(key, mapping, pressed, state, this._lastKeyState);
            }
        }
        return state;
    }

    private applyDigitalInput(
        key: string,
        mapping: DigitalInputMapping<Controls>,
        pressed: boolean,
        state: InputState<Controls>,
        lastPressed: Partial<{ [Key in string]: boolean }>
    ) {
        if (pressed) {
            if (mapping.type === "action") {
                if (!lastPressed[key]) {
                    state[mapping.control] = 1;
                }
            } else if (mapping.type === "momentary") {
                state[mapping.control] = 1;
            } else if (mapping.type === "analog") {
                if (state[mapping.control] === 0) {
                    state[mapping.control] = mapping.value;
                } else {
                    // The same analog control is getting inputs from more than one key, so average
                    // its current value with the new value
                    state[mapping.control] = (state[mapping.control] + mapping.value) / 2;
                }
            }
        }
        lastPressed[key] = pressed;
    }

    private onKeyEvent(e: KeyboardEvent, pressed: boolean) {
        this._keyState[e.key] = pressed;
    }

    private onKeyDown = (e: KeyboardEvent) => this.onKeyEvent(e, true);
    private onKeyUp = (e: KeyboardEvent) => this.onKeyEvent(e, false);

    private clampDeadzone(input: number): number {
        return Math.abs(input) > this.deadzone ? input : 0
    }
}

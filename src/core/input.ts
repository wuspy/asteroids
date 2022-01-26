import { InputMapping, InputLogConfig } from "./engine";

export const controls = ["start", "fire", "hyperspace", "turn", "thrust"] as const;

export const wasdMapping: InputMapping<typeof controls> = {
    keys: {
        "w": { control: "thrust", type: "analog", value: 1 },
        "a": { control: "turn", type: "analog", value: -1 },
        "d": { control: "turn", type: "analog", value: 1 },
        "s": { control: "hyperspace", type: "action" },
        "W": { control: "thrust", type: "analog", value: 1 },
        "A": { control: "turn", type: "analog", value: -1 },
        "D": { control: "turn", type: "analog", value: 1 },
        "S": { control: "hyperspace", type: "action" },
        " ": { control: "fire", type: "action" },
        "Enter": { control: "start", type: "action" },
    }
};

export const ijklMapping: InputMapping<typeof controls> = {
    keys: {
        "i": { control: "thrust", type: "analog", value: 1 },
        "j": { control: "turn", type: "analog", value: -1 },
        "l": { control: "turn", type: "analog", value: 1 },
        "k": { control: "hyperspace", type: "action" },
        "I": { control: "thrust", type: "analog", value: 1 },
        "J": { control: "turn", type: "analog", value: -1 },
        "L": { control: "turn", type: "analog", value: 1 },
        "K": { control: "hyperspace", type: "action" },
        " ": { control: "fire", type: "action" },
        "Enter": { control: "start", type: "action" },
    }
};

export const arrowMapping: InputMapping<typeof controls> = {
    keys: {
        "ArrowUp": { control: "thrust", type: "analog", value: 1 },
        "ArrowLeft": { control: "turn", type: "analog", value: -1 },
        "ArrowRight": { control: "turn", type: "analog", value: 1 },
        "ArrowDown": { control: "hyperspace", type: "action" },
        " ": { control: "fire", type: "action" },
        "Enter": { control: "start", type: "action" },
    }
};

export const gamepadMapping: InputMapping<typeof controls> = {
    buttons: {
        B: { control: "hyperspace", type: "action" },
        A: { control: "thrust", type: "analog", value: 1 },
        Start: { control: "start", type: "action" },
        RT: { control: "fire", type: "action" },
    },
    axes: {
        // LsVertical: { control: "thrust", type: "analog", invert: true },
        // RsHorizontal: { control: "turn", type: "analog" },
        LsHorizontal: { control: "turn", type: "analog" },
    }
};

export const inputLogConfig: InputLogConfig<typeof controls> = {
    fire: { code: "F", type: "action" },
    hyperspace: { code: "H", type: "action" },
    start: { code: "S", type: "action" },
    turn: { code: ">", type: "analog" },
    thrust: { code: "^", type: "analog" },
}
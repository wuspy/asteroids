import { InputMapping, InputLogConfig, InputMappingType } from "./engine";

export const controls = ["start", "fire", "hyperspace", "turn", "thrust"] as const;

export const wasdMapping: InputMapping<typeof controls> = {
    keys: {
        "w": { control: "thrust", type: InputMappingType.Analog, value: 1 },
        "a": { control: "turn", type: InputMappingType.Analog, value: -1 },
        "d": { control: "turn", type: InputMappingType.Analog, value: 1 },
        "s": { control: "hyperspace", type: InputMappingType.Digital },
        "W": { control: "thrust", type: InputMappingType.Analog, value: 1 },
        "A": { control: "turn", type: InputMappingType.Analog, value: -1 },
        "D": { control: "turn", type: InputMappingType.Analog, value: 1 },
        "S": { control: "hyperspace", type: InputMappingType.Digital },
        " ": { control: "fire", type: InputMappingType.Digital },
        "Enter": { control: "start", type: InputMappingType.Digital },
    }
};

export const ijklMapping: InputMapping<typeof controls> = {
    keys: {
        "i": { control: "thrust", type: InputMappingType.Analog, value: 1 },
        "j": { control: "turn", type: InputMappingType.Analog, value: -1 },
        "l": { control: "turn", type: InputMappingType.Analog, value: 1 },
        "k": { control: "hyperspace", type: InputMappingType.Digital },
        "I": { control: "thrust", type: InputMappingType.Analog, value: 1 },
        "J": { control: "turn", type: InputMappingType.Analog, value: -1 },
        "L": { control: "turn", type: InputMappingType.Analog, value: 1 },
        "K": { control: "hyperspace", type: InputMappingType.Digital },
        " ": { control: "fire", type: InputMappingType.Digital },
        "Enter": { control: "start", type: InputMappingType.Digital },
    }
};

export const arrowMapping: InputMapping<typeof controls> = {
    keys: {
        "ArrowUp": { control: "thrust", type: InputMappingType.Analog, value: 1 },
        "ArrowLeft": { control: "turn", type: InputMappingType.Analog, value: -1 },
        "ArrowRight": { control: "turn", type: InputMappingType.Analog, value: 1 },
        "ArrowDown": { control: "hyperspace", type: InputMappingType.Digital },
        " ": { control: "fire", type: InputMappingType.Digital },
        "Enter": { control: "start", type: InputMappingType.Digital },
    }
};

export const gamepadMapping: InputMapping<typeof controls> = {
    buttons: {
        B: { control: "hyperspace", type: InputMappingType.Digital },
        A: { control: "thrust", type: InputMappingType.Analog, value: 1 },
        Start: { control: "start", type: InputMappingType.Digital },
        RT: { control: "fire", type: InputMappingType.Digital },
    },
    axes: {
        // LsVertical: { control: "thrust", type: InputMappingType.Analog, invert: true },
        // RsHorizontal: { control: "turn", type: InputMappingType.Analog },
        LsHorizontal: { control: "turn", type: InputMappingType.Analog },
    }
};

export const inputLogConfig: InputLogConfig<typeof controls> = {
    fire: { code: 255, type: InputMappingType.Digital },
    hyperspace: { code: 254, type: InputMappingType.Digital },
    start: { code: 253, type: InputMappingType.Digital },
    turn: { code: 252, type: InputMappingType.Analog },
    thrust: { code: 251, type: InputMappingType.Analog },
}

import { controls as gameControls } from "../core";
import { InputMapping, InputMappingType } from "../core/engine";

export const controls = [ ...gameControls, "back" ] as const;

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
        "Escape": { control: "back", type: InputMappingType.Digital },
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
        "Escape": { control: "back", type: InputMappingType.Digital },
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
        "Escape": { control: "back", type: InputMappingType.Digital },
    }
};

export const gamepadMapping: InputMapping<typeof controls> = {
    buttons: {
        X: { control: "hyperspace", type: InputMappingType.Digital },
        B: { control: "back", type: InputMappingType.Digital },
        A: { control: "fire", type: InputMappingType.Digital },
        Start: { control: "start", type: InputMappingType.Digital },
        LT: { control: "thrust", type: InputMappingType.Digital },
    },
    axes: {
        // LsVertical: { control: "thrust", type: InputMappingType.Analog, invert: true },
        LsHorizontal: { control: "turn", type: InputMappingType.Analog },
    }
};

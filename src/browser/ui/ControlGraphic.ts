import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Text } from "./Text";
import { Align, JustifyContent, PositionType } from "../layout";
import { controls } from "@core";
import { AnalogInputMapping, DigitalInputMapping, GamepadAxisName, GamepadButtonName, InputMapping } from "@core/engine";

export type ControlType = "key" | "button" | "trigger" | "stick";

const KEY_LABELS: { [Key in string]: string } = {
    " ": "Space",
    "Escape": "Esc",
    "ArrowUp": "↑",
    "ArrowLeft": "←",
    "ArrowRight": "→",
    "ArrowDown": "↓",
};

export class ControlGraphic extends Container {
    constructor(params: {
        type: ControlType;
        control: string;
        fontSize: number;
        background: number;
        foreground: number;
    }) {
        super();
        this.flexContainer = true;
        this.layout.style({
            alignItems: Align.Center,
            justifyContent: JustifyContent.Center,
        })
        const label = params.type === "key" && params.control in KEY_LABELS ? KEY_LABELS[params.control] : params.control;
        const text = new Text(label.toUpperCase(), {
            fontSize: params.fontSize,
            fontWeight: "bold",
            fill: params.foreground ?? 0,
        });
        text.cacheAsBitmap = true;
        text.layout.position = PositionType.Absolute;

        const background = new Graphics();
        background.beginFill(params.background, 1, true);
        if (params.type === "stick") {
            const margin = Math.round(params.fontSize * 1.25);
            const radius = Math.max(text.height + margin, text.width + margin) / 2;
            background.drawCircle(radius, radius, radius);
            // Draw a dot on each side to make it more clear this is an analog stick and not a button
            background.endFill();
            background.beginFill(params.foreground ?? 0, 1, true);
            background.drawCircle(radius, radius * 0.25, radius / 12);
            background.drawCircle(radius, radius * 0.75, radius / 12);
            background.drawCircle(radius * 0.25, radius, radius / 12);
            background.drawCircle(radius * 0.75, radius, radius / 12);
        } else if (params.type === "button") {
            const margin = Math.round(params.fontSize * 0.67);
            const radius = Math.max(text.height + margin, text.width + margin);
            background.drawCircle(radius, radius, radius);
        } else { // trigger and key
            const margin = Math.round(params.fontSize * 0.5);
            const height = text.height + margin;
            // Make sure the container width isn't narrower than the height, otherwise single letter
            // keys will look off
            const width = Math.max(height, text.width + margin);
            background.drawRoundedRect(0, 0, width, height, height * 0.2);
        }
        this.addChild(background, text);
    }

    static getParamsFromMapping<Controls extends readonly string[]>(
        control: Controls[number],
        inputMapping: InputMapping<Controls>,
        analogValue?: number,
    ): { type: ControlType, control: string } | undefined {
        if (inputMapping.keys) {
            for (const [key, mapping] of Object.entries(inputMapping.keys)) {
                if (isMappingForControl(control, mapping, analogValue)) {
                    return { type: "key", control: key };
                }
            }
        }
        if (inputMapping.buttons) {
            for (const [button, mapping] of Object.entries(inputMapping.buttons)) {
                if (isMappingForControl(control, mapping, analogValue)) {
                    let type: ControlType, buttonName: string, foreground;
                    switch (button as GamepadButtonName) {
                        case "A":
                            type = "button";
                            buttonName = button;
                            break;
                        case "B":
                            type = "button";
                            buttonName = button;
                            break;
                        case "X":
                            type = "button";
                            buttonName = button;
                            break;
                        case "Y":
                            type = "button";
                            buttonName = button;
                            break;
                        case "LT":
                        case "RT":
                        case "LB":
                        case "RB":
                            type = "trigger";
                            buttonName = button;
                            break;
                        case "DpadUp":
                            buttonName = "▲";
                            type = "button";
                            break;
                        case "DpadRight":
                            buttonName = "►";
                            type = "button";
                            break;
                        case "DpadLeft":
                            buttonName = "◄";
                            type = "button";
                            break;
                        case "DpadDown":
                            buttonName = "▼";
                            type = "button";
                            break;
                        case "LS":
                        case "RS":
                            buttonName = button;
                            type = "stick";
                            break;
                        case "Start":
                        case "Back":
                            buttonName = button.toUpperCase();
                            type = "key";
                            break;
                    }
                    return { type: type!, control: buttonName! };
                }
            }
        }
        if (inputMapping.axes) {
            for (const [axis, mapping] of Object.entries(inputMapping.axes)) {
                if (isMappingForControl(control, mapping, analogValue)) {
                    let axisName;
                    switch (axis as GamepadAxisName) {
                        case "LsHorizontal":
                        case "LsVertical":
                            axisName = "LS";
                            break;
                        case "RsHorizontal":
                        case "RsVertical":
                            axisName = "RS";
                            break;
                    }
                    return { type: "stick", control: axisName };
                }
            }
        }
    }
}

const isMappingForControl = <Controls extends readonly string[]>(
    control: Controls[number],
    mapping: DigitalInputMapping<Controls> | AnalogInputMapping<Controls>,
    analogValue?: number,
) => control === mapping.control && (analogValue === undefined || !("value" in mapping) || mapping.value === analogValue);

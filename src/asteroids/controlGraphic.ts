import { Container } from "@pixi/display";
import { Text } from "@pixi/text";
import { FONT_FAMILY } from "./constants";
import { AnalogInputMapping, DigitalInputMapping, GamepadAxisName, GamepadButtonName, InputMapping, RelativeLayout } from "./engine";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { controls } from "./input";

export type ControlType = "key" | "button" | "trigger" | "stick";

const KEY_LABELS: { [Key in string]: string } = {
    " ": "Space",
    "Escape": "Esc",
    "ArrowUp": "↑",
    "ArrowLeft": "←",
    "ArrowRight": "→",
    "ArrowDown": "↓",
};

export const createControlGraphic = (params: {
    type: ControlType;
    control: string;
    fontSize: number;
    background: number;
    foreground: number;
}): Container => {
    const container = new RelativeLayout();
    const label = params.type === "key" && params.control in KEY_LABELS ? KEY_LABELS[params.control] : params.control;
    const text = new Text(label.toUpperCase(), {
        fontFamily: FONT_FAMILY,
        fontSize: params.fontSize,
        fontWeight: "bold",
        fill: params.foreground ?? 0,
    });
    const background = new Graphics();
    background.beginFill(params.background, 1, true);
    if (params.type === "stick") {
        const margin = Math.round(params.fontSize * 1.25);
        container.height = container.width = Math.max(text.height + margin, text.width + margin);
        background.drawCircle(container.width / 2, container.height / 2, container.width / 2);
        // Draw a dot on each side to make it more clear this is an analog stick and not a button
        background.endFill();
        background.beginFill(params.foreground ?? 0, 1, true);
        background.drawCircle(container.width / 2, container.height * 0.125, container.width / 24);
        background.drawCircle(container.width / 2, container.height * 0.875, container.width / 24);
        background.drawCircle(container.width * 0.125, container.height / 2, container.width / 24);
        background.drawCircle(container.width * 0.875, container.height / 2, container.width / 24);
    } else if (params.type === "button") {
        const margin = Math.round(params.fontSize * 0.67);
        container.height = container.width = Math.max(text.height + margin, text.width + margin);
        background.drawCircle(container.width / 2, container.height / 2, container.width / 2);
    } else { // trigger and key
        const margin = Math.round(params.fontSize * 0.5);
        container.height = text.height + margin;
        // Make sure the container width isn't narrower than the height, otherwise single letter
        // keys will look off
        container.width = Math.max(container.height, text.width + margin);
        background.drawRoundedRect(0, 0, container.width, container.height, container.height * 0.2);
    }
    container.addChildWithConstraints(background, { constraints: RelativeLayout.centeredIn("parent") });
    container.addChildWithConstraints(text, { constraints: RelativeLayout.centeredIn("parent") });
    return container;
}

export const createControlDescription = (params: {
    type: ControlType,
    control: string,
    background: number,
    foreground: number,
    beforeLabel?: string,
    afterLabel?: string,
    fontSize: number,
    direction: "horizontal" | "vertical",
}): Container => {
    const control = createControlGraphic({
        ...params,
        fontSize: params.fontSize * 0.75,
    });
    const beforeText = !params.beforeLabel ? null : new Text(params.beforeLabel, {
        fontFamily: FONT_FAMILY,
        fontSize: params.fontSize,
        fill: 0xffffff,
    });
    const afterText = !params.afterLabel ? null : new Text(params.afterLabel, {
        fontFamily: FONT_FAMILY,
        fontSize: params.fontSize,
        fill: 0xffffff,
    });
    const container = new RelativeLayout();
    if (params.direction === "horizontal") {
        const margin = Math.round(params.fontSize * 0.5);
        container.width = control.width + (beforeText ? beforeText.width + margin : 0) + (afterText ? afterText.width + margin : 0);
        container.height = control.height;
        if (beforeText) {
            container.addChildWithConstraints(beforeText, {
                constraints: {
                    vcenter: ["parent", "vcenter"],
                    left: ["parent", "left"],
                }
            });
        }
        container.addChildWithConstraints(control, {
            margin: { left: beforeText ? margin : 0, right: afterText ? margin : 0 },
            constraints: {
                vcenter: ["parent", "vcenter"],
                left: beforeText ? [beforeText, "right"] : ["parent", "left"],
            }
        });
        if (afterText) {
            container.addChildWithConstraints(afterText, {
                constraints: {
                    vcenter: ["parent", "vcenter"],
                    left: [control, "right"],
                }
            });
        }
    } else {
        const margin = Math.round(params.fontSize * 0.3);
        container.width = Math.max(control.width, beforeText?.width || 0, afterText?.width || 0);
        container.height = control.height + (beforeText ? beforeText.height + margin : 0) + (afterText ? afterText.height + margin : 0);
        if (beforeText) {
            container.addChildWithConstraints(beforeText, {
                constraints: {
                    top: ["parent", "top"],
                    hcenter: ["parent", "hcenter"],
                }
            });
        }
        container.addChildWithConstraints(control, {
            margin: { top: beforeText ? margin : 0, bottom: afterText ? margin : 0 },
            constraints: {
                top: beforeText ? [beforeText, "bottom"] : ["parent", "top"],
                hcenter: ["parent", "hcenter"],
            }
        });
        if (afterText) {
            container.addChildWithConstraints(afterText, {
                constraints: {
                    top: [control, "bottom"],
                    hcenter: ["parent", "hcenter"],
                }
            });
        }
    }
    return container;
}

export const getControlProps = (
    control: typeof controls[number],
    inputMapping: InputMapping<typeof controls>,
    analogValue?: number,
): { type: ControlType, control: string } | undefined => {
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

const isMappingForControl = (
    control: typeof controls[number],
    mapping: DigitalInputMapping<typeof controls> | AnalogInputMapping<typeof controls>,
    analogValue?: number,
) => control === mapping.control && (analogValue === undefined || !("value" in mapping) || mapping.value === analogValue);

import { Container, Graphics, Text } from "../react-pixi";
import { Align, JustifyContent, PositionType } from "../layout";
import { AnalogInputMapping, DigitalInputMapping, GamepadAxisName, GamepadButtonName, InputMapping } from "../../core/engine";
import { ComponentProps, useLayoutEffect, useRef } from "react";
import { FONT_STYLE } from "./theme";
import { RefType } from "../react-pixi";

export type ControlType = "key" | "button" | "trigger" | "stick";

const KEY_LABELS: { [Key in string]: string } = {
    " ": "Space",
    "Escape": "Esc",
    "ArrowUp": "↑",
    "ArrowLeft": "←",
    "ArrowRight": "→",
    "ArrowDown": "↓",
};

const isMappingForControl = <Controls extends readonly string[]>(
    control: Controls[number],
    mapping: DigitalInputMapping<Controls> | AnalogInputMapping<Controls>,
    analogValue?: number,
) => control === mapping.control && (analogValue === undefined || !("value" in mapping) || mapping.value === analogValue);

export const getControlGraphicParamsFromMapping = <Controls extends readonly string[]>(
    control: Controls[number],
    inputMapping: InputMapping<Controls>,
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
                let type: ControlType, buttonName: string;
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

export interface ControlGraphicProps extends ComponentProps<typeof Container> {
    type: ControlType;
    control: string;
    fontSize: number;
    background: number;
    foreground: number;
}

export const ControlGraphic = ({ type, control, fontSize, background, foreground, ...props }: ControlGraphicProps) => {
    const graphics = useRef<RefType<typeof Graphics>>(null);
    const text = useRef<RefType<typeof Text>>(null);

    useLayoutEffect(() => {
        const t = text.current!, g = graphics.current!;
        g.beginFill(background, 1, true);
        if (type === "stick") {
            const margin = Math.round(fontSize * 1.25);
            const radius = Math.max(t.height + margin, t.width + margin) / 2;
            g.drawCircle(radius, radius, radius);
            // Draw a dot on each side to make it more clear this is an analog stick and not a button
            g.endFill();
            g.beginFill(foreground ?? 0, 1, true);
            g.drawCircle(radius, radius * 0.25, radius / 12);
            g.drawCircle(radius, radius * 0.75, radius / 12);
            g.drawCircle(radius * 0.25, radius, radius / 12);
            g.drawCircle(radius * 0.75, radius, radius / 12);
        } else if (type === "button") {
            const margin = Math.round(fontSize * 0.67);
            const radius = Math.max(t.height + margin, t.width + margin);
            g.drawCircle(radius, radius, radius);
        } else { // trigger and key
            const margin = Math.round(fontSize * 0.5);
            const height = t.height + margin;
            // Make sure the container width isn't narrower than the height, otherwise single letter
            // keys will look off
            const width = Math.max(height, t.width + margin);
            g.drawRoundedRect(0, 0, width, height, height * 0.2);
        }
    }, [type, control, fontSize, background, foreground]);

    return (
        <Container
            {...props}
            flexContainer
            layoutStyle={{ ...props.layoutStyle, alignItems: Align.Center, justifyContent: JustifyContent.Center }}
        >
            <Graphics ref={graphics} />
            <Text
                ref={text}
                cacheAsBitmap
                layoutStyle={{ position: PositionType.Absolute }}
                style={{ ...FONT_STYLE, fontSize, fontWeight: "bold", fill: foreground }}
                text={(type === "key" && control in KEY_LABELS ? KEY_LABELS[control] : control).toUpperCase()}
            />
        </Container>
    );
};

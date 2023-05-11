import { AnalogInputMapping, DigitalInputMapping, GamepadAxisName, GamepadButtonName, InputMapping } from "@wuspy/asteroids-core";
import { ComponentProps, useMemo } from "react";
import { useApp } from "../AppContext";
import { controls } from "../input";
import { Align, ContainerBackgroundShape, JustifyContent } from "../layout";
import { Container, Text } from "../react-pixi";
import { FONT_STYLE } from "./theme";

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

const findControlValues = <Controls extends readonly string[]>(
    control: Controls[number],
    inputMapping: InputMapping<Controls>,
    analogValue?: number,
): [ControlType?, string?] => {
    if (inputMapping.keys) {
        for (const [key, mapping] of Object.entries(inputMapping.keys)) {
            if (isMappingForControl(control, mapping, analogValue)) {
                return ["key", key];
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
                return [type!, buttonName!];
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
                return ["stick", axisName];
            }
        }
    }
    return [undefined, undefined];
}

const capitalizeFirstLetter = (string: string) => string.charAt(0).toLocaleUpperCase() + string.slice(1);

export interface ControlGraphicProps extends ComponentProps<typeof Container> {
    control: typeof controls[number];
    analogValue?: number;
    size: number;
    color: number;
}

export const ControlGraphic = ({
    control,
    analogValue,
    size,
    color,
    ...props
}: ControlGraphicProps) => {
    const { input } = useApp();

    // This filter was designed to make the graphic glow when the associated input
    // is pressed, however enabling it for first time causes a severe hang in Chrome at
    // getUniformLocation in ShaderSystem.generateProgram.
    // The amount of time it hangs also depends on the values of distance and quality.

    // const glowFilter = useMemo(() => {
    //     const filter = new GlowFilter({
    //         outerStrength: 2.5,
    //         innerStrength: 0,
    //         distance: 10,
    //         quality: 0.5,
    //         color,
    //     });
    //     filter.enabled = false;
    //     return filter;
    // }, [color]);

    const [type, name] = useMemo(() =>
        findControlValues(control, input.mapping!, analogValue),
        [control, analogValue, input.mapping]
    );

    // useInputEvent("poll", (state) => {
    //     glowFilter.enabled = analogValue
    //         ? Math.abs(analogValue - state[control]) < 1
    //         : !!state[control];
    // });

    if (!name) {
        return null;
    } else if (type === "key") {
        return (
            <Container
                {...props}
                flexContainer
                layoutStyle={{
                    ...props.layoutStyle,
                    height: size,
                    minWidth: size,
                    paddingX: size * 0.25,
                    alignItems: Align.Center,
                    justifyContent: JustifyContent.Center,
                }}
                backgroundStyle={{
                    shape: ContainerBackgroundShape.Rectangle,
                    cornerRadius: size * 0.2,
                    stroke: {
                        width: 2,
                        color,
                        alpha: 1,
                    },
                }}
            >
                <Text
                    style={{ ...FONT_STYLE, fontSize: size * 0.66, fontWeight: "bold", fill: color }}
                    text={capitalizeFirstLetter(type === "key" && name in KEY_LABELS ? KEY_LABELS[name] : name)}
                />
            </Container>
        );
    } else {
        // TODO
        return null;
    }
};

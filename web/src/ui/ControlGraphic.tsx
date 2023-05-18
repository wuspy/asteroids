import {
    AnalogInputMapping,
    DigitalInputMapping,
    GamepadAxisName,
    GamepadButtonName,
    InputMapping
} from "@wuspy/asteroids-core";
import { Match, Show, Switch, splitProps } from "solid-js";
import { useApp } from "../AppContext";
import { controls } from "../input";
import { ContainerBackgroundShape } from "../layout";
import { ContainerProps } from "../solid-pixi";

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
): { type: ControlType, name: string } | undefined => {
    if (inputMapping.keys) {
        for (const [key, mapping] of Object.entries(inputMapping.keys)) {
            if (isMappingForControl(control, mapping, analogValue)) {
                return { type: "key", name: key };
            }
        }
    }
    if (inputMapping.buttons) {
        for (const [button, mapping] of Object.entries(inputMapping.buttons)) {
            if (isMappingForControl(control, mapping, analogValue)) {
                let type: ControlType, buttonName: string;
                switch (button as GamepadButtonName) {
                    case "A":
                    case "B":
                    case "X":
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
                return { type: type!, name: buttonName! };
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
                return { type: "stick", name: axisName };
            }
        }
    }
}

const capitalizeFirstLetter = (string: string) => string.charAt(0).toLocaleUpperCase() + string.slice(1);

export interface ControlGraphicProps extends ContainerProps {
    control: typeof controls[number];
    analogValue?: number;
    size: number;
    color: number;
}

export const ControlGraphic = (_props: ControlGraphicProps) => {
    const [props, childProps] = splitProps(_props, ["control", "analogValue", "size", "color"]);
    const { input } = useApp();

    const control = () => findControlValues(props.control, input.mapping!, props.analogValue);

    // This filter was designed to make the graphic glow when the associated input
    // is pressed, however enabling it for first time causes a severe hang in Chrome at
    // getUniformLocation in ShaderSystem.generateProgram.
    // The amount of time it hangs also depends on the values of distance and quality.

    // const glowFilter = new GlowFilter({
    //     outerStrength: 2,
    //     innerStrength: 0,
    //     distance: 10,
    //     quality: 0.5,
    // });

    // glowFilter.enabled = false;

    // createRenderEffect(() => glowFilter.color = props.color);

    // onInputEvent("poll", (state) => {
    //     glowFilter.enabled = props.analogValue
    //         ? Math.abs(props.analogValue - state[props.control]) < 1
    //         : !!state[props.control];
    // });

    return <Show when={control()}>{control =>
        <Switch>
            <Match when={control().type === "key"}>
                <container
                    {...childProps}
                    flexContainer
                    yg:height={props.size}
                    yg:minWidth={props.size}
                    yg:paddingX={props.size * 0.25}
                    yg:alignItems="center"
                    yg:justifyContent="center"
                    backgroundStyle={{
                        shape: ContainerBackgroundShape.Rectangle,
                        cornerRadius: props.size * 0.2,
                        stroke: {
                            width: 2,
                            color: props.color,
                            alpha: 1,
                        },
                    }}
                >
                    <text
                        style:fontSize={props.size / 1.618}
                        style:fontWeight="bold"
                        style:fill={props.color}
                        text={capitalizeFirstLetter(control().name in KEY_LABELS ? KEY_LABELS[control().name] : control().name)}
                    />
                </container>
            </Match>
        </Switch>}
    </Show>;
};

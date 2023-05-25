import { Accessor, Show, splitProps } from "solid-js";
import { controls } from "../input";
import { FlexDirection } from "../layout";
import { ContainerProps } from "../solid-pixi";
import { ControlGraphic } from "./ControlGraphic";

export interface ControlDescriptionProps extends ContainerProps {
    control: typeof controls[number];
    analogValue?: number;
    color: number;
    beforeLabel?: string;
    afterLabel?: string;
    size: number;
    direction: keyof typeof FlexDirection;
}

export const ControlDescription = (_props: ControlDescriptionProps) => {
    const [props, childProps] = splitProps(_props, [
        "control",
        "analogValue",
        "color",
        "beforeLabel",
        "afterLabel",
        "direction",
        "size",
    ]);

    const margin = () => Math.round(props.size * (props.direction === "column" ? 0.3 : 0.4));
    const label = (label: Accessor<string>) =>
        <text text={label()} style:fontSize={props.size} style:fill={props.color} />;

    return (
        <container
            {...childProps}
            flexContainer
            yg:alignItems="center"
            yg:flexDirection={props.direction}
        >
            <Show when={props.beforeLabel}>{label}</Show>
            <ControlGraphic
                control={props.control}
                analogValue={props.analogValue}
                color={props.color}
                size={props.size}
                yg:marginLeft={props.beforeLabel && props.direction === "row" ? margin() : undefined}
                yg:marginRight={props.afterLabel && props.direction === "row" ? margin() : undefined}
                yg:marginTop={props.beforeLabel && props.direction === "column" ? margin() : undefined}
                yg:marginBottom={props.afterLabel && props.direction === "column" ? margin() : undefined}
            />
            <Show when={props.afterLabel}>{label}</Show>
        </container>
    );
};
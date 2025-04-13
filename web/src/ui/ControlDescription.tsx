import { Accessor, Show, splitProps } from "solid-js";
import { controls } from "../input";
import { FlexDirection } from "../yoga-pixi";
import { ContainerProps } from "../solid-pixi";
import { ControlGraphic } from "./ControlGraphic";

export interface ControlDescriptionProps extends ContainerProps {
    control: typeof controls[number];
    analogValue?: number;
    color: number;
    beforeLabel?: string;
    afterLabel?: string;
    size: number;
    direction: FlexDirection;
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

    const gap = () => Math.round(props.size * (props.direction.startsWith("column") ? 0.3 : 0.4));
    const label = (label: Accessor<string>) =>
        <text text={label()} style:fontSize={props.size} style:fill={props.color} />;

    return (
        <container
            {...childProps}
            yogaContainer
            yg:alignItems="center"
            yg:flexDirection={props.direction}
            yg:gap={gap()}
        >
            <Show when={props.beforeLabel}>{label}</Show>
            <ControlGraphic
                control={props.control}
                analogValue={props.analogValue}
                color={props.color}
                size={props.size}
            />
            <Show when={props.afterLabel}>{label}</Show>
        </container>
    );
};

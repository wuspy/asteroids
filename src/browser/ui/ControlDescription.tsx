import { Align, FlexDirection } from "../layout";
import { ControlGraphic } from "./ControlGraphic";
import { Container, ContainerProps, RefType, Text } from "../react-pixi";
import { FONT_STYLE } from "./theme";
import { ForwardedRef, forwardRef } from "react";
import { controls } from "../input";


export interface ControlDescriptionProps extends ContainerProps {
    control: typeof controls[number];
    analogValue?: number;
    color: number;
    beforeLabel?: string;
    afterLabel?: string;
    size: number;
    direction: FlexDirection;
}

export const ControlDescription = forwardRef(({
    control,
    analogValue,
    color,
    beforeLabel,
    afterLabel,
    direction,
    size,
    ...props
}: ControlDescriptionProps, ref: ForwardedRef<RefType<typeof Container>>) => {
    const margin = Math.round(size * (direction === FlexDirection.Column ? 0.3 : 0.4));
    const controlGraphicLayout = direction === FlexDirection.Column
        ? {
            marginTop: beforeLabel ? margin : 0,
            marginBottom: afterLabel ? margin : 0,
        }
        : {
            marginLeft: beforeLabel ? margin : 0,
            marginRight: afterLabel ? margin : 0,
        };

    const beforeText = beforeLabel
        ? <Text text={beforeLabel} style={{ ...FONT_STYLE, fontSize: size, fill: color }} />
        : null;

    const afterText = afterLabel
        ? <Text text={afterLabel} style={{ ...FONT_STYLE, fontSize: size, fill: color }} />
        : null;

    return (
        <Container
            {...props}
            ref={ref}
            flexContainer
            layoutStyle={{ ...props.layoutStyle, alignItems: Align.Center, flexDirection: direction }}
        >
            {beforeText}
            <ControlGraphic
                control={control}
                analogValue={analogValue}
                color={color}
                size={size}
                layoutStyle={controlGraphicLayout}
            />
            {afterText}
        </Container>
    );
});

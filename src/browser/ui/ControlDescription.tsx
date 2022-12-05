import { Align, FlexDirection } from "../layout";
import { ControlGraphic, ControlType } from "./ControlGraphic";
import { Container, ContainerProps, Text } from "../react-pixi";
import { FONT_STYLE } from "./theme";

export interface ControlDescriptionProps extends ContainerProps {
    type: ControlType;
    control: string;
    background: number;
    foreground: number;
    beforeLabel?: string;
    afterLabel?: string;
    fontSize: number;
    direction: FlexDirection;
}

export const ControlDescription = ({
    type,
    control,
    background,
    foreground,
    beforeLabel,
    afterLabel,
    direction,
    fontSize,
    ...props
}: ControlDescriptionProps) => {
    const margin = Math.round(fontSize * (direction === FlexDirection.Column ? 0.3 : 0.5));
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
        ? <Text text={beforeLabel} style={{ ...FONT_STYLE, fontSize, fill: background }} />
        : null;

    const afterText = afterLabel
        ? <Text text={afterLabel} style={{ ...FONT_STYLE, fontSize, fill: background }} />
        : null;

    return (
        <Container
            {...props}
            flexContainer
            layoutStyle={{ ...props.layoutStyle, alignItems: Align.Center, flexDirection: direction }}
        >
            {beforeText}
            <ControlGraphic
                type={type}
                control={control}
                background={background}
                foreground={foreground}
                fontSize={fontSize * 0.75}
                layoutStyle={controlGraphicLayout}
            />
            {afterText}
        </Container>
    );
};

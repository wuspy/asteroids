import { ComponentProps, ReactNode } from "react";
import { Align, FlexDirection, JustifyContent, PositionType } from "../layout";
import { FONT_STYLE, MODAL_BACKGROUND } from "./theme";
import { Divider, DividerDirection } from "./Divider";
import { FadeContainer } from "./FadeContainer";
import { Container, Text } from "../react-pixi";

export interface ModalProps extends Omit<
    ComponentProps<typeof FadeContainer>,
    | "fadeInDuration"
    | "fadeOutDuration"
    | "visible"
    | "backgroundStyle"
    | "flexContainer"
> {
    open: boolean;
    headerTitle?: string;
    headerRightContent?: ReactNode;
    padding?: number;
}

export const Modal = ({ children, open, headerTitle, headerRightContent, padding = 16, ...props }: ModalProps) => {
    const header = (headerTitle || headerRightContent) && <>
        <Container
            flexContainer
            layoutStyle={{
                width: "100%",
                alignItems: Align.Center,
                justifyContent: JustifyContent.SpaceBetween,
            }}
        >
            <Text
                text={headerTitle}
                style={{ ...FONT_STYLE, fontSize: 32 }}
                layoutStyle={headerRightContent ? { marginRight: padding } : undefined}
            />
            {headerRightContent}
        </Container>
        <Divider direction={DividerDirection.Horizontal} margin={padding} />
    </>;

    return <FadeContainer
        {...props}
        visible={open}
        backgroundStyle={MODAL_BACKGROUND}
        flexContainer
        fadeInDuration={200}
        fadeOutDuration={200}
        layoutStyle={{
            ...props.layoutStyle,
            position: PositionType.Absolute,
            flexDirection: FlexDirection.Column,
            padding,
        }}
    >
        {header}
        {children}
    </FadeContainer>;
};

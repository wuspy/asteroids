import { ComponentProps, ReactNode } from "react";
import { Align, FlexDirection, JustifyContent, PositionType } from "../layout";
import { FONT_STYLE, MODAL_BACKGROUND } from "./theme";
import { Divider, DividerDirection } from "./Divider";
import { FadeContainer } from "./FadeContainer";
import { Container, Text } from "../react-pixi";
import { useInputEvent } from "../AppContext";
import { ModalCloseButton } from "./ModalCloseButton";

export interface ModalProps extends Omit<
    ComponentProps<typeof FadeContainer>,
    | "fadeInDuration"
    | "fadeOutDuration"
    | "visible"
    | "backgroundStyle"
    | "flexContainer"
> {
    open: boolean;
    onRequestClose: () => void;
    header?: string;
    padding?: number;
}

export const Modal = ({ children, open, onRequestClose, header, padding = 16, ...props }: ModalProps) => {
    const headerContent = header && <>
        <Container
            flexContainer
            layoutStyle={{
                width: "100%",
                alignItems: Align.Center,
                justifyContent: JustifyContent.SpaceBetween,
            }}
        >
            <Text
                text={header}
                style={{ ...FONT_STYLE, fontSize: 32 }}
                layoutStyle={{ marginRight: padding }}
            />
            <ModalCloseButton onClick={onRequestClose} />
        </Container>
        <Divider direction={DividerDirection.Horizontal} margin={padding} />
    </>;

    useInputEvent("poll", (state, prevState) => {
        if (state.back && !prevState.back) {
            onRequestClose();
        }
    }, open);

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
        {headerContent}
        {children}
    </FadeContainer>;
};

import { Show } from "solid-js";
import { onInputEvent } from "../AppContext";
import { Divider } from "./Divider";
import { FadeContainer, FadeContainerProps } from "./FadeContainer";
import { ModalCloseButton } from "./ModalCloseButton";
import { MODAL_BACKGROUND } from "./theme";

export interface ModalProps extends Omit<FadeContainerProps,
    | "fadeInDuration"
    | "fadeOutDuration"
    | "visible"
    | "backgroundStyle"
    | "flexContainer"
> {
    open: boolean;
    header?: string;
    padding?: number;
    onRequestClose: () => void;
}

const DEFAULT_PADDING = 16;

export const Modal = (props: ModalProps) => {
    onInputEvent("poll", (state, prevState) => {
        if (state.back && !prevState.back) {
            props.onRequestClose();
        }
    }, () => props.open);

    return <FadeContainer
        {...props}
        visible={props.open}
        backgroundStyle={MODAL_BACKGROUND}
        flexContainer
        fadeInDuration={200}
        fadeOutDuration={200}
        yg:position="absolute"
        yg:flexDirection="column"
        yg:padding={props.padding ?? DEFAULT_PADDING}
    >
        <Show when={!!props.header}>
            <container
                flexContainer
                yg:width="100%"
                yg:alignItems="center"
                yg:justifyContent="space-between"
            >
                <text
                    text={props.header}
                    style:fontSize={32}
                    yg:marginRight={props.padding ?? DEFAULT_PADDING}
                />
                <ModalCloseButton onClick={props.onRequestClose} />
            </container>
            <Divider direction="horizontal" yg:marginY={props.padding ?? DEFAULT_PADDING} />
        </Show>
        {props.children}
    </FadeContainer>;
};

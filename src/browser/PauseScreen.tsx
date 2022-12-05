import { useEffect, useMemo, useState } from "react";
import { GlowFilter } from "@pixi/filter-glow";
import { Align, ContainerBackgroundShape, FlexDirection, PositionType } from "./layout";
import { FadeContainer, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, RevealText, Button, ButtonType, FONT_STYLE } from "./ui";
import { ChromaticAbberationFilter } from "./filters";
import { Container, ContainerProps } from "./react-pixi";
import { StartControl } from "./StartControl";
import { useApp, useInputEvent } from "./AppContext";

export const PauseScreen = (props: ContainerProps) => {
    const { paused, dispatch } = useApp();
    const [visible, setVisible] = useState(paused);
    const titleFilters = useMemo(() => [
        new GlowFilter({
            outerStrength: 1,
            distance: 24,
        }),
        new ChromaticAbberationFilter(1, 2),
    ], []);

    useEffect(() => setVisible(paused), [paused]);

    const onQuit = () => {
        setVisible(false);
        setTimeout(() => {
            dispatch("quit");
            setTimeout(() => dispatch("reset"), 1000);
        }, 200);
    };

    const onResume = () => {
        setVisible(false);
        setTimeout(() => dispatch("resume"), 120);
    };

    useInputEvent("poll", (state, lastState) => {
        if (state.start && !lastState.start) {
            onResume();
        }
    }, visible);

    return (
        <FadeContainer
            {...props}
            visible={visible}
            // Causes the content to mount just before it becomes visible
            // so the RevealText animation will work
            keepMounted={paused}
            fadeInDuration={100}
            fadeOutDuration={120}
            flexContainer
            layoutStyle={{
                position: PositionType.Absolute,
                width: "100%",
                flexDirection: FlexDirection.Column,
                alignItems: Align.Center,
            }}
            backgroundStyle={{
                shape: ContainerBackgroundShape.Rectangle,
                fill: {
                    color: UI_BACKGROUND_COLOR,
                    alpha: UI_BACKGROUND_ALPHA,
                },
            }}
        >
            <RevealText
                text="PAUSED"
                revealed={visible}
                duration={500}
                style={{ ...FONT_STYLE, fontSize: 64 }}
                layoutStyle={{ margin: 24, marginBottom: 18 }}
                filters={titleFilters}
            />
            <StartControl resume on:pointertap={onResume} />
            <Container flexContainer layoutStyle={{ margin: 24, marginTop: 36 }}>
                <Button type={ButtonType.Danger} text="Quit" onClick={onQuit} />
            </Container>
        </FadeContainer>
    );
};

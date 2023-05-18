import { FederatedPointerEvent } from "@pixi/events";
import { GlowFilter } from "@pixi/filter-glow";
import { createEffect, createSignal, on } from "solid-js";
import { ChromaticAbberationFilter } from "./filters";
import { ContainerBackgroundShape } from "./layout";
import { ContainerProps } from "./solid-pixi";
import { Button, FONT_STYLE, FadeContainer, RevealText, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR } from "./ui";
// import { StartControl } from "./StartControl";
import { onInputEvent, useApp } from "./AppContext";
import { StartControl } from "./StartControl";

export const PauseScreen = (props: ContainerProps) => {
    const { isPaused, resume, quit, reset } = useApp();

    const [visible, setVisible] = createSignal(isPaused());

    // Causes the content to mount just before it becomes visible
    // so the RevealText animation will work
    createEffect(on(isPaused, isPaused => requestAnimationFrame(() => setVisible(isPaused))));

    const onQuit = () => {
        setVisible(false);
        setTimeout(() => {
            quit();
            setTimeout(reset, 1000);
        }, 200);
    };

    const onResume = () => {
        setVisible(false);
        setTimeout(resume, 120);
    };

    const onResumeClick = (e: FederatedPointerEvent) => e.button === 0 && onResume();

    onInputEvent("poll", (state, lastState) => {
        if (state.start && !lastState.start) {
            onResume();
        }
    }, visible);

    return (
        <FadeContainer
            {...props}
            visible={visible()}
            keepMounted={isPaused()}
            fadeInDuration={100}
            fadeOutDuration={120}
            flexContainer
            yg:position="absolute"
            yg:width="100%"
            yg:flexDirection="column"
            yg:alignItems="center"
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
                revealed={visible()}
                duration={500}
                style={{ ...FONT_STYLE, fontSize: 64 }}
                yg:margin={24}
                yg:marginBottom={18}
                filters={[
                    new GlowFilter({
                        outerStrength: 1,
                        distance: 24,
                    }),
                    new ChromaticAbberationFilter(1, 2),
                ]}
            />
            <StartControl color={UI_FOREGROUND_COLOR} type="resume" on:pointertap={onResumeClick} />
            <container flexContainer yg:margin={24} yg:marginTop={36}>
                <Button type="danger" text="Quit" onClick={onQuit} />
            </container>
        </FadeContainer>
    );
};

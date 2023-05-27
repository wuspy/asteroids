import { FederatedPointerEvent } from "@pixi/events";
import { GlowFilter } from "@pixi/filter-glow";
import { createEffect, createSignal } from "solid-js";
import { onInputEvent, useApp } from "./AppContext";
import { StartControl } from "./StartControl";
import { ChromaticAbberationFilter } from "./filters";
import { ContainerBackgroundShape } from "./layout";
import { ContainerProps } from "./solid-pixi";
import { Button, FadeContainer, RevealText, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR } from "./ui";

export const PauseScreen = (props: ContainerProps) => {
    const { isPaused, resume, quit, reset } = useApp();

    const [visible, setVisible] = createSignal(isPaused());

    createEffect(() => setVisible(isPaused()));

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

    // eslint-disable-next-line solid/reactivity
    onInputEvent("poll", (state, lastState) => {
        if (state.start && !lastState.start) {
            onResume();
        }
    }, visible);

    return (
        <FadeContainer
            {...props}
            visible={visible()}
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
                initiallyRevealed={false}
                duration={500}
                style={{ fontSize: 64 }}
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

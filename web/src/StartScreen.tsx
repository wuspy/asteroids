import { Container } from "@pixi/display";
import { FederatedPointerEvent } from "@pixi/events";
import { GameStatus } from "@wuspy/asteroids-core";
import { Show, createEffect, createSignal } from "solid-js";
import { AboutMeModal } from "./AboutMeModal";
import { onGameEvent, onInputEvent, useApp } from "./AppContext";
import { LeaderboardModal } from "./LeaderboardModal";
import { StartControl } from "./StartControl";
import { createShipTexture } from "./gameplay";
import { ContainerProps } from "./solid-pixi";
import { Button, ControlDescription, FadeContainer, Pointer } from "./ui";
import { createDropShadowTexture } from "./util";

const delayBetweenControls = 120;

export const StartScreen = (props: ContainerProps) => {
    const { game, renderer, theme, nextToken, start } = useApp();

    const [started, setStarted] = createSignal(game.state.status !== GameStatus.Init);
    const [visible, setVisible] = createSignal(false);
    const [bottomControlsVisible, setBottomControlsVisible] = createSignal(false);
    const [leaderboardOpen, setLeaderboardOpen] = createSignal(false);
    const [aboutOpen, setAboutOpen] = createSignal(false);
    const [fadeInDelay, setFadeInDelay] = createSignal(500);

    let mainContainer!: Container;

    createEffect(() => started() ? setVisible(false) : show(true));
    onGameEvent("started", () => setStarted(true));
    onGameEvent("reset", () => setStarted(false));

    const onStart = () => {
        if (!nextToken.loading) {
            setVisible(false)
            setTimeout(start, 1000);
        }
    };

    const onStartClick = (e: FederatedPointerEvent) => e.button === 0 && onStart();

    // eslint-disable-next-line solid/reactivity
    onInputEvent("poll", (state, lastState) => {
        if (state.start && !lastState.start) {
            onStart();
        }
    }, visible);

    const show = (withDelay: boolean) => {
        setFadeInDelay(withDelay ? 500 : 0);
        setVisible(true);
        if (withDelay) {
            setBottomControlsVisible(false);
            setTimeout(() => setBottomControlsVisible(true), 1500);
        } else {
            setBottomControlsVisible(true);
        }
    };

    const onAboutClick = () => {
        setAboutOpen(true);
        setVisible(false);
    };
    const onAboutClose = () => {
        setAboutOpen(false);
        show(false);
    };
    const onLeaderboardClick = () => {
        setLeaderboardOpen(true);
        setVisible(false);
    };
    const onLeaderboardClose = () => {
        setLeaderboardOpen(false);
        show(false);
    };

    return <>
        <FadeContainer
            {...props}
            ref={mainContainer}
            visible={visible()}
            keepMounted={!started()}
            fadeInDuration={500}
            fadeOutDuration={500}
            flexContainer
            yg:alignItems="center"
            yg:justifyContent="center"
        >
            <container
                alpha={theme().foregroundAlpha}
                skew={[-0.02, 0.02]}
                yg:position="absolute"
                yg:anchor={0.5}
            >
                <Pointer
                    position={[0, -40]}
                    angle={0}
                    length={50}
                    delay={fadeInDelay()}
                    revealed={visible()}
                    color={theme().foregroundColor}
                    childAttachment="bottom"
                >
                    <ControlDescription
                        color={theme().foregroundColor}
                        size={24}
                        control="fire"
                        beforeLabel="Fire"
                        direction="column"
                    />
                </Pointer>
                <Pointer
                    position={[20, -10]}
                    angle={70}
                    length={50}
                    delay={fadeInDelay() + delayBetweenControls}
                    revealed={visible()}
                    color={theme().foregroundColor}
                    childAttachment="left"
                >
                    <ControlDescription
                        color={theme().foregroundColor}
                        size={24}
                        control="turn"
                        analogValue={1}
                        afterLabel="Turn Right"
                        direction="row"
                    />
                </Pointer>
                <Pointer
                    position={[26, 40]}
                    angle={120}
                    length={50}
                    delay={fadeInDelay() + 2 * delayBetweenControls}
                    revealed={visible()}
                    color={theme().foregroundColor}
                    childAttachment="left"
                >
                    <ControlDescription
                        color={theme().foregroundColor}
                        size={24}
                        control="hyperspace"
                        afterLabel="Hyperspace"
                        direction="row"
                    />
                </Pointer>
                <Pointer
                    position={[0, 30]}
                    angle={180}
                    length={50}
                    delay={fadeInDelay() + 3 * delayBetweenControls}
                    revealed={visible()}
                    color={theme().foregroundColor}
                    childAttachment="top"
                >
                    <ControlDescription
                        color={theme().foregroundColor}
                        size={24}
                        control="thrust"
                        afterLabel="Thrust"
                        direction="column"
                    />
                </Pointer>
                <Pointer
                    position={[-26, 40]}
                    angle={240}
                    length={50}
                    delay={fadeInDelay() + 4 * delayBetweenControls}
                    revealed={visible()}
                    color={theme().foregroundColor}
                    childAttachment="right"
                >
                    <ControlDescription
                        color={theme().foregroundColor}
                        size={24}
                        control="start"
                        beforeLabel="Pause"
                        direction="row"
                    />
                </Pointer>
                <Pointer
                    position={[-20, -10]}
                    angle={290}
                    length={50}
                    delay={fadeInDelay() + 5 * delayBetweenControls}
                    revealed={visible()}
                    color={theme().foregroundColor}
                    childAttachment="right"
                >
                    <ControlDescription
                        color={theme().foregroundColor}
                        size={24}
                        control="turn"
                        analogValue={-1}
                        beforeLabel="Turn Left"
                        direction="row"
                    />
                </Pointer>
                <sprite
                    texture={createDropShadowTexture(renderer, createShipTexture(renderer))}
                    anchor={0.5}
                    tint={theme().foregroundColor}
                />
            </container>
            <FadeContainer
                fadeInDuration={500}
                fadeOutDuration={0}
                keepMounted
                keepPixiVisible
                visible={bottomControlsVisible()}
                blur={0}
                filterPadding={24}
                skew={[-0.02, 0.02]}
                flexContainer
                yg:flexDirection="column"
                yg:alignItems="center"
                yg:top={220}
            >
                <StartControl
                    type="start"
                    color={theme().foregroundColor}
                    alpha={theme().foregroundAlpha}
                    yg:margin={24}
                    on:pointertap={onStartClick}
                />
                <container flexContainer yg:flexDirection="column" yg:alignItems="center">
                    <container flexContainer>
                        <Button
                            text="About Me"
                            type="secondary"
                            onClick={onAboutClick}
                            yg:marginX={12}
                        />
                        <Show when={nextToken()}>
                            <Button
                                text="Leaderboard"
                                type="secondary"
                                onClick={onLeaderboardClick}
                                yg:marginX={12}
                            />
                        </Show>
                    </container>
                </container>
            </FadeContainer>
        </FadeContainer>
        <LeaderboardModal open={leaderboardOpen()} onClose={onLeaderboardClose} />
        <AboutMeModal open={aboutOpen()} onClose={onAboutClose} />
    </>;
};

import { Container, ContainerProps, RefType, Sprite } from "./react-pixi";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp, useInputEvent } from "./AppContext";
import { Align, FlexDirection, JustifyContent, PositionType } from "./layout";
import { Button, ButtonType, ControlDescription, FadeContainer, Pointer } from "./ui";
import { StartControl } from "./StartControl";
import { GameStatus } from "../core";
import { LeaderboardModal } from "./LeaderboardModal";
import { AboutMeModal } from "./AboutMeModal";
import { createDropShadowTexture } from "./util";
import { createShipTexture } from "./gameplay";

const delayBetweenControls = 100;

export const StartScreen = (props: ContainerProps) => {
    const { game, renderer, theme, nextToken, nextTokenLoading, dispatch } = useApp();
    const gameInit = game.state.status === GameStatus.Init;
    const [visible, setVisible] = useState(false);
    const [bottomControlsVisible, setBottomControlsVisible] = useState(false);
    const [leaderboardOpen, setLeaderboardOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const shipTexture = useMemo(() => createDropShadowTexture(renderer, createShipTexture(renderer)), [renderer]);
    const mainContainer = useRef<RefType<typeof Container>>(null);
    const [fadeInDelay, setFadeInDelay] = useState(500);

    useEffect(() => gameInit ? show(true) : hide(), [gameInit]);

    const onStart = () => {
        if (!nextTokenLoading) {
            hide();
            setTimeout(() => dispatch("start"), 1000);
        }
    };

    useInputEvent("poll", (state, lastState) => {
        if (state.start && !lastState.start) {
            onStart();
        }
    }, visible);

    const show = (withDelay: boolean) => {
        setFadeInDelay(withDelay ? 500 : 0);
        setVisible(true);
        if (withDelay) {
            setTimeout(() => setBottomControlsVisible(true), 1500);
        } else {
            setBottomControlsVisible(true);
        }
    };

    const hide = () => {
        setVisible(false);
        setBottomControlsVisible(false);
    };

    const onAboutClick = () => {
        setAboutOpen(true);
        hide();
    };
    const onAboutClose = () => {
        setAboutOpen(false);
        show(false);
    };
    const onLeaderboardClick = () => {
        setLeaderboardOpen(true);
        hide();
    };
    const onLeaderboardClose = () => {
        setLeaderboardOpen(false);
        show(false);
    };

    return <>
        <FadeContainer
            {...props}
            ref={mainContainer}
            visible={visible}
            keepMounted={gameInit}
            fadeInDuration={500}
            fadeOutDuration={500}
            flexContainer
            layoutStyle={{
                alignItems: Align.Center,
                justifyContent: JustifyContent.Center,
            }}
        >
            <Container
                alpha={theme.foregroundAlpha}
                skew={[-0.02, 0.02]}
                layoutStyle={{
                    position: PositionType.Absolute,
                    originAtCenter: true,
                }}
            >
                <Pointer
                    position={[0, -40]}
                    angle={0}
                    length={50}
                    delay={fadeInDelay}
                    revealed={visible}
                    color={theme.foregroundColor}
                    childAttachment="bottom"
                >
                    <ControlDescription
                        color={theme.foregroundColor}
                        size={24}
                        control="fire"
                        beforeLabel="Fire"
                        direction={FlexDirection.Column}
                    />
                </Pointer>
                <Pointer
                    position={[20, -10]}
                    angle={70}
                    length={50}
                    delay={fadeInDelay + delayBetweenControls}
                    revealed={visible}
                    color={theme.foregroundColor}
                    childAttachment="left"
                >
                    <ControlDescription
                        color={theme.foregroundColor}
                        size={24}
                        control="turn"
                        analogValue={1}
                        afterLabel="Turn Right"
                        direction={FlexDirection.Row}
                    />
                </Pointer>
                <Pointer
                    position={[26, 40]}
                    angle={120}
                    length={50}
                    delay={fadeInDelay + 2 * delayBetweenControls}
                    revealed={visible}
                    color={theme.foregroundColor}
                    childAttachment="left"
                >
                    <ControlDescription
                        color={theme.foregroundColor}
                        size={24}
                        control="hyperspace"
                        afterLabel="Hyperspace"
                        direction={FlexDirection.Row}
                    />
                </Pointer>
                <Pointer
                    position={[0, 30]}
                    angle={180}
                    length={50}
                    delay={fadeInDelay + 3 * delayBetweenControls}
                    revealed={visible}
                    color={theme.foregroundColor}
                    childAttachment="top"
                >
                    <ControlDescription
                        color={theme.foregroundColor}
                        size={24}
                        control="thrust"
                        afterLabel="Thrust"
                        direction={FlexDirection.Column}
                    />
                </Pointer>
                <Pointer
                    position={[-26, 40]}
                    angle={240}
                    length={50}
                    delay={fadeInDelay + 4 * delayBetweenControls}
                    revealed={visible}
                    color={theme.foregroundColor}
                    childAttachment="right"
                >
                    <ControlDescription
                        color={theme.foregroundColor}
                        size={24}
                        control="start"
                        beforeLabel="Pause"
                        direction={FlexDirection.Row}
                    />
                </Pointer>
                <Pointer
                    position={[-20, -10]}
                    angle={290}
                    length={50}
                    delay={fadeInDelay + 5 * delayBetweenControls}
                    revealed={visible}
                    color={theme.foregroundColor}
                    childAttachment="right"
                >
                    <ControlDescription
                        color={theme.foregroundColor}
                        size={24}
                        control="turn"
                        analogValue={-1}
                        beforeLabel="Turn Left"
                        direction={FlexDirection.Row}
                    />
                </Pointer>
                <Sprite texture={shipTexture} anchor={0.5} tint={theme.foregroundColor} />
            </Container>
            <FadeContainer
                flexContainer
                fadeInDuration={500}
                fadeOutDuration={500}
                keepMounted
                keepPixiVisible
                visible={bottomControlsVisible}
                blur={0}
                skew={[-0.02, 0.02]}
                layoutStyle={{
                    flexDirection: FlexDirection.Column,
                    alignItems: Align.Center,
                    top: 220,
                }}
            >
                <StartControl
                    color={theme.foregroundColor}
                    alpha={theme.foregroundAlpha}
                    layoutStyle={{ margin: 24 }}
                    on:pointertap={onStart}
                />
                <Container flexContainer layoutStyle={{ flexDirection: FlexDirection.Column, alignItems: Align.Center }}>
                    <Container flexContainer>
                        <Button
                            text="About Me"
                            type={ButtonType.Secondary}
                            onClick={onAboutClick}
                            layoutStyle={{ marginX: 12 }}
                        />
                        {nextToken && <Button
                            text="Leaderboard"
                            type={ButtonType.Secondary}
                            onClick={onLeaderboardClick}
                            layoutStyle={{ marginX: 12 }}
                        />}
                    </Container>
                </Container>
            </FadeContainer>
        </FadeContainer>
        <LeaderboardModal open={leaderboardOpen} onClose={onLeaderboardClose} />
        <AboutMeModal open={aboutOpen} onClose={onAboutClose} />
    </>;
};

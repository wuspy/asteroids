import { Container, ContainerProps } from "./react-pixi";
import { useEffect, useState } from "react";
import { useApp, useInputEvent } from "./AppContext";
import { Align, FlexDirection, PositionType } from "./layout";
import { Button, ButtonType, FadeContainer } from "./ui";
import { StartControl } from "./StartControl";
import { GameStatus } from "../core";

// TODO
export const StartScreen = (props: ContainerProps) => {
    const { game, aboutOpen, leaderboardOpen, nextToken, dispatch } = useApp();
    const gameInit = game.state.status === GameStatus.Init;
    const [visible, setVisible] = useState(gameInit);

    useEffect(() => setVisible(gameInit), [gameInit]);

    const onStart = () => {
        setVisible(false);
        setTimeout(() => dispatch("start"), 1000);
    };

    useInputEvent("poll", (state, lastState) => {
        if (state.start && !lastState.start) {
            onStart();
        }
    }, visible && !aboutOpen && !leaderboardOpen);

    const onAboutClick = () => dispatch("openAbout");
    const onLeaderboardClick = () => dispatch("openLeaderboard");

    return (
        <FadeContainer
            {...props}
            visible={visible && !aboutOpen && !leaderboardOpen}
            fadeInDuration={0}
            fadeOutDuration={500}
            flexContainer
            layoutStyle={{
                position: PositionType.Absolute,
                flexDirection: FlexDirection.Column,
                alignItems: Align.Center,
                paddingTop: 148,
            }}
        >
            <StartControl layoutStyle={{ margin: 24 }} on:pointertap={onStart} />
            <Container flexContainer layoutStyle={{ flexDirection: FlexDirection.Column, alignItems: Align.Center }}>
                <Container flexContainer>
                    <Button
                        text="About Me"
                        type={ButtonType.Secondary}
                        onClick={onAboutClick}
                        layoutStyle={{ marginX: 12 }}
                    />
                    {nextToken
                        ? <Button
                            text="Leaderboard"
                            type={ButtonType.Secondary}
                            onClick={onLeaderboardClick}
                            layoutStyle={{ marginX: 12 }}
                        />
                        : null
                    }
                </Container>
            </Container>
        </FadeContainer>
    );
};

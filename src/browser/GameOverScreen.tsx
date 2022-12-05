import { useEffect, useMemo, useState } from "react";
import { GlowFilter } from "@pixi/filter-glow";
import { Align, ContainerBackgroundShape, FlexDirection, PositionType } from "./layout";
import { FadeContainer, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR, RevealText, FONT_STYLE, Button, ButtonType, ScoreText, BUTTON_THEMES } from "./ui";
import { ChromaticAbberationFilter } from "./filters";
import { Container, ContainerProps, Text } from "./react-pixi";
import { useApp } from "./AppContext";
import { SaveScoreModal } from "./SaveScoreModal";
import { GameStatus } from "../core";

export const GameOverScreen = (props: ContainerProps) => {
    const { leaderboardOpen, game, token, dispatch } = useApp();
    const gameOver = game.state.status === GameStatus.Finished;
    const [visible, setVisible] = useState(gameOver);
    const [saveScoreOpen, setSaveScoreOpen] = useState(false);
    const [scoreSaved, setScoreSaved] = useState(false);

    const titleFilters = useMemo(() => [
        new GlowFilter({
            outerStrength: 1,
            distance: 24,
        }),
        new ChromaticAbberationFilter(1, 2),
    ], []);

    const scoreFilters = useMemo(() => [
        new GlowFilter({
            outerStrength: 1,
            distance: 24,
            color: UI_FOREGROUND_COLOR,
            quality: 0.05,
        }),
        new ChromaticAbberationFilter(4, 2),
    ], []);

    useEffect(() => {
        setVisible(gameOver);
        setScoreSaved(false);
        setSaveScoreOpen(false);
    }, [gameOver]);

    const onNewGameClicked = () => {
        setVisible(false);
        setTimeout(() => {
            dispatch("quit");
            setTimeout(() => dispatch("reset"), 1000);
        }, 200);
    };
    const onLeaderboardClicked = () => dispatch("openLeaderboard");
    const onSaveScoreClicked = () => setSaveScoreOpen(true);
    const onSaveScoreClose = () => setSaveScoreOpen(false);
    const onScoreSaved = () => {
        setSaveScoreOpen(false);
        setScoreSaved(true);
    };

    const enableSave = gameOver && token && game.enableLogging;

    const saveEnabledButtons = enableSave && <>
        <Button
            type={ButtonType.Secondary}
            text="Leaderboard"
            onClick={onLeaderboardClicked}
            layoutStyle={{ marginX: 12 }}
        />
        {scoreSaved
            // TODO add native disabled state to button
            ? <Container
                flexContainer
                layoutStyle={{
                    paddingX: 14,
                    paddingY: 10,
                    marginX: 12,
                    flexDirection: FlexDirection.Row,
                    alignItems: Align.Center,
                }}
                backgroundStyle={{
                    shape: ContainerBackgroundShape.Rectangle,
                    cornerRadius: 8,
                    stroke: {
                        width: BUTTON_THEMES[ButtonType.Primary].inactive.stroke?.width || 2,
                        color: BUTTON_THEMES[ButtonType.Primary].inactive.fill?.color ?? 0xffffff,
                    },
                }}
                alpha={(BUTTON_THEMES[ButtonType.Primary].inactive.fill?.alpha || 1) * 0.5}
            >
                <Text
                    text={"  Saved!  "}
                    style={{
                        ...FONT_STYLE,
                        fontSize: 20,
                        fill: BUTTON_THEMES[ButtonType.Primary].inactive.fill?.color ?? 0xffffff
                    }}
                />
            </Container>
            : <Button
                type={ButtonType.Primary}
                text={"Save Score"}
                onClick={onSaveScoreClicked}
                layoutStyle={{ marginX: 12 }}
            />
        }
    </>;

    return <>
        <FadeContainer
            {...props}
            visible={visible && !saveScoreOpen && !leaderboardOpen}
            // Causes the content to mount just before it becomes visible
            // so the RevealText animation will work
            keepMounted={gameOver}
            fadeOutAmount={visible && (saveScoreOpen || leaderboardOpen) ? 0.5 : 0}
            fadeInDuration={100}
            fadeOutDuration={200}
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
                text="GAME OVER"
                revealed={visible}
                duration={500}
                style={{ ...FONT_STYLE, fontSize: 64 }}
                layoutStyle={{ margin: 24, marginBottom: 18 }}
                filters={titleFilters}
            />
            <ScoreText
                score={game.state.score}
                zeroAlpha={0.2}
                style={{ ...FONT_STYLE, fontSize: 104 }}
                filters={scoreFilters}
            />
            <Container flexContainer layoutStyle={{ margin: 24, marginTop: 18 }}>
                <Button
                    type={enableSave ? ButtonType.Secondary : ButtonType.Primary}
                    text="New Game"
                    onClick={onNewGameClicked}
                    layoutStyle={{ marginX: 12 }}
                />
                {saveEnabledButtons}
            </Container>
        </FadeContainer>
        {enableSave && <SaveScoreModal open={saveScoreOpen} onClose={onSaveScoreClose} onSaved={onScoreSaved} />}
    </>;
}

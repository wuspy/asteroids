import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { GlowFilter } from "@pixi/filter-glow";
import { Align, ContainerBackgroundShape, FlexDirection, PositionType } from "./layout";
import { FadeContainer, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR, RevealText, FONT_STYLE, Button, ButtonType, ScoreText, BUTTON_THEMES } from "./ui";
import { ChromaticAbberationFilter } from "./filters";
import { Container, ContainerProps, Text } from "./react-pixi";
import { useApp, useTick } from "./AppContext";
import { SaveScoreModal } from "./SaveScoreModal";
import { GameStatus } from "../core";
import { LeaderboardModal } from "./LeaderboardModal";
import { GameResponse } from "../core/api";
import anime from "animejs";

export const GameOverScreen = (props: ContainerProps) => {
    const { game, token, dispatch } = useApp();
    const gameOver = game.state.status === GameStatus.Finished;
    const [visible, setVisible] = useState(gameOver);
    const [saveScoreOpen, setSaveScoreOpen] = useState(false);
    const [leaderboardOpen, setLeaderboardOpen] = useState(false);
    const [savedScoreId, setSavedScoreId] = useState<number>();
    const [anim, setAnim] = useState<anime.AnimeTimelineInstance>();

    const inBackground = saveScoreOpen || leaderboardOpen;

    const titleGlowFilter = useMemo(() =>
        new GlowFilter({
            outerStrength: 1,
            distance: 24,
        }),
        []
    );

    const titleAbberationFilter = useMemo(() =>
        new ChromaticAbberationFilter(1, 2),
        []
    );

    const scoreGlowFilter = useMemo(() =>
        new GlowFilter({
            outerStrength: 1,
            distance: 36,
            color: UI_FOREGROUND_COLOR,
            quality: 0.05,
        }),
        []
    );

    const scoreAbberationFilter = useMemo(() =>
        new ChromaticAbberationFilter(4, 2),
        []
    );

    useEffect(() => {
        setVisible(gameOver);
        setSavedScoreId(undefined);
        setSaveScoreOpen(false);
        if (gameOver) {
            game.state.score = 13660;
            scoreGlowFilter.outerStrength = 0;
            setAnim(anime.timeline({ autoplay: false })
                .add({
                    targets: scoreGlowFilter,
                    outerStrength: 2,
                    easing: "easeOutElastic",
                    delay: 150,
                    duration: 600,
                }).add({
                    targets: scoreGlowFilter,
                    outerStrength: 0.8,
                    easing: "linear",
                    delay: 250,
                    duration: 750,
                    complete: () => {
                        setAnim(undefined);
                    },
                })
            );
            return () => setAnim(undefined);
        }
    }, [gameOver]);

    // Disabling these filters when blurred massively increase performance
    useLayoutEffect(() => {
        scoreGlowFilter.enabled
            = scoreAbberationFilter.enabled
            = titleGlowFilter.enabled
            = titleAbberationFilter.enabled
            = !inBackground;
    }, [inBackground]);

    useTick("app", (timestamp) => anim!.tick(timestamp), !!anim);

    const onNewGameClicked = () => {
        setVisible(false);
        setTimeout(() => {
            dispatch("quit");
            setTimeout(() => dispatch("reset"), 1000);
        }, 200);
    };
    const onLeaderboardClicked = () => setLeaderboardOpen(true);
    const onLeaderboardClose = () => setLeaderboardOpen(false);
    const onSaveScoreClicked = () => setSaveScoreOpen(true);
    const onSaveScoreClose = () => setSaveScoreOpen(false);
    const onScoreSaved = (game: GameResponse) => {
        setSaveScoreOpen(false);
        setSavedScoreId(game.id);
        setTimeout(() => setLeaderboardOpen(true), 200);
    };

    const enableSave = gameOver && token && game.enableLogging;

    const saveEnabledButtons = enableSave && <>
        <Button
            type={ButtonType.Secondary}
            text="Leaderboard"
            onClick={onLeaderboardClicked}
            layoutStyle={{ marginX: 12 }}
        />
        {savedScoreId
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
            visible={visible && !inBackground}
            // Causes the content to mount just before it becomes visible
            // so the RevealText animation will work
            keepMounted={gameOver}
            fadeOutAmount={inBackground ? 0.5 : 0}
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
                filters={[titleGlowFilter, titleAbberationFilter]}
            />
            <ScoreText
                score={game.state.score}
                zeroAlpha={0.2}
                style={{ ...FONT_STYLE, fontSize: 104 }}
                filters={[scoreGlowFilter, scoreAbberationFilter]}
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
        <LeaderboardModal open={leaderboardOpen} onClose={onLeaderboardClose} selectedId={savedScoreId} />
        {enableSave && <SaveScoreModal open={saveScoreOpen} onClose={onSaveScoreClose} onSaved={onScoreSaved} />}
    </>;
};

import { GlowFilter } from "@pixi/filter-glow";
import { TextStyleFill } from "@pixi/text";
import { GameStatus } from "@wuspy/asteroids-core";
import anime from "animejs";
import { Show, batch, createRenderEffect, createSignal } from "solid-js";
import { onGameEvent, onTick, useApp } from "./AppContext";
import { LeaderboardModal } from "./LeaderboardModal";
import { SaveScoreModal } from "./SaveScoreModal";
import { ChromaticAbberationFilter } from "./filters";
import { ContainerBackgroundShape } from "./yoga-pixi";
import { ContainerProps } from "./solid-pixi";
import {
    BUTTON_THEMES,
    Button,
    FadeContainer,
    RevealText,
    ScoreText,
    UI_BACKGROUND_ALPHA,
    UI_BACKGROUND_COLOR,
    UI_FOREGROUND_COLOR
} from "./ui";

export const GameOverScreen = (props: ContainerProps) => {
    const { game, token, quit, reset } = useApp();

    const [visible, setVisible] = createSignal(game.state.status === GameStatus.Finished);
    const [saveScoreOpen, setSaveScoreOpen] = createSignal(false);
    const [leaderboardOpen, setLeaderboardOpen] = createSignal(false);
    const [savedScoreId, setSavedScoreId] = createSignal<number>();
    const [anim, setAnim] = createSignal<anime.AnimeTimelineInstance>();

    const inBackground = () => saveScoreOpen() || leaderboardOpen();

    const titleGlowFilter = new GlowFilter({
        outerStrength: 1,
        distance: 24,
    });
    const titleAbberationFilter = new ChromaticAbberationFilter(1, 2);
    const scoreGlowFilter = new GlowFilter({
        outerStrength: 1,
        distance: 36,
        color: UI_FOREGROUND_COLOR,
        quality: 0.05,
    });
    const scoreAbberationFilter = new ChromaticAbberationFilter(4, 2);

    onGameEvent("finished", () => batch(() => {
        setSavedScoreId(undefined);
        setSaveScoreOpen(false);
        setVisible(true);
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
                complete: () => setAnim(undefined),
            })
        );
    }));

    onGameEvent("reset", () => batch(() => {
        setVisible(false);
        setSavedScoreId(undefined);
        setSaveScoreOpen(false);
        setAnim(undefined);
    }));

    // Disabling these filters when blurred massively increase performance
    createRenderEffect(() => {
        scoreGlowFilter.enabled
            = scoreAbberationFilter.enabled
            = titleGlowFilter.enabled
            = titleAbberationFilter.enabled
            = !inBackground();
    });

    // eslint-disable-next-line solid/reactivity
    onTick("app", timestamp => anim()!.tick(timestamp), anim);

    const enableSave = () => visible() && token() && game.enableLogging;

    const onNewGameClick = () => {
        setVisible(false);
        setTimeout(() => {
            quit()
            setTimeout(reset, 1000);
        }, 200);
    };

    const onScoreSaved = (gameId: number) => {
        setSaveScoreOpen(false);
        setSavedScoreId(gameId);
        setTimeout(() => setLeaderboardOpen(true), 200);
    };

    const visibility = () => visible() ? (inBackground() ? 0.5 : 1) : false;

    return <>
        <FadeContainer
            {...props}
            visible={visibility()}
            fadeInDuration={100}
            fadeOutDuration={200}
            yogaContainer
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
                text="GAME OVER"
                revealed={visible()}
                initiallyRevealed={false}
                duration={500}
                style={{ fontSize: 64 }}
                yg:margin={24}
                yg:marginBottom={18}
                filters={[titleGlowFilter, titleAbberationFilter]}
            />
            <ScoreText
                score={game.state.score}
                zeroAlpha={0.2}
                style={{ fontSize: 104 }}
                filters={[scoreGlowFilter, scoreAbberationFilter]}
            />
            <container yogaContainer yg:margin={24} yg:marginTop={18} yg:gap={24}>
                <Button
                    type={enableSave() ? "secondary" : "primary"}
                    text="New Game"
                    onClick={onNewGameClick}
                />
                <Show when={enableSave()}>
                    <Button
                        type="secondary"
                        text="Leaderboard"
                        onClick={() => setLeaderboardOpen(true)}
                    />
                    <Show when={!savedScoreId()} fallback={<DisabledSaveButton />}>
                        <Button
                            type="primary"
                            text={"Save Score"}
                            onClick={() => setSaveScoreOpen(true)}
                        />
                    </Show>
                </Show>
            </container>
        </FadeContainer>
        <LeaderboardModal
            open={leaderboardOpen()}
            onClose={() => setLeaderboardOpen(false)}
            selectedId={savedScoreId()}
        />
        <Show when={enableSave()}>
            <SaveScoreModal
                open={saveScoreOpen()}
                onClose={() => setSaveScoreOpen(false)}
                onSaved={onScoreSaved}
            />
        </Show>
    </>;
};

// TODO add native disabled state to button
const DisabledSaveButton = () =>
    <container
        yogaContainer
        yg:paddingX={14}
        yg:paddingY={10}
        yg:marginX={12}
        yg:flexDirection="row"
        yg:alignItems="center"
        backgroundStyle={{
            shape: ContainerBackgroundShape.Rectangle,
            cornerRadius: 8,
            stroke: {
                width: BUTTON_THEMES.primary.inactive.stroke?.width || 2,
                color: BUTTON_THEMES.primary.inactive.fill?.color ?? 0xffffff,
            },
        }}
        alpha={(BUTTON_THEMES.primary.inactive.fill?.alpha || 1) * 0.5}
    >
        <text
            text="Saved!"
            style:fontSize={20}
            style:fill={BUTTON_THEMES.primary.inactive.fill?.color as TextStyleFill ?? 0xffffff}
            yg:marginX={24}
        />
    </container>;

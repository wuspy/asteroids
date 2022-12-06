import { useEffect, useLayoutEffect, useMemo } from "react";
import { GameStatus } from "../core";
import { ChromaticAbberationFilter, WarpFilter } from "./filters";
import { AlphaFilter } from "@pixi/filter-alpha";
import { Align, JustifyContent, PositionType } from "./layout";
import { Container } from "./react-pixi";
import { LevelIndicator, LifeIndicator, ScoreIndicator } from "./hud";
import { BoundsGraphics } from "./BoundsGraphics";
import { StartScreen } from "./StartScreen";
import { DebugContainer } from "./DebugContainer";
import { useApp, useTick, useInputEvent } from "./AppContext";
import { BackgroundAsteroidsContainer } from "./BackgroundAsteroidsContainer";
import { PauseScreen } from "./PauseScreen";
import { GameplayContainer } from "./gameplay";
import { GameOverScreen } from "./GameOverScreen";

const WARP_STRENGTH = 3;
const RGB_SPLIT_SEPARATION = 3;

export const AsteroidsGameContainer = () => {
    const {
        game,
        input,
        theme,
        stage,
        background,
        renderer,
        paused,
        quit,
        dispatch,
    } = useApp();

    const mainWarpFilter = useMemo(() => new WarpFilter(WARP_STRENGTH), []);
    const mainAlphaFilter = useMemo(() => {
        const filter = new AlphaFilter(0);
        filter.padding = 24;
        return filter;
    }, []);
    const mainAbberationFilter = useMemo(() => new ChromaticAbberationFilter(RGB_SPLIT_SEPARATION, 0.75), []);

    useEffect(() => {
        if (quit) {
            background.style.opacity = "0";
        } else {
            background.style.background = theme.background;
            background.style.opacity = "1";
            mainAlphaFilter.alpha = theme.foregroundAlpha;
            if (process.env.NODE_ENV === "development") {
                console.log("Applied theme", theme);
            }
        }
    }, [theme, quit]);

    useLayoutEffect(() => {
        mainAbberationFilter.maxDisplacement = RGB_SPLIT_SEPARATION * stage.scale.x;
    }, [stage.scale.x]);

    useTick("app", (timestamp, elapsed) => {
        const inputState = input.poll();
        if (!paused) {
            game.tick(elapsed * 1000, inputState);
        }
    });

    useInputEvent("poll", (state, lastState) => {
        if (state.start && !lastState.start) {
            dispatch("pause");
        }
    }, !paused && game.state.status === GameStatus.Running);

    return <>
        <Container key="background" interactiveChildren={false}>
            <BackgroundAsteroidsContainer />
            <BoundsGraphics mainWarpFilter={mainWarpFilter} />
        </Container>
        <Container key="main" filterArea={renderer.screen} filters={[mainAbberationFilter, mainWarpFilter]}>
            <GameplayContainer filters={[mainAlphaFilter]} />
            <DebugContainer />
            <Container
                key="ui"
                flexContainer
                layoutStyle={{
                    alignItems: Align.Center,
                    justifyContent: JustifyContent.Center,
                    width: game.worldSize.width,
                    height: game.worldSize.height,
                }}
            >
                <ScoreIndicator layoutStyle={{
                    margin: 12,
                    position: PositionType.Absolute,
                    top: 0,
                    left: 0
                }} />
                <LifeIndicator layoutStyle={{
                    margin: 12,
                    position: PositionType.Absolute,
                    top: 0,
                    right: 0
                }} />
                <LevelIndicator layoutStyle={{
                    marginY: 12,
                    position: PositionType.Absolute,
                    bottom: 0,
                    left: 0,
                }} />
                <StartScreen />
                <PauseScreen />
                <GameOverScreen />
            </Container>
        </Container>
    </>;
};

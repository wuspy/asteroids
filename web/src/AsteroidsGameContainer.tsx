import { AlphaFilter } from "@pixi/filter-alpha";
import { createEffect, createRenderEffect } from "solid-js";
import { onInputEvent, onTick, useApp } from "./AppContext";
import { BackgroundContainer } from "./BackgroundContainer";
import { BoundsGraphics } from "./BoundsGraphics";
import { DebugContainer } from "./DebugContainer";
import { GameOverScreen } from "./GameOverScreen";
import { PauseScreen } from "./PauseScreen";
import { StartScreen } from "./StartScreen";
import { ChromaticAbberationFilter, WarpFilter } from "./filters";
import { GameplayContainer } from "./gameplay/GameplayContainer";
import { LevelIndicator, LifeIndicator, ScoreIndicator } from "./hud";

const WARP_STRENGTH = 3;
const RGB_SPLIT_SEPARATION = 3;

export const AsteroidsGameContainer = () => {
    // This is necessary and I have no idea why
    if (!useApp()) return null; //eslint-disable-line solid/components-return-once

    const {
        renderer,
        background,
        game,
        input,
        worldSize,
        isQuit,
        isPaused,
        pause,
        theme,
        scale,
    } = useApp();

    const mainWarpFilter = new WarpFilter(WARP_STRENGTH);
    const mainAlphaFilter = new AlphaFilter(0);
    mainAlphaFilter.padding = 24;
    const mainAbberationFilter = new ChromaticAbberationFilter(RGB_SPLIT_SEPARATION, 0.75);

    createEffect(() => {
        if (isQuit()) {
            background.style.opacity = "0";
        } else {
            background.style.background = theme().background;
            background.style.opacity = "1";
            mainAlphaFilter.alpha = theme().foregroundAlpha;
            if (process.env.NODE_ENV === "development") {
                console.log("Applied theme", theme());
            }
        }
    });

    createRenderEffect(() => {
        mainAbberationFilter.maxDisplacement = RGB_SPLIT_SEPARATION * scale();
    });

    onTick("app", (timestamp, elapsed) => {
        // Dispatch game tick if game is running
        const inputState = input.poll();
        if (!isPaused()) {
            game.tick(elapsed * 1000, inputState);
        }
    });

    onInputEvent("poll", (state, lastState) => {
        if (state.start && !lastState.start) {
            pause();
        }
    }, () => !isPaused());

    return <>
        <container interactiveChildren={false}>
            <BackgroundContainer filterArea={renderer.screen} filters={[mainAbberationFilter]} />
            <BoundsGraphics mainWarpFilter={mainWarpFilter} />
            <DebugContainer />
        </container>
        <container filterArea={renderer.screen} filters={[mainAbberationFilter, mainWarpFilter]}>
            <GameplayContainer filters={[mainAlphaFilter]} />
            <container
                flexContainer
                yg:width={worldSize().width}
                yg:height={worldSize().height}
                yg:alignItems="center"
                yg:justifyContent="center"
            >
                <ScoreIndicator yg:position="absolute" yg:margin={12} yg:top={0} yg:left={0} />
                <LifeIndicator yg:position="absolute" yg:margin={12} yg:top={0} yg:right={0} />
                <LevelIndicator yg:position="absolute" yg:marginY={12} yg:bottom={0} yg:left={0} />
                <PauseScreen />
                <StartScreen />
                <GameOverScreen />
            </container>
        </container>
    </>;
};

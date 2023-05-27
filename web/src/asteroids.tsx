import { IRenderer, Renderer } from '@pixi/core';
import { Container } from "@pixi/display";
import "@pixi/events";
import { MIN_FPS, TickQueue } from "@wuspy/asteroids-core";
import FontFaceObserver from "fontfaceobserver";
import { AppProvider } from "./AppContext";
import { AsteroidsGameContainer } from "./AsteroidsGameContainer";
import { initYoga } from "./yoga-pixi";
import * as SolidPixi from "./solid-pixi";

const MAX_DEVICE_PIXEL_RATIO = 2;
const MAX_ELAPSED_MS = 1000 / MIN_FPS;

export const run = async () => {
    await initYoga();

    try {
        await new FontFaceObserver("Noto Sans Mono").load();
    } catch (e) {
        console.error("Failed to load fonts:", e);
    }

    const container = document.getElementById("game");
    if (!container) {
        throw new Error(`#game does not exist`);
    }
    const background = document.getElementById("background");
    if (!background) {
        throw new Error(`#background does not exist`);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    if (dpr !== 1) {
        container.style.transform = background.style.transform = `scale(${1 / dpr})`;
    }

    const renderer = new Renderer({
        width: container.clientWidth,
        height: container.clientHeight,
        antialias: false,
        backgroundAlpha: 0,
        powerPreference: "high-performance",
    }) as IRenderer as IRenderer<HTMLCanvasElement>;

    renderer.view.style.position = "absolute";
    container.appendChild(renderer.view);

    const stage = new Container();
    const queue = new TickQueue();

    SolidPixi.render(() => (
        <AppProvider
            stage={stage}
            queue={queue}
            renderer={renderer}
            container={container}
            background={background}
            dpr={dpr}
        >
            <AsteroidsGameContainer />
        </AppProvider>
    ), stage);

    let lastTimestamp = 0;
    const onAnimationFrame = (timestamp: number) => {
        const elapsedMs = Math.min(MAX_ELAPSED_MS, timestamp - lastTimestamp);
        lastTimestamp = timestamp;
        queue.tick(timestamp, elapsedMs / 1000);

        renderer.render(stage);

        window.requestAnimationFrame(onAnimationFrame);
    };

    document.getElementById("loader")?.remove();
    window.requestAnimationFrame(onAnimationFrame);
};

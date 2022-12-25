import { Renderer, IRenderer } from '@pixi/core';
import { AsteroidsGameContainer } from "./AsteroidsGameContainer";
import { initYoga } from "./layout";
import "./layout";
import { createRoot } from './react-pixi';
import { Assets } from "@pixi/assets";
import { MIN_FPS } from "../core";
import { AppProvider } from "./AppContext";
import { TickQueue } from "../core/engine";
import { Container } from "@pixi/display";
import "@pixi/events";

const MAX_DEVICE_PIXEL_RATIO = 2;
const MAX_ELAPSED_MS = 1000 / MIN_FPS;

(async () => {
    // Prefetch some assets
    Assets.backgroundLoad([
        "/assets/github-64px.webp",
        "/assets/linkedin-64px.webp",
    ]);
    // Init yoga
    await initYoga();

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

    const root = createRoot(stage);
    root.render((
        <AppProvider value={{ queue, stage, renderer, container, background, dpr }}>
            <AsteroidsGameContainer />
        </AppProvider>
    ));

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
})();

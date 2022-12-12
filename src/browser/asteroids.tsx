import { autoDetectRenderer, BatchRenderer, ExtensionType, extensions } from '@pixi/core';
import { InteractionManager } from '@pixi/interaction';
import { AsteroidsGameContainer } from "./AsteroidsGameContainer";
import { initYoga } from "./layout";
import "./layout";
import { ScrollInteractionManager } from './ui';
import { createRoot } from './react-pixi';
import { Assets } from "@pixi/assets";
import { MIN_FPS } from "../core";
import { AppProvider } from "./AppContext";
import { TickQueue } from "../core/engine";
import { Container } from "@pixi/display";

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

    extensions.add(
        { type: ExtensionType.RendererPlugin, ref: BatchRenderer, name: "batch" },
        // { type: ExtensionType.RendererPlugin, ref: ParticleRenderer, name: "particle" },
        { type: ExtensionType.RendererPlugin, ref: InteractionManager, name: "interaction" },
        { type: ExtensionType.RendererPlugin, ref: ScrollInteractionManager, name: "scrollInteraction" },
    );

    const renderer = autoDetectRenderer({
        width: container.clientWidth,
        height: container.clientHeight,
        antialias: false,
        backgroundAlpha: 0,
        powerPreference: "high-performance",
        forceCanvas: false,
    });

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    if (dpr !== 1) {
        renderer.view.style.transform = background.style.transform = `scale(${1 / dpr})`;
    }

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

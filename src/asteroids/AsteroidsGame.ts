import { Container } from "@pixi/display";
import { BatchRenderer, Renderer, AbstractRenderer, autoDetectRenderer } from '@pixi/core';
import { InteractionManager } from '@pixi/interaction';
import { clamp, FadeContainer, initRandom, InputProvider, ScrollInteractionManager } from "./engine";
import { LevelIndicator } from "./LevelIndicator";
import { Asteroid } from "./Asteroid";
import { ScoreIndicator } from "./ScoreIndicator";
import { LifeIndicator } from "./LifeIndicator";
import { GameObject, HitAreaDebugContainer, TickQueue } from "./engine";
import { ChromaticAbberationFilter, WarpFilter } from "./filters";
import { CoreAsteroidsGame } from "./CoreAsteroidsGame";
import { GameLog } from "./engine/GameLog";
import { StartScreen } from "./StartScreen";
import { AlphaFilter } from "@pixi/filter-alpha";
import { controls, arrowMapping, gamepadMapping, ijklMapping, inputLogConfig, wasdMapping } from "./input";
import { PauseScreen } from "./PauseScreen";
import { GameOverScreen } from "./GameOverScreen";
import { Align, JustifyContent, PositionType } from "./layout";
import { Theme } from "./Theme";
import Stats from "stats.js";
import { DashLineShader, SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { MAX_ASPECT_RATIO, MIN_ASPECT_RATIO } from "./constants";

const WARP_STRENGTH = 3;
const RGB_SPLIT_SEPARATION = 3;

const ENABLE_LOGGING = true;

declare global {
    interface Window {
        asteroidsInstance: AsteroidsGame;
        asteroids: any;
    }
}

if (process.env.NODE_ENV === "development") {
    window.asteroids = {
        showStats: () => {
            window.asteroidsInstance.statsDiv.style.display = "block";
        },
        hideStats: () => {
            window.asteroidsInstance.statsDiv.style.display = "none";
        },
        showHitareas: () => {
            window.asteroidsInstance.hitAreaDebugContainer.visible = true;
        },
        hideHitareas: () => {
            window.asteroidsInstance.hitAreaDebugContainer.visible = false;
        },
        kill: () => {
            if (window.asteroidsInstance.state.ship) {
                window.asteroidsInstance.state.lives = 1;
                window.asteroidsInstance.state.ship.destroy();
            }
        },
    };
}

export class AsteroidsGame extends CoreAsteroidsGame {
    private readonly _container: HTMLElement;
    private readonly _renderer: AbstractRenderer;
    private readonly _stage: Container;
    private readonly _input: InputProvider<typeof controls>;
    private readonly _backgroundContainer: Container;
    private readonly _cornerBoundsGraphics: Graphics;
    private readonly _absoluteBoundsGraphics: Graphics;
    private readonly _mainContainer: Container;
    private readonly _hudContainer: Container;
    private readonly _lifeIndicator: LifeIndicator;
    private readonly _scoreIndicator: ScoreIndicator;
    private readonly _levelIndicator: LevelIndicator;
    private readonly _uiQueue: TickQueue;
    private readonly _mainAlphaFilter: AlphaFilter;
    private readonly _mainWarpFilter: WarpFilter;
    private readonly _mainAbberationFilter: ChromaticAbberationFilter;
    private readonly _background: HTMLElement;
    protected override gameplayContainer: FadeContainer;
    private _randomSeed?: string;
    private _startScreen?: StartScreen;
    private _pauseScreen?: PauseScreen;
    private _gameOverScreen?: GameOverScreen;
    private _logger?: GameLog<typeof controls>;
    private _timestamp: number;
    private _queuedResizeId?: number;
    private _backgroundAsteroids: Asteroid[];
    private _nextAnimationFrameId?: number;
    private _aboutOpen: boolean;

    // Only used in development mode
    readonly fpsStats!: Stats;
    readonly memoryStats!: Stats;
    readonly statsDiv!: HTMLElement;
    readonly hitAreaDebugContainer!: HitAreaDebugContainer;

    constructor(params: { containerId: string, backgroundId: string }) {
        super();
        this._container = document.getElementById(params.containerId)!;
        if (!this._container) {
            throw new Error(`#${params.containerId} does not exist`);
        }
        this._background = document.getElementById(params.backgroundId)!;
        if (!this._background) {
            throw new Error(`#${params.backgroundId} does not exist`);
        }

        if (process.env.NODE_ENV === "development") {
            window.asteroidsInstance = this;

            this.fpsStats = new Stats();
            this.fpsStats.showPanel(0);
            this.fpsStats.dom.style.position = "relative";
            this.fpsStats.dom.style.display = "inline-block";

            this.memoryStats = new Stats();
            this.memoryStats.showPanel(2);
            this.memoryStats.dom.style.position = "relative";
            this.memoryStats.dom.style.display = "inline-block";

            this.statsDiv = document.createElement("div");
            this.statsDiv.style.position = "absolute";
            this.statsDiv.style.right = "0";
            this.statsDiv.style.bottom = "0";
            this.statsDiv.appendChild(this.fpsStats.dom);
            this.statsDiv.appendChild(this.memoryStats.dom);
            document.body.appendChild(this.statsDiv);
        }

        this._aboutOpen = false;

        Renderer.registerPlugin("batch", BatchRenderer);
        Renderer.registerPlugin("interaction", InteractionManager);
        Renderer.registerPlugin("scrollInteraction", ScrollInteractionManager);
        this._stage = new Container();
        this._renderer = autoDetectRenderer({
            width: this._container.clientWidth,
            height: this._container.clientHeight,
            antialias: false,
            backgroundAlpha: 0,
            powerPreference: "high-performance",
            forceCanvas: false,
        });

        this._renderer.view.style.position = "absolute";
        this._container.appendChild(this._renderer.view);
        this._uiQueue = new TickQueue("ui");

        this._input = new InputProvider(controls);
        this._input.mapping = wasdMapping;

        this._backgroundContainer = new Container();
        this._backgroundContainer.interactiveChildren = false;
        this._stage.addChild(this._backgroundContainer);

        this._cornerBoundsGraphics = new Graphics();
        this._cornerBoundsGraphics.shader = new DashLineShader();
        this._backgroundContainer.addChild(this._cornerBoundsGraphics);

        this._absoluteBoundsGraphics = new Graphics();
        this._backgroundContainer.addChild(this._absoluteBoundsGraphics);

        this._mainContainer = new Container();
        this._mainContainer.filterArea = this._renderer.screen;

        this._stage.addChild(this._mainContainer);
        this._mainContainer.filters = [
            this._mainAbberationFilter = new ChromaticAbberationFilter(RGB_SPLIT_SEPARATION, 0.75),
            this._mainWarpFilter = new WarpFilter(WARP_STRENGTH),
            this._mainAlphaFilter = new AlphaFilter(),
        ];

        this.applyTheme(this.state.theme);

        this.gameplayContainer = new FadeContainer({
            queue: this._uiQueue,
            fadeInDuration: 0,
            fadeOutDuration: 500,
            fadeOutExtraDelay: 500,
        });
        this.gameplayContainer.interactiveChildren = false;
        this._mainContainer.addChild(this.gameplayContainer);

        this._hudContainer = new Container();
        this._hudContainer.flexContainer = true;
        this._hudContainer.layout.style({
            alignItems: Align.Center,
            justifyContent: JustifyContent.Center,
        });
        // this._hudContainer.debugLayout = true;
        this._mainContainer.addChild(this._hudContainer);

        if (process.env.NODE_ENV === "development") {
            this.hitAreaDebugContainer = new HitAreaDebugContainer(this._uiQueue);
            this.hitAreaDebugContainer.visible = false;
            this._mainContainer.addChild(this.hitAreaDebugContainer);
        }

        this.executeResize();
        window.addEventListener("resize", this.queueResize);
        document.addEventListener("visibilitychange", this.onVisibilityChange);

        this._scoreIndicator = new ScoreIndicator({
            state: this.state,
            queue: this._uiQueue,
        });
        this._scoreIndicator.layout.style({
            margin: 12,
            position: PositionType.Absolute,
            top: 0,
            left: 0,
        });
        this._hudContainer.addChild(this._scoreIndicator);

        this._lifeIndicator = new LifeIndicator({
            state: this.state,
            queue: this._uiQueue,
        });
        this._lifeIndicator.layout.style({
            margin: 12,
            position: PositionType.Absolute,
            top: 0,
            right: 0,
        });
        this._hudContainer.addChild(this._lifeIndicator);

        this._levelIndicator = new LevelIndicator({
            queue: this._uiQueue,
            state: this.state,
        });
        this._levelIndicator.layout.style({
            marginVertical: 12,
            position: PositionType.Absolute,
            bottom: 0,
            left: 0,
        });
        this._hudContainer.addChild(this._levelIndicator);

        this._startScreen = new StartScreen({
            queue: this._uiQueue,
            state: this.state,
            events: this.events,
            inputProvider: this._input,
        });
        this._hudContainer.addChild(this._startScreen);

        this._backgroundAsteroids = Asteroid.createBackground({
            count: 20,
            queue: this._uiQueue,
            events: this.events,
            state: this.state,
            worldSize: this.worldSize,
        });
        this._backgroundAsteroids.forEach((asteroid) => this._backgroundContainer.addChild(asteroid.container));

        this.events.on("reset", this, () => {
            this._randomSeed = initRandom();
            if (ENABLE_LOGGING) {
                this._logger = new GameLog(this.worldSize, inputLogConfig);
            }
        });
        this.events.on("finished", this, () => {
            this._logger?.flush();
            this._gameOverScreen = new GameOverScreen({
                queue: this._uiQueue,
                events: this.events,
                state: this.state,
                inputProvider: this._input,
            });
            this._hudContainer.addChild(this._gameOverScreen);
        });
        this.events.on("startRequested", this, () => {
            if (this._aboutOpen) {
                return;
            }
            if (this._startScreen) {
                this._startScreen.fadeOut(() => this.start());
            } else if (this._gameOverScreen) {
                this._gameOverScreen.fadeOut(() => this.restart());
            }
        });
        this.events.on("started", this, () => {
            if (this._startScreen) {
                this._startScreen.destroy({ children: true });
                this._startScreen = undefined;
            }
            if (this._gameOverScreen) {
                this._gameOverScreen.destroy({ children: true });
                this._gameOverScreen = undefined;
            }
            if (this._pauseScreen) {
                this._pauseScreen.destroy({ children: true });
                this._pauseScreen = undefined;
            }
        });
        this.events.on("pauseRequested", this, this.pause);
        this.events.on("paused", this, () => {
            if (!this._pauseScreen) {
                this._pauseScreen = new PauseScreen({
                    queue: this._uiQueue,
                    events: this.events,
                    state: this.state,
                    inputProvider: this._input,
                });
                this._hudContainer.addChild(this._pauseScreen);
                this._pauseScreen.fadeIn();
            }
        });
        this.events.on("resumeRequested", this, () => {
            if (this._pauseScreen) {
                this._pauseScreen.fadeOut(() => this.resume());
            }
        });
        this.events.on("resumed", this, () => {
            if (this._pauseScreen) {
                this._pauseScreen.destroy();
                this._pauseScreen = undefined;
            }
        });
        this.events.on("quitRequested", this, () => {
            if (this._pauseScreen) {
                this._pauseScreen.fadeOut(() => this.quit());
            }
        });
        this.events.on("themeChanged", this, this.applyTheme);
        this.events.on("aboutOpened", this, () => {
            this._aboutOpen = true;
        });
        this.events.on("aboutClosed", this, () => {
            this._aboutOpen = false;
        });

        this._timestamp = 0;
        this._nextAnimationFrameId = window.requestAnimationFrame(this.onAnimationFrame);
    }

    override destroy(): void {
        super.destroy();
        if (this._nextAnimationFrameId) {
            window.cancelAnimationFrame(this._nextAnimationFrameId);
            this._nextAnimationFrameId = undefined;
        }
        if (this._queuedResizeId) {
            window.cancelAnimationFrame(this._queuedResizeId);
            this._queuedResizeId = undefined;
        }
        window.removeEventListener("resize", this.queueResize);
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
        this._input.destroy();
        this._renderer.destroy(true);
    }

    get log(): string | undefined {
        return this._logger?.log;
    }

    get randomSeed(): string | undefined {
        return this._randomSeed;
    }

    private applyTheme(theme: Theme): void {
        document.getElementById("background")!.style.background = theme.background;
        document.getElementById("background")!.style.opacity = "1";
        this._mainAlphaFilter.alpha = theme.foregroundAlpha;
        if (process.env.NODE_ENV === "development") {
            console.log("Applied theme", theme);
        }
    }

    private restart(): void {
        if (this.state.status !== "init") {
            this._background.style.opacity = "0";
            this.gameplayContainer.fadeOut(() => {
                this.reset(true);
                this.start();
                this.gameplayContainer.show();
            });
        }
    }

    private quit(): void {
        if (this.state.status !== "init") {
            this._background.style.opacity = "0";
            this.gameplayContainer.fadeOut(() => {
                this.reset(true);
                this.gameplayContainer.show();
                this._startScreen = new StartScreen({
                    queue: this._uiQueue,
                    state: this.state,
                    events: this.events,
                    inputProvider: this._input,
                });
                this._hudContainer.addChild(this._startScreen);
            });
        }
    }

    protected override start(): void {
        this.gameplayContainer.show();
        super.start();
    }

    private onAnimationFrame = (timestamp: number): void => {
        if (process.env.NODE_ENV === "development") {
            this.fpsStats.begin();
            this.memoryStats.begin();
        }
        let elapsed = timestamp - this._timestamp;
        let input = this._input.poll();

        if (input.start) {
            if (this.state.status === "running") {
                this.events.trigger("pauseRequested");
            } else if (this.state.status === "init") {
                this.events.trigger("startRequested");
            } else if (this.state.status === "paused") {
                this.events.trigger("resumeRequested");
            }
        }

        if (this._logger && this.state.status === "running") {
            [elapsed, input] = this._logger.logFrame(elapsed, input, this.worldSize);
        }

        elapsed /= 1000;
        this._timestamp = timestamp;

        super.tick(elapsed, input);
        this._uiQueue.tick(this._timestamp, elapsed);

        // Debug options

        if (process.env.NODE_ENV === "development") {
            if (this.hitAreaDebugContainer.visible) {
                this.hitAreaDebugContainer.visible = true;
                const objects: GameObject<any, any>[] = [...this.state.projectiles, ...this.state.asteroids, ...this.state.ufos];
                if (this.state.ship) {
                    objects.push(this.state.ship);
                }
                this.hitAreaDebugContainer.objects = objects;
            }
        }

        // Render

        this._renderer.render(this._stage);

        if (process.env.NODE_ENV === "development") {
            this.fpsStats.end();
            this.memoryStats.end();
        }
        this._nextAnimationFrameId = window.requestAnimationFrame(this.onAnimationFrame);
    }

    private queueResize = (): void => {
        if (this._queuedResizeId) {
            window.cancelAnimationFrame(this._queuedResizeId);
        }
        this._queuedResizeId = window.requestAnimationFrame(() => this.executeResize());
    }

    private onVisibilityChange = (): void => {
        if (document.hidden) {
            this.events.trigger("pauseRequested");
        }
    }

    private executeResize(): void {
        const aspectRatio = this._container.clientWidth / this._container.clientHeight;
        if (process.env.NODE_ENV === "development") {
            console.log("Aspect ratio changed", aspectRatio);
        }
        this.aspectRatio = clamp(aspectRatio, MAX_ASPECT_RATIO, MIN_ASPECT_RATIO);
        // Scale world based on new screen size and aspect ratio
        if (aspectRatio > MAX_ASPECT_RATIO) {
            this._stage.scale.set(this._container.clientHeight / this.worldSize.height);
            this._renderer.resize(this._container.clientHeight * MAX_ASPECT_RATIO, this._container.clientHeight);
        } else if (aspectRatio < MIN_ASPECT_RATIO) {
            this._stage.scale.set(this._container.clientWidth / this.worldSize.width);
            this._renderer.resize(this._container.clientWidth, this._container.clientWidth / MIN_ASPECT_RATIO);
        } else {
            this._renderer.resize(this._container.clientWidth, this._container.clientHeight);
            this._stage.scale.set(this._container.clientWidth / this.worldSize.width);
        }
        // Position view in center of screen
        this._renderer.view.style.top = `${Math.round((this._container.clientHeight - this._renderer.view.clientHeight) / 2)}px`;
        this._renderer.view.style.left = `${Math.round((this._container.clientWidth - this._renderer.view.clientWidth) / 2)}px`;
        // Resize background to view
        this._background.style.top = this._renderer.view.style.top;
        this._background.style.left = this._renderer.view.style.left;
        this._background.style.width = `${this._renderer.view.width}px`;
        this._background.style.height = `${this._renderer.view.height}px`;
        // Resize HUD
        this._hudContainer.layout.style({
            width: this.worldSize.width,
            height: this.worldSize.height,
        });
        // Adjust displacemnt of chromatic abberation
        this._mainAbberationFilter.maxDisplacement = RGB_SPLIT_SEPARATION * this._stage.scale.x;
        // Redistribute background asteroids
        if (this._backgroundAsteroids) {
            for (const asteroid of this._backgroundAsteroids) {
                asteroid.moveToUnoccupiedPosition(this._backgroundAsteroids);
            }
        }

        this.drawBounds(aspectRatio);
    }

    private drawBounds(aspectRatio: number): void {
        const cornerExtra = 10;
        const xCornerMarkingDistance = this.worldSize.width / 7;
        const yCornerMarkingDistance = this.worldSize.height / 7;
        const lineWidth = 2 / this._stage.scale.x;
        const resolution = 10;
        const { width, height } = this.worldSize;
        let x, y;

        // Draw bounds markers in each corner

        this._cornerBoundsGraphics.clear();
        this._cornerBoundsGraphics.lineStyle({
            width: lineWidth,
            color: 0xffffff,
            alpha: 0.1,
        });

        y = lineWidth / 2;
        this._cornerBoundsGraphics.moveTo(...this._mainWarpFilter.getDisplacement(this.worldSize, -cornerExtra, y));
        for (x = 0; x < xCornerMarkingDistance; x += resolution) {
            this._cornerBoundsGraphics.lineTo(...this._mainWarpFilter.getDisplacement(this.worldSize, x, y));
        }
        this._cornerBoundsGraphics.moveTo(...this._mainWarpFilter.getDisplacement(this.worldSize, width + cornerExtra, y));
        for (x = width; x > width - xCornerMarkingDistance; x -= resolution) {
            this._cornerBoundsGraphics.lineTo(...this._mainWarpFilter.getDisplacement(this.worldSize, x, y));
        }

        y = height - lineWidth / 2;
        this._cornerBoundsGraphics.moveTo(...this._mainWarpFilter.getDisplacement(this.worldSize, -cornerExtra, y));
        for (x = 0; x < xCornerMarkingDistance; x += resolution) {
            this._cornerBoundsGraphics.lineTo(...this._mainWarpFilter.getDisplacement(this.worldSize, x, y));
        }
        this._cornerBoundsGraphics.moveTo(...this._mainWarpFilter.getDisplacement(this.worldSize, width + cornerExtra, y));
        for (x = width; x > width - xCornerMarkingDistance; x -= resolution) {
            this._cornerBoundsGraphics.lineTo(...this._mainWarpFilter.getDisplacement(this.worldSize, x, y));
        }

        x = lineWidth / 2;
        this._cornerBoundsGraphics.moveTo(...this._mainWarpFilter.getDisplacement(this.worldSize, x, -cornerExtra));
        for (y = 0; y < yCornerMarkingDistance; y += resolution) {
            this._cornerBoundsGraphics.lineTo(...this._mainWarpFilter.getDisplacement(this.worldSize, x, y));
        }
        this._cornerBoundsGraphics.moveTo(...this._mainWarpFilter.getDisplacement(this.worldSize, x, height + cornerExtra));
        for (y = height; y > height - yCornerMarkingDistance; y -= resolution) {
            this._cornerBoundsGraphics.lineTo(...this._mainWarpFilter.getDisplacement(this.worldSize, x, y));
        }

        x = width - lineWidth / 2;
        this._cornerBoundsGraphics.moveTo(...this._mainWarpFilter.getDisplacement(this.worldSize, x, -cornerExtra));
        for (y = 0; y < yCornerMarkingDistance; y += resolution) {
            this._cornerBoundsGraphics.lineTo(...this._mainWarpFilter.getDisplacement(this.worldSize, x, y));
        }
        this._cornerBoundsGraphics.moveTo(...this._mainWarpFilter.getDisplacement(this.worldSize, x, height + cornerExtra));
        for (y = height; y > height - yCornerMarkingDistance; y -= resolution) {
            this._cornerBoundsGraphics.lineTo(...this._mainWarpFilter.getDisplacement(this.worldSize, x, y));
        }

        // If the game is letterboxed, draw absolute bounds

        this._absoluteBoundsGraphics.clear();
        this._absoluteBoundsGraphics.lineStyle({
            width: lineWidth,
            color: 0xffffff,
            alpha: 0.1,
        });

        if (aspectRatio < MIN_ASPECT_RATIO) {           
            this._absoluteBoundsGraphics.visible = true;
            y = lineWidth / 2;
            this._absoluteBoundsGraphics.moveTo(0, y).lineTo(width, y);        
            y = height - lineWidth / 2;
            this._absoluteBoundsGraphics.moveTo(0, y).lineTo(width, y);
        } else if (aspectRatio > MAX_ASPECT_RATIO) {
            this._absoluteBoundsGraphics.visible = true;
            x = lineWidth / 2;
            this._absoluteBoundsGraphics.moveTo(x, 0).lineTo(x, height);
            x = this.worldSize.width - lineWidth / 2;
            this._absoluteBoundsGraphics.moveTo(x, 0).lineTo(x, height);
        } else {
            this._absoluteBoundsGraphics.visible = false;
        }
    }
}

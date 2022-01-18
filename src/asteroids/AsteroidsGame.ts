import { Container } from "@pixi/display";
import { BatchRenderer, Renderer, AbstractRenderer, autoDetectRenderer } from '@pixi/core';
import { InteractionManager } from '@pixi/interaction';
import { FadeContainer, initRandom, InputProvider } from "./engine";
import { LevelIndicator } from "./LevelIndicator";
import { Asteroid } from "./Asteroid";
import { ScoreIndicator } from "./ScoreIndicator";
import { LifeIndicator } from "./LifeIndicator";
import { GameObject, HitAreaDebugContainer, TickQueue } from "./engine";
import { ChromaticAbberationFilter, WarpFilter } from "./filters";
import { CoreAsteroidsGame } from "./CoreAsteroidsGame";
import { FPSIndicator } from "./FPSIndicator";
// import { AlphaFilter } from "@pixi/filter-alpha";
import { GameLog } from "./engine/GameLog";
import { StartScreen } from "./StartScreen";
import { AlphaFilter } from "@pixi/filter-alpha";
import { controls, arrowMapping, gamepadMapping, ijklMapping, inputLogConfig, wasdMapping } from "./input";
import { PauseScreen } from "./PauseScreen";
import { GameOverScreen } from "./GameOverScreen";
import "./layout";
import { Align, JustifyContent, PositionType } from "./layout";
import { Theme } from "./Theme";

declare global {
    interface Window {
        asteroids: AsteroidsGame;
    }
}

const WARP_STRENGTH = 3;
const RGB_SPLIT_SEPARATION = 3;

const ENABLE_LOGGING = true;

export class AsteroidsGame extends CoreAsteroidsGame {
    private readonly _container: HTMLElement;
    private readonly _renderer: AbstractRenderer;
    private readonly _stage: Container;
    private readonly _input: InputProvider<typeof controls>;
    private readonly _backgroundContainer: Container;
    private readonly _mainContainer: Container;
    private readonly _hudContainer: Container;
    private readonly _hitAreaDebugContainer!: HitAreaDebugContainer;
    private readonly _fpsIndicator!: FPSIndicator;
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

        Renderer.registerPlugin("batch", BatchRenderer);
        Renderer.registerPlugin("interaction", InteractionManager);
        this._stage = new Container();
        this._renderer = autoDetectRenderer({
            width: this._container.clientWidth,
            height: this._container.clientHeight,
            antialias: false,
            backgroundAlpha: 0,
            powerPreference: "high-performance",
            forceCanvas: false,
        });

        this._container.appendChild(this._renderer.view);
        this._uiQueue = new TickQueue();

        this._input = new InputProvider(controls);
        this._input.mapping = wasdMapping;

        this._backgroundContainer = new Container();
        this._stage.addChild(this._backgroundContainer);

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
            this._fpsIndicator = new FPSIndicator(this._uiQueue);
            this._fpsIndicator.layout.style({
                margin: 24,
                position: PositionType.Absolute,
                top: 0,
                right: [45, "%"],
            });
            this._fpsIndicator.visible = false;
            this._hudContainer.addChild(this._fpsIndicator);

            this._hitAreaDebugContainer = new HitAreaDebugContainer(this._uiQueue);
            this._hitAreaDebugContainer.visible = false;
            this._mainContainer.addChild(this._hitAreaDebugContainer);

            window.asteroids = this;
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
            if (this._startScreen) {
                this._startScreen.fadeOut(() => this.start());
            } else if (this._gameOverScreen) {
                this._gameOverScreen.fadeOut(() => this.restart());
            }
        });
        this.events.on("started", this, () => {
            if (this._startScreen) {
                this._startScreen.destroy();
                this._startScreen = undefined;
            }
            if (this._gameOverScreen) {
                this._gameOverScreen.destroy();
                this._gameOverScreen = undefined;
            }
            if (this._pauseScreen) {
                this._pauseScreen.destroy();
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
                this._pauseScreen.fadeIn(() => { });
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
        this.events.on("restartRequested", this, () => {
            if (this._pauseScreen) {
                this._pauseScreen.fadeOut(() => this.restart());
            }
        });
        this.events.on("themeChanged", this, this.applyTheme);

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

    showFps(): void {
        if (process.env.NODE_ENV === "development") {
            this._fpsIndicator.visible = true;
        }
    }

    hideFps(): void {
        if (process.env.NODE_ENV === "development") {
            this._fpsIndicator.visible = false;
        }
    }

    showHitareas(): void {
        if (process.env.NODE_ENV === "development") {
            this._hitAreaDebugContainer.visible = true;
        }
    }

    hideHitareas(): void {
        if (process.env.NODE_ENV === "development") {
            this._hitAreaDebugContainer.visible = false;
        }
    }

    kill(): void {
        if (process.env.NODE_ENV === "development" && this.state.ship) {
            this.state.lives = 1;
            this.state.ship.destroy();
        }
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
        this._background.style.opacity = "0";
        this.gameplayContainer.fadeOut(() => {
            this.reset(true);
            this.start();
            this.gameplayContainer.show();
        });
    }

    protected override start(): void {
        this.gameplayContainer.show();
        super.start();
    }

    private onAnimationFrame = (timestamp: number): void => {
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
            if (this._hitAreaDebugContainer.visible) {
                this._hitAreaDebugContainer.visible = true;
                const objects: GameObject<any, any>[] = [...this.state.projectiles, ...this.state.asteroids, ...this.state.ufos];
                if (this.state.ship) {
                    objects.push(this.state.ship);
                }
                this._hitAreaDebugContainer.objects = objects;
            }
        }

        // Render

        this._renderer.render(this._stage);
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
        this.aspectRatio = this._container.clientWidth / this._container.clientHeight;
        this._renderer.resize(this._container.clientWidth, this._container.clientHeight);
        this._stage.scale.set(this._container.clientWidth / this.worldSize.width);
        this._hudContainer.layout.style({
            width: this.worldSize.width,
            height: this.worldSize.height,
        });
        this._mainAbberationFilter.maxDisplacement = RGB_SPLIT_SEPARATION * this._stage.scale.x;
        // Redistribute background asteroids
        if (this._backgroundAsteroids) {
            for (const asteroid of this._backgroundAsteroids) {
                asteroid.moveToUnoccupiedPosition(this._backgroundAsteroids);
            }
        }
        this._queuedResizeId = undefined;
    }
}

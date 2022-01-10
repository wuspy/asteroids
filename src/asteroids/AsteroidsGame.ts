import { Container } from "@pixi/display";
import { BatchRenderer, Renderer, AbstractRenderer, autoDetectRenderer } from '@pixi/core';
import { InteractionManager } from '@pixi/interaction';
import { InputProvider } from "./engine";
import { LevelIndicator } from "./LevelIndicator";
import { Asteroid } from "./Asteroid";
import { ScoreIndicator } from "./ScoreIndicator";
import { LifeIndicator } from "./LifeIndicator";
import { GameObject, HitAreaDebugContainer, RelativeLayout, TickQueue } from "./engine";
import { ChromaticAbberationFilter, WarpFilter } from "./filters";
import { AbstractAsteroidsGame } from "./AbstractAsteroidsGame";
import { FPSIndicator } from "./FPSIndicator";
// import { AlphaFilter } from "@pixi/filter-alpha";
import { GameLog } from "./engine/GameLog";
import { StartScreen } from "./StartScreen";
import { AlphaFilter } from "@pixi/filter-alpha";
import { controls, arrowMapping, gamepadMapping, ijklMapping, inputLogConfig, wasdMapping } from "./input";
import { PauseScreen } from "./PauseScreen";
import { GameOverScreen } from "./GameOverScreen";

declare global {
    interface Window {
        asteroids_showHitareas?: boolean;
        asteroids_showFps?: boolean;
    }
}

// window.asteroids_showFps = true;

const WARP_STRENGTH = 3;
const RGB_SPLIT_SEPARATION = 3;

const ENABLE_LOGGING = true;

export class AsteroidsGame extends AbstractAsteroidsGame {
    private readonly _container: HTMLElement;
    private readonly _renderer: AbstractRenderer;
    private readonly _stage: Container;
    private readonly _input: InputProvider<typeof controls>;
    private readonly _backgroundContainer: Container;
    private readonly _mainContainer: Container;
    private readonly _effectsContainer: Container;
    private readonly _hudContainer: RelativeLayout;
    private readonly _hitAreaDebugContainer: HitAreaDebugContainer;
    private readonly _fpsIndicator: FPSIndicator;
    private readonly _lifeIndicator: LifeIndicator;
    private readonly _scoreIndicator: ScoreIndicator;
    private readonly _levelIndicator: LevelIndicator;
    private readonly _uiQueue: TickQueue;
    private _startScreen?: StartScreen;
    private _pauseScreen?: PauseScreen;
    private _gameOverScreen?: GameOverScreen;
    private _logger?: GameLog<typeof controls>;
    private _timestamp: number;
    private _queuedResizeId?: number;
    private _backgroundAsteroids: Asteroid[];
    private _nextAnimationFrame?: number;

    constructor(params: { containerId: string }) {
        super();
        const container = document.getElementById(params.containerId);
        if (!container) {
            throw new Error(`#${params.containerId} does not exist`);
        }
        this._container = container;

        document.getElementById("background")!.style.background = this.state.theme.background;
        document.getElementById("background")!.style.opacity = "1";

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
            new ChromaticAbberationFilter(RGB_SPLIT_SEPARATION, 0.75),
            new WarpFilter(WARP_STRENGTH),
            new AlphaFilter(this.state.theme.foregroundAlpha),
        ];

        this.gameplayContainer = new Container();
        this._mainContainer.addChild(this.gameplayContainer);

        this._effectsContainer = new Container();
        this._mainContainer.addChild(this._effectsContainer);

        this._hitAreaDebugContainer = new HitAreaDebugContainer({
            queue: this._uiQueue,
            queuePriority: 0
        });
        this._mainContainer.addChild(this._hitAreaDebugContainer.container);

        this._hudContainer = new RelativeLayout(this.worldSize.width, this.worldSize.height);
        this._mainContainer.addChild(this._hudContainer);

        this.executeResize();
        window.addEventListener("resize", this.queueResize);
        document.addEventListener("visibilitychange", this.onVisibilityChange);

        this._scoreIndicator = new ScoreIndicator({
            state: this.state,
            queue: this._uiQueue,
        });
        this._hudContainer.addChildWithConstraints(this._scoreIndicator.container, {
            margin: 12,
            constraints: {
                left: ["parent", "left"],
                top: ["parent", "top"],
            },
        });

        this._lifeIndicator = new LifeIndicator({
            state: this.state,
            queue: this._uiQueue,
        });
        this._hudContainer.addChildWithConstraints(this._lifeIndicator.container, {
            margin: 12,
            constraints: {
                right: ["parent", "right"],
                top: ["parent", "top"],
            },
        });

        this._levelIndicator = new LevelIndicator({
            queue: this._uiQueue,
            state: this.state,
        });
        this._hudContainer.addChildWithConstraints(this._levelIndicator.container, {
            margin: { bottom: 12 },
            constraints: {
                bottom: ["parent", "bottom"],
                left: ["parent", "left"],
            },
        });

        this._fpsIndicator = new FPSIndicator({
            queue: this._uiQueue,
        });
        this._hudContainer.addChildWithConstraints(this._fpsIndicator.container, {
            margin: { bottom: 12, left: 48 },
            constraints: {
                bottom: ["parent", "bottom"],
                left: [this._levelIndicator.container, "right"],
            },
        });

        this._startScreen = new StartScreen({
            queue: this._uiQueue,
            state: this.state,
            inputProvider: this._input,
            onStartRequested: () => this.start(),
        });
        this._hudContainer.addChildWithConstraints(this._startScreen.container, {
            constraints: {
                top: ["parent", "vcenter"],
                left: ["parent", "hcenter"],
            },
        });

        this._backgroundAsteroids = Asteroid.createBackground({
            count: 20,
            queue: this._uiQueue,
            events: this.events,
            state: this.state,
            worldSize: this.worldSize,
        });
        this._backgroundAsteroids.forEach((asteroid) => this._backgroundContainer.addChild(asteroid.container));

        this.events.on("preStart", () => {
            if (ENABLE_LOGGING) {
                this._logger = new GameLog(this.worldSize, inputLogConfig);
            }
        }, this);
        this.events.on("finished", () => {
            this._logger?.flush();
            this._gameOverScreen = new GameOverScreen({
                queue: this._uiQueue,
                state: this.state,
                inputProvider: this._input,
            });
            this._hudContainer.addChildWithConstraints(this._gameOverScreen.container, {
                constraints: {
                    left: ["parent", "left"],
                    vcenter: ["parent", "vcenter"],
                },
            });
        }, this);
        this.events.on("pause", () => {
            this._pauseScreen = new PauseScreen({
                queue: this._uiQueue,
                state: this.state,
                inputProvider: this._input,
                onResumeRequested: () => this.resume(),
            });
            this._hudContainer.addChildWithConstraints(this._pauseScreen.container, {
                constraints: {
                    left: ["parent", "left"],
                    vcenter: ["parent", "vcenter"],
                },
            });
        }, this);

        this._timestamp = 0;
        this._nextAnimationFrame = window.requestAnimationFrame(this.onAnimationFrame);
    }

    destroy(): void {
        if (this._nextAnimationFrame) {
            window.cancelAnimationFrame(this._nextAnimationFrame);
            this._nextAnimationFrame = undefined;
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

    protected override start(): void {
        if (this._startScreen) {
            const startScreen = this._startScreen;
            this._startScreen = undefined;
            startScreen.fadeOut(() => {
                startScreen.destroy();
                super.start();
            });
            this.events.trigger("startScreenFadeOut");
        } else {
            super.start();
        }
    }

    protected override resume(): void {
        if (this._pauseScreen) {
            const pauseScreen = this._pauseScreen;
            this._pauseScreen = undefined;
            pauseScreen.fadeOut(() => {
                pauseScreen.destroy();
                super.resume();
            });
        } else {
            super.resume();
        }
    }

    private onAnimationFrame = (timestamp: number): void => {
        let elapsed = timestamp - this._timestamp;
        let input = this._input.poll();

        if (input.start) {
            if (this.state.status === "running") {
                this.pause();
            } else if (this.state.status === "init") {
                this.start();
            } else if (this.state.status === "paused") {
                this.resume();
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

        this._fpsIndicator.visible = !!window.asteroids_showFps;

        if (window.asteroids_showHitareas) {
            this._hitAreaDebugContainer.visible = true;
            const objects: GameObject<any, any>[] = [...this.state.projectiles, ...this.state.asteroids, ...this.state.ufos];
            if (this.state.ship) {
                objects.push(this.state.ship);
            }
            this._hitAreaDebugContainer.objects = objects;
        } else if (this._hitAreaDebugContainer.visible) {
            this._hitAreaDebugContainer.visible = false;
        }

        // Render

        this._renderer.render(this._stage);
        this._nextAnimationFrame = window.requestAnimationFrame(this.onAnimationFrame);
    }

    private queueResize = (): void => {
        if (this._queuedResizeId) {
            window.cancelAnimationFrame(this._queuedResizeId);
        }
        this._queuedResizeId = window.requestAnimationFrame(() => this.executeResize());
    }

    private onVisibilityChange = (): void => {
        if (document.hidden) {
            this.pause();
        }
    }

    private executeResize(): void {
        this.aspectRatio = this._container.clientWidth / this._container.clientHeight;
        this._renderer.resize(this._container.clientWidth, this._container.clientHeight);
        this._stage.scale.set(this._container.clientWidth / this.worldSize.width);
        this._hudContainer.width = this.worldSize.width;
        this._hudContainer.height = this.worldSize.height;
        (this._mainContainer.filters![0] as ChromaticAbberationFilter).maxDisplacement = RGB_SPLIT_SEPARATION * this._stage.scale.x;
        // Redistribute background asteroids
        if (this._backgroundAsteroids) {
            for (const asteroid of this._backgroundAsteroids) {
                asteroid.moveToUnoccupiedPosition(this._backgroundAsteroids);
            }
        }
        this._queuedResizeId = undefined;
    }
}

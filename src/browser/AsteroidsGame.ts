import { Container } from "@pixi/display";
import { BatchRenderer, Renderer, AbstractRenderer, autoDetectRenderer } from '@pixi/core';
import { InteractionManager } from '@pixi/interaction';
import { AsteroidsGame as CoreAsteroidsGame, controls, GameStatus, wasdMapping, MAX_ASPECT_RATIO, MIN_ASPECT_RATIO, MIN_FPS } from "../core";
import { LifeIndicator, ScoreIndicator, LevelIndicator } from "./hud";
import { clamp, initRandom, seedRandom, InputProvider, GameObject, TickQueue, random, EventManager } from "../core/engine";
import { ChromaticAbberationFilter, WarpFilter } from "./filters";
import { StartScreen } from "./StartScreen";
import { AlphaFilter } from "@pixi/filter-alpha";
import { PauseScreen } from "./PauseScreen";
import { GameOverScreen } from "./GameOverScreen";
import { Align, JustifyContent, PositionType } from "./layout";
import Stats from "stats.js";
import { DashLineShader, SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { FadeContainer, HitAreaDebugContainer, ScrollInteractionManager } from "./ui";
import { BackgroundAsteroid } from "./BackgroundAsteroid";
import { ShipDisplay } from "./ShipDisplay";
import { ProjectileDisplay } from "./ProjectileDisplay";
import { AsteroidDisplay } from "./AsteroidDisplay";
import { UFODisplay } from "./UFODisplay";
import { GameTheme, GAME_THEMES } from "./GameTheme";
import { GameTokenResponse, decodeIntArray } from "../core/api";
import { getGameToken } from "./api";
import { UIEvents } from "./UIEvents";
import { AboutMeModal } from "./AboutMeModal";
import { SaveScoreModal } from "./SaveScoreModal";
import { LeaderboardModal } from "./LeaderboardModal";

const WARP_STRENGTH = 3;
const RGB_SPLIT_SEPARATION = 3;
const MAX_DEVICE_PIXEL_RATIO = 2;
const MAX_ELAPSED_MS = 1000 / MIN_FPS;

declare global {
    interface Window {
        asteroidsInstance: AsteroidsGame;
        asteroids: any;
    }
}

if (process.env.NODE_ENV === "development") {
    window.asteroids = {
        state: () => window.asteroidsInstance.game.state,
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
            if (window.asteroidsInstance.game.state.ship) {
                window.asteroidsInstance.game.state.lives = 1;
                window.asteroidsInstance.game.state.ship.destroy({ hit: true });
            }
        },
    };
}

export class AsteroidsGame {
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
    private readonly _uiEvents: EventManager<UIEvents>;
    private readonly _mainAlphaFilter: AlphaFilter;
    private readonly _mainWarpFilter: WarpFilter;
    private readonly _mainAbberationFilter: ChromaticAbberationFilter;
    private readonly _background: HTMLElement;
    private readonly _gameplayContainer: FadeContainer;
    private readonly _dpr: number;
    private readonly _apiRoot?: string;
    readonly game: CoreAsteroidsGame;
    private _theme!: GameTheme;
    private _token?: GameTokenResponse;
    private _loadingGameToken: boolean;
    private _nextToken?: GameTokenResponse;
    private _startScreen?: StartScreen;
    private _pauseScreen?: PauseScreen;
    private _aboutModal?: AboutMeModal;
    private _saveScoreModal?: SaveScoreModal;
    private _leaderboardModal?: LeaderboardModal;
    private _gameOverScreen?: GameOverScreen;
    private _timestamp: number;
    private _paused: boolean;
    private _queuedResizeId?: number;
    private _backgroundAsteroids: BackgroundAsteroid[];
    private _nextAnimationFrameId?: number;
    private _lastStartPressed: boolean;

    // Only used in development mode
    readonly fpsStats!: Stats;
    readonly memoryStats!: Stats;
    readonly statsDiv!: HTMLElement;
    readonly hitAreaDebugContainer!: HitAreaDebugContainer;

    constructor(params: {
        containerId: string,
        backgroundId: string,
        apiRoot?: string,
    }) {
        this._container = document.getElementById(params.containerId)!;
        if (!this._container) {
            throw new Error(`#${params.containerId} does not exist`);
        }
        this._background = document.getElementById(params.backgroundId)!;
        if (!this._background) {
            throw new Error(`#${params.backgroundId} does not exist`);
        }

        this.game = new CoreAsteroidsGame();
        this._paused = false;
        this._lastStartPressed = false;

        this._apiRoot = params.apiRoot;
        this._loadingGameToken = false;
        this.fetchNextGameToken();

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

        Renderer.registerPlugin("batch", BatchRenderer);
        Renderer.registerPlugin("interaction", InteractionManager);
        Renderer.registerPlugin("scrollInteraction", ScrollInteractionManager);
        this._renderer = autoDetectRenderer({
            width: this._container.clientWidth,
            height: this._container.clientHeight,
            antialias: false,
            backgroundAlpha: 0,
            powerPreference: "high-performance",
            forceCanvas: false,
        });

        this._dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
        if (this._dpr !== 1) {
            this._renderer.view.style.transform = this._background.style.transform = `scale(${1 / this._dpr})`;
        }

        this._renderer.view.style.position = "absolute";
        this._container.appendChild(this._renderer.view);

        this._uiQueue = new TickQueue();
        this._uiEvents = new EventManager();

        this._input = new InputProvider(controls);
        this._input.mapping = wasdMapping;

        this._stage = new Container();

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
        ];

        this._gameplayContainer = new FadeContainer({
            queue: this._uiQueue,
            fadeInDuration: 0,
            fadeOutDuration: 500,
            fadeOutExtraDelay: 500,
        });
        this._gameplayContainer.filters!.push(this._mainAlphaFilter = new AlphaFilter());
        this._mainAlphaFilter.padding = 24;
        this._gameplayContainer.interactiveChildren = false;
        this._mainContainer.addChild(this._gameplayContainer);

        this._hudContainer = new Container();
        this._hudContainer.flexContainer = true;
        this._hudContainer.layout.style({
            alignItems: Align.Center,
            justifyContent: JustifyContent.Center,
        });
        this._mainContainer.addChild(this._hudContainer);

        if (process.env.NODE_ENV === "development") {
            this.hitAreaDebugContainer = new HitAreaDebugContainer(this._uiQueue);
            this.hitAreaDebugContainer.visible = false;
            this._mainContainer.addChild(this.hitAreaDebugContainer);
        }

        this.applyTheme(this.getRandomTheme());
        this.executeResize();
        window.addEventListener("resize", this.queueResize);
        document.addEventListener("visibilitychange", this.onVisibilityChange);

        this._scoreIndicator = new ScoreIndicator({
            state: this.game.state,
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
            state: this.game.state,
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
            theme: this._theme,
            state: this.game.state,
        });
        this._levelIndicator.layout.style({
            marginVertical: 12,
            position: PositionType.Absolute,
            bottom: 0,
            left: 0,
        });
        this._hudContainer.addChild(this._levelIndicator);

        this.showStartScreen();

        this._backgroundAsteroids = BackgroundAsteroid.create({
            count: 20,
            queue: this._uiQueue,
            theme: this._theme,
            events: this.game.events,
            state: this.game.state,
            worldSize: this.game.worldSize,
        });
        this._backgroundAsteroids.forEach((asteroid) => this._backgroundContainer.addChild(asteroid.display));

        this.game.events.on("shipCreated", this, (ship) =>
            this._gameplayContainer.addChild(new ShipDisplay(ship, this._theme))
        );
        this.game.events.on("asteroidsCreated", this, (asteroids) => asteroids.forEach((asteroid) =>
            this._gameplayContainer.addChild(new AsteroidDisplay(asteroid, this._theme))
        ));
        this.game.events.on("projectileCreated", this, (projectile) =>
            this._gameplayContainer.addChild(new ProjectileDisplay(projectile, this._theme))
        );
        this.game.events.on("ufoCreated", this, (ufo) =>
            this._gameplayContainer.addChild(new UFODisplay(ufo, this._theme))
        );
        this.game.events.on("beforeStart", this, () => {
            // Remove anything that may be remaining in the gameplay container (animations, etc)
            for (let i = this._gameplayContainer.children.length - 1; i >= 0; i--) {
                this._gameplayContainer.children[i].destroy();
            }

            if (process.env.NODE_ENV === "development") {
                if (this._gameplayContainer.children.length) {
                    throw new Error(`${this._gameplayContainer.children.length} children remaining in gameplay container after reset`);
                }
            }

            if (this._nextToken) {
                try {
                    seedRandom(decodeIntArray(this._nextToken.randomSeed));
                    this.game.enableLogging = true;
                    this._token = this._nextToken;
                    this._nextToken = undefined;
                } catch (e) {
                    initRandom();
                    this._nextToken = this._token = undefined;
                    this.game.enableLogging = false;
                }
            } else {
                initRandom();
                this._token = undefined;
                this.game.enableLogging = false;
            }
            this.fetchNextGameToken();
            this._gameplayContainer.show();
        });
        this.game.events.on("finished", this, () => {
            this._gameOverScreen = new GameOverScreen({
                queue: this._uiQueue,
                events: this._uiEvents,
                state: this.game.state,
                enableSave: !!this._token && this.game.enableLogging && !!this._apiRoot,
            });
            this._hudContainer.addChild(this._gameOverScreen);
        });
        this.game.events.on("reset", this, () => {
            this._paused = false;
        })
        this._uiEvents.on("start", this, () => {
            if (this._aboutModal || this._leaderboardModal || this._saveScoreModal) {
                return;
            }
            if (this._startScreen) {
                const startScreen = this._startScreen;
                this._startScreen = undefined;
                startScreen.fadeOut().then(() => {
                    startScreen.destroy({ children: true });
                    this.game.start();
                });
            } else if (this._gameOverScreen) {
                const gameOverScreen = this._gameOverScreen;
                this._gameOverScreen = undefined;
                gameOverScreen.fadeOut().then(() => {
                    gameOverScreen.destroy({ children: true });
                    this.quit();
                });
            }
        });
        this._uiEvents.on("pause", this, () => {
            if (this.game.state.status === GameStatus.Running && !this._paused) {
                this._paused = true;
                if (!this._pauseScreen) {
                    this._pauseScreen = new PauseScreen({
                        queue: this._uiQueue,
                        events: this._uiEvents,
                        state: this.game.state,
                        inputProvider: this._input,
                    });
                    this._hudContainer.addChild(this._pauseScreen);
                    this._pauseScreen.fadeIn();
                }
            }
        });
        this._uiEvents.on("resume", this, () => {
            if (this.game.state.status === GameStatus.Running && this._paused) {
                if (this._pauseScreen) {
                    const pauseScreen = this._pauseScreen;
                    this._pauseScreen = undefined;
                    pauseScreen.fadeOut().then(() => {
                        pauseScreen.destroy({ children: true });
                        this._paused = false;
                    });
                } else {
                    this._paused = false;
                }
            }
        });
        this._uiEvents.on("quit", this, () => {
            if (this._pauseScreen) {
                const pauseScreen = this._pauseScreen;
                this._pauseScreen = undefined;
                pauseScreen.fadeOut().then(() => {
                    pauseScreen.destroy({ children: true });
                    this.quit();
                });
            } else if (this._gameOverScreen) {
                const gameOverScreen = this._gameOverScreen;
                this._gameOverScreen = undefined;
                gameOverScreen.fadeOut().then(() => {
                    gameOverScreen.destroy({ children: true });
                    this.quit();
                });
            }
        });
        this._uiEvents.on("openAbout", this, () => {
            if (!this._aboutModal) {
                this._aboutModal = new AboutMeModal({
                    queue: this._uiQueue,
                    events: this._uiEvents,
                });
                this._hudContainer.addChild(this._aboutModal);
                this._aboutModal.fadeIn();
                this._gameOverScreen && this._gameOverScreen.fadeOut(0.6);
                this._pauseScreen && this._pauseScreen.fadeOut(0.6);
                this._startScreen && this._startScreen.fadeOut();
            }
        });
        this._uiEvents.on("closeAbout", this, () => {
            if (this._aboutModal) {
                const modal = this._aboutModal;
                this._aboutModal = undefined;
                modal.fadeOut().then(() => {
                    modal.destroy({ children: true });
                });
                this._gameOverScreen && this._gameOverScreen.fadeIn();
                this._startScreen && this._startScreen.fadeIn();
                this._pauseScreen && this._pauseScreen.fadeIn();
            }
        });
        this._uiEvents.on("openSaveScore", this, () => {
            if (this._token && this.game.log && this._apiRoot && !this._saveScoreModal) {
                this._saveScoreModal = new SaveScoreModal({
                    queue: this._uiQueue,
                    events: this._uiEvents,
                    token: this._token,
                    apiRoot: this._apiRoot,
                    log: this.game.log,
                    state: this.game.state,
                });
                this._hudContainer.addChild(this._saveScoreModal);
                this._saveScoreModal.fadeIn();
                this._gameOverScreen && this._gameOverScreen.fadeOut(0.6);
            }
        });
        this._uiEvents.on("closeSaveScore", this, (saved) => {
            if (this._saveScoreModal) {
                const modal = this._saveScoreModal;
                this._saveScoreModal = undefined;
                modal.fadeOut().then(() => {
                    modal.destroy({ children: true });
                });
                if (this._gameOverScreen) {
                    this._gameOverScreen.fadeIn();
                    if (saved) {
                        this._gameOverScreen.onSaved();
                    }
                }
            }
        });
        this._uiEvents.on("openLeaderboard", this, () => {
            if (this._apiRoot && !this._leaderboardModal) {
                this._leaderboardModal = new LeaderboardModal({
                    queue: this._uiQueue,
                    events: this._uiEvents,
                    apiRoot: this._apiRoot,
                });
                this._hudContainer.addChild(this._leaderboardModal);
                this._leaderboardModal.fadeIn();
                this._gameOverScreen && this._gameOverScreen.fadeOut(0.6);
                this._pauseScreen && this._pauseScreen.fadeOut(0.6);
                this._startScreen && this._startScreen.fadeOut();
            }
        });
        this._uiEvents.on("closeLeaderboard", this, () => {
            if (this._leaderboardModal) {
                const modal = this._leaderboardModal;
                this._leaderboardModal = undefined;
                modal.fadeOut().then(() => {
                    modal.destroy({ children: true });
                });
                this._gameOverScreen && this._gameOverScreen.fadeIn();
                this._startScreen && this._startScreen.fadeIn();
                this._pauseScreen && this._pauseScreen.fadeIn();
            }
        });

        this._timestamp = 0;
        this._nextAnimationFrameId = window.requestAnimationFrame(this.onAnimationFrame);
    }

    destroy(): void {
        this.game.destroy();
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

    private fetchNextGameToken(): void {
        if (this._apiRoot) {
            this._loadingGameToken = true;
            getGameToken(this._apiRoot).then((response) => {
                if (response.ok) {
                    this._nextToken = response.data;
                }
                if (this._startScreen) {
                    this._startScreen.enableLeaderboard = response.ok;
                }
                this._loadingGameToken = false;
            });
        }
    }

    private getRandomTheme(): GameTheme {
        return GAME_THEMES[random(0, GAME_THEMES.length - 1, false)];
    }

    private applyTheme(theme: GameTheme): void {
        this._theme = theme;
        document.getElementById("background")!.style.background = theme.background;
        document.getElementById("background")!.style.opacity = "1";
        this._mainAlphaFilter.alpha = theme.foregroundAlpha;
        if (process.env.NODE_ENV === "development") {
            console.log("Applied theme", theme);
        }
    }

    private showStartScreen(): void {
        this._startScreen = new StartScreen({
            queue: this._uiQueue,
            theme: this._theme,
            state: this.game.state,
            events: this._uiEvents,
            inputProvider: this._input,
            enableLeaderboard: !!this._nextToken,
        });
        this._hudContainer.addChild(this._startScreen);
    }

    private quit(): void {
        if (this.game.state.status !== GameStatus.Init) {
            this._background.style.opacity = "0";
            this._gameplayContainer.fadeOut().then(() => {
                this.game.reset();
                this.applyTheme(this.getRandomTheme());
                this.showStartScreen();
            });
        }
    }

    private onAnimationFrame = (timestamp: number): void => {
        if (process.env.NODE_ENV === "development") {
            this.fpsStats.begin();
            this.memoryStats.begin();
        }
        const elapsedMs = Math.min(MAX_ELAPSED_MS, timestamp - this._timestamp);
        this._timestamp = timestamp;
        const input = this._input.poll();

        if (input.start && !this._lastStartPressed) {
            if (this.game.state.status === GameStatus.Init && !this._loadingGameToken) {
                this._uiEvents.trigger("start");
            } else if (this.game.state.status === GameStatus.Running) {
                if (this._paused) {
                    this._uiEvents.trigger("resume");
                } else {
                    this._uiEvents.trigger("pause");
                }
            }
        }
        this._lastStartPressed = !!input.start;

        if (!this._paused) {
            this.game.tick(elapsedMs, input);
        }
        this._uiQueue.tick(this._timestamp, elapsedMs / 1000);

        // Debug options

        if (process.env.NODE_ENV === "development") {
            if (this.hitAreaDebugContainer.visible) {
                const objects: GameObject[] = [
                    ...this.game.state.projectiles,
                    ...this.game.state.asteroids,
                    ...this.game.state.ufos
                ];
                if (this.game.state.ship) {
                    objects.push(this.game.state.ship);
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
            this._uiEvents.trigger("pause");
        }
    }

    private executeResize(): void {
        this._uiEvents.trigger("pause");
        const [nativeWidth, nativeHeight] = [
            this._container.clientWidth * this._dpr,
            this._container.clientHeight * this._dpr,
        ];
        const aspectRatio = nativeWidth / nativeHeight;
        if (process.env.NODE_ENV === "development") {
            console.log("Aspect ratio changed", aspectRatio);
        }
        this.game.aspectRatio = clamp(aspectRatio, MAX_ASPECT_RATIO, MIN_ASPECT_RATIO);
        // Scale world based on new screen size and aspect ratio
        if (aspectRatio > MAX_ASPECT_RATIO) {
            this._stage.scale.set(nativeHeight / this.game.worldSize.height);
            this._renderer.resize(nativeHeight * MAX_ASPECT_RATIO, nativeHeight);
        } else if (aspectRatio < MIN_ASPECT_RATIO) {
            this._stage.scale.set(nativeWidth / this.game.worldSize.width);
            this._renderer.resize(nativeWidth, nativeWidth / MIN_ASPECT_RATIO);
        } else {
            this._renderer.resize(nativeWidth, nativeHeight);
            this._stage.scale.set(nativeWidth / this.game.worldSize.width);
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
            width: this.game.worldSize.width,
            height: this.game.worldSize.height,
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

    private drawCornerBound(hy: number, hx1: number, hx2: number, vx: number, vy1: number, vy2: number): void {
        const { worldSize } = this.game;
        const resolution = 10;

        this._cornerBoundsGraphics.moveTo(...this._mainWarpFilter.getDisplacement(worldSize, hx1, hy));
        for (let hx = hx1 + resolution; hx < hx2 - 1; hx += resolution) {
            this._cornerBoundsGraphics.lineTo(...this._mainWarpFilter.getDisplacement(worldSize, hx, hy));
        }
        this._cornerBoundsGraphics.lineTo(...this._mainWarpFilter.getDisplacement(worldSize, hx2, hy));

        this._cornerBoundsGraphics.moveTo(...this._mainWarpFilter.getDisplacement(worldSize, vx, vy1));
        for (let vy = vy1 + resolution; vy < vy2 - 1; vy += resolution) {
            this._cornerBoundsGraphics.lineTo(...this._mainWarpFilter.getDisplacement(worldSize, vx, vy));
        }
        this._cornerBoundsGraphics.lineTo(...this._mainWarpFilter.getDisplacement(worldSize, vx, vy2));
    }

    private drawCornerBounds(lineWidth: number): void {
        const extra = 10;
        const xLength = this.game.worldSize.width / 7;
        const yLength = this.game.worldSize.height / 7;
        const { width, height } = this.game.worldSize;
        const halfLineWidth = lineWidth / 2;

        this._cornerBoundsGraphics.clear();
        this._cornerBoundsGraphics.lineStyle({
            width: lineWidth,
            color: this._theme.backgroundColor,
            alpha: this._theme.backgroundAlpha * 2,
        });

        // Top left
        this.drawCornerBound(halfLineWidth, -extra, xLength, halfLineWidth, -extra, yLength);
        // Top Right
        this.drawCornerBound(halfLineWidth, width - xLength, width + extra, width - halfLineWidth, -extra, yLength);
        // Bottom left
        this.drawCornerBound(height - halfLineWidth, -extra, xLength, halfLineWidth, height - yLength, height + extra);
        // Bottom right
        this.drawCornerBound(height - halfLineWidth, width - xLength, width + extra, width - halfLineWidth, height - yLength, height + extra);
    }

    private drawBounds(aspectRatio: number): void {
        const lineWidth = 2 / this._stage.scale.x;
        const { width, height } = this.game.worldSize;

        this.drawCornerBounds(lineWidth);

        // If the game is letterboxed, draw absolute bounds

        this._absoluteBoundsGraphics.clear();
        this._absoluteBoundsGraphics.lineStyle({
            width: lineWidth,
            color: this._theme.backgroundColor,
            alpha: this._theme.backgroundAlpha * 2,
        });

        if (aspectRatio < MIN_ASPECT_RATIO) {
            this._absoluteBoundsGraphics.visible = true;
            let y = lineWidth / 2;
            this._absoluteBoundsGraphics.moveTo(0, y).lineTo(width, y);
            y = height - lineWidth / 2;
            this._absoluteBoundsGraphics.moveTo(0, y).lineTo(width, y);
        } else if (aspectRatio > MAX_ASPECT_RATIO) {
            this._absoluteBoundsGraphics.visible = true;
            let x = lineWidth / 2;
            this._absoluteBoundsGraphics.moveTo(x, 0).lineTo(x, height);
            x = width - lineWidth / 2;
            this._absoluteBoundsGraphics.moveTo(x, 0).lineTo(x, height);
        } else {
            this._absoluteBoundsGraphics.visible = false;
        }
    }
}

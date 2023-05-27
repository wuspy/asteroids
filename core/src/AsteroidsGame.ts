import { ISize } from "@pixi/core";
import { Asteroid } from "./Asteroid";
import { GameEvents } from "./GameEvents";
import { GameState, GameStatus } from "./GameState";
import { Ship } from "./Ship";
import { UFO } from "./UFO";
import {
    EXTRA_LIFE_AT_SCORE,
    LIVES,
    MAX_ASPECT_RATIO,
    MIN_ASPECT_RATIO,
    MIN_FPS,
    NEXT_LEVEL_DELAY,
    RESPAWN_DELAY,
    SHIP_POWERUP_FIRE_INTERVAL,
    UFOType,
    UFO_DISTRIBUTION,
    UFO_HARD_DISTRIBUTION_SCORE,
    UFO_SPAWN_TIME,
    WORLD_AREA,
    controls,
    inputLogConfig
} from "./constants";
import { EventManager, GameLog, InputState, RandomFn, TickQueue, urandom } from "./engine";

const WORLD_AREA_PX = WORLD_AREA * 1000000;
const MAX_ELAPSED_MS = 1000 / MIN_FPS;

export class AsteroidsGame {
    readonly state: GameState;
    readonly events: EventManager<GameEvents>;
    readonly worldSize: ISize;
    readonly queue: TickQueue;
    private _nextLevelCountdown: number;
    private _respawnCountdown: number;
    private _nextUFOSpawn: number;
    private _logger?: GameLog<typeof controls>;
    private _lastFirePressed: boolean;
    private _lastHyperspacePressed: boolean;
    private _random: RandomFn;

    enableLogging: boolean;

    constructor() {
        this.worldSize = { width: 0, height: 0 };
        this.aspectRatio = 1;
        this.enableLogging = false;
        this.events = new EventManager();
        this.queue = new TickQueue();
        this._random = urandom; // Default to global unseeded random

        this.state = {
            level: 1,
            score: 0,
            lives: LIVES,
            status: GameStatus.Init,
            timestamp: 0,
            asteroids: [],
            projectiles: [],
            ufos: [],
        };

        this._respawnCountdown = 0;
        this._nextLevelCountdown = 0;
        this._nextUFOSpawn = 0;
        this._lastFirePressed = false;
        this._lastHyperspacePressed = false;

        this.events.on("shipCreated", (ship) => {
            if (this.state.ship) {
                throw new Error("Multiple ships created");
            }
            this.state.ship = ship;
        });
        this.events.on("shipDestroyed", () => {
            this.state.ship = undefined;
            if (this.state.lives && this.state.status === GameStatus.Running) {
                this.state.lives--;
                this.events.trigger("livesChanged", this.state.lives);
                if (this.state.lives) {
                    this._respawnCountdown = RESPAWN_DELAY;
                }
            }
        });

        this.events.on("asteroidsCreated", (asteroids) => this.addGameObjects("asteroids", ...asteroids));
        this.events.on("asteroidDestroyed", (asteroid, hit, scored) => {
            if (scored) {
                this.addScore(asteroid.score);
            }
            this.removeGameObject("asteroids", asteroid);
        });

        this.events.on("ufoCreated", (ufo) => this.addGameObjects("ufos", ufo));
        this.events.on("ufoDestroyed", (ufo, hit, scored) => {
            if (scored) {
                this.addScore(ufo.score);
            }
            this.removeGameObject("ufos", ufo);
        });

        this.events.on("projectileCreated", (projectile) => this.addGameObjects("projectiles", projectile));
        this.events.on("projectileDestroyed", (projectile) => this.removeGameObject("projectiles", projectile));
    }

    start(): void {
        if (this.state.status !== GameStatus.Init) {
            return;
        }
        this.events.trigger("beforeStart");
        this._logger = this.enableLogging
            ? new GameLog(this.worldSize, inputLogConfig)
            : undefined
        this.spawnShip(false);
        this.setNextUFOSpawn();
        Asteroid.createInitial({
            state: this.state,
            queue: this.queue,
            events: this.events,
            worldSize: this.worldSize,
            random: this._random,
        });
        this.state.status = GameStatus.Running;
        this.events.trigger("started");
    }

    reset(): void {
        if (this.state.ship) {
            this.state.ship.destroy({ hit: false });
        }
        for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
            this.state.projectiles[i].destroy({ hit: false });
        }
        for (let i = this.state.asteroids.length - 1; i >= 0; i--) {
            this.state.asteroids[i].destroy({ hit: false, scored: false, createChildren: false });
        }
        for (let i = this.state.ufos.length - 1; i >= 0; i--) {
            this.state.ufos[i].destroy({ hit: false, scored: false });
        }

        if (process.env.NODE_ENV === "development") {
            if (this.state.ship) {
                throw new Error("Ship remaining after reset");
            }
            if (this.state.asteroids.length) {
                throw new Error(`${this.state.asteroids.length} asteroids remaining after reset`);
            }
            if (this.state.ufos.length) {
                throw new Error(`${this.state.ufos.length} ufos remaining after reset`);
            }
            if (this.state.projectiles.length) {
                throw new Error(`${this.state.projectiles.length} projectiles remaining after reset`);
            }
        }

        this.queue.clear();

        this.state.level = 1;
        this.state.lives = LIVES;
        this.state.score = 0;
        this.state.timestamp = 0;
        this.state.status = GameStatus.Init;

        this._respawnCountdown = 0;
        this._nextLevelCountdown = 0;
        this._nextUFOSpawn = 0;
        this._lastFirePressed = false;
        this._lastHyperspacePressed = false;
        this.events.trigger("reset");
    }

    get aspectRatio(): number {
        return this.worldSize.width / this.worldSize.height;
    }

    set aspectRatio(aspectRatio: number) {
        if (aspectRatio > MAX_ASPECT_RATIO || aspectRatio < MIN_ASPECT_RATIO) {
            throw new Error(`Aspect ratio ${aspectRatio} must be between ${MIN_ASPECT_RATIO} and ${MAX_ASPECT_RATIO}`);
        }
        this.worldSize.width = Math.floor(Math.sqrt(WORLD_AREA_PX * aspectRatio));
        this.worldSize.height = Math.floor(WORLD_AREA_PX / this.worldSize.width);
    }

    get log(): Uint8Array | undefined {
        return this._logger?.log;
    }

    set random(random: RandomFn) {
        if (this.state.status !== GameStatus.Init) {
            throw new Error("Cannot set seeded random function on an already started game");
        }
        this._random = random;
    }

    tick(elapsedMs: number, input: InputState<typeof controls>): void {
        if (this.state.status === GameStatus.Init) {
            return;
        }

        elapsedMs = Math.min(MAX_ELAPSED_MS, elapsedMs);
        if (this._logger && this.state.status === GameStatus.Running) {
            [elapsedMs, input] = this._logger.logFrame(elapsedMs, input, this.worldSize);
        }

        const { ship, ufos } = this.state;

        const timestamp = this.state.timestamp + elapsedMs;
        while (timestamp > this.state.timestamp) {
            let nextCriticalTime = timestamp;
            for (const ufo of ufos) {
                nextCriticalTime = Math.min(nextCriticalTime, ufo.nextFireTime);
                if (ufo.nextYShift) {
                    nextCriticalTime = Math.min(nextCriticalTime, ufo.nextYShift);
                }
                if (ufo.currentYShiftEnd) {
                    nextCriticalTime = Math.min(nextCriticalTime, ufo.currentYShiftEnd);
                }
            }
            if (ship?.nextFireTime) {
                nextCriticalTime = Math.min(nextCriticalTime, ship.nextFireTime);
            }
            this._tick(nextCriticalTime - this.state.timestamp, input);
        }
    }

    private _tick(elapsedMs: number, input: InputState<typeof controls>): void {
        this.state.timestamp += elapsedMs
        const elapsed = elapsedMs / 1000;

        // Dispatch tick event

        this.queue.tick(this.state.timestamp, elapsed);

        // Handle user input

        const { ship, asteroids, projectiles, ufos } = this.state;

        if (ship) {
            ship.rotationAmount = input.turn;
            ship.accelerationAmount = input.thrust;

            if (input.fire) {
                if (ship.powerupRemaining) {
                    if (!ship.isFiringFullAuto) {
                        ship.startFireFullAuto(SHIP_POWERUP_FIRE_INTERVAL);
                    }
                } else if (!this._lastFirePressed) {
                    ship.fire();
                }
            }

            if (ship.isFiringFullAuto && (!input.fire || !ship.powerupRemaining)) {
                ship.endFireFullAuto();
            }

            if (input.hyperspace && !this._lastHyperspacePressed) {
                ship.hyperspace();
            }
        }

        this._lastFirePressed = !!input.fire;
        this._lastHyperspacePressed = !!input.hyperspace;

        this.checkShipCollisions();

        // Check for UFO collision with other UFOs

        for (let i = 0; i < ufos.length; i++) {
            for (let j = i + 1; j < ufos.length; j++) {
                if (ufos[i].collidesWith(ufos[j])) {
                    ufos[i].destroy({ hit: true, scored: false });
                    ufos[j - 1].destroy({ hit: true, scored: false });
                    break;
                }
            }
        }

        // Check for asteroid collisions with UFOs

        for (const asteroid of asteroids) {
            for (const ufo of ufos) {
                if (ufo.collidesWith(asteroid)) {
                    ufo.destroy({ hit: true, scored: false });
                    asteroid.destroy({ hit: true, scored: false, createChildren: true });
                    break;
                }
            }
        }

        // Check for UFO collisions with projectiles

        for (const ufo of ufos) {
            for (const projectile of projectiles) {
                if (projectile.from !== ufo && projectile.collidesWith(ufo)) {
                    projectile.destroy({ hit: true });
                    ufo.destroy({
                        hit: true,
                        scored: projectile.from === ship && this.state.status !== GameStatus.Finished,
                    });
                    break;
                }
            }
        }

        // Check for asteroid collisions with projectilels

        for (const asteroid of asteroids) {
            for (const projectile of projectiles) {
                if (projectile.collidesWith(asteroid)) {
                    asteroid.destroy({
                        hit: true,
                        scored: projectile.from === ship && this.state.status !== GameStatus.Finished,
                        createChildren: true,
                    });
                    projectile.destroy({ hit: true });
                    break;
                }
            }
        }

        // Spawn UFO

        if (this.state.timestamp >= this._nextUFOSpawn) {
            // Decide which type of UFO to generate
            const randomPercent = this._random(1, 100);
            let currentChance = 0;
            const type = Object.entries(UFO_DISTRIBUTION)
                // Find what the distribution is at the current score
                .map(([type, { easy, hard }]) => [
                    type,
                    Math.min(1, this.state.score / UFO_HARD_DISTRIBUTION_SCORE) * (hard - easy) + easy
                ] as [UFOType, number])
                // Sort distribution by least to most likely
                .sort(([, chance1], [, chance2]) => chance1 - chance2)
                // Map chances to a running total
                .map(([type, chance]) => [type, currentChance += chance * 100] as [UFOType, number])
                // Find the first type that is >= the generated percent
                .find(([, chance]) => chance >= randomPercent)![0];

            this.events.trigger("ufoCreated", new UFO({
                state: this.state,
                events: this.events,
                queue: this.queue,
                worldSize: this.worldSize,
                random: this._random,
                type,
            }));
            this.setNextUFOSpawn();
        }

        // Advance game status if needed

        if (this.state.lives === 0 && this.state.status === GameStatus.Running) {
            this.state.status = GameStatus.Finished;
            this._logger?.flush();
            this.events.trigger("finished");
        }

        if (this._nextLevelCountdown) {
            this._nextLevelCountdown = Math.max(0, this._nextLevelCountdown - elapsed);
            if (this._nextLevelCountdown === 0) {
                // The game will continue running even after it's finished, as a visual effect. So it's possible
                // spanwed UFOs will destroy all asteroids and trigger the next level. But don't actually increment
                // the level in that case.
                if (this.state.status !== GameStatus.Finished) {
                    this.state.level++;
                }
                Asteroid.createInitial({
                    state: this.state,
                    worldSize: this.worldSize,
                    events: this.events,
                    queue: this.queue,
                    random: this._random,
                });
                this.events.trigger("levelChanged", this.state.level);
            }
        } else if (asteroids.length === 0) {
            this._nextLevelCountdown = NEXT_LEVEL_DELAY;
        }

        if (!ship && this._respawnCountdown) {
            this._respawnCountdown = Math.max(0, this._respawnCountdown - elapsed);
            if (this._respawnCountdown === 0) {
                this.spawnShip(true);
            }
        }
    }

    private addGameObjects<T extends "asteroids" | "ufos" | "projectiles">(
        type: T,
        ...objects: GameState[T][0][]
    ): void {
        this.state[type].push(...objects as any[]);
    }

    private removeGameObject<T extends "asteroids" | "ufos" | "projectiles">(type: T, object: GameState[T][0]): void {
        const i = this.state[type].indexOf(object as any);
        if (i !== -1) {
            this.state[type].splice(i, 1);
        }
    }

    private spawnShip(invulnerable: boolean): void {
        this.events.trigger("shipCreated", new Ship({
            state: this.state,
            queue: this.queue,
            events: this.events,
            worldSize: this.worldSize,
            random: this._random,
            invulnerable,
            position: {
                x: this.worldSize.width / 2,
                y: this.worldSize.height / 2,
            },
        }));
    }

    private setNextUFOSpawn(): void {
        this._nextUFOSpawn = this.state.timestamp + this._random(UFO_SPAWN_TIME[0] * 1000, UFO_SPAWN_TIME[1] * 1000);
    }

    private addScore(increase: number): void {
        if (EXTRA_LIFE_AT_SCORE
            && this.state.lives < LIVES
            && Math.floor((this.state.score + increase) / EXTRA_LIFE_AT_SCORE) > Math.floor(this.state.score / EXTRA_LIFE_AT_SCORE)
        ) {
            this.state.lives = Math.min(LIVES, this.state.lives + Math.ceil(increase / EXTRA_LIFE_AT_SCORE));
            this.events.trigger("livesChanged", this.state.lives);
        }
        this.state.score += increase;
        this.events.trigger("scoreChanged", this.state.score);
    }

    private checkShipCollisions() {
        const { ship, ufos, asteroids, projectiles } = this.state;
        if (ship && !ship.invulnerable) {
            for (const ufo of ufos) {
                if (ship.collidesWith(ufo)) {
                    ufo.destroy({ hit: true, scored: true });
                    if (!ship.powerupRemaining) {
                        ship.destroy({ hit: true });
                    }
                    return;
                }
            }
            for (const asteroid of asteroids) {
                if (ship.collidesWith(asteroid)) {
                    asteroid.destroy({ hit: true, scored: true, createChildren: true });
                    if (asteroid.hasPowerup) {
                        ship.startPowerup();
                    } else if (!ship.powerupRemaining) {
                        ship.destroy({ hit: true });
                    }
                    return;
                }
            }
            for (const projectile of projectiles) {
                if (projectile.from !== ship && ship.collidesWith(projectile)) {
                    projectile.destroy({ hit: true });
                    if (!ship.powerupRemaining) {
                        ship.destroy({ hit: true });
                    }
                    return;
                }
            }
        }
    }
}

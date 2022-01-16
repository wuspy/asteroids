import { ISize } from "@pixi/math";
import { InputState } from "./engine";
import { Ship } from "./Ship";
import { Asteroid } from "./Asteroid";
import { LIVES, NEXT_LEVEL_DELAY, RESPAWN_DELAY, WORLD_AREA, UFO_SPAWN_TIME, UFO_DISTRIBUTION, UFOType, UFO_HARD_DISTRIBUTION_SCORE, EXTRA_LIFE_AT_SCORE } from "./constants";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";
import { EventManager } from "./engine/EventManager";
import { random, TickQueue } from "./engine";
import { UFO } from "./UFO";
import { THEMES } from "./Theme";
import { controls } from "./input";
import { Container } from "@pixi/display";

const WORLD_AREA_PX = WORLD_AREA * 1000000;

export abstract class AbstractAsteroidsGame {
    readonly state: GameState;
    readonly events: EventManager<GameEvents>;
    readonly worldSize: ISize;
    readonly queue: TickQueue;
    protected gameplayContainer?: Container;
    private _nextLevelCountdown: number;
    private _respawnCountdown: number;
    private _nextUFOSpawn: number;

    constructor() {
        this.worldSize = { width: 0, height: 0 };
        this.aspectRatio = 1;
        this.events = new EventManager();
        this.queue = new TickQueue();

        this.state = {
            level: 1,
            score: 0,
            lives: LIVES,
            status: "init",
            timestamp: 0,
            theme: THEMES[random(0, THEMES.length - 1, false)],
            asteroids: [],
            projectiles: [],
            ufos: [],
        };

        this._respawnCountdown = 0;
        this._nextLevelCountdown = 0;
        this._nextUFOSpawn = 0;

        this.events.on("shipCreated", (ship) => {
            if (this.state.ship) {
                throw new Error("Multiple ships created");
            }
            this.state.ship = ship;
            this.gameplayContainer?.addChild(ship.container);
        }, this);
        this.events.on("shipDestroyed", () => {
            this.state.ship = undefined;
            if (this.state.lives) {
                this.state.lives--;
                if (this.state.lives) {
                    this._respawnCountdown = RESPAWN_DELAY;
                }
            }
        }, this);
        this.events.on("asteroidsCreated", (asteroids) => {
            this.state.asteroids.push(...asteroids);
            this.gameplayContainer?.addChild(...asteroids.map((asteroid) => asteroid.container));
        }, this);
        this.events.on("asteroidDestroyed", (asteroid) => this.removeGameObject("asteroids", asteroid), this);
        this.events.on("ufoCreated", (ufo) => {
            this.state.ufos.push(ufo);
            this.gameplayContainer?.addChild(ufo.container);
        }, this);
        this.events.on("ufoDestroyed", (ufo) => this.removeGameObject("ufos", ufo), this);
        this.events.on("projectileCreated", (projectile) => {
            this.state.projectiles.push(projectile);
            this.gameplayContainer?.addChild(projectile.container);
        }, this);
        this.events.on("projectileDestroyed", (projectile) => this.removeGameObject("projectiles", projectile), this);
    }

    protected start(): void {
        if (this.state.status !== "finished" && this.state.status !== "init") {
            return;
        }
        this.reset();
        this.events.trigger("preStart");

        this.spawnShip(false);
        this.setNextUFOSpawn();
        Asteroid.createInitial({
            state: this.state,
            queue: this.queue,
            events: this.events,
            worldSize: this.worldSize,
        });
        this.state.status = "running";
        this.events.trigger("start");
    }

    protected reset(): void {
        if (this.state.ship) {
            this.state.ship.destroy(false);
        }
        this.state.ship = undefined;
        for (const projectile of this.state.projectiles) {
            projectile.destroy();
        }
        this.state.projectiles = [];
        for (const asteroid of this.state.asteroids) {
            asteroid.destroy(false);
        }
        this.state.asteroids = [];
        for (const ufo of this.state.ufos) {
            ufo.destroy(false);
        }
        this.state.ufos = [];

        this.state.level = 1;
        this.state.lives = LIVES;
        this.state.score = 0;
        this.state.timestamp = 0;
        this.state.status = "init";

        this._respawnCountdown = 0;
        this._nextLevelCountdown = 0;
        this._nextUFOSpawn = 0;
    }

    protected resume(): void {
        if (this.state.status === "paused") {
            this.state.status = "running";
            this.events.trigger("resume");
        }
    }

    protected pause(): void {
        if (this.state.status === "running") {
            this.state.status = "paused";
            this.events.trigger("pause");
        }
    }

    protected get aspectRatio(): number {
        return this.worldSize.width / this.worldSize.height;
    }

    protected set aspectRatio(aspectRatio: number) {
        this.worldSize.width = Math.floor(Math.sqrt(WORLD_AREA_PX * aspectRatio));
        this.worldSize.height = Math.floor(WORLD_AREA_PX / this.worldSize.width);
    }

    protected tick(elapsed: number, input: InputState<typeof controls>): void {
        const { ship, asteroids, projectiles, ufos } = this.state;

        if (this.state.status === "paused" || this.state.status === "init") {
            return;
        }

        this.state.timestamp += elapsed * 1000;

        // Handle user input

        if (ship) {
            ship.rotationAmount = input.turn;
            ship.accelerationAmount = input.thrust;

            if (input.fire) {
                ship.fire();
            }

            if (input.hyperspace) {
                ship.hyperspace();
            }
        }

        // Dispatch tick event

        this.queue.tick(this.state.timestamp, elapsed);

        this.checkShipCollisions();

        // Check for UFO collision with other UFOs

        for (let i = 0; i < ufos.length; i++) {
            for (let j = i + 1; j < ufos.length; j++) {
                if (ufos[i].collidesWith(ufos[j])) {
                    ufos[i].destroy(true);
                    ufos[j - 1].destroy(true);
                    break;
                }
            }
        }

        // Check for asteroid collisions with UFOs

        for (const asteroid of asteroids) {
            for (const ufo of ufos) {
                if (ufo.collidesWith(asteroid)) {
                    ufo.destroy(true);
                    asteroid.destroy(true, true);
                    break;
                }
            }
        }

        // Check for UFO collisions with projectiles

        for (const ufo of ufos) {
            for (const projectile of projectiles) {
                if (projectile.from !== ufo && projectile.collidesWith(ufo)) {
                    projectile.destroy();
                    ufo.destroy(true);
                    if (projectile.from === ship && this.state.status !== "finished") {
                        this.addScore(ufo.score);
                    }
                    break;
                }
            }
        }

        // Check for asteroid collisions with projectilels

        for (const asteroid of asteroids) {
            for (const projectile of projectiles) {
                if (projectile.collidesWith(asteroid)) {
                    asteroid.destroy(true, true);
                    projectile.destroy();
                    if (projectile.from === ship && this.state.status !== "finished") {
                        this.addScore(asteroid.score);
                    }
                    break;
                }
            }
        }

        // Spawn UFO

        if (this.state.timestamp >= this._nextUFOSpawn) {
            // Decide which type of UFO to generate
            const randomPercent = random(1, 100, true);
            let currentChance = 0;
            const type = Object.entries(UFO_DISTRIBUTION)
                // Find what the distribution is at the current score
                .map(([type, { easy, hard }]) => [type, Math.min(1, this.state.score / UFO_HARD_DISTRIBUTION_SCORE) * (hard - easy) + easy] as [UFOType, number])
                // Sort distribution by least to most likely
                .sort(([, chance1], [, chance2]) => chance1 - chance2)
                // Map chances to a running total
                .map(([type, chance]) => [type, currentChance += chance * 100])
                // Find the first type that is >= the generated percent
                .find(([, chance]) => chance >= randomPercent)![0] as UFOType;
            new UFO({
                state: this.state,
                events: this.events,
                queue: this.queue,
                worldSize: this.worldSize,
                type,
            });
            this.setNextUFOSpawn();
        }

        // Advance game status if needed

        if (this.state.lives === 0 && this.state.status === "running") {
            this.state.status = "finished";
            this.events.trigger("finished");
        }

        if (this._nextLevelCountdown) {
            this._nextLevelCountdown = Math.max(0, this._nextLevelCountdown - elapsed);
            if (this._nextLevelCountdown === 0) {
                // The game will continue running even after it's finished, as a visual effect. So it's possible
                // spanwed UFOs will destroy all asteroids and trigger the next level. But don't actually increment
                // the level in that case.
                if (this.state.status !== "finished") {
                    this.state.level++;
                }
                Asteroid.createInitial({
                    state: this.state,
                    worldSize: this.worldSize,
                    events: this.events,
                    queue: this.queue,
                });
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

    private removeGameObject<T extends "asteroids" | "ufos" | "projectiles">(type: T, object: GameState[T][number]): void {
        const i = this.state[type].indexOf(object as any);
        if (i !== -1) {
            this.state[type].splice(i, 1);
        }
    }

    private spawnShip(invulnerable: boolean): void {
        new Ship({
            state: this.state,
            queue: this.queue,
            events: this.events,
            worldSize: this.worldSize,
            invulnerable,
            position: {
                x: this.worldSize.width / 2,
                y: this.worldSize.height / 2,
            },
        });
    }

    private setNextUFOSpawn(): void {
        this._nextUFOSpawn = this.state.timestamp + random(UFO_SPAWN_TIME[0] * 1000, UFO_SPAWN_TIME[1] * 1000, true);
    }

    private addScore(increase: number): void {
        // if (this.state.lives < LIVES && Math.floor((this.state.score + increase) / EXTRA_LIFE_AT_SCORE) > Math.floor(this.state.score / EXTRA_LIFE_AT_SCORE)) {
        //     this.state.lives++;
        // }
        this.state.score += increase;
    }

    private checkShipCollisions() {
        const { ship, ufos, asteroids, projectiles } = this.state;
        if (ship && !ship.invulnerable) {
            for (const ufo of ufos) {
                if (ship.collidesWith(ufo)) {
                    ufo.destroy(true);
                    ship.destroy(true);
                    this.addScore(ufo.score);
                    return;
                }
            }
            for (const asteroid of asteroids) {
                if (ship.collidesWith(asteroid)) {
                    asteroid.destroy(true);
                    ship.destroy(true);
                    this.addScore(asteroid.score);
                    return;
                }
            }
            for (const projectile of projectiles) {
                if (projectile.from !== ship && ship.collidesWith(projectile)) {
                    projectile.destroy();
                    ship.destroy(true);
                    return;
                }
            }
        }
    }
}

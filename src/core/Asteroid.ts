import {
    ASTEROID_CHILDREN_COUNT,
    ASTEROID_COUNT_INCREASE_PER_LEVEL,
    ASTEROID_GENERATION_COUNT,
    ASTEROID_GENERATION_SCORES,
    ASTEROID_GENERATION_SPEEDS,
    ASTEROID_HITAREAS,
    INITIAL_ASTEROID_COUNT,
    MAX_ASTEROID_COUNT,
    QUEUE_PRIORITIES
} from "./constants";
import { DEG_TO_RAD, ISize, Rectangle } from "@pixi/math";
import {
    random,
    GameObject,
    findUnoccupiedPosition,
    TickQueue,
    EventManager,
    CoreGameObjectParams,
    Vec2,
    IGameObjectDisplay
} from "./engine";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";

// Generates a random angle that isn't within +/-15deg of horizontal or vertical, to prevent
// an asteroid from being stuck near the screen margin.
export const generateAsteroidAngle = (useSeededRandom: boolean) => (random(15, 75, useSeededRandom) + 90 * random(0, 3, useSeededRandom)) * DEG_TO_RAD;

export interface AsteroidDestroyOptions {
    hit: boolean;
    scored: boolean;
    createChildren: boolean;
}

export type IAsteroidDisplay = IGameObjectDisplay<AsteroidDestroyOptions>;

export class Asteroid extends GameObject<GameState, AsteroidDestroyOptions, GameEvents> {
    override display?: IAsteroidDisplay;
    private _model: number;
    private _generation: number;

    private constructor(params: CoreGameObjectParams<GameState, GameEvents> & {
        position?: Vec2,
        obstacles?: GameObject[],
        velocity: Vec2,
        model: number,
        generation: number,
    }) {
        super({
            ...params,
            position: params.obstacles ? { x: 0, y: 0 } : params.position,
            queuePriority: QUEUE_PRIORITIES.asteroid,
            hitArea: ASTEROID_HITAREAS[params.model][params.generation],
        });

        this._model = params.model;
        this._generation = params.generation;

        if (params.obstacles) {
            this.moveToUnoccupiedPosition(params.obstacles);
        }
    }

    moveToUnoccupiedPosition(obstacles: GameObject[]): void {
        const boundingBox = this.boundingBox;
        const position = findUnoccupiedPosition({
            bounds: new Rectangle(
                boundingBox.width / 2,
                boundingBox.height / 2,
                this.worldSize.width - boundingBox.width,
                this.worldSize.height - boundingBox.height,
            ),
            objectSize: { width: boundingBox.width * 2, height: boundingBox.height * 2 },
            obstacles: obstacles.filter((obstacle) => obstacle !== this).map((obstacle) => obstacle.boundingBox),
            useSeededRandom: true,
        });
        // Since we found free location twice the size of the asteroid, move the initial locaiton away
        // from the direction it's traveling so that it can appear to generate close to obstacles
        // it's moving away from.
        //
        // Probably not worth it but makes things feel a bit more random to me.
        position.x -= this.velocity.x * 0.5;
        position.y -= this.velocity.y * 0.5;
        this.position.copyFrom(position);
    }

    override destroy(options: AsteroidDestroyOptions): void {
        super.destroy(options);
        const generation = this._generation + 1;
        const createChildren = options.createChildren && generation < ASTEROID_GENERATION_COUNT;
        this.events.trigger("asteroidDestroyed", this, options.hit, options.scored, createChildren);

        if (createChildren) {
            let lastAngle = -15;
            const asteroids = [];
            for (let i = 0; i < ASTEROID_CHILDREN_COUNT; i++) {
                let angle = generateAsteroidAngle(true);
                // Ensure this child is at leat 15deg apart from the last one
                while (Math.abs(angle - lastAngle) < 15 * DEG_TO_RAD) {
                    angle = generateAsteroidAngle(true);
                }
                lastAngle = angle;
                const [sin, cos] = [Math.sin(angle), Math.cos(angle)];
                const speed = random(ASTEROID_GENERATION_SPEEDS[generation][0], ASTEROID_GENERATION_SPEEDS[generation][1], true);
                const distance = random(this.boundingBox.width / 8, this.boundingBox.width / 4, true);
                asteroids.push(new Asteroid({
                    state: this.state,
                    events: this.events,
                    queue: this.queue,
                    worldSize: this.worldSize,
                    model: this._model,
                    generation,
                    position: {
                        x: this.x + distance * sin,
                        y: this.y + distance * -cos,
                    },
                    velocity: {
                        x: speed * sin,
                        y: speed * -cos,
                    },
                }));
            }
            this.events.trigger("asteroidsCreated", asteroids);
        }
    }

    static createInitial(params: {
        state: GameState,
        queue: TickQueue,
        events: EventManager<GameEvents>,
        worldSize: ISize,
    }): void {
        const count = Math.min(
            MAX_ASTEROID_COUNT,
            INITIAL_ASTEROID_COUNT + Math.floor(ASTEROID_COUNT_INCREASE_PER_LEVEL * (params.state.level - 1))
        );
        const modelNumbers = [];
        for (let i = 0; i <= count; i++) {
            modelNumbers.push(random(0, ASTEROID_HITAREAS.length - 1, true));
        }
        const obstacles: GameObject[] = [...params.state.asteroids, ...params.state.ufos];
        if (params.state.ship) {
            obstacles.push(params.state.ship);
        }
        const asteroids: Asteroid[] = [];
        for (let i = 0; i < count; i++) {
            const modelNumber = modelNumbers[i];
            const angle = generateAsteroidAngle(true);
            const speed = random(ASTEROID_GENERATION_SPEEDS[0][0], ASTEROID_GENERATION_SPEEDS[0][1], true);
            const [sin, cos] = [Math.sin(angle), Math.cos(angle)];
            asteroids.push(new Asteroid({
                ...params,
                model: modelNumber,
                generation: 0,
                obstacles: [...obstacles, ...asteroids],
                velocity: {
                    x: speed * sin,
                    y: speed * -cos,
                },
            }));
        }
        params.events.trigger("asteroidsCreated", asteroids);
    }

    get score(): number {
        return ASTEROID_GENERATION_SCORES[this._generation];
    }

    get generation(): number {
        return this._generation;
    }

    get model(): number {
        return this._model;
    }
}

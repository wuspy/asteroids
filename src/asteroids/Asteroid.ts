import { Explosion } from "./Explosion";
import {
    ASTEROID_CHILDREN_COUNT,
    ASTEROID_COUNT_INCREASE_PER_LEVEL,
    ASTEROID_GENERATION_COUNT,
    ASTEROID_GENERATION_SCORES,
    ASTEROID_GENERATION_SIZES,
    ASTEROID_GENERATION_SPEEDS,
    ASTEROID_MODEL_HITAREAS,
    INITIAL_ASTEROID_COUNT,
    MAX_ASTEROID_COUNT,
    QUEUE_PRIORITIES
} from "./constants";
import { DEG_TO_RAD, ISize, Rectangle } from "@pixi/math";
import {
    scalePolygon,
    random,
    GameObject,
    findUnoccupiedPosition,
    getPolygonBoundingBox,
    TickQueue,
    EventManager,
    CoreGameObjectParams,
    Vec2
} from "./engine";
import { GameState } from "./GameState";
import { GameEvents } from "./GameEvents";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LINE_JOIN } from "@pixi/graphics";
import { BlurFilter } from "@pixi/filter-blur";

const GENERATION_LINE_WIDTHS: readonly number[] = [4, 3.5, 3];
const GENERATION_EXPLOSION_SIZES: readonly number[] = [250, 200, 150];

const POLYGONS = ASTEROID_MODEL_HITAREAS.map((polygon) => {
    const generations = [];
    for (let i = 0; i < ASTEROID_GENERATION_COUNT; i++) {
        generations.push(scalePolygon(polygon, ASTEROID_GENERATION_SIZES[i]));
    }
    return generations;
});

const BACKGROUND_POLYGONS = ASTEROID_MODEL_HITAREAS.map((polygon) => {
    const generations = [];
    for (let i = 0; i < ASTEROID_GENERATION_COUNT; i++) {
        generations.push(scalePolygon(polygon, ASTEROID_GENERATION_SIZES[i] * 0.6));
    }
    return generations;
});

// Since background asteroids are never used for hit detection, don't bother adding the overhead
// of giving them polygon hitareas. Just give them point hitareas with a radius that will produce
// the same bounding box.
//
// Also, all background asteroids use the generation 0 bounding box regardless of what generation
// they actually are, to make them wrap the screen consistently so they don't begin to overlap
// as the game progresses.
const BACKGROUND_HITAREAS = BACKGROUND_POLYGONS.map((generations) => {
    const boundingBox = getPolygonBoundingBox(generations[0]);
    return Math.max(boundingBox.width, boundingBox.height) / 2;
});

const GEOMETRIES = POLYGONS.map((generations) => generations.map((polygon, generation) => {
    const graphics = new Graphics();
    graphics.lineStyle({
        width: GENERATION_LINE_WIDTHS[generation],
        color: 0xffffff,
        alpha: 1,
        join: LINE_JOIN.BEVEL,
    });
    graphics.drawPolygon(polygon);
    return graphics.geometry;
}));

const BACKGROUND_GEOMETRIES = BACKGROUND_POLYGONS.map((generations) => generations.map((polygon, generation) => {
    const graphics = new Graphics();
    graphics.lineStyle({
        width: GENERATION_LINE_WIDTHS[generation],
        color: 0xffffff,
        alpha: 1,
        join: LINE_JOIN.BEVEL,
    });
    graphics.drawPolygon(polygon);
    return graphics.geometry;
}));

// Generates a random angle that isn't within +/-15deg of horizontal or vertical, to prevent
// an asteroid from being stuck near the screen margin.
const generateAsteroidAngle = (useSeededRandom: boolean) => (random(15, 75, useSeededRandom) + 90 * random(0, 3, useSeededRandom)) * DEG_TO_RAD;

export class Asteroid extends GameObject<GameState, GameEvents> {
    private _model: number;
    private _generation: number;
    private _isBackground: boolean;

    private constructor(params: CoreGameObjectParams<GameState, GameEvents> & {
        position?: Vec2,
        obstacles?: GameObject<any, any>[],
        velocity: Vec2,
        model: number,
        generation: number,
        isBackground?: boolean,
    }) {
        super({
            ...params,
            position: params.obstacles ? { x: 0, y: 0 } : params.position,
            queuePriority: params.isBackground
                ? QUEUE_PRIORITIES.animation
                : QUEUE_PRIORITIES.asteroid,
            hitArea: params.isBackground
                ? BACKGROUND_HITAREAS[params.model]
                : POLYGONS[params.model][params.generation],
        });

        this._model = params.model;
        this._generation = params.generation;
        this._isBackground = params.isBackground ?? false;
        
        if (params.obstacles) {
            this.moveToUnoccupiedPosition(params.obstacles);
        }

        if (this._isBackground) {
            const sprite = new Graphics(BACKGROUND_GEOMETRIES[this._model][this._generation]);
            sprite.alpha = this.state.theme.backgroundAsteroidAlpha;
            sprite.tint = this.state.theme.backgroundAsteroidColor;
            this.container.addChild(sprite);
        } else {
            const sprite = new Graphics(GEOMETRIES[this._model][this._generation]);
            sprite.tint = this.state.theme.foregroundColor;
            const blur = sprite.clone();
            blur.filters = [new BlurFilter()];
            this.container.addChild(blur, sprite);
        }
    }

    moveToUnoccupiedPosition(obstacles: GameObject<any, any>[]): void {
        const boundingBox = this.boundingBox;
            const bounds = this._isBackground
                ? new Rectangle(0, 0, this.worldSize.width, this.worldSize.height)
                : new Rectangle(
                    boundingBox.width / 2,
                    boundingBox.height / 2,
                    this.worldSize.width - boundingBox.width,
                    this.worldSize.height - boundingBox.height,
                );
            const position = findUnoccupiedPosition({
                bounds,
                objectSize: { width: boundingBox.width * 2, height: boundingBox.height * 2 },
                obstacles: obstacles.filter((obstacle) => obstacle !== this).map((obstacle) => obstacle.boundingBox),
                useSeededRandom: !this._isBackground,
            });
            if (!this._isBackground) {
                // Since we found free location twice the size of the asteroid, move the initial locaiton away
                // from the direction it's traveling so that it can appear to generate close to obstacles
                // it's moving away from.
                //
                // Probably not worth it but makes things feel a bit more random to me.
                position.x -= this.velocity.x * 0.5;
                position.y -= this.velocity.y * 0.5;
            }
            this.position.copyFrom(position);
    }

    override destroy(explode: boolean = false, createChildren: boolean = false): void {
        if (explode && this.container.parent) {
            const explosion = new Explosion({
                queue: this.queue,
                diameter: GENERATION_EXPLOSION_SIZES[this._generation],
                maxDuration: 2000,
                color: this.state.theme.foregroundColor,
            });
            explosion.position.copyFrom(this.position);
            this.container.parent.addChild(explosion);
        }
        super.destroy();
        const generation = this._generation + 1;
        createChildren &&= generation < ASTEROID_GENERATION_COUNT;
        this.events.trigger("asteroidDestroyed", this, createChildren);
        
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
            modelNumbers.push(random(0, POLYGONS.length - 1, true));
        }
        const obstacles: GameObject<any, any>[] = [...params.state.asteroids, ...params.state.ufos];
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

    static createBackground(params: {
        count: number,
        queue: TickQueue,
        events: EventManager<GameEvents>,
        state: GameState,
        worldSize: ISize,
    }): Asteroid[] {
        const modelNumbers = [];
        const generationNumbers = [];
        for (let i = 0; i < params.count; i++) {
            modelNumbers.push(random(0, POLYGONS.length - 1, false));
            generationNumbers.push(random(0, ASTEROID_GENERATION_COUNT - 1, false));
        }
        // All asteroids move in the same direction
        const angle = generateAsteroidAngle(false);
        const [sin, cos] = [Math.sin(angle), Math.cos(angle)];
        // All background asteroids move with the same speed
        const velocity = {
            x: 20 * sin,
            y: 20 * -cos,
        };
        const asteroids: Asteroid[] = [];
        for (let i = 0; i < params.count; i++) {
            asteroids.push(new Asteroid({
                ...params,
                isBackground: true,
                model: modelNumbers[i],
                generation: generationNumbers[i],
                obstacles: asteroids,
                velocity,
            }));
        }
        return asteroids;
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

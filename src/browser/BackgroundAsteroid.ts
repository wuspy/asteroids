import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LINE_JOIN } from "@pixi/graphics";
import { ISize, Rectangle } from "@pixi/math";
import { CoreGameObjectParams, EventManager, findUnoccupiedPosition, GameObject, random, TickQueue, Vec2 } from "@core/engine";
import { ASTEROID_GENERATION_COUNT, ASTEROID_HITAREAS, GameState, GameEvents, generateAsteroidAngle } from "@core";

const GENERATION_LINE_WIDTHS: readonly number[] = [4, 3.5, 3];

const BACKGROUND_POLYGONS = ASTEROID_HITAREAS.map((generation) => generation.map((polygon) => polygon.clone().scale(0.6)));

// Since background asteroids are never used for hit detection, don't bother adding the overhead
// of giving them polygon hitareas. Just give them point hitareas with a radius that will produce
// the same bounding box.
//
// Also, all background asteroids use the generation 0 bounding box regardless of what generation
// they actually are, to make them wrap the screen consistently so they don't begin to overlap
// as the game progresses.
const HITAREAS = BACKGROUND_POLYGONS.map((generations) => {
    const boundingBox = generations[0].getBoundingBox();
    return Math.max(boundingBox.width, boundingBox.height) / 2;
});

const GEOMETRIES = BACKGROUND_POLYGONS.map((generations) => generations.map((polygon, generation) => {
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

export class BackgroundAsteroid extends GameObject<GameState, GameEvents> {
    override readonly display: Graphics;
    private _model: number;
    private _generation: number;

    private constructor(params: CoreGameObjectParams<GameState, GameEvents> & {
        obstacles: GameObject<any, any>[],
        velocity: Vec2,
        model: number,
        generation: number,
    }) {
        super({
            ...params,
            position: { x: 0, y: 0 },
            queuePriority: 100,
            hitArea: HITAREAS[params.generation],
        });

        this._model = params.model;
        this._generation = params.generation;

        this.moveToUnoccupiedPosition(params.obstacles);
        this.display = new Graphics(GEOMETRIES[this._model][this._generation]);
        this.display.alpha = this.state.theme.backgroundAsteroidAlpha;
        this.display.tint = this.state.theme.backgroundAsteroidColor;
        this.display.position.copyFrom(this.position);
        this.display.rotation = this.rotation;
    }

    moveToUnoccupiedPosition(obstacles: GameObject<any, any>[]): void {
        const boundingBox = this.boundingBox;
        const position = findUnoccupiedPosition({
            bounds: new Rectangle(0, 0, this.worldSize.width, this.worldSize.height),
            objectSize: { width: boundingBox.width * 2, height: boundingBox.height * 2 },
            obstacles: obstacles.filter((obstacle) => obstacle !== this).map((obstacle) => obstacle.boundingBox),
            useSeededRandom: false,
        });
        this.position.copyFrom(position);
    }

    static create(params: {
        count: number,
        queue: TickQueue,
        events: EventManager<GameEvents>,
        state: GameState,
        worldSize: ISize,
    }): BackgroundAsteroid[] {
        const modelNumbers = [];
        const generationNumbers = [];
        for (let i = 0; i < params.count; i++) {
            modelNumbers.push(random(0, ASTEROID_HITAREAS.length - 1, false));
            generationNumbers.push(random(0, ASTEROID_GENERATION_COUNT - 1, false));
        }
        // All background asteroids move with the same speed and direction
        const angle = generateAsteroidAngle(false);
        const [sin, cos] = [Math.sin(angle), Math.cos(angle)];
        const velocity = {
            x: 20 * sin,
            y: 20 * -cos,
        };
        const asteroids: BackgroundAsteroid[] = [];
        for (let i = 0; i < params.count; i++) {
            asteroids.push(new BackgroundAsteroid({
                ...params,
                model: modelNumbers[i],
                generation: generationNumbers[i],
                obstacles: asteroids,
                velocity,
            }));
        }
        return asteroids;
    }

    get model(): number {
        return this._model;
    }

    get generation(): number {
        return this._generation;
    }
}

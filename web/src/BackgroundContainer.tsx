import { DEG_TO_RAD, IRenderer, ISize, Rectangle, Texture } from "@pixi/core";
import { LINE_JOIN } from "@pixi/graphics";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Sprite } from "@pixi/sprite";
import {
    ASTEROID_GENERATION_COUNT,
    ASTEROID_HITAREAS,
    CoreGameObjectParams,
    EventManager,
    GameEvents,
    GameObject,
    GameState,
    TickQueue,
    Vec2,
    findUnoccupiedPosition,
    generateAsteroidAngle,
    urandom
} from "@wuspy/asteroids-core";
import { For, createRenderEffect } from "solid-js";
import { useApp } from "./AppContext";
import { ContainerProps } from "./solid-pixi";

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

const GRID_ANGLE = 7;
const GRID_SPACING = 95;

const createAsteroidTexture = (renderer: IRenderer, model: number, generation: number): Texture => {
    const graphics = new Graphics();
    graphics.lineStyle({
        width: GENERATION_LINE_WIDTHS[generation],
        color: 0xffffff,
        alpha: 1,
        join: LINE_JOIN.BEVEL,
    });
    graphics.drawPolygon(BACKGROUND_POLYGONS[model][generation]);
    return renderer.generateTexture(graphics);
};

const TEXTURE_CACHE = new WeakMap<IRenderer, Texture[][]>;

const generateTextureCache = (renderer: IRenderer) => {
    TEXTURE_CACHE.set(renderer, ASTEROID_HITAREAS.map((generations, model) =>
        generations.map((polygon, generation) => {
            const texture = createAsteroidTexture(renderer, model, generation);
            texture.defaultAnchor.set(0.5);
            return texture;
        })
    ));
}

class BackgroundAsteroid extends GameObject<GameState, undefined, GameEvents> {
    private _model: number;
    private _generation: number;

    private constructor(params: Omit<CoreGameObjectParams<GameState, GameEvents>, "random"> & {
        obstacles: GameObject[];
        velocity: Vec2;
        model: number;
        generation: number;
    }) {
        super({
            ...params,
            position: { x: 0, y: 0 },
            queuePriority: 100,
            hitArea: HITAREAS[params.generation],
            random: urandom,
        });

        this._model = params.model;
        this._generation = params.generation;

        // Move to unoccupied position
        const boundingBox = this.boundingBox;
        const position = findUnoccupiedPosition({
            bounds: new Rectangle(0, 0, this.worldSize.width, this.worldSize.height),
            objectSize: { width: boundingBox.width * 2, height: boundingBox.height * 2 },
            obstacles: params.obstacles.map(obstacle => obstacle.boundingBox),
            random: urandom,
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
            modelNumbers.push(urandom(0, ASTEROID_HITAREAS.length - 1));
            generationNumbers.push(urandom(0, ASTEROID_GENERATION_COUNT - 1));
        }
        // All background asteroids move with the same speed and direction
        const angle = generateAsteroidAngle(urandom);
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

export const BackgroundContainer = (props: ContainerProps) => {
    const { renderer, game, queue, worldSize, theme } = useApp();
    let lastWorldSize = { width: 0, height: 0 };

    const asteroids = BackgroundAsteroid.create({
        count: 20,
        queue,
        events: game.events,
        state: game.state,
        worldSize: game.worldSize,
    });

    // Reposition background asteroids
    createRenderEffect(() => {
        if (lastWorldSize.width && lastWorldSize.height) {
            const xDiff = worldSize().width / lastWorldSize.width;
            const yDiff = worldSize().height / lastWorldSize.height;

            for (const asteroid of asteroids) {
                asteroid.position.set(
                    asteroid.x * xDiff,
                    asteroid.y * yDiff,
                );
            }
        }

        lastWorldSize = worldSize();
    });

    let gridGraphics!: Graphics;
    const grid = <graphics ref={gridGraphics} alpha={theme().backgroundAlpha} />;

    // Draw background grid
    createRenderEffect(() => {
        const {width, height} = worldSize();

        gridGraphics.clear();
        gridGraphics.lineStyle({
            width: 1,
            color: theme().backgroundColor,
        });
        const xOffset = height * Math.sin(GRID_ANGLE * DEG_TO_RAD);
        const yOffset = width * Math.sin(GRID_ANGLE * DEG_TO_RAD);
        for (let i = xOffset * 0.8; i <= width + xOffset; i += GRID_SPACING) {
            gridGraphics.moveTo(i, 0);
            gridGraphics.lineTo(i - xOffset, height);
        }
        for (let i = -yOffset; i <= height; i += GRID_SPACING) {
            gridGraphics.moveTo(0, i);
            gridGraphics.lineTo(width, i + yOffset);
        }
    });

    return <container {...props}>
        {grid}
        <For each={asteroids}>
            {(asteroid) => {
                if (!TEXTURE_CACHE.has(renderer)) {
                    generateTextureCache(renderer);
                }
                const texture = TEXTURE_CACHE.get(renderer)![asteroid.model][asteroid.generation];
            
                let sprite: Sprite;
                asteroid.onPositionChange = position => sprite.position.copyFrom(position);
                asteroid.onRotationChange = rotation => sprite.rotation = rotation;
            
                return (
                    <sprite
                        ref={sprite!}
                        texture={texture}
                        anchor={texture.defaultAnchor}
                        alpha={theme().backgroundAlpha}
                        tint={theme().backgroundColor}
                        position={asteroid.position}
                        rotation={asteroid.rotation}
                    />
                );
            }}
        </For>
    </container>;
};

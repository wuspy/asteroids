import { AbstractRenderer, Texture } from "@pixi/core";
import { useLayoutEffect, useMemo, useRef } from "react";
import { ASTEROID_GENERATION_COUNT, ASTEROID_HITAREAS, GameEvents, GameState, generateAsteroidAngle } from "../core";
import { LINE_JOIN } from "@pixi/graphics";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Rectangle, ISize } from "@pixi/math";
import { useApp } from "./AppContext";
import { CoreGameObjectParams, EventManager, findUnoccupiedPosition, GameObject, urandom, TickQueue, Vec2 } from "../core/engine";
import { Container, RefType, Sprite } from "./react-pixi";

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

const createAsteroidTexture = (renderer: AbstractRenderer, model: number, generation: number): Texture => {
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

const TEXTURE_CACHE = new WeakMap<AbstractRenderer, Texture[][]>;

const generateTextureCache = (renderer: AbstractRenderer) => {
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

interface BackgroundAsteroidDisplayProps {
    asteroid: BackgroundAsteroid;
}

const BackgroundAsteroidDisplay = ({ asteroid }: BackgroundAsteroidDisplayProps) => {
    const { renderer, theme } = useApp();
    const sprite = useRef<RefType<typeof Sprite>>(null);

    if (!TEXTURE_CACHE.has(renderer)) {
        generateTextureCache(renderer);
    }

    useLayoutEffect(() => {
        asteroid.onPositionChange = position => sprite.current!.position.copyFrom(position);
        asteroid.onRotationChange = rotation => sprite.current!.rotation = rotation;
    }, [asteroid]);

    return <Sprite
        ref={sprite}
        texture={TEXTURE_CACHE.get(renderer)![asteroid.model][asteroid.generation]}
        alpha={theme.backgroundAlpha}
        tint={theme.backgroundColor}
        position={asteroid.position}
        rotation={asteroid.rotation}
    />;
};

export const BackgroundAsteroidsContainer = () => {
    const { game } = useApp();
    const tickQueue = useApp().queue;
    const lastWorldSize = useRef({ ...game.worldSize });
    const asteroids = useMemo(() => (
        BackgroundAsteroid.create({
            count: 20,
            queue: tickQueue,
            events: game.events,
            state: game.state,
            worldSize: lastWorldSize.current,
        })
    ), []);

    useLayoutEffect(() => {
        if (lastWorldSize.current.width !== game.worldSize.width
            || lastWorldSize.current.height !== game.worldSize.height
        ) {
            const xDiff = game.worldSize.width / lastWorldSize.current.width;
            const yDiff = game.worldSize.height / lastWorldSize.current.height;
            lastWorldSize.current.width = game.worldSize.width;
            lastWorldSize.current.height = game.worldSize.height;
            for (const asteroid of asteroids) {
                asteroid.position.set(
                    asteroid.x * xDiff,
                    asteroid.y * yDiff,
                );
            }
        }
    }, [game.worldSize.width, game.worldSize.height]);

    return <Container>
        {asteroids.map((asteroid, i) => <BackgroundAsteroidDisplay key={i} asteroid={asteroid} />)}
    </Container>;
};

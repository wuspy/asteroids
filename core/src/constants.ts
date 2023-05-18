import { Polygon } from "@pixi/core";
import { InputLogConfig, InputMappingType } from "./engine";
import "./engine";

/**
 * Constants and types that configure core gameplay mechanics.
 * 
 * All coordinates/distances are in CSS pixels (1/96 of a inch), all time values are in seconds,
 * and all angles in radians. By extension, all speeds are in pixels/sec and radians/sec, and
 * accelerations in pixels/sec^2 and radians/sec^2.
 */

/**
 * The queue priority for each type of game object. They will be ticked on each frame in increasing order of priority.
 */
 export const QUEUE_PRIORITIES = {
    ship: 0,
    ufo: 1,
    asteroid: 2,
    projectile: 3,
} as const;

/**
 * Game control types
 */
export const controls = ["start", "fire", "hyperspace", "turn", "thrust"] as const;

export const inputLogConfig: InputLogConfig<typeof controls> = {
    fire: { code: 255, type: InputMappingType.Digital },
    hyperspace: { code: 254, type: InputMappingType.Digital },
    start: { code: 253, type: InputMappingType.Digital },
    turn: { code: 252, type: InputMappingType.Analog },
    thrust: { code: 251, type: InputMappingType.Analog },
}

/**
 * The minimum FPS the game will run at before it starts slowing down.
 */
 export const MIN_FPS = 20;

/**
 * Number of lives
 */
export const LIVES = 5;

/**
 * After the score increases by this amount, an extra life will be given. Zero to disable.
 */
export const EXTRA_LIFE_AT_SCORE = 20000;

/**
 * How long after the ship is destroyed before it respawns.
 */
export const RESPAWN_DELAY = 2;

/**
 * How long after the current level is cleared before the next level starts.
 */
export const NEXT_LEVEL_DELAY = 0.5;

/**
 * The world area in mega(css)pixels. The game will be scaled so that it perceives that the container
 * it's running in has this much area.
 */
export const WORLD_AREA = 1.5;

/**
 * The min and max screen aspect ratios supported by the game. If the client size is outside
 * of these bounds it must be letterboxed.
 */
export const MAX_ASPECT_RATIO = 2.25
export const MIN_ASPECT_RATIO = 0.75;

/**
 * How long a hyperspace jump takes. For half this amount, the ship fades out in its current location, and
 * after that it spawns in its new location and fades in. The ship is invulnerable for this entire time.
 */
export const HYPERSPACE_DELAY = 0.2;

/**
 * Ship physics parameters
 */
export const MAX_SPEED = 1000;
export const MAX_ROTATION_SPEED = Math.PI * 1.6;
export const ACCELERATION = 1600;
export const ROTATION_ACCELERATION = Math.PI * 10;
export const FRICTION = 425;
export const ROTATION_FRICTION = Math.PI * 10;
export const SHIP_HITAREA = new Polygon(
    { x: 20, y: 30 },
    { x: 0, y: -30 },
    { x: -20, y: 30 },
    { x: -7, y: 16 },
    { x: 7, y: 16 },
);

/**
 * How much recoil acceleration is applied to the ship when firing a shot.
 */
export const RECOIL = 75;

/**
 * How long the ship remains invulerable after respawning.
 */
export const INVULNERABLE_TIME = 2;

/**
 * The minimum interval between hyperspace jumps.
 */
export const HYPERSPACE_COOLDOWN = 0.5;

/**
 * Ship projectile physics parameters
 */
export const BASE_SHIP_PROJECTILE_SPEED = 1000;
export const MAX_SHIP_PROJECTILE_SPEED = 1500;
export const MIN_SHIP_PROJECTILE_SPEED = 1000;
export const SHIP_PROJECTILE_ENABLE_TANGENTIAL_VELOCITY = false;

/**
 * Ship projecitle rate limiting
 */
export const SHIP_FIRE_COOLDOWN = 1 / 20;
export const SHIP_PROJECTILE_CAPACITY = 10;
export const SHIP_PROJECTILE_RECHARGE_RATE = 5;

/**
 * Ship powerup parameters
 */
export const SHIP_POWERUP_DURATION = 15;
export const SHIP_POWERUP_PROJECTILE_SPEED_MULTIPLIER = 2;
export const SHIP_POWERUP_FIRE_INTERVAL = 1 / 30;
export const SHIP_POWERUP_RECOIL_MULTIPLER = 0.25;

/**
 * How much time a projectile can stay active. Applies to both ship and UFO projectiles.
 */
export const PROJECTILE_LIFETIME = 0.8;

export const ASTEROID_GENERATION_COUNT = 3;
export const ASTEROID_CHILDREN_COUNT = 2;
export const ASTEROID_GENERATION_SIZES = [1, 0.6, 0.3] as const;
export const ASTEROID_POWERUP_SPAWN_CHANCE = 0.02;

/**
 * The score each asteroid generation is worth when destroyed by the ship.
 */
export const ASTEROID_GENERATION_SCORES = [20, 50, 100] as const;

/**
 * The min and max speed each asteroid generation can have. Asteroids speeds are calculatd as a random number
 * between these two values.
 */
export const ASTEROID_GENERATION_SPEEDS = [
    [80, 120],
    [130, 170],
    [180, 220],
] as const;

/**
 * The minimum number of asteroids that spawn at each level, and the number that spawns at level 1.
 */
export const INITIAL_ASTEROID_COUNT = 4;

/**
 * The maximum number of asteroids that can spawn at each level.
 */
export const MAX_ASTEROID_COUNT = 8;

/**
 * How many more asteroids should spawn with each level increase. Does not have to be an integer, can be < 1
 * or any float value. For example, if set to 0.5, an additional asteroid will spawn every other level.
 */
export const ASTEROID_COUNT_INCREASE_PER_LEVEL = 1;

const ASTEROID_MODEL_HITAREAS = [
    new Polygon(
        { x: -42, y: 71 },
        { x: 15, y: 71 },
        { x: 68, y: 34 },
        { x: 48, y: -6 },
        { x: 71, y: -43 },
        { x: 35, y: -72 },
        { x: 0, y: -42 },
        { x: -35, y: -72 },
        { x: -72, y: -38 },
        { x: -72, y: 42 }
    ),
    new Polygon(
        { x: -35, y: 71 },
        { x: -20, y: 51 },
        { x: 28, y: 71 },
        { x: 71, y: 17 },
        { x: 28, y: -18 },
        { x: 71, y: -35 },
        { x: 35, y: -72 },
        { x: -2, y: -51 },
        { x: -28, y: -72 },
        { x: -72, y: -35 },
        { x: -51, y: 0 },
        { x: -72, y: 35 }
    ),
    new Polygon(
        { x: -43, y: 71 },
        { x: -9, y: 15 },
        { x: -17, y: 71 },
        { x: 17, y: 71 },
        { x: 71, y: 5 },
        { x: 71, y: -20 },
        { x: 34, y: -72 },
        { x: -18, y: -72 },
        { x: -72, y: -18 },
        { x: -37, y: -3 },
        { x: -72, y: 15 }
    ),
    new Polygon(
        { x: -39, y: 59 },
        { x: 12, y: 51 },
        { x: 29, y: 71 },
        { x: 62, y: 41 },
        { x: 15, y: 0 },
        { x: 63, y: -3 },
        { x: 71, y: -18 },
        { x: 15, y: -66 },
        { x: -32, y: -72 },
        { x: -21, y: -37 },
        { x: -72, y: -43 },
        { x: -70, y: 8 },
    )
] as const;

export const ASTEROID_HITAREAS = ASTEROID_MODEL_HITAREAS.map((polygon) => {
    const generations = [];
    for (let i = 0; i < ASTEROID_GENERATION_COUNT; i++) {
        generations.push(polygon.clone().scale(ASTEROID_GENERATION_SIZES[i]));
    }
    return generations;
});

export type UFOType = "small" | "large";

/**
 * The min and max interval between UFO spawns. UFO spawns are calculated as a random number between
 * these two values regardless of score.
 */
export const UFO_SPAWN_TIME = [8, 16] as const;

/**
 * The probability of each type of UFO spawning, at 'easy' and 'hard' scores. At zero score, only the easy
 * distribution is used. At UFO_HARD_DISTRIBUTION_SCORE, only the hard distribution is used. Inbetween,
 * the distribution is adjusted linearly based on the current score.
 */
export const UFO_DISTRIBUTION: Readonly<{ [Key in UFOType]: { easy: number, hard: number } }> = {
    large: { easy: 0.8, hard: 0.2 },
    small: { easy: 0.2, hard: 0.8 },
};
export const UFO_HARD_DISTRIBUTION_SCORE = 50000;

export const UFO_SIZES: Readonly<{ [Key in UFOType]: number }> = {
    large: 1.0,
    small: 0.6,
};

/**
 * The speed each UFO type travels at.
 */
export const UFO_SPEEDS: Readonly<{ [Key in UFOType]: number }> = {
    large: 175,
    small: 225,
};

/**
 * The score each UFO type is worth when destroyed by the ship.
 */
export const UFO_SCORES: Readonly<{ [Key in UFOType]: number }> = {
    large: 200,
    small: 1000,
};

export const UFO_PROJECTILE_SPEEDS: Readonly<{ [Key in UFOType]: number }> = {
    large: 800,
    small: 1000,
};

/**
 * The min and max fire intervals for each type of UFO. Fire intervals are calculated as a random
 * number between min and max.
 */
export const UFO_FIRE_INTERVALS: Readonly<{ [Key in UFOType]: readonly [number, number] }> = {
    large: [0.5, 1.5] as const,
    small: [0.5, 1.5] as const,
};

/**
 * The min and max vertical shift intervals for each type of UFO. Vertical shift intervals are calculated
 * as a random number between min and max.
 */
export const UFO_SHIFT_INTERVALS: Readonly<{ [Key in UFOType]: readonly [number, number] }> = {
    large: [1.5, 3] as const,
    small: [0.75, 2] as const,
};

/**
 * The min and max vertical shift amounts for each type of UFO. Vertical shift amounts are calculated
 * as a random number between min and max.
 */
export const UFO_SHIFT_AMOUNTS: Readonly<{ [Key in UFOType]: readonly [number, number] }> = {
    large: [100, 400] as const,
    small: [150, 500] as const,
};

/**
 * The inaccuracy for small UFO's, in radians, at 'easy' and 'hard' scores. At zero score, only the easy
 * inaccuracy is used. At UFO_HARD_INACCURACY_SCORE, only the hard inaccuracy is used. Inbetween, the
 * inaccuracy is adjusted linearly based on the current score.
 */
export const UFO_INACCURACY = { easy: 0.25, hard: 0.0 } as const; // +/- radians

export const UFO_HARD_INACCURACY_SCORE = 50000;

const BASE_UFO_HITAREA = new Polygon(
    { x: -60, y: 12 },
    { x: -36, y: -13 },
    { x: -32, y: -13 },
    { x: -24, y: -35 },
    { x: 23, y: -35 },
    { x: 31, y: -13 },
    { x: 35, y: -13 },
    { x: 59, y: 12 },
    { x: 37, y: 12 },
    { x: 14, y: 33 },
    { x: -15, y: 33 },
    { x: -38, y: 12 },
);

export const UFO_HITAREAS: Readonly<{ [Key in UFOType]: Polygon }> = {
    large: BASE_UFO_HITAREA.clone().scale(UFO_SIZES.large),
    small: BASE_UFO_HITAREA.clone().scale(UFO_SIZES.small),
};

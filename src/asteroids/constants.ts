import { Polygon } from "@pixi/math";

/**
 * Constants and types that configure core gameplay mechanics.
 * 
 * All coordinates/distances are in CSS pixels (1/96 of a inch), all time values are in seconds,
 * and all angles in radians. By extension, all speeds are in pixels/sec and radians/sec, and
 * accelerations in pixels/sec^2 and radians/sec^2.
 */

export const FONT_FAMILY = "Consolas, Monaco, Noto Sans Mono, Roboto Mono, Liberation Mono, monospace";

export const LIVES = 5;
export const EXTRA_LIFE_AT_SCORE = 10000;
export const RESPAWN_DELAY = 2;
export const NEXT_LEVEL_DELAY = 0.25;
export const QUEUE_PRIORITIES = {
    ship: 0,
    ufo: 1,
    asteroid: 2,
    projectile: 3,
    animation: 100,
} as const;

/**
 * The world area in mega(css)pixels. The game will be scaled so that it perceives that the container
 * it's running in has this much area.
 */
export const WORLD_AREA = 1.5;

export const HYPERSPACE_DELAY = 0.2;
export const MAX_SPEED = 1000;
export const MAX_ROTATION = Math.PI * 1.5;
export const ACCELERATION = 1600; // 1500
export const ROTATION_ACCELERATION = Math.PI * 12;
export const FRICTION = 500; // 500
export const ROTATION_FRICTION = Math.PI * 12;
export const RECOIL = 80;
export const INVULNERABLE_TIME = 2;
export const SHIP_HITAREA = new Polygon(
    { x: 20, y: 30 },
    { x: 0, y: -30 },
    { x: -20, y: 30 },
    { x: -7, y: 16 },
    { x: 7, y: 16 },
);

export const SHIP_PROJECTILE_SPEED = 1000;
export const PROJECTILE_LIFETIME = 800; // pixels, not time

export const ASTEROID_GENERATION_COUNT = 3;
export const ASTEROID_CHILDREN_COUNT = 2;
export const ASTEROID_GENERATION_SIZES = [1, 0.6, 0.3] as const;
export const ASTEROID_GENERATION_SCORES = [20, 50, 100] as const;
export const ASTEROID_GENERATION_SPEEDS = [
    [80, 120],
    [130, 170],
    [180, 220],
] as const;
export const INITIAL_ASTEROID_COUNT = 4;
export const MAX_ASTEROID_COUNT = 8;
export const ASTEROID_COUNT_INCREASE_PER_LEVEL = 1; // Can also be < 1
export const ASTEROID_MODEL_HITAREAS = [
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

export type UFOType = "small" | "large";
export const UFO_SPAWN_TIME = [8, 24] as const;
export const UFO_DISTRIBUTION: Readonly<{ [Key in UFOType]: { easy: number, hard: number } }> = {
    large: { easy: 0.8, hard: 0.1 },
    small: { easy: 0.2, hard: 0.9 },
};
export const UFO_HARD_DISTRIBUTION_SCORE = 40000;
export const UFO_SIZES: Readonly<{ [Key in UFOType]: number }> = {
    large: 1.0,
    small: 0.6,
};
export const UFO_SPEEDS: Readonly<{ [Key in UFOType]: number }> = {
    large: 175,
    small: 225,
};
export const UFO_SCORES: Readonly<{ [Key in UFOType]: number }> = {
    large: 200,
    small: 1000,
};
export const UFO_PROJECTILE_SPEEDS: Readonly<{ [Key in UFOType]: number }> = {
    large: 800,
    small: 1000,
};
export const UFO_FIRE_INTERVALS: Readonly<{ [Key in UFOType]: readonly [number, number] }> = {
    large: [0.5, 1.5] as const,
    small: [0.5, 1.5] as const,
};
export const UFO_SHIFT_INTERVALS: Readonly<{ [Key in UFOType]: readonly [number, number] }> = {
    large: [1.5, 3] as const,
    small: [0.75, 2] as const,
};
export const UFO_SHIFT_AMOUNTS: Readonly<{ [Key in UFOType]: readonly [number, number] }> = {
    large: [100, 400] as const,
    small: [150, 500] as const,
};
export const UFO_INACCURACY = { easy: 0.25, hard: 0 } as const; // +/- radians
export const UFO_HARD_INACCURACY_SCORE = 50000;
export const UFO_HITAREA = new Polygon(
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

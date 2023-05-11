import { Asteroid } from "./Asteroid";
import { Projectile } from "./Projectile";
import { Ship } from "./Ship";
import { UFO } from "./UFO";

export interface GameEvents {
    reset: () => void;
    beforeStart: () => void;
    started: () => void;
    finished: () => void;
    scoreChanged: (score: number) => void;
    livesChanged: (lives: number) => void;
    levelChanged: (level: number) => void;
    shipCreated: (ship: Ship) => void;
    shipDestroyed: (ship: Ship, hit: boolean) => void;
    ufoCreated: (ufo: UFO) => void;
    ufoDestroyed: (ufo: UFO, hit: boolean, scored: boolean) => void;
    asteroidsCreated: (asteroids: Asteroid[]) => void;
    asteroidDestroyed: (asteroid: Asteroid, hit: boolean, scored: boolean) => void;
    projectileCreated: (projectile: Projectile) => void;
    projectileDestroyed: (projectile: Projectile, hit: boolean) => void;
}

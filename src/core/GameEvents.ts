import { Asteroid } from "./Asteroid";
import { Projectile } from "./Projectile";
import { Ship } from "./Ship";
import { UFO } from "./UFO";

export interface GameEvents {
    reset: () => void;
    beforeStart: () => void;
    started: () => void;
    paused: () => void;
    resumed: () => void;
    finished: () => void;
    shipCreated: (ship: Ship) => void;
    shipDestroyed: (ship: Ship) => void;
    ufoCreated: (ufo: UFO) => void;
    ufoDestroyed: (ufo: UFO, scored: boolean) => void;
    asteroidsCreated: (asteroids: Asteroid[]) => void;
    asteroidDestroyed: (asteroid: Asteroid, scored: boolean, willCreateChildren: boolean) => void;
    projectileCreated: (projectile: Projectile) => void;
    projectileDestroyed: (projectile: Projectile) => void;
}

import { Asteroid } from "./Asteroid";
import { Projectile } from "./Projectile";
import { Ship } from "./Ship";
import { UFO } from "./UFO";

export interface GameEvents {
    startScreenFadeOut: () => void;
    preStart: () => void;
    start: () => void;
    pause: () => void;
    resume: () => void;
    finished: () => void;
    shipCreated: (ship: Ship) => void;
    shipDestroyed: (ship: Ship) => void;
    ufoCreated: (ufo: UFO) => void;
    ufoDestroyed: (ufo: UFO) => void;
    asteroidsCreated: (asteroids: Asteroid[]) => void;
    asteroidDestroyed: (asteroid: Asteroid, willCreateChildren: boolean) => void;
    projectileCreated: (projectile: Projectile) => void;
    projectileDestroyed: (projectile: Projectile) => void;
}

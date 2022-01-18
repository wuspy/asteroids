import { Asteroid } from "./Asteroid";
import { Projectile } from "./Projectile";
import { Ship } from "./Ship";
import { Theme } from "./Theme";
import { UFO } from "./UFO";

export interface GameEvents {
    reset: () => void;
    startRequested: () => void;
    restartRequested: () => void;
    pauseRequested: () => void;
    resumeRequested: () => void;
    started: () => void;
    paused: () => void;
    resumed: () => void;
    finished: () => void;
    themeChanged: (theme: Theme) => void;
    shipCreated: (ship: Ship) => void;
    shipDestroyed: (ship: Ship) => void;
    ufoCreated: (ufo: UFO) => void;
    ufoDestroyed: (ufo: UFO) => void;
    asteroidsCreated: (asteroids: Asteroid[]) => void;
    asteroidDestroyed: (asteroid: Asteroid, willCreateChildren: boolean) => void;
    projectileCreated: (projectile: Projectile) => void;
    projectileDestroyed: (projectile: Projectile) => void;
}

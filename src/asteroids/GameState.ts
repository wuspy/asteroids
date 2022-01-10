import { Asteroid } from "./Asteroid";
import { Projectile } from "./Projectile";
import { Ship } from "./Ship";
import { Theme } from "./Theme";
import { UFO } from "./UFO";

export type GameStatus = "init" | "running" | "paused" | "finished";

export interface GameState {
    level: number;
    score: number;
    lives: number;
    status: GameStatus;
    timestamp: number;
    theme: Theme;
    ship?: Ship;
    asteroids: Asteroid[];
    projectiles: Projectile[];
    ufos: UFO[];
}

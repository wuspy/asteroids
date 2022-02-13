import { Asteroid } from "./Asteroid";
import { Projectile } from "./Projectile";
import { Ship } from "./Ship";
import { UFO } from "./UFO";

export type GameStatus = "init" | "running" | "finished" | "destroyed";

export interface GameState {
    level: number;
    score: number;
    lives: number;
    status: GameStatus;
    timestamp: number;
    ship?: Ship;
    asteroids: Asteroid[];
    projectiles: Projectile[];
    ufos: UFO[];
}

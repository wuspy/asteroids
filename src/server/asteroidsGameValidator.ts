import { AsteroidsGame, inputLogConfig, GameState, GameStatus } from "../core";
import { seedRandom, parseGameLog } from "../core/engine";

const [V_MAJOR, V_MINOR, V_PATCH] = process.env.npm_package_version!.split(".");

export const enum GameValidatorError {
    InvalidRandomSeed,
    EmptyLog,
    LogParseError,
    PrematureEndOfLog,
    ScoreMismatch,
    LevelMismatch,
    VersionMismatch,
}

export type GameValidatorResult = {
    success: true;
    duration: number;
    shotsFired: number;
    accuracy: number;
    asteroidsDestroyed: number;
    largeUfosDestroyed: number;
    smallUfosDestroyed: number;
} | {
    success: false;
    error: GameValidatorError;
    state?: GameState;
};

export interface GameValidatorRequest {
    version: string;
    randomSeed: number[];
    log: Buffer;
    score: number;
    level: number;
}

export const validateAsteroidsGame = (request: GameValidatorRequest, allowVersionMismatch = false): GameValidatorResult => {
    const [major, minor, patch] = request.version.split(".");

    if (!allowVersionMismatch && (major !== V_MAJOR || minor !== V_MINOR)) {
        return { success: false, error: GameValidatorError.VersionMismatch };
    }

    const game = new AsteroidsGame();

    let shotsFired = 0;
    let shotsHit = 0;
    let asteroidsDestroyed = 0;
    let largeUfosDestroyed = 0;
    let smallUfosDestroyed = 0;

    game.events.on("projectileCreated", undefined, (projectile) => projectile.from === game.state.ship && ++shotsFired);
    game.events.on("projectileDestroyed", undefined, (projectile, hit) => projectile.from === game.state.ship && hit && ++shotsHit);
    game.events.on("asteroidDestroyed", undefined, (asteroid, scored) => scored && ++asteroidsDestroyed);
    game.events.on("ufoDestroyed", undefined, (ufo, scored) => {
        if (scored) {
            if (ufo.type === "large") {
                ++largeUfosDestroyed;
            } else {
                ++smallUfosDestroyed;
            }
        }
    });

    try {
        if (!seedRandom(request.randomSeed)) {
            return { success: false, error: GameValidatorError.InvalidRandomSeed };
        }
        const parser = parseGameLog(request.log, inputLogConfig);
        let frame = parser.next();
        if (frame.done) {
            return { success: false, error: GameValidatorError.EmptyLog, state: game.state };
        }
        const worldSize = frame.value[1];
        game.worldSize.width = worldSize.width;
        game.worldSize.height = worldSize.height;

        game.start();

        frame = parser.next();
        while (!frame.done) {
            const [elapsed, worldSize, input] = frame.value;
            game.worldSize.width = worldSize.width;
            game.worldSize.height = worldSize.height;
            game.tick(elapsed, input);
            frame = parser.next();
            if (game.state.status === GameStatus.Finished) {
                break;
            }
        }
        if (!frame.done) {
            return { success: false, error: GameValidatorError.PrematureEndOfLog, state: game.state, };
        }
        if (game.state.score !== request.score) {
            return { success: false, error: GameValidatorError.ScoreMismatch, state: game.state };
        }
        if (game.state.level !== request.level) {
            return { success: false, error: GameValidatorError.LevelMismatch, state: game.state };
        }
        return {
            success: true,
            duration: game.state.timestamp,
            shotsFired,
            accuracy: shotsHit / shotsFired,
            asteroidsDestroyed,
            largeUfosDestroyed,
            smallUfosDestroyed,
        };
    } catch (e) {
        return {
            success: false,
            error: GameValidatorError.LogParseError,
        };
    }
}

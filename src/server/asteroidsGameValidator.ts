import { AsteroidsGame, inputLogConfig, GameState, GameStatus } from "@core";
import { seedRandom, parseGameLog } from "@core/engine";
import { SaveGameRequest } from "@core/api";
import { ValidUnsavedGame } from "./ValidUnsavedGame";

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
    game: ValidUnsavedGame;
} | {
    success: false;
    error: GameValidatorError;
    state?: GameState;
};

export const validateAsteroidsGame = (request: SaveGameRequest, randomSeed: string): GameValidatorResult => {
    const [major, minor, patch] = request.version.split(".");

    if (major !== V_MAJOR || minor !== V_MINOR) {
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
        if (!seedRandom(randomSeed)) {
            return { success: false, error: GameValidatorError.InvalidRandomSeed };
        }
        const parser = parseGameLog(request.log, inputLogConfig);
        let frame = parser.next();
        if (frame.done) {
            return { success: false, error: GameValidatorError.EmptyLog, state: game.state };
        }
        const [elapsed, worldSize] = frame.value;
        if (elapsed !== 0 || worldSize.width === 0 || worldSize.height === 0) {
            return { success: false, error: GameValidatorError.LogParseError, state: game.state };
        }
        game.worldSize.width = worldSize.width;
        game.worldSize.height = worldSize.height;

        game.start();

        frame = parser.next();
        while (!frame.done) {
            const [elapsed, worldSize, input] = frame.value;
            game.worldSize.width = worldSize.width;
            game.worldSize.height = worldSize.height;
            if (elapsed === 0 || worldSize.width === 0 || worldSize.height === 0) {
                return { success: false, error: GameValidatorError.LogParseError };
            }
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
            game: {
                ...request,
                duration: game.state.timestamp,
                shotsFired,
                accuracy: shotsHit / shotsFired,
                asteroidsDestroyed,
                largeUfosDestroyed,
                smallUfosDestroyed,
            }
        };
    } catch (e) {
        return {
            success: false,
            error: GameValidatorError.LogParseError,
        };
    }
}

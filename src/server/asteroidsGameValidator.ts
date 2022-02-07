import { AsteroidsGame, inputLogConfig } from "@core";
import { seedRandom, parseGameLog } from "@core/engine";
import { SaveGameRequest } from "@core/api";
import { ValidUnsavedGame } from "./ValidUnsavedGame";

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
};

export const validateAsteroidsGame = (request: SaveGameRequest, randomSeed: string): GameValidatorResult => {
    if (request.version !== process.env.npm_package_version) {
        return { success: false, error: GameValidatorError.VersionMismatch };
    }

    const game = new AsteroidsGame();

    let shotsFired = 0;
    let asteroidsDestroyed = 0;
    let largeUfosDestroyed = 0;
    let smallUfosDestroyed = 0;

    game.events.on("projectileCreated", undefined, (projectile) => projectile.from === game.state.ship && ++shotsFired);
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
            return { success: false, error: GameValidatorError.EmptyLog };
        }
        const [elapsed, worldSize] = frame.value;
        if (elapsed !== 0 || worldSize.width === 0 || worldSize.height === 0) {
            return { success: false, error: GameValidatorError.LogParseError };
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
            if (game.state.status === "finished") {
                break;
            }
        }
        if (!frame.done) {
            return { success: false, error: GameValidatorError.PrematureEndOfLog };
        }
        if (game.state.score !== request.score) {
            return { success: false, error: GameValidatorError.ScoreMismatch };
        }
        if (game.state.level !== request.level) {
            return { success: false, error: GameValidatorError.LevelMismatch };
        }
        return {
            success: true,
            game: {
                ...request,
                duration: game.state.timestamp,
                shotsFired,
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

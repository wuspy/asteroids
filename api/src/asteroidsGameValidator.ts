import {
    AsteroidsGame,
    GameState,
    GameStatus,
    createRandom,
    inputLogConfig,
    parseGameLog
} from "@wuspy/asteroids-core";

export const enum GameValidatorError {
    InvalidRandomSeed,
    EmptyLog,
    LogParseError,
    PrematureEndOfLog,
    ScoreMismatch,
    LevelMismatch,
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

export const validateAsteroidsGame = (request: GameValidatorRequest): GameValidatorResult => {
    const game = new AsteroidsGame();

    let shotsFired = 0;
    let shotsHit = 0;
    let asteroidsDestroyed = 0;
    let largeUfosDestroyed = 0;
    let smallUfosDestroyed = 0;

    game.events.on("projectileCreated", (projectile) => projectile.from === game.state.ship && ++shotsFired);
    game.events.on("projectileDestroyed", (projectile, hit) =>
        projectile.from === game.state.ship && hit && ++shotsHit
    );
    game.events.on("asteroidDestroyed", (asteroid, scored) => scored && ++asteroidsDestroyed);
    game.events.on("ufoDestroyed", (ufo, scored) => {
        if (scored) {
            if (ufo.type === "large") {
                ++largeUfosDestroyed;
            } else {
                ++smallUfosDestroyed;
            }
        }
    });

    try {
        game.random = createRandom(request.randomSeed);
    } catch {
        return { success: false, error: GameValidatorError.InvalidRandomSeed };
    }

    try {
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
    } catch {
        return {
            success: false,
            error: GameValidatorError.LogParseError,
        };
    }
}

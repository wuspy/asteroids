import config from "../config";
import { Kysely, PostgresDialect } from "kysely";
import { ValidUnsavedGame } from "../models/ValidUnsavedGame";
import { Database } from "./schema";
import { Game, GameToken, HighScore } from "../models";
import { bufferToUintArray, uintArrayToBuffer } from "./util";

const db = new Kysely<Database>({
    dialect: new PostgresDialect({
        database: "asteroids",
        user: config.dbUsername,
        host: config.dbHostname,
        password: config.dbPassword,
        port: config.dbPort,
        ssl: config.dbSsl,
    }),
});

console.log(`Connected to database at ${config.dbHostname}:${config.dbPort}`);

export const destroyConnection = () => db.destroy();

export const findHighScores = async (): Promise<HighScore[]> =>
    await db.selectFrom("game")
        .select([
            "game_id as id",
            "player_name as name",
            "score",
            "level_reached as level",
            "duration",
            "shots_fired as shots",
            "asteroids_destroyed as asteroids",
            "large_ufos_destroyed as ufos",
            "accuracy"
        ])
        .where("deleted", "=", false)
        .orderBy("score", "desc")
        .orderBy("time_added", "asc")
        .limit(999)
        .execute();

export const findGame = async (id: number): Promise<Game | undefined> =>
    await db.selectFrom("game")
        .innerJoin("game_token", "game_token.game_token_id", "game.game_token_id")
        .select([
            "game_id as id",
            "player_name as playerName",
            "score",
            "level_reached as level",
            "duration",
            "shots_fired as shotsFired",
            "accuracy",
            "large_ufos_destroyed as largeUfosDestroyed",
            "small_ufos_destroyed as smallUfosDestroyed",
            "asteroids_destroyed as asteroidsDestroyed",
            "game_version as version",
            "game.time_added as timeAdded",
            "random_seed as randomSeed",
        ])
        .where("game_id", "=", id)
        .where("deleted", "=", false)
        .executeTakeFirst()
        .then((row) => !row ? undefined : {
            ...row,
            randomSeed: bufferToUintArray(row.randomSeed, 4),
        });

export const findGameLog = async (id: number): Promise<Buffer | undefined> =>
    await db.selectFrom("game")
        .innerJoin("game_token", "game_token.game_token_id", "game.game_token_id")
        .select("game_log")
        .where("game_id", "=", id)
        .where("deleted", "=", false)
        .executeTakeFirst()
        .then((row) => !row ? undefined : row.game_log);

export const findUnusedGameToken = async (id: number): Promise<GameToken | undefined> =>
    await db.selectFrom("game_token")
        .select([
            "game_token_id as id",
            "random_seed as randomSeed",
        ])
        .where("game_token_id", "=", id)
        .whereNotExists((qb) => qb
            .selectFrom("game")
            .select("game.game_id")
            .whereRef("game.game_token_id", "=", "game_token.game_token_id")
        )
        .executeTakeFirst()
        .then((row) => !row ? undefined : {
            ...row,
            randomSeed: bufferToUintArray(row.randomSeed, 4),
        });

export const createGameToken = async (randomSeed: number[]): Promise<{ id: number, timeAdded: string }> =>
    await db.insertInto("game_token")
        .values({
            random_seed: uintArrayToBuffer(randomSeed, 4),
        })
        .returning([
            "game_token_id as id",
            "time_added as timeAdded",
        ])
        .executeTakeFirstOrThrow();

export const storeGame = async (game: ValidUnsavedGame): Promise<{ id: number, timeAdded: string }> =>
    await db.insertInto("game")
        .values({
            player_name: game.playerName,
            game_token_id: game.tokenId,
            score: game.score,
            level_reached: game.level,
            duration: Math.round(game.duration),
            shots_fired: game.shotsFired,
            accuracy: game.accuracy,
            large_ufos_destroyed: game.largeUfosDestroyed,
            small_ufos_destroyed: game.smallUfosDestroyed,
            asteroids_destroyed: game.asteroidsDestroyed,
            game_log: game.log,
            game_version: game.version,
        })
        .returning([
            "game_id as id",
            "time_added as timeAdded",
        ])
        .executeTakeFirstOrThrow();

import config from "../config";
import Knex from "knex";
import { GameResponse, GameTokenResponse, HighScoreResponse } from "@core/api";
import { ValidUnsavedGame } from "../ValidUnsavedGame";

const knex = Knex({
    client: "pg",
    connection: {
        database: "asteroids",
        user: config.dbUsername,
        host: config.dbHostname,
        password: config.dbPassword,
        port: config.dbPort,
        ssl: config.dbSsl,
    }
});
console.log(`Connected to database at ${config.dbHostname}:${config.dbPort}`);

export const destroyConnection = () => knex.destroy();

export const findHighScores = async (): Promise<HighScoreResponse[]> =>
    await knex("game")
        .select({
            id: "game_id",
            name: "player_name",
            score: "score",
            level: "level_reached",
            duration: "duration",
            shots: "shots_fired",
            asteroids: "asteroids_destroyed",
            ufos: knex.raw("large_ufos_destroyed + small_ufos_destroyed"),
            accuracy: "accuracy",
        })
        .where({ deleted: false })
        .orderBy("score", "desc")
        .orderBy("time_added", "asc")
        .limit(999);

export const findGame = async (id: number): Promise<GameResponse | undefined> =>
    await knex("game")
        .select({
            id: "game_id",
            playerName: "player_name",
            score: "score",
            level: "level_reached",
            duration: "duration",
            shotsFired: "shots_fired",
            accuracy: "accuracy",
            largeUfosDestroyed: "large_ufos_destroyed",
            smallUfosDestroyed: "small_ufos_destroyed",
            asteroidsDestroyed: "asteroids_destroyed",
            log: "game_log",
            version: "game_version",
            timeAdded: "game.time_added",
            randomSeed: "random_seed",
        })
        .innerJoin("game_token", "game_token.game_token_id", "=", "game.game_token_id")
        .where({
            game_id: id,
            deleted: false,
        })
        .first();

export const findUnusedGameToken = async (id: number): Promise<GameTokenResponse | undefined> =>
    await knex("game_token")
        .select({
            id: "game_token_id",
            randomSeed: "random_seed",
        })
        .where({ game_token_id: id })
        .whereNotExists((qb) => qb
            .select("*")
            .from("game")
            .where("game.game_token_id", "=", knex.ref("game_token.game_token_id"))
        )
        .first();

export const createGameToken = async (randomSeed: string): Promise<{ id: number, timeAdded: string }> =>
    await knex("game_token")
        .insert({
            random_seed: randomSeed,
        })
        .returning(["game_token_id", "time_added"])
        .then(([{ game_token_id, time_added }]) => ({
            id: game_token_id,
            timeAdded: time_added,
        }));

export const storeGame = async (game: ValidUnsavedGame): Promise<{ id: number, timeAdded: string }> =>
    await knex("game")
        .insert({
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
        .returning(["game_id", "time_added"])
        .then(([{ game_id, time_added }]) => ({
            id: game_id,
            timeAdded: time_added,
        }));

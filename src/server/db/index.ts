import config from "../config";
import Knex from "knex";
import { GameResponse, GameTokenResponse, HighScoreResponse } from "@core/api";
import { GameSchema, GameTokenSchema, PlayerNameFilterSchema } from "./schema";
import { ValidUnsavedGame } from "../ValidUnsavedGame";
import { PlayerNameFilterAction } from "../PlayerNameFilterAction";

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

export const findPlayerNameFilters = async (maxLength: number): Promise<{ phrase: string, action: PlayerNameFilterAction }[]> =>
    await knex<PlayerNameFilterSchema>("player_name_filter")
        .select("phrase", "action")
        .where("length(phrase)", "<=", maxLength)
        .orderBy("action", "asc");

export const findHighScores = async (): Promise<HighScoreResponse[]> =>
    await knex<GameSchema>("game")
        .select(
            knex.ref("game_id").as("id"),
            knex.ref("player_name").as("playerName"),
            knex.ref("score"),
            knex.ref("level_reached").as("level"),
            knex.ref("time_added").as("timeAdded"),
        )
        .where({ deleted: false })
        .orderBy("score", "desc")
        .orderBy("timestamp", "asc")
        .limit(999);

export const findGame = async (id: number): Promise<GameResponse | undefined> =>
    await knex<GameSchema>("game")
        .select(
            knex.ref("game_id").as("id"),
            knex.ref("player_name").as("playerName"),
            knex.ref("score"),
            knex.ref("level_reached").as("level"),
            knex.ref("duration"),
            knex.ref("shots_fired").as("shotsFired"),
            knex.ref("large_ufos_destroyed").as("largeUfosDestroyed"),
            knex.ref("small_ufos_destroyed").as("smallUfosDestroyed"),
            knex.ref("asteroids_destroyed").as("asteroidsDestroyed"),
            knex.ref("game_log").as("log"),
            knex.ref("game_version").as("version"),
            knex.ref("time_added").withSchema("game").as("timeAdded"),
            knex.ref("random_seed").as("randomSeed"),
        )
        .innerJoin<GameTokenSchema>("game_token", "game_token.game_token_id", "=", "game.game_token_id")
        .where({
            game_id: id,
            deleted: false,
        })
        .first();

export const findUnusedGameToken = async (id: number): Promise<GameTokenResponse | undefined> =>
    await knex<GameTokenSchema>("game_token")
        .select(
            knex.ref("game_token_id").as("id"),
            knex.ref("random_seed").as("randomSeed"),
            knex.ref("time_added").as("timeAdded"),
        )
        .where({ game_token_id: id })
        .whereNotExists((qb) => qb
            .select("*")
            .from("game")
            .where("game.game_token_id", "=", knex.ref("game_token.game_token_id"))
        )
        .first();

export const createGameToken = async (randomSeed: string): Promise<{ id: number, timeAdded: string }> =>
    await knex<GameTokenSchema>("game_token")
        .insert({
            random_seed: randomSeed,
        })
        .returning(["game_token_id", "time_added"])
        .then(([{ game_token_id, time_added }]) => ({
            id: game_token_id,
            timeAdded: time_added,
        }));

export const storeGame = async (game: ValidUnsavedGame): Promise<{ id: number, timeAdded: string }> =>
    await knex<GameSchema>("game")
        .insert({
            player_name: game.playerName,
            game_token_id: game.tokenId,
            score: game.score,
            level_reached: game.level,
            duration: Math.round(game.duration),
            shots_fired: game.shotsFired,
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

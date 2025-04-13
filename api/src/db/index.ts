import { InsertResult } from "kysely";
import config from "../config";
import db from "./connection";
import { Game, GameToken } from "../models";
import { ValidUnsavedGame } from "../models/ValidUnsavedGame";
import { PlayerNameFilterAction } from "./schema";
import { bufferToUintArray, uintArrayToBuffer } from "./util";
import { HighScoreResponse } from "@wuspy/asteroids-core";

export {default as db} from "./connection";

export const findHighScores = async (): Promise<HighScoreResponse[]> =>
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
        .limit(config.ASTEROIDS_HIGH_SCORE_LIMIT)
        .execute();

const selectGames = () =>
    db.selectFrom("game")
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
        .where("deleted", "=", false);

export const findGame = async (id: number): Promise<Omit<Game, "log"> | undefined> =>
    await selectGames()
        .where("game_id", "=", id)
        .executeTakeFirst()
        .then((row) => !row ? undefined : {
            ...row,
            randomSeed: bufferToUintArray(row.randomSeed, 4),
        });

export const findAllGames = async (offset: number, limit: number): Promise<Game[]> =>
    await selectGames()
        .select("game_log as log")
        .offset(offset)
        .limit(limit)
        .execute()
        .then((result) => result.map((row) => ({
            ...row,
            randomSeed: bufferToUintArray(row.randomSeed, 4),
        })));

export const findGameLog = async (id: number): Promise<Buffer | undefined> =>
    await db.selectFrom("game")
        .innerJoin("game_token", "game_token.game_token_id", "game.game_token_id")
        .select("game_log")
        .where("game_id", "=", id)
        .where("deleted", "=", false)
        .executeTakeFirst()
        .then((row) => row?.game_log);

export const findUnusedGameToken = async (id: number): Promise<GameToken | undefined> =>
    await db.selectFrom("game_token")
        .select([
            "game_token_id as id",
            "random_seed as randomSeed",
        ])
        .where("game_token_id", "=", id)
        .where(({ not, exists, selectFrom }) => not(exists(
            selectFrom("game")
                .select("game.game_id")
                .whereRef("game.game_token_id", "=", "game_token.game_token_id")
        )))
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

export const storeGame = async (game: ValidUnsavedGame, deleted = false): Promise<number> =>
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
            deleted,
        })
        .returning([
            "game_id as id"
        ])
        .executeTakeFirstOrThrow()
        .then(({id}) => id)

export const storeReservedPlayerName = async (playerName: string, password: string): Promise<InsertResult> =>
    await db.insertInto("reserved_player_name")
        .values({
            player_name: playerName,
            passwd: password
        })
        .executeTakeFirstOrThrow();

export const findReservedPlayerNames = async (): Promise<{ [Key in string]: string }> =>
    await db.selectFrom("reserved_player_name")
        .select(["player_name", "passwd"])
        .execute()
        .then((result) => result.reduce((obj, row) => {
            obj[row.player_name] = row.passwd;
            return obj;
        }, <{ [Key in string]: string }>{}))

export const storePlayerNameFilter = async (phrase: string, action: PlayerNameFilterAction): Promise<InsertResult> =>
    await db.insertInto("player_name_filter")
        .values({
            phrase,
            filter_action: action
        })
        .executeTakeFirstOrThrow()

export const findPlayerNameFilters = async (): Promise<{ [Key in string]: PlayerNameFilterAction }> =>
    await db.selectFrom("player_name_filter")
        .select(["phrase", "filter_action"])
        .orderBy("filter_action", "asc")
        .execute()
        .then((result) => result.reduce((obj, row) => {
            obj[row.phrase] = row.filter_action;
            return obj;
        }, <{ [Key in string]: PlayerNameFilterAction }>{}))

import { Generated, ColumnType } from "kysely";

type TimeAdded = ColumnType<string, never, never>;

export interface GameTokenTable {
    game_token_id: Generated<number>;
    random_seed: Buffer;
    time_added: TimeAdded;
}

export interface GameTable {
    game_id: Generated<number>;
    game_token_id: number;
    player_name: string;
    score: number;
    level_reached: number
    duration: number
    shots_fired: number;
    large_ufos_destroyed: number;
    small_ufos_destroyed: number;
    asteroids_destroyed: number;
    accuracy: number;
    game_log: Buffer;
    game_version: string;
    time_added: TimeAdded;
    deleted: Generated<boolean>;
}

export interface ReservedPlayerNameTable {
    player_name: string;
    passwd: string;
    time_added: TimeAdded;
}

export const enum PlayerNameFilterAction {
    WhitelistExactMatch = 0,
    BlacklistExactMatch,
    BlacklistContains,
}

export interface PlayerNameFilterTable {
    phrase: string;
    filter_action: PlayerNameFilterAction;
    time_added: TimeAdded;
}

export interface Database {
    game: GameTable;
    game_token: GameTokenTable;
    player_name_filter: PlayerNameFilterTable;
    reserved_player_name: ReservedPlayerNameTable;
}

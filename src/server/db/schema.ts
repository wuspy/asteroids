import { Generated, ColumnType } from "kysely";

export interface GameTokenTable {
    game_token_id: Generated<number>;
    random_seed: Buffer;
    time_added: ColumnType<string, never, never>;
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
    time_added: ColumnType<string, never, never>;
    deleted: Generated<boolean>;
}

export interface Database {
    game: GameTable;
    game_token: GameTokenTable;
}

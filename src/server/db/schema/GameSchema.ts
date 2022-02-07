export interface GameSchema {
    game_id: number;
    game_token_id: number;
    player_name: string;
    score: number;
    level_reached: number;
    duration: number;
    shots_fired: number;
    large_ufos_destroyed: number;
    small_ufos_destroyed: number;
    asteroids_destroyed: number;
    game_log: string;
    game_version: string;
    time_added: string;
    deleted: boolean;
}

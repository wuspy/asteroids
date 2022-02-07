drop table if exists game;

create table game (
    game_id                 serial primary key,
    game_token_id           int not null,
    player_name             varchar(15) not null,
    score                   int not null,
    level_reached           int not null,
    duration                int not null,
    shots_fired             int not null,
    large_ufos_destroyed    int not null,
    small_ufos_destroyed    int not null,
    asteroids_destroyed     int not null,
    game_log                text not null,
    game_version            varchar(12) not null,
    time_added              timestamp without time zone not null default (now() at time zone 'utc'),
    deleted                 boolean not null default false,
    constraint fk_game_token_id
        foreign key (game_token_id)
        references game_token(game_token_id)
);

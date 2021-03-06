create table game_token (
    game_token_id   serial primary key,
    random_seed     bytea not null,
    time_added      timestamp without time zone default (now() at time zone 'utc') not null
);

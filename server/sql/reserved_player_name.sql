create table reserved_player_name (
    player_name     varchar(15) not null primary key,
    passwd          text not null,
    time_added      timestamp without time zone not null default (now() at time zone 'utc')
);

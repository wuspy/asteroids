create table player_name_filter (
    phrase          varchar(15) not null primary key,
    filter_action   smallint not null,
    time_added      timestamp without time zone not null default (now() at time zone 'utc')
);

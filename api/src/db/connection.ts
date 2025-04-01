import { Kysely, PostgresDialect } from "kysely";
import { Database } from "./schema";
import { Pool } from "pg";
import config from "../config";

const connection = new Kysely<Database>({
    dialect: new PostgresDialect({
        pool: new Pool({
            database: "asteroids",
            user: config.ASTEROIDS_DB_USER,
            host: config.ASTEROIDS_DB_HOST,
            password: config.ASTEROIDS_DB_PASS,
            port: config.ASTEROIDS_DB_PORT,
            ssl: config.ASTEROIDS_DB_SSL,
        }),
    })
});

export default connection;

import { bool, cleanEnv, host, port, str, num } from "envalid";

const config = cleanEnv(process.env, {
    ASTEROIDS_DB_HOST: host({ devDefault: "192.168.1.2" }),
    ASTEROIDS_DB_PORT: port({ default: 5432 }),
    ASTEROIDS_DB_USER: str({ devDefault: "user" }),
    ASTEROIDS_DB_PASS: str({ devDefault: "password" }),
    ASTEROIDS_DB_SSL: bool({ default: true, devDefault: false }),
    ASTEROIDS_TRUST_PROXY: bool({ default: false }),
    ASTEROIDS_HIGH_SCORE_LIMIT: num({ default: 999 }),
    ASTEROIDS_LOG: bool({ default: false, devDefault: true }),
    ASTEROIDS_SAVE_FAILED_GAMES: bool({ default: false, devDefault: true }),
});

export type ServerConfig = typeof config;

export default config;

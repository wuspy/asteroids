export interface ServerConfig {
    port: number;
    dbHostname: string;
    dbPort: number;
    dbUsername: string;
    dbPassword: string;
    dbSsl: boolean;
    trustedProxies: string[];
}

const config: ServerConfig = process.env.NODE_ENV === "production"
    ? require("./config/production.json")
    : require("./config/development.json");

export default config;

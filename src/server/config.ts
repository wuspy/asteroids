import nodeConfig from "config";

export interface ServerConfig {
    port: number;
    dbHostname: string;
    dbPort: number;
    dbUsername: string;
    dbPassword: string;
    dbSsl: boolean;
}

const config: ServerConfig = {
    port: nodeConfig.get<number>("port"),
    dbHostname: nodeConfig.get<string>("dbHostname"),
    dbPort: nodeConfig.get<number>("dbPort"),
    dbUsername: nodeConfig.get<string>("dbUsername"),
    dbPassword: nodeConfig.get<string>("dbPassword"),
    dbSsl: nodeConfig.get<boolean>("dbSsl"),
};

export default config;

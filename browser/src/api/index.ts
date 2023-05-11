export { ApiErrorType } from "./request";
export type { ApiResponse } from "./request";
import { GameResponse, GameTokenResponse, HighScoreResponse, SaveGameRequest } from "@wuspy/asteroids-core";
import { ApiResponse, get, mapApiResponse, post } from "./request";

export const getHighScores = async (): Promise<ApiResponse<HighScoreResponse[]>> => get({
    url: "/api/leaderboard",
    accept: "application/json",
    timeout: 10000,
});

export const getGame = async (gameId: number): Promise<ApiResponse<GameResponse>> => get({
    url: `/api/game/${gameId}`,
    accept: "application/json",
    timeout: 10000,
});

export const getGameLog = async (gameId: number): Promise<ApiResponse<Uint8Array>> => mapApiResponse(
    get({
        url: `/api/game/${gameId}/log`,
        accept: "application/octet-stream",
        timeout: 30000,
    }),
    async (blob) => new Uint8Array(await blob.arrayBuffer())
);

export const getGameToken = async (): Promise<ApiResponse<GameTokenResponse>> => get({
    url: "/api/game-token",
    accept: "application/json",
    timeout: 4000,
});

export const saveGame = async (game: SaveGameRequest): Promise<ApiResponse<GameResponse>> => {
    const body = new FormData();
    body.append("playerName", game.playerName);
    if (game.playerNameAuth !== undefined) {
        body.append("playerNameAuth", game.playerNameAuth);
    }
    body.append("score", game.score.toFixed());
    body.append("level", game.level.toFixed());
    body.append("tokenId", game.tokenId.toFixed());
    body.append("version", game.version);
    body.append("log", new Blob([game.log]));
    return post({
        url: "/api/games",
        accept: "application/json",
        body,
        timeout: 30000,
    });
}

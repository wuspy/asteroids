export { ApiResponse, ApiErrorType } from "./request";
import { ApiResponse, get, mapApiResponse, post } from "./request";
import { GameResponse, HighScoreResponse, SaveGameRequest, GameTokenResponse } from "../../core/api";

export const getHighScores = async (
    apiRoot: string,
): Promise<ApiResponse<HighScoreResponse[]>> => get({
    url: `${apiRoot}/leaderboard`,
    accept: "application/json",
    timeout: 10000,
});

export const getGame = async (
    apiRoot: string,
    gameId: number,
): Promise<ApiResponse<GameResponse>> => get({
    url: `${apiRoot}/game/${gameId}`,
    accept: "application/json",
    timeout: 10000,
});

export const getGameLog = async (
    apiRoot: string,
    gameId: number,
): Promise<ApiResponse<Uint8Array>> => mapApiResponse(
    get({
        url: `${apiRoot}/game/${gameId}/log`,
        accept: "application/octet-stream",
        timeout: 30000,
    }),
    async (blob) => new Uint8Array(await blob.arrayBuffer())
);

export const getGameToken = async (
    apiRoot: string,
): Promise<ApiResponse<GameTokenResponse>> => get({
    url: `${apiRoot}/game-token`,
    accept: "application/json",
    timeout: 4000,
});

export const saveGame = async (
    apiRoot: string,
    game: SaveGameRequest,
): Promise<ApiResponse<GameResponse>> => {
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
        url: `${apiRoot}/games`,
        accept: "application/json",
        body,
        timeout: 30000,
    });
}

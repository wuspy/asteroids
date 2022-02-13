export { ApiResponse, ApiErrorType } from "./request";
import { ApiResponse, get, post } from "./request";
import { GameResponse, HighScoreResponse, SaveGameRequest, GameTokenResponse } from "@core/api";

export const getHighScores = async (
    apiRoot: string,
): Promise<ApiResponse<HighScoreResponse[]>> => get(`${apiRoot}/leaderboard`, 10000);

export const getGame = async (
    apiRoot: string,
    gameId: number,
): Promise<ApiResponse<GameResponse>> => get(`${apiRoot}/game/${gameId}`, 10000);

export const getGameToken = async (
    apiRoot: string,
): Promise<ApiResponse<GameTokenResponse>> => get(`${apiRoot}/game-token`, 4000);

export const saveGame = async (
    apiRoot: string,
    game: SaveGameRequest,
): Promise<ApiResponse<GameResponse>> => post(`${apiRoot}/games`, game, 10000);

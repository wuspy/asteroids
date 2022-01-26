import { ApiResponse, get, post } from "./request";
import { Game, HighScore, UnsavedGame } from "../../core/models";

export const getHighScores = async (): Promise<ApiResponse<HighScore[]>> => get("/api/high-scores");
export const getGame = async (gameId: number): Promise<ApiResponse<Game>> => get(`/api/games/${gameId}`);
export const saveGame = async (game: UnsavedGame): Promise<ApiResponse<Game>> => post("/api/games", game);

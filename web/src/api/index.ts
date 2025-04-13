import { GameResponse, GameTokenResponse, HighScoreResponse, SaveGameRequest } from "@wuspy/asteroids-core";
import { ApiResponse, createApi } from "./api";

const api = createApi(process.env.NODE_ENV === "development" ? "http://localhost:8080" : "");

export const getHighScores = async () =>
    api.json.get<HighScoreResponse[]>("/api/leaderboard", { timeout: 10000 });

export const getGame = async (gameId: number) =>
    api.json.get<GameResponse>(`/api/game/${gameId}`, { timeout: 10000 });

export const getGameLog = async (gameId: number) => {
    const response = await api.octetStream.get(`/api/game/${gameId}/log`, { timeout: 30000 });
    if (response.ok) {
        const data = await response.data.arrayBuffer();
        return {ok: true, status: response.status, data} as ApiResponse<typeof data, void>;
    } else {
        return response;
    }
};

export const getGameToken = async () =>
    api.json.get<GameTokenResponse>("/api/game-token", { timeout: 4000 });

export const saveGame = async (game: SaveGameRequest) => {
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

    return api.json.post<number, string>("/api/games", { body, timeout: 30000 });
}

export type { ApiResponse } from "./api";

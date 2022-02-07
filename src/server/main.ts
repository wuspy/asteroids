console.log(`Version ${process.env.npm_package_version}`);

import config from "./config";
import express from "express";
import bodyParser from "body-parser";
import { SaveGameRequest, SaveGameResponse, GameTokenResponse, HighScoreResponse, GameResponse } from "@core/api";
import { createRandomSeed } from "@core/engine";
import { validateAsteroidsGame } from "./asteroidsGameValidator";
import { createGameToken, destroyConnection, findGame, findHighScores, findUnusedGameToken, storeGame } from "./db";
import { validatePlayerName } from "./playerNameValidator";

const successResponse = <T>(data: T) => ({ ok: true, data });
const errorResponse = (message: string) => ({ ok: false, message });

const app = express();

if (process.env.NODE_ENV === "development") {
    // Static content isn't hosted through express in production
    app.use(express.static("public"));
}

app.use(
    bodyParser.json(),
    bodyParser.urlencoded({
        extended: true,
    }),
);

app.get("/api/game-token", async (request, response) => {
    const randomSeed = createRandomSeed();
    const { id } = await createGameToken(randomSeed);
    response.json(successResponse<GameTokenResponse>({ id, randomSeed }));
});

app.get("/api/leaderboard", async (request, response) => {
    response.json(successResponse<HighScoreResponse[]>(await findHighScores()));
});

app.get("/api/game/:id(\\d{1,10})", async (request, response) => {
    const id = parseInt(request.params.id + "", 10);
    const game = await findGame(id);
    if (game) {
        response.json(successResponse<GameResponse>(game));
    } else {
        response.sendStatus(404);
    }
});

app.post("/api/games", async (request, response) => {
    const { body } = request;
    const params: SaveGameRequest = {
        playerName: body.playerName,
        score: parseInt(body.score + "", 10),
        level: parseInt(body.level + "", 10),
        tokenId: parseInt(body.tokenId + "", 10),
        version: body.version,
        log: body.log,
    };

    if (typeof params.playerName !== "string"
        || typeof params.version !== "string"
        || typeof params.log !== "string"
        || isNaN(params.score)
        || isNaN(params.level)
        || isNaN(params.tokenId)
    ) {
        return response.sendStatus(400);
    }

    if (params.version !== process.env.npm_package_version) {
        return response.json(errorResponse("You're playing an old version of the game, so your score can't be saved."));
    }

    const token = await findUnusedGameToken(params.tokenId);
    if (!token) {
        return response.json(errorResponse("Invalid game token."));
    }

    const nameError = validatePlayerName(params.playerName);
    if (nameError) {
        return response.json(errorResponse(nameError));
    }

    const result = validateAsteroidsGame(params, token.randomSeed);
    if (result.success) {
        const { game } = result;
        const { id, timeAdded } = await storeGame(game);
        response.json(successResponse<SaveGameResponse>({ id, timeAdded }));
    } else {
        response.json(errorResponse("That score doesn't seem to be possible."));
    }
});

const server = app.listen(config.port, () => console.log(`Server listening on port: ${config.port}`));

const shutdown = () => {
    console.log("Shutting down");
    server.close(() => {
        destroyConnection();
    });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`Version ${process.env.npm_package_version}`);

import {
    GameResponse,
    GameTokenResponse,
    HighScoreResponse,
    SaveGameResponse,
    createRandomSeed,
    encodeIntArray
} from "@wuspy/asteroids-core";
import bodyParser from "body-parser";
import express from "express";
import morgan from "morgan";
import multer from "multer";
import { promisify } from "util";
import { validateAsteroidsGame } from "./asteroidsGameValidator";
import config from "./config";
import { createGameToken, destroyConnection, findGame, findGameLog, findHighScores, findUnusedGameToken, storeGame } from "./db";
import { SaveGameRequest } from "./models";
import { validatePlayerName } from "./playerNameValidator";

const successResponse = <T>(data: T) => ({ ok: true, data });
const errorResponse = (message: string) => ({ ok: false, message });

const app = express();
const upload = multer();

app.set("trust proxy", config.ASTEROIDS_TRUST_PROXY);

app.use(
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
);

if (config.ASTEROIDS_LOG) {
    app.use(morgan(":remote-addr - [:date[clf]] :method :url :status :res[content-length] - :response-time ms"));
}

app.get("/api/game-token", async (request, response) => {
    try {
        const randomSeed = createRandomSeed();
        const { id } = await createGameToken(randomSeed);
        response.json(successResponse<GameTokenResponse>({ id, randomSeed: encodeIntArray(randomSeed) }));
    } catch (e) {
        console.error(e);
        response.sendStatus(500);
    }
});

app.get("/api/leaderboard", async (request, response) => {
    try {
        response.json(successResponse<HighScoreResponse[]>(await findHighScores()));
    } catch (e) {
        console.error(e);
        response.sendStatus(500);
    }
});

app.get("/api/game/:id(\\d{1,10})", async (request, response) => {
    try {
        const id = parseInt(request.params.id + "", 10);
        const game = await findGame(id);
        if (game) {
            response.json(successResponse<GameResponse>({
                ...game,
                randomSeed: encodeIntArray(game.randomSeed)
            }));
        } else {
            response.sendStatus(404);
        }
    } catch (e) {
        console.error(e);
        response.sendStatus(500);
    }
});

app.get("/api/game/:id(\\d{1,10})/log", async (request, response) => {
    try {
        const id = parseInt(request.params.id + "", 10);
        const log = await findGameLog(id);
        if (log) {
            response.writeHead(200, {
                "Content-Type": "application/octet-stream",
                "Content-Length": log.byteLength,
            });
            response.end(log);
        } else {
            response.sendStatus(404);
        }
    } catch (e) {
        console.error(e);
        response.sendStatus(500);
    }
});

app.post("/api/games", upload.single("log"), async (request, response) => {
    try {
        const { body } = request;
        const log = request.file?.buffer;
        if (!log) {
            return response.sendStatus(400);
        }
        const params: SaveGameRequest = {
            playerName: body.playerName,
            playerNameAuth: body.playerNameAuth,
            score: parseInt(body.score + "", 10),
            level: parseInt(body.level + "", 10),
            tokenId: parseInt(body.tokenId + "", 10),
            version: body.version,
            log: request.file!.buffer,
        };

        if (typeof params.playerName !== "string"
            || !["undefined", "string"].includes(typeof params.playerNameAuth)
            || typeof params.version !== "string"
            || !params.log
            || isNaN(params.score)
            || isNaN(params.level)
            || isNaN(params.tokenId)
        ) {
            return response.sendStatus(400);
        }

        const token = await findUnusedGameToken(params.tokenId);
        if (!token) {
            return response.json(errorResponse("Invalid game token."));
        }

        const nameResult = await validatePlayerName(params.playerName, params.playerNameAuth);
        if (nameResult.ok) {
            params.playerName = nameResult.playerName;
        } else if ("unauthorized" in nameResult) {
            if (params.playerNameAuth !== undefined) {
                await promisify(setTimeout)(2000);
            }
            return response.sendStatus(401);
        } else {
            return response.json(errorResponse(nameResult.error));
        }

        const gameResult = validateAsteroidsGame({
            ...params,
            randomSeed: token.randomSeed,
        });
        if (gameResult.success) {
            response.json(successResponse<SaveGameResponse>(await storeGame({
                ...params,
                ...gameResult
            })));
        } else {
            if (config.ASTEROIDS_SAVE_FAILED_GAMES) {
                await storeGame({
                    ...params,
                    largeUfosDestroyed: -1,
                    smallUfosDestroyed: -1,
                    asteroidsDestroyed: -1,
                    shotsFired: -1,
                    accuracy: -1,
                    duration: -1,
                }, true);
            }
            response.json(errorResponse("That score doesn't seem to be possible."));
        }
    } catch (e) {
        console.error(e);
        response.sendStatus(500);
    }
});

if (process.env.NODE_ENV === "development") {
    console.log("Server is running in development move");
    const createViteProxy = async () => {
        const { existsSync } = await import("fs");
        if (existsSync("../web/dist")) {
            console.log("Serving static assets from web/dist");
            app.use(express.static("../web/dist"));
        } else {
            console.log("Proxying all non-API requests to Vite at http://localhost:8081");
            const { createProxyMiddleware } = await import("http-proxy-middleware");
            app.use(createProxyMiddleware({
                target: "http://localhost:8081",
                changeOrigin: true,
                ws: true,
            }));
        }
    };

    createViteProxy();
}

const server = app.listen(8080, "0.0.0.0", () => console.log("Server listening on port 8080"));

const shutdown = () => {
    console.log("Shutting down server");
    server.close(() => {
        console.log("Closing database connection");
        destroyConnection();
        console.log("Done");
    });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

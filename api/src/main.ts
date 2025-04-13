import { promisify } from "util";
import {
    GameResponse,
    GameTokenResponse,
    createRandomSeed,
    encodeIntArray
} from "@wuspy/asteroids-core";
import bodyParser from "body-parser";
import express from "express";
import morgan from "morgan";
import multer from "multer";
import { validateAsteroidsGame } from "./asteroidsGameValidator";
import config from "./config";
import {
    createGameToken,
    db,
    findGame,
    findGameLog,
    findHighScores,
    findReservedPlayerNames,
    findUnusedGameToken,
    storeGame
} from "./db";
import { SaveGameRequest } from "./models";
import { validatePlayerName } from "./playerNameValidator";
import * as log from "./log";

log.info(`---------- Version ${process.env.npm_package_version} ----------`);

const app = express();
const upload = multer();

const ID_REGEX = "{\\d{1,10}}";

app.set("trust proxy", config.ASTEROIDS_TRUST_PROXY);

app.use(
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
);

if (config.ASTEROIDS_LOG) {
    app.use(morgan(":remote-addr - [:date[clf]] :method :url :status :res[content-length] - :response-time ms"));
}

app.get("/api/game-token", async (request, response) => {
    const randomSeed = createRandomSeed();
    const { id } = await createGameToken(randomSeed);
    response.json(<GameTokenResponse>{ id, randomSeed: encodeIntArray(randomSeed) });
});

app.get("/api/leaderboard", async (request, response) => {
    response.json(await findHighScores());
});

app.get(`/api/game/:id${ID_REGEX}`, async (request, response) => {
    const game = await findGame(Number(request.params.id));
    if (game) {
        response.json(<GameResponse>{
            ...game,
            randomSeed: encodeIntArray(game.randomSeed)
        });
    } else {
        response.sendStatus(404);
    }
});

app.get(`/api/game/:id${ID_REGEX}/log`, async (request, response) => {
    const log = await findGameLog(Number(request.params.id));
    if (log) {
        response.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Length": log.byteLength,
        });
        response.end(log);
    } else {
        response.sendStatus(404);
    }
});

app.post("/api/games", upload.single("log"), async (request, response) => {
    const { body } = request;
    const log = request.file?.buffer;
    if (!log) {
        response.sendStatus(400).json("Bad request");
        return;
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
        response.status(400).json("Bad request");
        return;
    }

    const token = await findUnusedGameToken(params.tokenId);
    if (!token) {
        response.status(400).json("Invalid game token.");
        return;
    }

    const nameResult = await validatePlayerName(params.playerName, params.playerNameAuth);
    if (nameResult.ok) {
        params.playerName = nameResult.playerName;
    } else if ("unauthorized" in nameResult) {
        if (params.playerNameAuth !== undefined) {
            await promisify(setTimeout)(2000);
            response.status(401).json("Incorrect password.");
        } else {
            response.status(401).json("This name requires a password. Enter it here.");
        }
        return;
    } else {
        response.status(400).json(nameResult.error);
        return;
    }

    const gameResult = validateAsteroidsGame({
        ...params,
        randomSeed: token.randomSeed,
    });
    if (gameResult.success) {
        response.status(201).json(await storeGame({ ...params, ...gameResult }));
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
        response.status(400).json("That score doesn't seem to be possible.");
    }
});

(async () => {
    try {
        log.info("Checking database connection...")
        await findReservedPlayerNames();
        log.success("Database connection OK")
    } catch (error) {
        log.err(`Database connection failed: ${error}`);
        log.err("Exiting");
        return;
    }

    if (process.env.NODE_ENV === "development") {
        log.warn("Server is running in development mode");
        log.warn("Proxying all non-API requests to http://localhost:8081");
        const { createProxyMiddleware } = await import("http-proxy-middleware");
        app.use(createProxyMiddleware({
            target: "http://localhost:8081",
            changeOrigin: true,
            ws: true,
        }));
    }

    log.info("Starting web server on 0.0.0.0:8080...");
    const server = app.listen(8080, "0.0.0.0", (error) => {
        if (error) {
            log.err(`Failed to start web server: ${error}`)
        } else {
            log.success("Server is up");
            log.info(`------------------------------------`);
        }
    });

    const shutdown = (signal: any) => {
        log.warn(`Received ${signal}`)
        log.info("Shutting down server...");
        server.close(() => {
            log.info("Closing database connection...");
            db.destroy().then(() => log.info("Shutdown complete"));
        });
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
})();

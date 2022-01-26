import config from "./config";
import express from "express";
import bodyParser from "body-parser";
import { UnsavedGame } from "../core/models";
import { HeadlessAsteroidsGame } from "./HeadlessAsteroidsGame";

const run = async () => {
    const app = express();

    app.use(
        express.static("public"),
        bodyParser.json(),
        bodyParser.urlencoded({
            extended: true,
        }),
    );

    if (process.env.NODE_ENV === "development") {
        app.post("/api/test-game", async (request, response) => {
            const error = () => {
                console.error("Game was rejected");
                response.json({
                    ok: false,
                    message: "That score doesn't seem to be possible"
                });
            };

            try {
                const params: UnsavedGame = request.body;
                try {
                    const game = new HeadlessAsteroidsGame({
                        log: params.log,
                        randomSeed: params.randomSeed,
                    });
                    game.run();
                    if (!game.didParserComplete
                        || game.state.score !== params.score
                        || game.state.level !== params.level
                    ) {
                        return error();
                    }
                } catch (e) {
                    return error();
                }
                console.log("Game was accepted");
                response.json({
                    ok: true,
                    message: "Score valid"
                });
            } catch (e) {
                response.sendStatus(500);
            }
        });
    }

    app.listen(config.port, () => console.log(`Server listening on port: ${config.port}`));
}

run();
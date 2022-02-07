import config from "./config";
import express from "express";
import bodyParser from "body-parser";
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

    app.listen(config.port, () => console.log(`Server listening on port: ${config.port}`));
}

run();

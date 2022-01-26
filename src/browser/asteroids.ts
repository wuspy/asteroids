import { Loader } from "@pixi/loaders";
import { AsteroidsGame } from "./AsteroidsGame";
import { HeadlessAsteroidsGame } from "../server/HeadlessAsteroidsGame";
import { initYoga } from "./layout";
import { ApiErrorType } from "./api";
import "./loaderMixin";
import "./layout";
import { post } from "./api/request";

window.setTimeout(async () => {
    await Loader.shared
        .add("github-64px.webp", "assets/github-64px.webp")
        .add("linkedin-64px.webp", "assets/linkedin-64px.webp")
        .promise();

    await initYoga();

    document.getElementById("loader")?.remove();
    const game = new AsteroidsGame({ containerId: "game", backgroundId: "background" });

    if (process.env.NODE_ENV === "development") {
        game.events.on("finished", undefined, async () => {
            if (game.log) {
                console.log("Testing log", game.log);
                console.log("Seed", game.randomSeed);
                const testGame = new HeadlessAsteroidsGame({
                    log: game.log!,
                    randomSeed: game.randomSeed!,
                });
                testGame.run();
                console.log("Error", testGame.parseError);
                console.log("Did Finish", testGame.didParserComplete);
                console.log("Real State", game.state);
                console.log("Simulated State", testGame.state);
                const serverResponse = await post("api/test-game", {
                    username: "test",
                    score: game.state.score,
                    level: game.state.level,
                    randomSeed: game.randomSeed!,
                    log: game.log,
                    version: process.env.npm_package_version!,
                });
                if (serverResponse.ok) {
                    console.log("Server accepted game");
                } else if (serverResponse.error === ApiErrorType.ApiError) {
                    console.error("Server rejected game");
                } else {
                    console.error("Reqest failed");
                }
            }
        });
    }
});

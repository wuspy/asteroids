import { Loader } from "@pixi/loaders";
import { AsteroidsGame } from "./asteroids/AsteroidsGame";
import { HeadlessAsteroidsGame } from "./asteroids/HeadlessAsteroidsGame";
import { initYoga } from "./asteroids/layout";
import "./asteroids/engine";

window.setTimeout(async () => {
    await Loader.shared
        .add("github-64px.webp", "assets/github-64px.webp")
        .add("linkedin-64px.webp", "assets/linkedin-64px.webp")
        .promise();
        
    await initYoga();

    document.getElementById("loader")?.remove();
    const game = new AsteroidsGame({ containerId: "game", backgroundId: "background" });

    if (process.env.NODE_ENV === "development") {
        game.events.on("finished", undefined, () => {
            if (game.log) {
                console.log("Testing log", game.log);
                console.log("Seed", game.randomSeed);
                const testGame = new HeadlessAsteroidsGame({
                    log: game.log!,
                    randomSeed: game.randomSeed!,
                });
                testGame.start();
                console.log("Error", testGame.parseError);
                console.log("Did Finish", testGame.didParserComplete);
                console.log("Real State", game.state);
                console.log("Simulated State", testGame.state);
            }
        });
    }
});

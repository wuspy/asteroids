import { AsteroidsGame } from "./asteroids/AsteroidsGame";
import { initRandom } from "./asteroids/engine";
import { HeadlessAsteroidsGame } from "./asteroids/HeadlessAsteroidsGame";

// const BRANDING = "jacobjordan.tech | <a href=\"https://github.com/wuspy/asteroids\">Source Code</a>";

document.getElementById("loader")?.remove();

window.setTimeout(() => {
    const randomSeed = initRandom();
    const game = new AsteroidsGame({ containerId: "game" });

    game.events.on("finished", () => {
        if (game.log) {
            console.log("Testing log", game.log);
            console.log("Seed", randomSeed);
            const testGame = new HeadlessAsteroidsGame({
                log: game.log!,
                randomSeed,
            });
            testGame.start();
            console.log("Error", testGame.parseError);
            console.log("Did Finish", testGame.didParserComplete);
            console.log("Real State", game.state);
            console.log("Simulated State", testGame.state);
        }
    });
}, 100);

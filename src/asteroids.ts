import { AsteroidsGame } from "./asteroids/AsteroidsGame";
import { initRandom } from "./asteroids/engine";
import { HeadlessAsteroidsGame } from "./asteroids/HeadlessAsteroidsGame";
import { initYoga } from "./asteroids/layout";

window.setTimeout(async () => {
    await initYoga();

    document.getElementById("loader")?.remove();

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
});

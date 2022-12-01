import { Assets } from "@pixi/assets";
import { AsteroidsGame } from "./AsteroidsGame";
import { initYoga } from "./layout";

(async () => {
    await Assets.init({
        basePath: "/assets/",
    });
    Assets.backgroundLoad([
        "github-64px.webp",
        "linkedin-64px.webp",
    ]);
    await initYoga();

    document.getElementById("loader")?.remove();

    // In a timeout because removing the loader at the same time as initializing the game causes
    // stuttering on firefox
    window.setTimeout(() => {
        new AsteroidsGame({
            containerId: "game",
            backgroundId: "background",
        });
    });
})();

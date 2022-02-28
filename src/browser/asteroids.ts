import { Loader } from "@pixi/loaders";
import { AsteroidsGame } from "./AsteroidsGame";
import { initYoga } from "./layout";
import "./loaderMixin";

(async () => {
    const loaderTask = Loader.shared
        .add("github-64px.webp", "assets/github-64px.webp")
        .add("linkedin-64px.webp", "assets/linkedin-64px.webp")
        .promise();

    const yogaTask = initYoga();

    await loaderTask;
    await yogaTask;

    document.getElementById("loader")?.remove();

    // In a timeout because removing the loader at the same time as initializing the game causes
    // stuttering on firefox
    window.setTimeout(() => {
        new AsteroidsGame({
            containerId: "game",
            backgroundId: "background",
            apiRoot: process.env.NODE_ENV === "production" ? "https://astapi.jacobjordan.tech/api" : "/api",
        });
    });
})();

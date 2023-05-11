import { Container } from "@pixi/display";
import { onGameEvent, useApp } from "../AppContext";
import { ContainerProps } from "../solid-pixi";
import { FadeContainer } from "../ui";
import { displayAsteroid } from "./asteroid";
import { displayProjectile } from "./projectile";
import { displayShip } from "./ship";
import { displayUFO } from "./ufo";

export const GameplayContainer = (props: ContainerProps) => {
    const { renderer, isQuit, theme } = useApp();

    let background!: Container;
    let main!: Container;
    let foreground!: Container;

    onGameEvent("shipCreated", ship => displayShip({
        ship,
        theme: theme(),
        renderer,
        mainContainer: main,
        backgroundContainer: background,
        foregroundContainer: foreground,
    }));

    onGameEvent("asteroidsCreated", newAsteroids => {
        for (const asteroid of newAsteroids) {
            displayAsteroid({
                asteroid,
                theme: theme(),
                renderer,
                mainContainer: main,
                foregroundContainer: foreground,
            });
        }
    });

    onGameEvent("projectileCreated", projectile => displayProjectile({
        projectile,
        theme: theme(),
        renderer,
        mainContainer: main,
        backgroundContainer: background,
    }));

    onGameEvent("ufoCreated", ufo => displayUFO({
        ufo,
        theme: theme(),
        renderer,
        mainContainer: main,
        foregroundContainer: foreground,
    }));

    onGameEvent("reset", () => {
        // Remove anything that may be remaining in the containers
        while (background.children.length) {
            background.children[0].destroy({ children: true });
        }
        while (main.children.length) {
            main.children[0].destroy({ children: true });
        }
        while (foreground.children.length) {
            foreground.children[0].destroy({ children: true });
        }
    });

    return <FadeContainer
        {...props}
        visible={!isQuit()}
        keepMounted={true}
        fadeInDuration={0}
        fadeOutDuration={500}
        interactiveChildren={false}
    >
        <container ref={background} />
        <container ref={main} />
        <container ref={foreground} />
    </FadeContainer>;
};

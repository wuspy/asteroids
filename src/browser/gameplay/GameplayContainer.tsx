import { ComponentProps, useRef } from "react";
import { Container, RefType } from "../react-pixi";
import { useApp, useGameEvent } from "../AppContext";
import { displayAsteroid } from "./asteroid";
import { displayShip } from "./ship";
import { displayUFO } from "./ufo";
import { displayProjectile } from "./projectile";
import { FadeContainer } from "../ui";

export type GameplayContainerProps = ComponentProps<typeof Container>;

export const GameplayContainer = (props: GameplayContainerProps) => {
    const background = useRef<RefType<typeof Container>>(null);
    const main = useRef<RefType<typeof Container>>(null);
    const foreground = useRef<RefType<typeof Container>>(null);
    const { renderer, quit, theme } = useApp();

    useGameEvent("shipCreated", ship => displayShip({
        ship,
        theme,
        renderer,
        mainContainer: main.current!,
        backgroundContainer: background.current!,
        foregroundContainer: foreground.current!,
    }));

    useGameEvent("asteroidsCreated", newAsteroids => {
        for (const asteroid of newAsteroids) {
            displayAsteroid({
                asteroid,
                theme,
                renderer,
                mainContainer: main.current!,
                foregroundContainer: foreground.current!,
            });
        }
    });

    useGameEvent("projectileCreated", projectile => displayProjectile({
        projectile,
        theme,
        renderer,
        mainContainer: main.current!,
        backgroundContainer: background.current!,
    }));

    useGameEvent("ufoCreated", ufo => displayUFO({
        ufo,
        theme,
        renderer,
        mainContainer: main.current!,
        foregroundContainer: foreground.current!,
    }));

    useGameEvent("reset", () => {
        // Remove anything that may be remaining in the containers
        while (background.current!.children.length) {
            background.current!.children[0].destroy({ children: true });
        }
        while (main.current!.children.length) {
            main.current!.children[0].destroy({ children: true });
        }
        while (foreground.current!.children.length) {
            foreground.current!.children[0].destroy({ children: true });
        }
    });

    return <FadeContainer
        {...props}
        visible={!quit}
        keepMounted={true}
        fadeInDuration={0}
        fadeOutDuration={500}
        interactiveChildren={false}
    >
        <Container ref={background} />
        <Container ref={main} />
        <Container ref={foreground} />
    </FadeContainer>;
};

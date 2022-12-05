import { ComponentProps, useRef } from "react";
import { Container, RefType } from "../react-pixi";
import { useApp, useGameEvent } from "../AppContext";
import { AsteroidDisplay } from "./AsteroidDisplay";
import { ShipDisplay } from "./ShipDisplay";
import { UFODisplay } from "./UFODisplay";
import { ProjectileDisplay } from "./ProjectileDisplay";
import { FadeContainer } from "../ui";

export type GameplayContainerProps = ComponentProps<typeof Container>;

export const GameplayContainer = (props: GameplayContainerProps) => {
    const container = useRef<RefType<typeof FadeContainer>>(null);

    const { quit, theme } = useApp();

    useGameEvent("shipCreated", (ship) => {
        container.current!.addChild(new ShipDisplay(ship, theme));
    });

    useGameEvent("asteroidsCreated", (asteroids) => {
        for (const asteroid of asteroids) {
            container.current!.addChild(new AsteroidDisplay(asteroid, theme));
        }
    });

    useGameEvent("projectileCreated", (projectile) => {
        container.current!.addChild(new ProjectileDisplay(projectile, theme));
    });

    useGameEvent("ufoCreated", (ufo) => {
        container.current!.addChild(new UFODisplay(ufo, theme));
    });

    useGameEvent("reset", () => {
        // Remove anything that may be remaining in the gameplay container (animations, etc)
        while (container.current!.children.length) {
            container.current!.children[0].destroy({ children: true });
        }
    });

    return <FadeContainer
        {...props}
        ref={container}
        visible={!quit}
        fadeInDuration={0}
        fadeOutDuration={500}
        interactiveChildren={false}
    />;
};

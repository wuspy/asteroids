import { Container } from "@pixi/display";
import { onGameEvent, useApp } from "../AppContext";
import { ContainerProps } from "../solid-pixi";
import { FadeContainer } from "../ui";
import { createSignal, For, Show } from "solid-js";
import { ShipSprite } from "./ShipSprite";
import { Asteroid, Projectile, Ship, UFO } from "@wuspy/asteroids-core";
import { AsteroidsSprite } from "./AsteroidSprite";
import { UfoSprite } from "./UfoSprite";
import { ProjectileSprite } from "./ProjectileSprite";

export const GameplayContainer = (props: ContainerProps) => {
    const { isQuit, game } = useApp();
    const [ship, setShip] = createSignal<Ship | undefined>();
    const [projectiles, setProjectiles] = createSignal<Projectile[]>([]);
    const [asteroids, setAsteroids] = createSignal<Asteroid[]>([]);
    const [ufos, setUfos] = createSignal<UFO[]>([]);
    let effectsContainer!: Container;

    onGameEvent("shipCreated", setShip);
    onGameEvent("shipDestroyed", () => setShip(undefined));

    onGameEvent("projectileCreated", () => setProjectiles([...game.state.projectiles]));
    onGameEvent("projectileDestroyed", () => setProjectiles([...game.state.projectiles]));

    onGameEvent("asteroidsCreated", () => setAsteroids([...game.state.asteroids]));
    onGameEvent("asteroidDestroyed", () => setAsteroids([...game.state.asteroids]));

    onGameEvent("ufoCreated", () => setUfos([...game.state.ufos]));
    onGameEvent("ufoDestroyed", () => setUfos([...game.state.ufos]));

    onGameEvent("reset", () => {
        // Remove any remaining effects
        while (effectsContainer.children.length) {
            effectsContainer.children[0].destroy({ children: true });
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
        <container ref={effectsContainer} />
        <For each={projectiles()}>{projectile =>
            <ProjectileSprite projectile={projectile} effectsContainer={effectsContainer} />}
        </For>
        <For each={asteroids()}>{asteroid =>
            <AsteroidsSprite asteroid={asteroid} effectsContainer={effectsContainer} />}
        </For>
        <For each={ufos()}>{ufo =>
            <UfoSprite ufo={ufo} effectsContainer={effectsContainer} />}
        </For>
        <Show when={ship()}>{ship =>
            <ShipSprite ship={ship()} effectsContainer={effectsContainer} />}
        </Show>
    </FadeContainer>;
};

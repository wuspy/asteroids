import { HYPERSPACE_DELAY, Ship } from "@wuspy/asteroids-core";
import { onTick, useApp } from "../AppContext";
import { createDropShadowTexture } from "../util";
import { createSignal, onMount } from "solid-js";
import { Sprite } from "@pixi/sprite";
import { Container } from "@pixi/display";
import { IRenderer, Texture } from "@pixi/core";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LINE_JOIN } from "@pixi/graphics";
import { PowerupFilter } from "../filters";
import { Explosion, ShipFireAnimation, ShipHyperspaceEmitter, ShipSpawnAnimation } from "../effects";
import { trackGameObject } from "./util";

export const createShipTexture = (renderer: IRenderer, lineWidth = 3, height = 60): Texture => {
    const ship = new Graphics();
    const scale = height / 60;
    ship.lineStyle({
        width: lineWidth,
        color: 0xffffff,
        alpha: 1,
        join: LINE_JOIN.BEVEL,
    });

    ship.moveTo(0, -30 * scale);
    ship.lineTo(20 * scale, 30 * scale);
    ship.lineTo(7 * scale, 16 * scale);
    ship.lineTo(-7 * scale, 16 * scale);
    ship.lineTo(-20 * scale, 30 * scale);
    ship.closePath();
    ship.moveTo(-15.335 * scale, 16 * scale);
    ship.arcTo(0, 0, 15.335 * scale, 16 * scale, 20 * scale);

    ship.lineStyle({ width: 0 });
    ship.beginFill(0xffffff, 1, true);
    ship.moveTo(15.335 * scale, 16 * scale);
    ship.lineTo(20 * scale, 30 * scale);
    ship.lineTo(7 * scale, 16 * scale);
    ship.lineTo(-7 * scale, 16 * scale);
    ship.lineTo(-20 * scale, 30 * scale);
    ship.lineTo(-15.335 * scale, 16 * scale);
    ship.arcTo(0, 0, 15.335 * scale, 16 * scale, 20 * scale);
    ship.endFill();

    return renderer.generateTexture(ship);
};

interface ShipSpriteProps {
    ship: Ship;
    effectsContainer: Container;
    ref?: (ref: Container) => void;
}

export const ShipSprite = (props: ShipSpriteProps) => {
    const {renderer, theme} = useApp();
    // eslint-disable-next-line solid/reactivity
    const [powerup, setPowerup] = createSignal(props.ship.powerupRemaining > 0);
    // eslint-disable-next-line solid/reactivity
    const [accelerating, setAccelerating] = createSignal(props.ship.accelerationAmount > 0);

    const shipTexture = createDropShadowTexture(renderer, createShipTexture(renderer));
    let shipSprite!: Sprite;
    let container!: Container;
    let hyperspaceEmitter: ShipHyperspaceEmitter | undefined;
    const powerupFilter = new PowerupFilter();

    const createSpawnAnimation = () => {
        container.addChild(new ShipSpawnAnimation({
            color: theme().foregroundColor,
            diameter: 50,
            queue: props.ship.queue,
        }));
    };

    onTick(props.ship.queue, (timestamp, elapsed) => { // eslint-disable-line solid/reactivity
        if (props.ship.hyperspaceCountdown) {
            const progress = Math.abs(props.ship.hyperspaceCountdown - HYPERSPACE_DELAY / 2) / (HYPERSPACE_DELAY / 2);
            container.scale.set(progress / 2 + 0.5);
            if (!hyperspaceEmitter) {
                hyperspaceEmitter = new ShipHyperspaceEmitter({
                    parent: props.effectsContainer,
                    owner: container,
                    color: shipSprite.tint,
                    texture: shipSprite.texture,
                    ship: props.ship,
                    renderer
                });
            }
        } else {
            if (hyperspaceEmitter) {
                hyperspaceEmitter.emit = false;
                hyperspaceEmitter.destroyWhenComplete = true;
                hyperspaceEmitter = undefined;
            }
            if (props.ship.invulnerable) {
                container.alpha = (props.ship.invulnerableRemaining * 1000) % 150 > 75 ? 0.2 : 1;
            } else {
                container.alpha = 1;
            }
        }

        if (props.ship.powerupRemaining) {
            powerupFilter.tick(timestamp, elapsed);
        }

        setAccelerating(props.ship.accelerationAmount > 0);
    });

    onMount(() => {
        trackGameObject(props.ship, container);
        createSpawnAnimation();
        props.ship.onHyperspace = createSpawnAnimation;
        props.ship.onPowerupStart = () => setPowerup(true);
        props.ship.onPowerupEnd = () => setPowerup(false);
        props.ship.onDestroyed = ({ hit }) => { // eslint-disable-line solid/reactivity
            if (hit) {
                props.effectsContainer.addChild(new Explosion({
                    source: props.ship,
                    diameter: 250,
                    maxDuration: 3000,
                    color: theme().foregroundColor,
                    renderer,
                }));
            }
        };
    });

    return <>
        <container
            ref={(ref) => {
                container = ref;
                if (props.ref) {
                    props.ref(container);
                }
            }}
            filters={powerup() ? [powerupFilter] : null}
        >
            <ShipFireAnimation queue={props.ship.queue} enabled={accelerating()} powerup={powerup()} />
            <sprite
                ref={shipSprite}
                texture={shipTexture}
                tint={powerup() ? theme().powerupColor : theme().foregroundColor}
                anchor={0.5}
            />
        </container>
    </>;
}

import { IRenderer, Texture, utils } from "@pixi/core";
import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LINE_JOIN } from "@pixi/graphics";
import { Ship, HYPERSPACE_DELAY } from "../../core";
import { Explosion, ShipSpawnAnimation, Emitter } from "../animations";
import { GameTheme } from "../GameTheme";
import { PowerupFilter } from "../filters";
import { Sprite } from "@pixi/sprite";
import { createDropShadowTexture, createShadowTexture } from "../util";
import { TickFn } from "../../core/engine";

export const createShipFireTexture = (renderer: IRenderer): Texture => {
    const fire = new Graphics();

    fire.lineStyle({
        width: 3,
        color: 0xffffff,
        alpha: 1,
        join: LINE_JOIN.BEVEL,
    });
    fire.moveTo(8, 16);
    fire.lineTo(0, 36);
    fire.lineTo(-8, 16);
    fire.finishPoly();

    return renderer.generateTexture(fire);
}

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

export interface ShipDisplayProps {
    ship: Ship;
    theme: GameTheme;
    mainContainer: Container;
    backgroundContainer: Container;
    foregroundContainer: Container;
    renderer: IRenderer;
}

export const displayShip = ({ ship, theme, mainContainer, backgroundContainer, foregroundContainer, renderer }: ShipDisplayProps) => {
    const shipTexture = createShipTexture(renderer);
    const container = new Container();
    container.position.copyFrom(ship.position);
    container.rotation = ship.rotation;

    const shipSprite = new Sprite(createDropShadowTexture(renderer, shipTexture));
    const fireSprite = new Sprite(createDropShadowTexture(renderer, createShipFireTexture(renderer)));
    shipSprite.tint = theme.foregroundColor;
    shipSprite.anchor.set(0.5);
    fireSprite.tint = theme.fireColor;
    fireSprite.anchor.set(0.5, 0);

    container.addChild(fireSprite, shipSprite);
    mainContainer.addChild(container);

    let hyperspaceEmitter: Emitter | undefined;
    let lastFireAnimation = 0;
    const powerupFilter = new PowerupFilter();

    const createSpawnAnimation = () => {
        container.addChild(new ShipSpawnAnimation({
            color: ship.powerupRemaining ? theme.powerupColor : theme.foregroundColor,
            diameter: 50,
            queue: ship.queue,
        }));
    };

    const tick: TickFn = (timestamp, elapsed) => {
        if (ship.hyperspaceCountdown) {
            const progress = Math.abs(ship.hyperspaceCountdown - HYPERSPACE_DELAY / 2) / (HYPERSPACE_DELAY / 2);
            container.scale.set(progress / 2 + 0.5);
            if (!hyperspaceEmitter) {
                hyperspaceEmitter = new Emitter({
                    queue: ship.queue,
                    parent: backgroundContainer,
                    owner: container,
                    emit: true,
                    lifetime: { min: 0.1, max: 0.1 },
                    frequency: 0.0002,
                    emitterLifetime: -1,
                    maxParticles: 500,
                    pos: { x: 0, y: 0 },
                    behaviors: [{
                        type: "alpha",
                        config: { alpha: { start: 0.25, end: 0 } },
                    }, {
                        type: "scale",
                        config: { scale: { start: 0.5, end: 0 } },
                    }, {
                        type: "colorStatic",
                        config: { color: utils.hex2string(shipSprite.tint) }
                    }, {
                        type: "textureSingle",
                        config: { texture: createShadowTexture(renderer, shipTexture) },
                    }],
                });
            }
        } else {
            if (hyperspaceEmitter) {
                hyperspaceEmitter.emit = false;
                hyperspaceEmitter.destroyWhenComplete = true;
                hyperspaceEmitter = undefined;
            }
            if (ship.invulnerable) {
                container.alpha = (ship.invulnerableRemaining * 1000) % 150 > 75 ? 0.2 : 1;
            } else {
                container.alpha = 1;
            }
        }

        if (ship.accelerationAmount) {
            if (timestamp - lastFireAnimation > 100) {
                fireSprite.visible = false;
                lastFireAnimation = timestamp;
            } else if (timestamp - lastFireAnimation > 50) {
                fireSprite.visible = true;
            }
        } else {
            fireSprite.visible = false;
        }

        if (ship.powerupRemaining) {
            powerupFilter.tick(timestamp, elapsed);
        }
    };

    ship.onPositionChange = position => container.position.copyFrom(position);
    ship.onRotationChange = rotation => container.rotation = rotation;

    ship.onHyperspace = () => {
        createSpawnAnimation();
    };

    ship.onPowerupStart = () => {
        shipSprite.tint = fireSprite.tint = theme.powerupColor;
        container.filters = [powerupFilter];
        createSpawnAnimation();
    };

    ship.onPowerupEnd = () => {
        shipSprite.tint = theme.foregroundColor;
        fireSprite.tint = theme.fireColor;
        container.filters = null;
    };

    ship.onDestroyed = ({ hit }) => {
        if (hit) {
            const explosion = new Explosion({
                queue: ship.queue,
                diameter: 250,
                maxDuration: 3000,
                color: theme.foregroundColor,
                renderer,
            });
            explosion.position.copyFrom(ship.position);
            explosion.rotation = ship.rotation;
            foregroundContainer.addChild(explosion);
        }
        ship.queue.remove(tick);
        container.destroy({ children: true });
    };

    createSpawnAnimation();
    ship.queue.add(100, tick);
};

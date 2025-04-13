import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { onTick, useApp } from "../AppContext";
import { IRenderer, Texture } from "@pixi/core";
import { LINE_JOIN } from "@pixi/graphics";
import { createDropShadowTexture } from "../util";
import { Sprite } from "@pixi/sprite";
import { TickQueue } from "@wuspy/asteroids-core";

const createShipFireTexture = (renderer: IRenderer): Texture => {
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

interface ShipFireAnimationProps {
    enabled: boolean;
    powerup: boolean;
    queue: TickQueue;
}

export const ShipFireAnimation = (props: ShipFireAnimationProps) => {
    const { renderer, theme } = useApp();

    const texture = createDropShadowTexture(renderer, createShipFireTexture(renderer));
    let sprite!: Sprite;
    let lastAnimation = 0;

    onTick(props.queue, (timestamp) => { // eslint-disable-line solid/reactivity
        if (props.enabled) {
            if (timestamp - lastAnimation > 100) {
                sprite.visible = false;
                lastAnimation = timestamp;
            } else if (timestamp - lastAnimation > 50) {
                sprite.visible = true;
            }
        } else {
            sprite.visible = false;
        }
    });

    return <sprite
        ref={sprite}
        texture={texture}
        tint={props.powerup ? theme().powerupColor : theme().fireColor}
        anchor={[0.5, 0]}
        visible={props.enabled}
    />;
};

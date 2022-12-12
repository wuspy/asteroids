import { AbstractRenderer, Texture } from "@pixi/core";
import { Container } from "@pixi/display";
import { Sprite } from "@pixi/sprite";
import { BlurFilter } from "@pixi/filter-blur";
import { Rectangle } from "@pixi/math";

export const createShadowTexture = (renderer: AbstractRenderer, texture: Texture, strength?: number): Texture => {
    const sprite = new Sprite(texture);
    const filter = new BlurFilter(strength);
    sprite.filters = [filter];
    return renderer.generateTexture(sprite, {
        region: new Rectangle(
            -filter.padding,
            -filter.padding,
            sprite.width + filter.padding * 2,
            sprite.height + filter.padding * 2
        ),
    });
};

export const createDropShadowTexture = (renderer: AbstractRenderer, texture: Texture, strength?: number): Texture => {
    const sprite = new Sprite(texture);
    const shadow = new Sprite(createShadowTexture(renderer, texture, strength));
    sprite.anchor.set(0.5);
    shadow.anchor.set(0.5);
    const container = new Container();
    container.addChild(shadow, sprite);
    return renderer.generateTexture(container);
};

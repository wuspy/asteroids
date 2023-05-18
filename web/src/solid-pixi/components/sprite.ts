import { Sprite } from "@pixi/sprite"
import { registerPixiComponent, PixiContainerProps } from "../element";

export type SpriteProps = PixiContainerProps<Sprite>;

declare module "solid-js" {
    namespace JSX {
        interface IntrinsicElements {
            sprite: SpriteProps,
        }
    }
}

registerPixiComponent<SpriteProps, Sprite>("sprite", {
    create () {
        return new Sprite();
    },
});

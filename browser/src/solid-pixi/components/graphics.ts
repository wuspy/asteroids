import { SmoothGraphics } from "@pixi/graphics-smooth";
import { registerPixiComponent, PixiContainerProps } from "../element";

export type GraphicsProps = PixiContainerProps<SmoothGraphics>;

declare module "solid-js" {
    namespace JSX {
        interface IntrinsicElements {
            graphics: GraphicsProps,
        }
    }
}

registerPixiComponent<GraphicsProps, SmoothGraphics>("graphics", {
    create() {
        return new SmoothGraphics();
    },
});

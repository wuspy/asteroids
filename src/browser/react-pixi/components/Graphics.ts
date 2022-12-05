import { SmoothGraphics as PixiGraphics, SmoothGraphicsGeometry } from "@pixi/graphics-smooth";
import { PixiComponent, PixiContainerProps } from "../element";
import { applyDefaultProps } from "../props";

export interface GraphicsProps extends PixiContainerProps<PixiGraphics> {
    geometry?: SmoothGraphicsGeometry;
    draw?(instance: PixiGraphics): void;
}

export const Graphics = PixiComponent<GraphicsProps, PixiGraphics>("Graphics", {
    create: ({ geometry }) => new PixiGraphics(geometry),
    applyProps: (instance, updatePayload) => {
        const { draw, geometry, ...props } = updatePayload;
        if (process.env.NODE_ENV === "development") {
            if (geometry && geometry[0]) {
                console.error("Graphics geometry cannot be modified through props, use a draw function instead.", instance);
            }
        }
        applyDefaultProps(instance, props);
        if (draw && draw[1]) {
            draw[1](instance);
        }
    }
});

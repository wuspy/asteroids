import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Layout } from "yoga-layout-wasm";
import { ContainerBackgroundShape } from "../layout";
import { UI_DIVIDER_COLOR } from "./theme";

export const enum DividerDirection {
    Horizontal,
    Vertical,
}

export class Divider extends Graphics {
    readonly direction: DividerDirection;

    constructor(direction: DividerDirection, margin?: number) {
        super();
        this.direction = direction;
        if (direction === DividerDirection.Horizontal) {
            this.layout.style({
                height: 2,
                width: "100%",
                marginVertical: margin || 0,
            });
        } else {
            this.layout.style({
                height: "100%",
                width: 2,
                marginHorizontal: margin || 0,
            });
        }
    }

    override onLayout(layout: Layout): void {
        super.onLayout(layout);
        this.clear();
        this.beginFill(UI_DIVIDER_COLOR);
        this.drawRect(
            0,
            0,
            this.direction === DividerDirection.Horizontal ? layout.width : 2,
            this.direction === DividerDirection.Vertical ? layout.height : 2,
        );
        this.endFill();
    }
}

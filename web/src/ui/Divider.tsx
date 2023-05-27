import { Rectangle } from "@pixi/core";
import { SmoothGraphics } from "@pixi/graphics-smooth";
import { GraphicsProps } from "../solid-pixi";
import { UI_DIVIDER_COLOR } from "./theme";

export interface DividerProps extends GraphicsProps {
    direction: "vertical" | "horizontal";
}

export const Divider = (props: DividerProps) => {
    let g!: SmoothGraphics;
    let lastSize = { width: 0, height: 0 };

    const vertical = () => props.direction === "vertical";

    const onLayout = (layout: Rectangle) => {
        if (lastSize.width !== layout.width || lastSize.height !== layout.height) {
            g.clear();
            g.beginFill(UI_DIVIDER_COLOR);
            g.drawRect(
                0,
                0,
                !vertical() ? layout.width : 2,
                vertical() ? layout.height : 2
            );
            g.endFill();
            lastSize = { width: layout.width, height: layout.height };
        }
    };

    return <graphics
        yg:height={vertical() ? "100%" : 2}
        yg:width={vertical() ? 2 : "100%"}
        {...props}
        ref={g}
        on:layout={onLayout}
    />
};

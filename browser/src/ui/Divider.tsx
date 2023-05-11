import { useRef } from "react";
import { ComputedLayout, FlexLayoutProps } from "../layout";
import { UI_DIVIDER_COLOR } from "./theme";
import { Graphics, GraphicsProps, RefType } from "../react-pixi";

export const enum DividerDirection {
    Horizontal,
    Vertical,
}

export interface DividerProps extends GraphicsProps {
    direction: DividerDirection;
    margin?: number;
}

export const Divider = ({direction, margin = 0, ...props}: DividerProps) => {
    const g = useRef<RefType<typeof Graphics>>(null);
    const lastSize = useRef({ width: 0, height: 0});

    const onLayout = (layout: ComputedLayout) => {
        if (g.current && (lastSize.current.width !== layout.width || lastSize.current.height !== layout.height)) {
            g.current.clear();
            g.current.beginFill(UI_DIVIDER_COLOR);
            g.current.drawRect(
                0,
                0,
                direction === DividerDirection.Horizontal ? layout.width : 2,
                direction === DividerDirection.Vertical ? layout.height : 2
            );
            g.current.endFill();
            lastSize.current = { width: layout.width, height: layout.height };
        }
    };

    const layoutStyle: Partial<FlexLayoutProps> = direction === DividerDirection.Horizontal
        ? {
            height: 2,
            width: "100%",
            marginY: margin,
        }
        : {
            height: "100%",
            width: 2,
            marginX: margin,
        };

    return <Graphics
        {...props}
        ref={g}
        on:layout={onLayout}
        layoutStyle={{ ...layoutStyle, ...props.layoutStyle }}
    />
};

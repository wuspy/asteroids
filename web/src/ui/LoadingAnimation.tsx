import { DEG_TO_RAD } from "@pixi/core";
import { SmoothGraphics } from "@pixi/graphics-smooth";
import { createEffect, splitProps } from "solid-js";
import { onTick } from "../AppContext";
import { ContainerProps } from "../solid-pixi";

export interface LoadingAnimationParams extends ContainerProps {
    diameter: number;
    color: number;
}

export const LoadingAnimation = (_props: LoadingAnimationParams) => {
    const [props, childProps] = splitProps(_props, ["diameter", "color"]);
    let g!: SmoothGraphics;

    createEffect(() => {
        g.clear();
        g.lineStyle({
            width: Math.ceil(props.diameter * 0.12),
            color: props.color,
            alignment: 0,
        });
        const radius = props.diameter / 2;
        g.moveTo(radius, 0);
        g.arc(0, 0, radius, 0, 90 * DEG_TO_RAD);
        g.moveTo(-radius, 0);
        g.arc(0, 0, radius, Math.PI, 270 * DEG_TO_RAD);
    });

    onTick("app", (timestamp, elapsed) => {
        g.rotation += elapsed * 2 * Math.PI;
    });

    return (
        <container
            {...childProps}
            flexContainer
            yg:alignItems="center"
            yg:justifyContent="center"
        >
            <graphics
                ref={g}
                yg:width={props.diameter}
                yg:aspectRatio={1}
                yg:anchor={0.5}
            />
        </container>
    );
};

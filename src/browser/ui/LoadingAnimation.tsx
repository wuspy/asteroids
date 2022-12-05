import { DEG_TO_RAD } from "@pixi/math";
import { ComponentProps, useCallback, useRef } from "react";
import { Container, Graphics, RefType } from "../react-pixi";
import { Align, JustifyContent } from "../layout";
import { useTick } from "../AppContext";

export interface LoadingAnimationParams extends Omit<ComponentProps<typeof Graphics>, "draw"> {
    diameter: number;
    color: number;
}

export const LoadingAnimation = ({diameter, color, ...props}: LoadingAnimationParams) => {
    const graphics = useRef<RefType<typeof Graphics>>(null);

    const draw = useCallback((g: RefType<typeof Graphics>) => {
        g.lineStyle({
            width: Math.ceil(diameter * 0.12),
            color: color,
            alignment: 0,
        });
        const radius = diameter / 2;
        g.moveTo(radius, 0);
        g.arc(0, 0, radius, 0, 90 * DEG_TO_RAD);
        g.moveTo(-radius, 0);
        g.arc(0, 0, radius, Math.PI, 270 * DEG_TO_RAD);
    }, [diameter, color]);

    useTick("app", (timestamp, elapsed) => {
        if (graphics.current) {
            graphics.current.rotation += elapsed * 2 * Math.PI;
        }
    });

    return <Container {...props} flexContainer layoutStyle={{ ...props.layoutStyle, alignItems: Align.Center, justifyContent: JustifyContent.Center }}>
        <Graphics
            ref={graphics}
            draw={draw}
            layoutStyle={{
                width: diameter,
                height: diameter,
                originAtCenter: true,
            }}
        />
    </Container>;
};

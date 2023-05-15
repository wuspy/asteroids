import { DashLineShader, SmoothGraphics } from "@pixi/graphics-smooth";
import { MAX_ASPECT_RATIO, MIN_ASPECT_RATIO } from "@wuspy/asteroids-core";
import { createEffect } from "solid-js";
import { useApp } from "./AppContext";
import { WarpFilter } from "./filters";

export interface BoundsGraphicsProps {
    mainWarpFilter: Readonly<WarpFilter>;
}

export const BoundsGraphics = (props: BoundsGraphicsProps) => {
    const { scale, worldSize, theme } = useApp();
    const lineWidth = () => 2 / scale();

    let cornerBoundsGraphics!: SmoothGraphics;
    let absoluteBoundsGraphics!: SmoothGraphics;

    const drawCornerBounds = () => {
        const g = cornerBoundsGraphics;
        const ws = worldSize();
        const { width, height } = ws;
        const lw = lineWidth();

        const drawCorner = (hy: number, hx1: number, hx2: number, vx: number, vy1: number, vy2: number) => {
            const resolution = 10;

            g.moveTo(...props.mainWarpFilter.getDisplacement(worldSize(), hx1, hy));
            for (let hx = hx1 + resolution; hx < hx2 - 1; hx += resolution) {
                g.lineTo(...props.mainWarpFilter.getDisplacement(ws, hx, hy));
            }
            g.lineTo(...props.mainWarpFilter.getDisplacement(ws, hx2, hy));

            g.moveTo(...props.mainWarpFilter.getDisplacement(ws, vx, vy1));
            for (let vy = vy1 + resolution; vy < vy2 - 1; vy += resolution) {
                g.lineTo(...props.mainWarpFilter.getDisplacement(ws, vx, vy));
            }
            g.lineTo(...props.mainWarpFilter.getDisplacement(ws, vx, vy2));
        }

        const extra = 10;
        const xLength = width / 7;
        const yLength = height / 7;
        const halfLineWidth = lw / 2;

        g.clear();
        g.lineStyle({
            width: lw,
            color: theme().backgroundColor,
            alpha: theme().backgroundAlpha * 2,
        });

        // Top left
        drawCorner(halfLineWidth, -extra, xLength, halfLineWidth, -extra, yLength);
        // Top Right
        drawCorner(halfLineWidth, width - xLength, width + extra, width - halfLineWidth, -extra, yLength);
        // Bottom left
        drawCorner(height - halfLineWidth, -extra, xLength, halfLineWidth, height - yLength, height + extra);
        // Bottom right
        drawCorner(height - halfLineWidth, width - xLength, width + extra, width - halfLineWidth, height - yLength, height + extra);
    };

    const drawAbsoluteBounds = () => {
        const g = absoluteBoundsGraphics;
        const { width, height } = worldSize();
        const lw = lineWidth();
        const aspectRatio = width / height;

        g.clear();
        g.lineStyle({
            width: lw,
            color: theme().backgroundColor,
            alpha: theme().backgroundAlpha * 2,
        });

        // If the game is letterboxed, draw absolute bounds

        if (aspectRatio < MIN_ASPECT_RATIO) {
            g.visible = true;
            let y = lw / 2;
            g.moveTo(0, y).lineTo(width, y);
            y = height - lw / 2;
            g.moveTo(0, y).lineTo(width, y);
        } else if (aspectRatio > MAX_ASPECT_RATIO) {
            g.visible = true;
            let x = lw / 2;
            g.moveTo(x, 0).lineTo(x, height);
            x = width - lw / 2;
            g.moveTo(x, 0).lineTo(x, height);
        } else {
            g.visible = false;
        }
    };

    createEffect(() => {
        drawCornerBounds();
        drawAbsoluteBounds();
    });

    return <>
        <graphics ref={cornerBoundsGraphics} shader={new DashLineShader()} />
        <graphics ref={absoluteBoundsGraphics} />
    </>;
};

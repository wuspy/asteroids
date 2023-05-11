import { MAX_ASPECT_RATIO, MIN_ASPECT_RATIO } from "@wuspy/asteroids-core";
import { DashLineShader } from "@pixi/graphics-smooth";
import { useCallback, useMemo } from "react";
import { useApp } from "./AppContext";
import { WarpFilter } from "./filters";
import { Graphics, RefType } from "./react-pixi";

export interface BoundsGraphicsProps {
    mainWarpFilter: WarpFilter;
}

export const BoundsGraphics = ({ mainWarpFilter }: BoundsGraphicsProps) => {
    const { stage, theme, game } = useApp();
    const dashLineShader = useMemo(() => new DashLineShader(), []);

    const { width, height } = game.worldSize;
    const lineWidth = 2 / stage.scale.x;

    const drawCornerBounds = useCallback((g: RefType<typeof Graphics>) => {
        const drawCorner = (hy: number, hx1: number, hx2: number, vx: number, vy1: number, vy2: number) => {
            const resolution = 10;

            g.moveTo(...mainWarpFilter.getDisplacement(game.worldSize, hx1, hy));
            for (let hx = hx1 + resolution; hx < hx2 - 1; hx += resolution) {
                g.lineTo(...mainWarpFilter.getDisplacement(game.worldSize, hx, hy));
            }
            g.lineTo(...mainWarpFilter.getDisplacement(game.worldSize, hx2, hy));

            g.moveTo(...mainWarpFilter.getDisplacement(game.worldSize, vx, vy1));
            for (let vy = vy1 + resolution; vy < vy2 - 1; vy += resolution) {
                g.lineTo(...mainWarpFilter.getDisplacement(game.worldSize, vx, vy));
            }
            g.lineTo(...mainWarpFilter.getDisplacement(game.worldSize, vx, vy2));
        }

        const extra = 10;
        const xLength = width / 7;
        const yLength = height / 7;
        const halfLineWidth = lineWidth / 2;

        g.clear();
        g.lineStyle({
            width: lineWidth,
            color: theme.backgroundColor,
            alpha: theme.backgroundAlpha * 2,
        });

        // Top left
        drawCorner(halfLineWidth, -extra, xLength, halfLineWidth, -extra, yLength);
        // Top Right
        drawCorner(halfLineWidth, width - xLength, width + extra, width - halfLineWidth, -extra, yLength);
        // Bottom left
        drawCorner(height - halfLineWidth, -extra, xLength, halfLineWidth, height - yLength, height + extra);
        // Bottom right
        drawCorner(height - halfLineWidth, width - xLength, width + extra, width - halfLineWidth, height - yLength, height + extra);
    }, [width, height, lineWidth, mainWarpFilter]);

    const drawAbsoluteBounds = useCallback((g: RefType<typeof Graphics>) => {
        const aspectRatio = width / height;

        g.clear();
        g.lineStyle({
            width: lineWidth,
            color: theme.backgroundColor,
            alpha: theme.backgroundAlpha * 2,
        });

        // If the game is letterboxed, draw absolute bounds

        if (aspectRatio < MIN_ASPECT_RATIO) {
            g.visible = true;
            let y = lineWidth / 2;
            g.moveTo(0, y).lineTo(width, y);
            y = height - lineWidth / 2;
            g.moveTo(0, y).lineTo(width, y);
        } else if (aspectRatio > MAX_ASPECT_RATIO) {
            g.visible = true;
            let x = lineWidth / 2;
            g.moveTo(x, 0).lineTo(x, height);
            x = width - lineWidth / 2;
            g.moveTo(x, 0).lineTo(x, height);
        } else {
            g.visible = false;
        }
    }, [width, height, lineWidth]);

    if (width === 0) {
        return null;
    }

    return <>
        <Graphics draw={drawCornerBounds} shader={dashLineShader} />
        <Graphics draw={drawAbsoluteBounds} />
    </>;
};

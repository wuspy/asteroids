import { useLayoutEffect, useMemo, useRef, useState, FC } from "react";
import { SmoothGraphics as PixiGraphics } from "@pixi/graphics-smooth";
import { Graphics } from "./react-pixi";
import { GameObject } from "../core/engine";
import Stats from "stats.js";
import { useApp, useTick } from "./AppContext";

declare global {
    interface Window {
        asteroids: any;
    }
}

export let DebugContainer: FC;

if (process.env.NODE_ENV === "development") {
    const drawObjects = (graphics: PixiGraphics, objects: GameObject[]) => {
        for (const object of objects) {
            graphics.lineStyle({
                width: 2,
                color: 0xff0000,
                alpha: 0.5,
                smooth: false
            });
            graphics.drawRect(object.boundingBox.x, object.boundingBox.y, object.boundingBox.width, object.boundingBox.height);
            graphics.line.alpha = 0;
            graphics.beginFill(0xff0000, 0.5, false);
            if (typeof (object.hitArea) === "object") {
                graphics.drawPolygon(object.hitArea);
            } else {
                graphics.drawCircle(object.x, object.y, object.hitArea);
            }
            graphics.endFill();
        }
    }

    DebugContainer = () => {
        const { game } = useApp();
        const [visible, setVisible] = useState(false);
        const fpsStats = useMemo(() => {
            const fpsStats = new Stats();
            fpsStats.showPanel(0);
            fpsStats.dom.style.position = "relative";
            fpsStats.dom.style.display = "inline-block";
            return fpsStats;
        }, []);
        const memoryStats = useMemo(() => {
            const memoryStats = new Stats();
            memoryStats.showPanel(2);
            memoryStats.dom.style.position = "relative";
            memoryStats.dom.style.display = "inline-block";
            return memoryStats;
        }, []);
        const graphics = useRef<PixiGraphics>(null);

        useLayoutEffect(() => {
            const statsDiv = document.createElement("div");
            statsDiv.style.position = "absolute";
            statsDiv.style.right = "0";
            statsDiv.style.bottom = "0";
            statsDiv.appendChild(fpsStats.dom);
            statsDiv.appendChild(memoryStats.dom);
            document.body.appendChild(statsDiv);

            fpsStats.begin();
            memoryStats.begin();

            window.asteroids = {
                state: () => game.state,
                showStats: () => {
                    statsDiv.style.display = "block";
                },
                hideStats: () => {
                    statsDiv.style.display = "none";
                },
                showHitareas: () => setVisible(true),
                hideHitareas: () => setVisible(false),
                kill: () => {
                    if (game.state.ship) {
                        game.state.lives = 1;
                        game.state.ship.destroy({ hit: true });
                    }
                },
            };
            return () => {
                fpsStats.end();
                memoryStats.end();
                statsDiv.remove();
                window.asteroids = undefined;
            };
        }, []);

        useTick("app", () => {
            fpsStats.update();
            memoryStats.update();
        });

        useTick("game", () => {
            if (!graphics.current) {
                return;
            }

            graphics.current.clear();
            drawObjects(graphics.current, game.state.asteroids);
            drawObjects(graphics.current, game.state.ufos);
            drawObjects(graphics.current, game.state.projectiles);
            game.state.ship && drawObjects(graphics.current, [game.state.ship]);
        }, visible);

        return <Graphics ref={graphics} visible={visible} />;
    }
} else {
    DebugContainer = () => null;
}

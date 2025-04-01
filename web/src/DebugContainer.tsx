import { SmoothGraphics } from "@pixi/graphics-smooth";
import { GameObject } from "@wuspy/asteroids-core";
import { Component, createSignal, onCleanup, onMount } from "solid-js";
import { onTick, useApp } from "./AppContext";

declare global {
    interface Window {
        asteroids: any;
    }
}

let spectorImported = false;

export let DebugContainer: Component;

if (process.env.NODE_ENV === "development") {
    const drawObjects = (graphics: SmoothGraphics, objects: GameObject[]) => {
        for (const object of objects) {
            graphics.lineStyle({
                width: 2,
                color: 0xff0000,
                alpha: 0.5,
                smooth: false
            });
            graphics.drawRect(
                object.boundingBox.x,
                object.boundingBox.y,
                object.boundingBox.width,
                object.boundingBox.height
            );
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
        const [visible, setVisible] = createSignal(false);

        let graphics!: SmoothGraphics;

        onMount(() => {
            window.asteroids = {
                state: () => game.state,
                showHitareas: () => setVisible(true),
                hideHitareas: () => setVisible(false),
                kill: () => {
                    if (game.state.ship) {
                        game.state.lives = 1;
                        game.state.ship.destroy({ hit: true });
                    }
                },
                spector: () => {
                    if (!spectorImported) {
                        spectorImported = true;
                        // @ts-ignore No type definitions
                        import("spectorjs").then(SPECTOR => {
                            const spector = new SPECTOR.Spector();
                            spector.displayUI();
                        });
                    }
                },
            };
        });

        onCleanup(() => {
            window.asteroids = undefined;
        });

        // eslint-disable-next-line solid/reactivity
        onTick("game", () => {
            graphics.clear();
            drawObjects(graphics, game.state.asteroids);
            drawObjects(graphics, game.state.ufos);
            drawObjects(graphics, game.state.projectiles);
            if (game.state.ship) {
                drawObjects(graphics, [game.state.ship]);
            }
        }, visible);

        return <graphics ref={graphics} visible={visible()} />;
    }
} else {
    DebugContainer = () => null;
}

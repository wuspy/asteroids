import { DEG_TO_RAD, PI_2 } from "@pixi/core";
import { Container } from "@pixi/display";
import { LINE_JOIN } from "@pixi/graphics";
import { SmoothGraphics } from "@pixi/graphics-smooth";
import anime from "animejs";
import { createEffect, createSignal, splitProps } from "solid-js";
import { onTick } from "../AppContext";
import { ContainerProps } from "../solid-pixi";

export interface PointerProps extends ContainerProps {
    childAttachment: "top" | "bottom" | "left" | "right";
    angle: number;
    length: number;
    delay?: number;
    color: number;
    revealed: boolean;
}

const CIRCLE_RADIUS = 3;

export const Pointer = (_props: PointerProps) => {
    const [props, childProps] = splitProps(_props, [
        "childAttachment",
        "angle",
        "length",
        "delay",
        "color",
        "revealed",
        "children",
    ]);

    // eslint-disable-next-line solid/reactivity
    const [progress, setProgress] = createSignal(props.revealed ? 1 : 0);
    // eslint-disable-next-line solid/reactivity
    const [contentAlpha, setContentAlpha] = createSignal(props.revealed ? 1 : 0);
    // eslint-disable-next-line solid/reactivity
    let wasRevealed = props.revealed;

    let target!: Container;
    let container!: Container;
    let g!: SmoothGraphics;

    const angleRad = () => (props.angle * DEG_TO_RAD) % PI_2;
    const childPosition = () => ({
        x: (CIRCLE_RADIUS + props.length) * progress() * Math.sin(angleRad()),
        y: (CIRCLE_RADIUS + props.length) * progress() * -Math.cos(angleRad()),
    });

    const [anim, setAnim] = createSignal<anime.AnimeInstance>();

    createEffect(() => {
        if (props.revealed !== wasRevealed) {
            const targets = { progress: progress(), contentAlpha: contentAlpha() };
            setAnim(anime.timeline({
                autoplay: false,
                targets,
                delay: props.revealed ? props.delay : 0,
                easing: "spring(10, 80, 54, 4)",
                complete: () => {
                    setProgress(props.revealed ? 1 : 0);
                    setContentAlpha(props.revealed ? 1 : 0);
                    setAnim(undefined);
                },
            }).add({
                progress: props.revealed ? 1 : 0,
                change: () => setProgress(targets.progress),
            }, props.revealed ? 0 : 135).add({
                contentAlpha: props.revealed ? 1 : 0,
                change: () => setContentAlpha(targets.contentAlpha),
            }, props.revealed ? 235 : 0));

            wasRevealed = props.revealed;
        }
    });

    // eslint-disable-next-line solid/reactivity
    onTick("app", timestamp => anim()!.tick(timestamp), anim);

    createEffect(() => {
        g.clear();
        g.beginFill(props.color, 1, true);
        const origin = {
            x: (1 - progress()) * -5 * Math.sin(angleRad()),
            y: (1 - progress()) * -5 * -Math.cos(angleRad()),
        };
        g.drawCircle(origin.x, origin.y, CIRCLE_RADIUS);
        g.endFill()
        if (progress() > 0) {
            g.lineStyle({
                color: props.color,
                width: 2,
                join: LINE_JOIN.BEVEL,
            });
            g.moveTo(
                origin.x + (CIRCLE_RADIUS) * Math.sin(angleRad()),
                origin.y + (CIRCLE_RADIUS) * -Math.cos(angleRad())
            );
            g.lineTo(childPosition().x, childPosition().y);
        }
    });

    createEffect(() => {
        const { width, height } = target.getLocalBounds();
        const { x, y } = childPosition();
        switch (props.childAttachment) {
            case "left":
                target.position.set(x, y - height / 2);
                break;
            case "right":
                target.position.set(x - width, y - height / 2);
                break;
            case "top":
                target.position.set(x - width / 2, y);
                break;
            case "bottom":
                target.position.set(x - width / 2, y - height);
                break;
        }
    });

    return (
        <container {...childProps} ref={container}>
            <graphics ref={g} alpha={Math.min(progress(), 0.5)} />
            <container ref={target} alpha={Math.max(contentAlpha(), 0.01)}>
                {props.children}
            </container>
        </container>
    );
};

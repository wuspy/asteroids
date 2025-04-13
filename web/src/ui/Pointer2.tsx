import { DEG_TO_RAD, IPointData, PI_2, Point } from "@pixi/core";
import { Container, DisplayObject } from "@pixi/display";
import { LINE_JOIN } from "@pixi/graphics";
import { SmoothGraphics } from "@pixi/graphics-smooth";
import anime from "animejs";
import { createEffect, createMemo, createSignal, splitProps } from "solid-js";
import { onTick } from "../AppContext";
import { ContainerProps, PointLike, setPoint } from "../solid-pixi";
import { pointsEqual, scaleVec2, subVec2 } from "@wuspy/asteroids-core";

export interface Pointer2Props extends Omit<ContainerProps, "position" | "x" | "y" | "rotation"> {
    target: DisplayObject;
    attachment: PointLike;
    angle: number;
    length: number;
    delay?: number;
    color: number;
    revealed: boolean;
}

const CIRCLE_RADIUS = 3;

export const Pointer2 = (_props: Pointer2Props) => {
    const [props, childProps] = splitProps(_props, [
        "target",
        "attachment",
        "angle",
        "length",
        "delay",
        "color",
        "revealed",
        "children",
    ]);

    // eslint-disable-next-line solid/reactivity
    const [progress, setProgress] = createSignal(props.revealed ? 1 : 0);
    // const [progress, setTarget] = createSpring("app", 0, 0, { mass: 10, stiffness: 80, damping: 54, velocity: 4 });
    // onDelay("app", props.delay ?? 0, () => setTarget(1));
    // eslint-disable-next-line solid/reactivity
    const [contentAlpha, setContentAlpha] = createSignal(props.revealed ? 1 : 0);
    // eslint-disable-next-line solid/reactivity
    let wasRevealed = props.revealed;

    let child!: Container;
    let container!: Container;
    let g!: SmoothGraphics;

    // eslint-disable-next-line solid/reactivity
    const [targetRotation, setTargetRotation] = createSignal(props.target.rotation);
    const angleRad = createMemo(() => (props.angle * DEG_TO_RAD) % PI_2 + targetRotation());
    const targetChildPosition = createMemo((): IPointData => (
        props.revealed ? {
            x: (CIRCLE_RADIUS + props.length) * Math.sin(angleRad()),
            y: (CIRCLE_RADIUS + props.length) * -Math.cos(angleRad()),
        }: {
            x: 0,
            y: 0,
        }));

    // props.attachment converted into a Point
    const attachment = createMemo(() => {
        const point = new Point();
        setPoint(point, props.attachment);
        return point;
    });

    const [revealAnim, setRevealAnim] = createSignal<anime.AnimeInstance>();

    createEffect(() => {
        setPoint(container.position, props.attachment);
    });

    createEffect(() => {
        if (props.revealed !== wasRevealed) {
            const targets = { progress: progress(), contentAlpha: contentAlpha() };
            setRevealAnim(anime.timeline({
                autoplay: false,
                targets,
                delay: props.revealed ? props.delay : 0,
                easing: "spring(1, 80, 54, 0)",
                complete: () => {
                    setProgress(props.revealed ? 1 : 0);
                    setContentAlpha(props.revealed ? 1 : 0);
                    setRevealAnim(undefined);
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

    const m = 4;
    const k = 80;
    const d = 28;
    const v = 0;

    const childPosition = { x: 0, y: 0 };
    const childVelocity: IPointData = {
        x: v * Math.sin(angleRad()), // eslint-disable-line solid/reactivity
        y: v * -Math.cos(angleRad()), // eslint-disable-line solid/reactivity
    };

    // eslint-disable-next-line solid/reactivity
    onTick("app", (timestamp, elapsed) => {
        revealAnim()?.tick(timestamp);

        const lastPos = { x: container.x, y: container.y };
        container.position.copyFrom(props.target.localTransform.apply(attachment()));
        setTargetRotation(props.target.rotation);
        if (!pointsEqual(lastPos, container)) {
            childPosition.x += lastPos.x - container.x;
            childPosition.y += lastPos.y - container.y;
        }
        if (progress()) {
            const displacement = subVec2(childPosition, targetChildPosition());
            if (displacement.x || displacement.y) {
                const force = subVec2(scaleVec2(displacement, -k), scaleVec2(childVelocity, d));
                childVelocity.x += force.x / m * elapsed;
                childVelocity.y += force.y / m * elapsed;
            }
            if (childVelocity.x) {
                childPosition.x += childVelocity.x * elapsed;
            }
            if (childVelocity.y) {
                childPosition.y += childVelocity.y * elapsed;
            }
        }

        const { x, y } = childPosition;

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
            g.lineTo(x, y);
        }

        const { width, height } = child.getLocalBounds();
        if (props.angle < 45) { // bottom attachment
            child.position.set(x - width / 2, y - height);
        } else if (props.angle < 135) { // left attachment
            child.position.set(x, y - height / 2);
        } else if (props.angle < 225) { // top attachment
            child.position.set(x - width / 2, y);
        } else { // right attachment
            child.position.set(x - width, y - height / 2);
        }
    });

    return (
        <container {...childProps} ref={container}>
            <graphics ref={g} alpha={Math.min(progress(), 0.5)} />
            <container ref={child} alpha={Math.max(contentAlpha(), 0.01)}>
                {props.children}
            </container>
        </container>
    );
};

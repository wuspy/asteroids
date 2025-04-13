import { DEG_TO_RAD, PI_2, Point } from "@pixi/core";
import { Container, DisplayObject } from "@pixi/display";
import { LINE_JOIN } from "@pixi/graphics";
import { SmoothGraphics } from "@pixi/graphics-smooth";
import anime from "animejs";
import { createEffect, createMemo, createRenderEffect, createSignal, splitProps } from "solid-js";
import { onTick } from "../AppContext";
import { ContainerProps, PointLike, setPoint } from "../solid-pixi";
import { subVec2 } from "@wuspy/asteroids-core";

export interface PointerProps extends Omit<ContainerProps, "position" | "x" | "y" | "rotation"> {
    target: DisplayObject;
    attachment: PointLike;
    angle: number;
    length: number;
    delay?: number;
    color: number;
    revealed: boolean;
}

const CIRCLE_RADIUS = 3;

export const Pointer = (_props: PointerProps) => {
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

    const animation = {
        length: 0,
        pointerAlpha: 0,
        contentAlpha: 0.01,
    };
    let wasRevealed = false;

    let child!: Container;
    let container!: Container;
    let g!: SmoothGraphics;

    const propsRotation = createMemo(() => (props.angle * DEG_TO_RAD) % PI_2);
    // eslint-disable-next-line solid/reactivity
    const [targetRotation, setTargetRotation] = createSignal(propsRotation());

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
            setRevealAnim(anime.timeline({
                autoplay: false,
                targets: animation,
                delay: props.revealed ? props.delay : 0,
                easing: "spring(1, 80, 54, 0)",
                complete: () => {
                    setRevealAnim(undefined);
                },
            }).add(
                { length: props.revealed ? props.length : 0 },
                props.revealed ? 0 : 135
            ).add(
                { pointerAlpha: props.revealed ? 0.5 : 0 },
                props.revealed ? 0 : 135
            ).add(
                { contentAlpha: props.revealed ? 1 : 0.01 },
                props.revealed ? 235 : 0
            ));

            wasRevealed = props.revealed;
        }
    });

    // Spring constants
    const m = 2;
    const k = 50;
    const d = 10;

    const childPosition = { x: 0, y: 0 };
    let childAngularVelocity = 0;
    // eslint-disable-next-line solid/reactivity
    let rotation = targetRotation();
    const lastTargetPosition = { x: 0, y: 0 };

    createRenderEffect(() => {
        lastTargetPosition.x = props.target.x;
        lastTargetPosition.y = props.target.y;
    });

    // eslint-disable-next-line solid/reactivity
    onTick("app", (timestamp, elapsed) => {
        revealAnim()?.tick(timestamp);

        // Apply transform from target
        container.position.copyFrom(props.target.localTransform.apply(attachment()));
        setTargetRotation((propsRotation() + props.target.rotation) % PI_2);

        // Calculate angular force on pointer and apply it to rotation
        let displacement = rotation - targetRotation();
        const childVelocity = subVec2(props.target.position, lastTargetPosition);
        lastTargetPosition.x = props.target.x;
        lastTargetPosition.y = props.target.y;
        if (animation.length) {
            if (childVelocity.x) {
                displacement += childVelocity.x * Math.cos(rotation) / Math.sqrt(animation.length);
            }
            if (childVelocity.y) {
                displacement += childVelocity.y * Math.sin(rotation) / Math.sqrt(animation.length);
            }
        }
        // if (Math.abs(displacement) < 0.0001) {
        //     return;
        // }

        const force = displacement * -k - childAngularVelocity * d;
        childAngularVelocity += force / m * elapsed;
        rotation += childAngularVelocity * elapsed;

        const [sinRot, cosRot] = [Math.sin(rotation), Math.cos(rotation)];
        childPosition.x = (CIRCLE_RADIUS + animation.length) * sinRot;
        childPosition.y = (CIRCLE_RADIUS + animation.length) * -cosRot;

        const { x, y } = childPosition;

        g.clear();
        g.beginFill(props.color, 1, true);
        const origin = {
            x: (1 - animation.length / props.length) * -5 * sinRot,
            y: (1 - animation.length / props.length) * -5 * -cosRot,
        };
        g.drawCircle(origin.x, origin.y, CIRCLE_RADIUS);
        g.endFill()
        if (animation.length > 0) {
            g.lineStyle({
                color: props.color,
                width: 2,
                join: LINE_JOIN.BEVEL,
            });
            g.moveTo(
                origin.x + (CIRCLE_RADIUS) * sinRot,
                origin.y + (CIRCLE_RADIUS) * -cosRot,
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

        g.alpha = animation.pointerAlpha;
        child.alpha = animation.contentAlpha;
    });

    return (
        <container {...childProps} ref={container}>
            <graphics ref={g} />
            <container ref={child}>
                {props.children}
            </container>
        </container>
    );
};

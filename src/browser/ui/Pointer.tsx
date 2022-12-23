import { LINE_JOIN } from "@pixi/graphics";
import { DEG_TO_RAD, PI_2 } from "@pixi/math";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Container, ContainerProps, Graphics, RefType } from "../react-pixi";
import anime from "animejs";
import { useTick } from "../AppContext";

export interface PointerProps extends ContainerProps {
    childAttachment: "top" | "bottom" | "left" | "right";
    angle: number;
    length: number;
    delay?: number;
    color: number;
    revealed: boolean;
}

const CIRCLE_RADIUS = 3;

export const Pointer = ({ childAttachment, angle, length, delay = 0, color, revealed, children, ...props }: PointerProps) => {
    const angleRad = (angle * DEG_TO_RAD) % PI_2;
    const [progress, setProgress] = useState(revealed ? 1 : 0);
    const [contentAlpha, setContentAlpha] = useState(revealed ? 1 : 0);
    const [wasRevealed, setWasRevealed] = useState(revealed);
    const target = useRef<RefType<typeof Container>>(null);
    const container = useRef<RefType<typeof Container>>(null);

    const childPosition = useMemo(() => ({
        x: (CIRCLE_RADIUS + length) * progress * Math.sin(angleRad),
        y: (CIRCLE_RADIUS + length) * progress * -Math.cos(angleRad),
    }), [angleRad, progress]);

    const [anim, setAnim] = useState<anime.AnimeInstance>();

    useEffect(() => {
        if (revealed !== wasRevealed) {
            const targets = { progress, contentAlpha };
            setAnim(anime.timeline({
                autoplay: false,
                targets,
                delay: revealed ? delay : 0,
                easing: "spring(10, 80, 54, 4)",
                complete: () => {
                    setProgress(revealed ? 1 : 0);
                    setContentAlpha(revealed ? 1 : 0);
                    setAnim(undefined);
                },
            }).add({
                progress: revealed ? 1 : 0,
                change: () => setProgress(targets.progress),
            }, revealed ? 0 : 135).add({
                contentAlpha: revealed ? 1 : 0,
                change: () => setContentAlpha(targets.contentAlpha),
            }, revealed ? 235 : 0));
            setWasRevealed(revealed);
            return () => setAnim(undefined);
        }
    }, [revealed]);

    useTick("app", timestamp => anim!.tick(timestamp), !!anim);

    const draw = useCallback((g: RefType<typeof Graphics>) => {
        g.clear();
        g.beginFill(color, 1, true);
        const origin = {
            x: (1 - progress) * -5 * Math.sin(angleRad),
            y: (1 - progress) * -5 * -Math.cos(angleRad),
        };
        g.drawCircle(origin.x, origin.y, CIRCLE_RADIUS);
        g.endFill()
        if (progress > 0) {
            g.lineStyle({
                color,
                width: 2,
                join: LINE_JOIN.BEVEL,
            });
            g.moveTo(
                origin.x + (CIRCLE_RADIUS) * Math.sin(angleRad),
                origin.y + (CIRCLE_RADIUS) * -Math.cos(angleRad)
            );
            g.lineTo(childPosition.x, childPosition.y);
        }
    }, [progress, angleRad, childPosition]);

    useLayoutEffect(() => {
        const t = target.current!;
        const { width, height } = t.getLocalBounds();
        switch (childAttachment) {
            case "left":
                t.position.set(childPosition.x, childPosition.y - height / 2);
                break;
            case "right":
                t.position.set(childPosition.x - width, childPosition.y - height / 2);
                break;
            case "top":
                t.position.set(childPosition.x - width / 2, childPosition.y);
                break;
            case "bottom":
                t.position.set(childPosition.x - width / 2, childPosition.y - height);
                break;
        }
    }, [childPosition]);

    return (
        <Container {...props} ref={container}>
            <Graphics draw={draw} alpha={Math.min(progress, 0.5)} />
            <Container ref={target} alpha={Math.max(contentAlpha, 0.01)}>
                {children}
            </Container>
        </Container>
    );
};

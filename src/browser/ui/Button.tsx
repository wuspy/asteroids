import { ComponentProps, useMemo, useRef, useState } from "react";
import { GlowFilter } from "@pixi/filter-glow";
import { Align, ContainerBackground, ContainerBackgroundShape, drawContainerBackground, FlexDirection, PositionType } from "../layout";
import { Image } from "./Image";
import { ButtonType, BUTTON_THEMES, FONT_STYLE } from "./theme";
import { LoadingAnimation } from "./LoadingAnimation";
import { Container, Graphics, RefType, Text } from "../react-pixi";
import { useTick } from "../AppContext";

const TRANSITION_TIME = 0.25;

interface ButtonProps extends ComponentProps<typeof Container> {
    type: ButtonType;
    text: string;
    imageUrl?: string;
    enabled?: boolean;
    loading?: boolean;
    onClick: () => void;
}

export const Button = ({type, text, imageUrl, enabled = true, loading = false, onClick, ...props}: ButtonProps) => {
    const theme = BUTTON_THEMES[type];
    const [hovering, setHovering] = useState(false);
    const [active, setActive] = useState(false);
    const lastWidth = useRef(0);
    const lastHeight = useRef(0);
    const container = useRef<RefType<typeof Container>>(null);
    const activeGraphics = useRef<RefType<typeof Graphics>>(null);
    const inactiveGraphics = useRef<RefType<typeof Graphics>>(null);
    const inactiveGlowFilter = useMemo(() => new GlowFilter({
        innerStrength: 0,
        outerStrength: 0,
        distance: 24,
        color: theme.inactive.glow,
    }), [theme.inactive.glow]);
    const activeGlowFilter = useMemo(() => new GlowFilter({
        innerStrength: 0,
        outerStrength: 2,
        distance: 24,
        color: theme.active.glow,
    }), [theme.active.glow]);
    const activeBackground = useMemo((): ContainerBackground => ({
        shape: ContainerBackgroundShape.Rectangle,
        cornerRadius: 8,
        fill: theme.active.fill,
        stroke: theme.active.stroke,
    }), [theme.active.fill, theme.active.stroke]);
    const inactiveBackground = useMemo((): ContainerBackground => ({
        shape: ContainerBackgroundShape.Rectangle,
        cornerRadius: 8,
        fill: theme.inactive.fill,
        stroke: theme.inactive.stroke,
    }), [theme.inactive.fill, theme.inactive.stroke]);

    useTick("app", (timestamp, elapsed) => {
        if (!container.current) {
            return;
        }
        const { width, height } = container.current.layout.computedLayout;
        const alphaDiff = elapsed / TRANSITION_TIME;
        const glowDiff = alphaDiff * 2;

        let needsBackgroundRedraw = width !== lastWidth.current || height !== lastHeight.current;

        if (!active && hovering) {
            inactiveGlowFilter.outerStrength = Math.min(2, inactiveGlowFilter.outerStrength + glowDiff);
            needsBackgroundRedraw = true;
        } else if (inactiveGlowFilter.outerStrength) {
            inactiveGlowFilter.outerStrength = Math.max(0, inactiveGlowFilter.outerStrength - glowDiff);
            needsBackgroundRedraw = true;
        }

        if (active) {
            activeGraphics.current!.alpha = Math.min(1, activeGraphics.current!.alpha + alphaDiff);
            activeGraphics.current!.visible = true;
            needsBackgroundRedraw = true;
        } else if (activeGraphics.current!.visible) {
            activeGraphics.current!.alpha = Math.max(0, activeGraphics.current!.alpha - alphaDiff);
            activeGraphics.current!.visible = activeGraphics.current!.alpha > 0;
            needsBackgroundRedraw = true;
        }

        if (needsBackgroundRedraw) {
            inactiveGraphics.current!.clear();
            drawContainerBackground(inactiveGraphics.current!, inactiveBackground, width, height);
            if (activeGraphics.current!.visible) {
                activeGraphics.current!.clear();
                drawContainerBackground(activeGraphics.current!, activeBackground, width, height);
            }
            lastWidth.current = width;
            lastHeight.current = height;
        }
    });

    const onPointerOver = () => setHovering(true);
    const onPointerOut = () => setHovering(false);
    const onPointerDown = () => setActive(enabled && !loading);
    const onPointerUp = () => setActive(false);
    const onPointerTap = () => {
        if (enabled && !loading) {
            onClick();
        }
    };

    return (
        <Container
            {...props}
            ref={container}
            flexContainer
            interactive={enabled}
            buttonMode={enabled}
            on:pointertap={onPointerTap}
            on:pointerover={onPointerOver}
            on:pointerout={onPointerOut}
            on:pointerdown={onPointerDown}
            on:pointerup={onPointerUp}
            on:pointerupoutside={onPointerUp}
            layoutStyle={{
                ...props.layoutStyle,
                paddingX: 14,
                paddingY: 10,
                flexDirection: FlexDirection.Row,
                alignItems: Align.Center,
            }}
        >
            <Graphics
                ref={inactiveGraphics}
                layoutStyle={{ excluded: true }}
                filters={[inactiveGlowFilter]}
            />
            <Graphics
                ref={activeGraphics}
                alpha={0}
                layoutStyle={{ excluded: true }}
                filters={[activeGlowFilter]}
            />
            {imageUrl ? <Image
                url={imageUrl}
                alpha={theme.textAlpha}
                layoutStyle={{
                    width: 20,
                    height: 20,
                    marginRight: 8,
                }}
                renderable={!loading}
            /> : null}
            <Text
                text={text}
                alpha={theme.textAlpha}
                style={{ ...FONT_STYLE, fontSize: 20, fill: theme.textColor }}
                renderable={!loading}
            />
            {loading ? <LoadingAnimation
                diameter={24}
                color={theme.textColor}
                alpha={theme.textAlpha}
                layoutStyle={{
                    position: PositionType.Absolute,
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}
            /> : null}
        </Container>
    );
};

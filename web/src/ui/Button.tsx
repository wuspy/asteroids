import { FederatedPointerEvent } from "@pixi/events";
import { GlowFilter } from "@pixi/filter-glow";
import { Show, createRenderEffect, mergeProps, splitProps } from "solid-js";
import { onTick } from "../AppContext";
import { ContainerBackgroundShape } from "../layout";
import { ContainerProps } from "../solid-pixi";
import { Image } from "./Image";
import { LoadingAnimation } from "./LoadingAnimation";
import { BUTTON_THEMES, ButtonType } from "./theme";
import { Container } from "@pixi/display";

const TRANSITION_TIME = 0.25;

interface ButtonProps extends ContainerProps {
    type: ButtonType;
    text: string;
    imageUrl?: string;
    enabled?: boolean;
    loading?: boolean;
    onClick: () => void;
}

const defaultProps = {
    enabled: true,
    loading: false,
};

export const Button = (_props: ButtonProps) => {
    const [props, childProps] = splitProps(
        mergeProps(defaultProps, _props),
        ["type", "text", "imageUrl", "enabled", "loading", "onClick"]
    );

    const theme = () => BUTTON_THEMES[props.type];
    let active = false;
    let hovering = false;
    let activeBackground!: Container;

    const inactiveGlowFilter = new GlowFilter({
        innerStrength: 0,
        outerStrength: 0,
        distance: 24,
    });
    inactiveGlowFilter.enabled = false;

    const activeGlowFilter = new GlowFilter({
        innerStrength: 0,
        outerStrength: 2,
        distance: 24,
    });

    createRenderEffect(() => {
        inactiveGlowFilter.color = theme().inactive.glow;
        activeGlowFilter.color = theme().active.glow;
    });

    onTick("app", (timestamp, elapsed) => {
        const alphaDiff = elapsed / TRANSITION_TIME;
        const glowDiff = alphaDiff * 2;

        if (!active && hovering) {
            inactiveGlowFilter.outerStrength = Math.min(2, inactiveGlowFilter.outerStrength + glowDiff);
            inactiveGlowFilter.enabled = true;
        } else if (inactiveGlowFilter.outerStrength) {
            inactiveGlowFilter.outerStrength = Math.max(0, inactiveGlowFilter.outerStrength - glowDiff);
        } else {
            inactiveGlowFilter.enabled = false;
        }

        if (active) {
            activeBackground.alpha = Math.min(1, activeBackground.alpha + alphaDiff);
            activeBackground.visible = true;
        } else if (activeBackground.alpha) {
            activeBackground.alpha = Math.max(0, activeBackground.alpha - alphaDiff);
        } else {
            activeBackground.visible = false;
        }
    });

    const onPointerOver = () => hovering = true;
    const onPointerOut = () => hovering = false;
    const onPointerDown = (e: FederatedPointerEvent) => {
        if (e.button === 0 && props.enabled && !props.loading) {
            active = true;
        }
    };
    const onPointerUp = (e: FederatedPointerEvent) => {
        if (e.button === 0) {
            active = false;
        }
    };
    const onPointerTap = (e: FederatedPointerEvent) => {
        if (e.button === 0 && props.enabled && !props.loading) {
            props.onClick();
        }
    };

    return (
        <container
            {...childProps}
            backgroundStyle={{
                shape: ContainerBackgroundShape.Rectangle,
                cornerRadius: 8,
                fill: theme().inactive.fill,
                stroke: theme().inactive.stroke,
            }}
            filters={[inactiveGlowFilter]}
            flexContainer
            eventMode={props.enabled ? "static" : "auto"}
            cursor="pointer"
            on:pointertap={onPointerTap}
            on:pointerover={onPointerOver}
            on:pointerout={onPointerOut}
            on:pointerdown={onPointerDown}
            on:pointerup={onPointerUp}
            on:pointerupoutside={onPointerUp}
            yg:paddingX={14}
            yg:paddingY={10}
            yg:flexDirection="row"
            yg:alignItems="center"
        >
            <container
                alpha={0}
                visible={false}
                ref={activeBackground}
                backgroundStyle={{
                    shape: ContainerBackgroundShape.Rectangle,
                    cornerRadius: 8,
                    fill: theme().active.fill,
                    stroke: theme().active.stroke,
                }}
                yg:position="absolute"
                yg:inset={0}
                filters={[activeGlowFilter]}
            />
            <Show when={props.imageUrl}>
                {url => <Image
                    url={url()}
                    alpha={theme().textAlpha}
                    yg:width={20}
                    yg:aspectRatio={1}
                    yg:marginRight={8}
                    renderable={!props.loading}
                />}
            </Show>
            <text
                text={props.text}
                alpha={theme().textAlpha}
                style:fontSize={20}
                style:fill={theme().textColor}
                renderable={!props.loading}
            />
            <Show when={props.loading}>
                <LoadingAnimation
                    diameter={24}
                    color={theme().textColor}
                    alpha={theme().textAlpha}
                    yg:position="absolute"
                    yg:inset={0}
                />
            </Show>
        </container>
    );
};

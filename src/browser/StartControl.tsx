import { GlowFilter } from "@pixi/filter-glow";
import anime from "animejs";
import { useMemo } from "react";
import { useApp, useTick } from "./AppContext";
import { FlexDirection } from "./layout";
import { ContainerProps } from "./react-pixi"
import { ControlDescription, getControlGraphicParamsFromMapping } from "./ui";

export interface StartControlProps extends ContainerProps {
    resume?: boolean;
}

export const StartControl = ({ resume = false, ...props }: StartControlProps) => {
    const { input, theme } = useApp();

    const glowFilter = useMemo(() => new GlowFilter({
        innerStrength: 0,
        outerStrength: 0,
        distance: 24,
        color: theme.foregroundColor,
    }), [theme.foregroundColor]);

    const anim = useMemo(() =>
        anime.timeline({
            autoplay: false,
            loop: true,
            direction: "alternate",
        }).add({
            easing: "linear",
            duration: 1500,
            targets: glowFilter,
            outerStrength: 2.5,
            innerStrength: 2,
        }),
        [glowFilter]
    );

    useTick("app", anim.tick);

    return (
        <ControlDescription
            {...props}
            {...getControlGraphicParamsFromMapping("start", input.mapping)!}
            interactive
            buttonMode
            filters={[glowFilter]}
            foreground={theme.foregroundContrastColor}
            background={theme.foregroundColor}
            fontSize={32}
            beforeLabel="Press"
            afterLabel={resume ? "to resume" : "to play"}
            direction={FlexDirection.Row}
        />
    );
}

import { GlowFilter } from "@pixi/filter-glow";
import anime from "animejs";
import { useMemo } from "react";
import { useApp, useTick } from "./AppContext";
import { FlexDirection } from "./layout";
import { ContainerProps } from "./react-pixi"
import { ControlDescription } from "./ui";

export interface StartControlProps extends ContainerProps {
    color: number;
    resume?: boolean;
}

export const StartControl = ({ resume = false, ...props }: StartControlProps) => {
    const { theme } = useApp();

    const glowFilter = useMemo(() => new GlowFilter({
        innerStrength: 0.25,
        outerStrength: 0.25,
        distance: 24,
        color: theme.foregroundColor,
    }), [theme.foregroundColor]);

    const anim = useMemo(() =>
        anime({
            autoplay: false,
            loop: true,
            direction: "alternate",
            easing: "easeInOutSine",
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
            control="start"
            interactive
            cursor="pointer"
            filters={[glowFilter]}
            size={32}
            beforeLabel="Press"
            afterLabel={resume ? "to resume" : "to play"}
            direction={FlexDirection.Row}
        />
    );
}

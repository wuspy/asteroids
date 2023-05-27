import { GlowFilter } from "@pixi/filter-glow";
import anime from "animejs";
import { createRenderEffect, splitProps } from "solid-js";
import { onTick, useApp } from "./AppContext";
import { ContainerProps } from "./solid-pixi";
import { ControlDescription } from "./ui";

export interface StartControlProps extends ContainerProps {
    color: number;
    type: "start" | "resume";
}

export const StartControl = (_props: StartControlProps) => {
    const [props, childProps] = splitProps(_props, ["type"]);

    const { theme } = useApp();

    const glowFilter = new GlowFilter({
        innerStrength: 0.25,
        outerStrength: 0.25,
        distance: 24,
    });

    createRenderEffect(() => glowFilter.color = theme().foregroundColor);

    const anim = anime({
        autoplay: false,
        loop: true,
        direction: "alternate",
        easing: "easeInOutSine",
        duration: 1500,
        targets: glowFilter,
        outerStrength: 2.5,
        innerStrength: 2,
    });

    onTick("app", anim.tick);

    return (
        <ControlDescription
            {...childProps}
            control="start"
            eventMode="static"
            cursor="pointer"
            filters={[glowFilter]}
            size={32}
            beforeLabel="Press"
            afterLabel={props.type === "resume" ? "to resume" : "to play"}
            direction="row"
        />
    );
}

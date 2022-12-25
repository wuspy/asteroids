import { ForwardedRef, forwardRef, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { AlphaFilter } from "@pixi/filter-alpha";
import { KawaseBlurFilter } from "@pixi/filter-kawase-blur";
import anime from "animejs";
import { Container, ContainerProps, RefType } from "../react-pixi";
import { useTick } from "../AppContext";

export interface FadeContainerProps extends ContainerProps {
    fadeInDuration: number;
    fadeOutDuration: number;
    fadeOutExtraDelay?: number;
    keepPixiVisible?: boolean;
    keepMounted?: boolean;
    fadeInAmount?: number;
    fadeOutAmount?: number;
    blur?: number;
    filterPadding?: number;
    onFadeInComplete?: () => void;
    onFadeOutComplete?: () => void;
}

export const FadeContainer = forwardRef(({
    children,
    visible = true,
    fadeInDuration,
    fadeOutDuration,
    fadeOutExtraDelay = 0,
    keepPixiVisible = false,
    keepMounted = false,
    interactiveChildren = true,
    fadeInAmount = 1,
    fadeOutAmount = 0,
    blur = 8,
    filterPadding = blur,
    onFadeInComplete,
    onFadeOutComplete,
    filters: otherFilters,
    ...props
}: FadeContainerProps, ref: ForwardedRef<RefType<typeof Container>>) => {
    const alphaFilter = useMemo(() => {
        const filter = new AlphaFilter();
        filter.alpha = visible ? fadeInAmount : fadeOutAmount;
        filter.enabled = filter.alpha < 1;
        return filter;
    }, []);

    const blurFilter = useMemo(() => {
        const filter = new KawaseBlurFilter((1 - (visible ? fadeInAmount : fadeOutAmount)) * blur);
        filter.enabled = filter.blur > 0;
        return filter;
    }, []);

    const [anim, setAnim] = useState<anime.AnimeTimelineInstance>();
    const [wasVisible, setWasVisible] = useState(visible);

    useLayoutEffect(() => {
        blurFilter.padding = alphaFilter.padding = filterPadding;
    }, [filterPadding]);

    useEffect(() => {
        if (process.env.NODE_ENV === "development" && fadeInAmount <= fadeOutAmount) {
            console.error("fadeInAmount <= fadeOutAmount");
            return;
        }
        if (visible && !wasVisible) {
            alphaFilter.enabled = true;
            const anim = anime.timeline({
                autoplay: false,
                easing: "linear",
                duration: fadeInDuration,
                complete: () => {
                    alphaFilter.enabled = fadeInAmount < 1;
                    blurFilter.enabled = blurFilter.enabled && alphaFilter.enabled;
                    setAnim(undefined);
                    onFadeInComplete && onFadeInComplete();
                },
            }).add({
                targets: alphaFilter,
                alpha: fadeInAmount,
            }, 0);
            if (blur) {
                blurFilter.enabled = true;
                anim.add({
                    targets: blurFilter,
                    blur: blur * (1.01 - fadeInAmount),
                }, 0);
            }
            setAnim(anim);
            setWasVisible(visible);
        } else if (!visible && wasVisible) {
            alphaFilter.enabled = true;
            const anim = anime.timeline({
                autoplay: false,
                duration: fadeOutDuration,
                endDelay: fadeOutExtraDelay,
                easing: "linear",
                complete: () => {
                    setAnim(undefined);
                    onFadeOutComplete && onFadeOutComplete();
                },
            }).add({
                targets: alphaFilter,
                alpha: fadeOutAmount,
            }, 0);
            if (blur) {
                blurFilter.enabled = true;
                anim.add({
                    targets: blurFilter,
                    blur: blur * (1.01 - fadeOutAmount),
                }, 0);
            }
            setAnim(anim);
            setWasVisible(visible);
        }
    }, [visible, fadeInDuration, fadeOutDuration, fadeOutExtraDelay, blur, alphaFilter, blurFilter]);

    useTick("app", (timestamp) => anim!.tick(timestamp), !!anim);

    const renderable = visible || visible !== wasVisible || !!fadeOutAmount || !!anim;

    return <Container
        {...props}
        ref={ref}
        interactiveChildren={interactiveChildren && visible}
        filters={[alphaFilter, blurFilter, ...otherFilters || []]}
        renderable={renderable}
        visible={renderable || keepPixiVisible}
    >
        {(renderable || keepMounted) && children}
    </Container>;
});

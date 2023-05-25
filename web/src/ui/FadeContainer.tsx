import { AlphaFilter } from "@pixi/filter-alpha";
import { KawaseBlurFilter } from "@pixi/filter-kawase-blur";
import { Show, createMemo, createRenderEffect, createSignal, mergeProps, splitProps } from "solid-js";
import { onTick } from "../AppContext";
import { ContainerProps } from "../solid-pixi";

export interface FadeContainerProps extends Omit<ContainerProps, "visible" | "renderable"> {
    visible: number | boolean;
    fadeInDuration: number;
    fadeOutDuration: number;
    fadeOutExtraDelay?: number;
    keepPixiVisible?: boolean;
    keepMounted?: boolean;
    blur?: number;
    filterPadding?: number;
    onFadeInComplete?: () => void;
    onFadeOutComplete?: () => void;
}

const defaultProps = {
    visible: true,
    fadeOutExtraDelay: 0,
    keepPixiVisible: false,
    keepMounted: false,
    interactiveChildren: true,
    blur: 8,
    filterPadding: 0,
};

export const FadeContainer = (_props: FadeContainerProps) => {
    const [props, childProps] = splitProps(
        mergeProps(defaultProps, _props),
        [
            "children",
            "visible",
            "fadeInDuration",
            "fadeOutDuration",
            "fadeOutExtraDelay",
            "keepPixiVisible",
            "keepMounted",
            "interactiveChildren",
            "blur",
            "filterPadding",
            "onFadeInComplete",
            "onFadeOutComplete",
            "filters"
        ]
    );

    let [amount, setAmount] = createSignal(Number(props.visible));
    const renderable = createMemo(() => !!amount());

    const alphaFilter = new AlphaFilter();
    const blurFilter = new KawaseBlurFilter();

    createRenderEffect(() => {
        alphaFilter.enabled = renderable() && amount() < 1;
        blurFilter.enabled = renderable() && !!props.blur && amount() < 1;
        alphaFilter.alpha = amount();
        blurFilter.blur = (1 - amount()) * props.blur;    
    });

    createRenderEffect(() => {
        blurFilter.padding = alphaFilter.padding = props.filterPadding + props.blur;
    });

    onTick("app", (timestamp, elapsed) => {
        let target = Number(props.visible);
        if (target > amount()) {
            setAmount(amount => Math.min(target, amount + elapsed * 1000 / props.fadeInDuration));
        } else if (target < amount()) {
            setAmount(amount => Math.max(target, amount - elapsed * 1000 / props.fadeOutDuration));
        }
    }, () => Number(props.visible) !== amount());

    return <container
        {...childProps}
        interactiveChildren={props.interactiveChildren && amount() === 1}
        filters={[alphaFilter, blurFilter, ...props.filters || []]}
        renderable={renderable()}
        visible={renderable() || props.keepPixiVisible}
    >
        <Show when={renderable() || props.keepMounted}>
            {props.children}
        </Show>
    </container>;
};

import { Assets } from "@pixi/assets";
import { createResource, Show, splitProps } from "solid-js";
import { ContainerProps } from "../solid-pixi";
import { FadeContainer } from "./FadeContainer";

export interface ImageProps extends ContainerProps {
    url: string;
}

export const Image = (_props: ImageProps) => {
    const [props, childProps] = splitProps(_props, ["url"]);

    const [texture] = createResource(() =>
        Assets.cache.has(props.url)
            ? Assets.cache.get(props.url)
            : Assets.load(props.url)
    );

    return <FadeContainer
        {...childProps}
        flexContainer
        fadeInDuration={200}
        fadeOutDuration={200}
        keepPixiVisible
        keepMounted
        visible={!!texture()}
    >
        <Show when={!!texture()}>
            <sprite texture={texture()} />
        </Show>
    </FadeContainer>;
};

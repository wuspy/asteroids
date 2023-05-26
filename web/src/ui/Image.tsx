import { Texture } from "@pixi/core";
import { createResource, Show, splitProps } from "solid-js";
import { ContainerProps } from "../solid-pixi";
import { FadeContainer } from "./FadeContainer";

export interface ImageProps extends ContainerProps {
    url: string;
}

export const Image = (_props: ImageProps) => {
    const [props, childProps] = splitProps(_props, ["url"]);

    const [texture] = createResource(() => Texture.fromURL(props.url));

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

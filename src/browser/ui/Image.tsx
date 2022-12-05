import { ComponentProps, useEffect, useState } from "react";
import { Assets } from "@pixi/assets";
import { FadeContainer } from "./FadeContainer";
import { Container, Sprite } from "../react-pixi";

export interface ImageProps extends ComponentProps<typeof Container> {
    url: string;
}

export const Image = ({ url, ...props }: ImageProps) => {
    const [texture, setTexture] = useState(
        Assets.cache.has(url)
            ? Assets.cache.get(url)
            : undefined
    );

    useEffect(() => {
        if (texture) {
            return;
        }
        let isMounted = true;
        Assets.load(url).then(texture => isMounted && setTexture(texture));
        return () => {
            isMounted = false;
        };
    }, [url, texture]);

    return <FadeContainer
        {...props}
        flexContainer
        fadeInDuration={200}
        fadeOutDuration={200}
        keepPixiVisible
        keepMounted
        visible={!!texture}
    >
        {texture && <Sprite texture={texture} />}
    </FadeContainer>;
};

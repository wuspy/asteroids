import { ITextStyle } from "@pixi/text";
import { createEffect, splitProps } from "solid-js";
import { ContainerProps } from "./solid-pixi";
import { Button, Image, Modal } from "./ui";
import bootiesRoundedWebpUrl from "/assets/booties-rounded.webp";
import github64pxWebpUrl from "/assets/github-64px.webp";
import gkRoundedWebpUrl from "/assets/gk-rounded.webp";
import linkedin64pxWebpUrl from "/assets/linkedin-64px.webp";
import meRoundedWebpUrl from "/assets/me-rounded.webp";
import stormyRoundedWebpUrl from "/assets/stormy-rounded.webp";

interface CatProps extends ContainerProps {
    imageUrl: string;
    name: string;
    caption: string;
}

const Cat = (_props: CatProps) => {
    const [props, childProps] = splitProps(_props, ["imageUrl", "name", "caption"]);
    return (
        <container {...childProps} flexContainer yg:flexDirection="column" yg:alignItems="center" yg:marginX={8}>
            <Image url={props.imageUrl} yg:width={144} yg:aspectRatio={1} />
            <text
                text={props.name}
                yg:marginTop={8}
                yg:marginBottom={4}
                style:fontSize={18}
                style:lineHeight={24}
            />
            <text
                text={props.caption}
                style:fontSize={14}
                style:lineHeight={16}
                style:wordWrap
                style:align="center"
                alpha={0.5}
            />
        </container>
    );
}

const headerTextStyle: Partial<ITextStyle> = {
    fontSize: 48,
    lineHeight: 60,
    fontWeight: "bold",
};

export interface AboutMeModalProps {
    open: boolean;
    onClose: () => void;
}

export const AboutMeModal = (props: AboutMeModalProps) => {
    createEffect(() => {
        document.getElementById("branding")!.style.visibility = props.open ? "hidden" : "visible";
    });

    return <Modal open={props.open} onRequestClose={props.onClose} padding={24} yg:width={700}>
        <container flexContainer yg:flexDirection="column" yg:width="100%" yg:marginBottom={24}>
            <container flexContainer yg:marginTop={4} yg:marginBottom={12}>
                <text text="Hi!" style={headerTextStyle} />
                <text text="👋" style={headerTextStyle} yg:marginX={10} />
                <text text="I'm Jacob." style={headerTextStyle} />
            </container>
            <text
                text={"Thanks for checking out my\nsite and my little game :)"}
                style:fontSize={28}
                style:lineHeight={34}
                style:fontWeight="bold"
            />
            <Image
                url={meRoundedWebpUrl}
                yg:width={144}
                yg:aspectRatio={1}
                yg:position="absolute"
                yg:top={0}
                yg:right={0}
            />
        </container>
        <text
            text={
                "I'm a programmer, among other things. I currently work as a full-stack web developer using " +
                "Typescript, React, C#, PHP & MySQL, and I also have experience with Android/Kotlin, Rust, Svelte, SolidJS, C++, Arduino, and Qt/QML. " +
                "You can check out the source code for this website and other projects I've made on GitHub.\n\n" +

                "Besides programming? I like cycling, mountain biking, 3D printing & 3D modeling... " +
                "ok instead of boring you with my life story I'm just gonna show you some pictures of my cats."
            }
            style:fontSize={18}
            style:lineHeight={24}
            style:wordWrap
        />
        <container flexContainer yg:marginBottom={32} yg:marginTop={28} yg:justifyContent="space-around">
            <Cat name="Stormy" caption={"a very fitting name\nbut he's very sweet"} imageUrl={stormyRoundedWebpUrl} />
            <Cat name="Booties" caption={"cause her feet look\nlike little booties"} imageUrl={bootiesRoundedWebpUrl} />
            <Cat name="G.K." caption={"it stands for gray\nkitty don't judge me"} imageUrl={gkRoundedWebpUrl} />
        </container>
        <container flexContainer yg:alignSelf="center">
            <Button
                type="secondary"
                text="GitHub"
                imageUrl={github64pxWebpUrl}
                onClick={() => window.open("https://github.com/wuspy", "_blank")}
                yg:marginX={12}
            />
            <Button
                type="secondary"
                text="LinkedIn"
                imageUrl={linkedin64pxWebpUrl}
                onClick={() => window.open("https://linkedin.com/in/jacob-jordan-0b6831128", "_blank")}
                yg:marginX={12}
            />
            <Button
                type="secondary"
                text="Back to Game"
                onClick={props.onClose}
                yg:marginX={12}
            />
        </container>
    </Modal>;
};

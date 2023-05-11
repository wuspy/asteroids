import { useEffect } from "react";
import { ITextStyle } from "@pixi/text";
import { Align, FlexDirection, JustifyContent, PositionType } from "./layout";
import { Image, Button, Modal, ButtonType, FONT_STYLE } from "./ui";
import { Container, ContainerProps, Text } from "./react-pixi";

interface CatProps extends ContainerProps {
    imageUrl: string;
    name: string;
    caption: string;
}

const Cat = ({ imageUrl, name, caption, ...props }: CatProps) =>
    <Container
        {...props}
        flexContainer
        layoutStyle={{ ...props.layoutStyle, flexDirection: FlexDirection.Column, alignItems: Align.Center, marginX: 8 }}
    >
        <Image
            url={imageUrl}
            layoutStyle={{ width: 144, height: 144, marginBottom: 8 }}
        />
        <Text
            text={name}
            style={{ ...FONT_STYLE, fontSize: 20, lineHeight: 24 }}
        />
        <Text
            text={caption}
            style={{ ...FONT_STYLE, fontSize: 14, lineHeight: 16, wordWrap: true, align: "center" }}
            alpha={0.5}
        />
    </Container>;

const headerTextStyle: Partial<ITextStyle> = {
    ...FONT_STYLE,
    fontSize: 50,
    lineHeight: 60,
    fontWeight: "bold",
};

const onGithubClick = () => window.open("https://github.com/wuspy", "_blank");
const onLinkedinClick = () => window.open("https://linkedin.com/in/jacob-jordan-0b6831128", "_blank");

export interface AboutMeModalProps {
    open: boolean;
    onClose: () => void;
}

export const AboutMeModal = ({ open, onClose }: AboutMeModalProps) => {
    useEffect(() => {
        document.getElementById("branding")!.style.visibility = open ? "hidden" : "visible";
    }, [open]);

    return <Modal open={open} onRequestClose={onClose} padding={24} layoutStyle={{ width: 700 }}>
        <Container
            flexContainer
            layoutStyle={{ flexDirection: FlexDirection.Column, width: "100%", marginBottom: 24 }}
        >
            <Container flexContainer layoutStyle={{ marginTop: 4, marginBottom: 12 }}>
                <Text text="Hi!" style={headerTextStyle} />
                <Text text="👋" style={headerTextStyle} layoutStyle={{ marginX: 10 }} />
                <Text text="I'm Jacob." style={headerTextStyle} />
            </Container>
            <Text
                text={"Thanks for checking out my\nsite and my little game :)"}
                style={{ ...FONT_STYLE, fontSize: 28, lineHeight: 32, fontWeight: "bold" }}
            />
            <Image
                url="/assets/me.webp"
                layoutStyle={{ width: 144, height: 144, position: PositionType.Absolute, top: 0, right: 0 }}
            />
        </Container>
        <Text
            text={
                "I'm a programmer, among other things. I currently work as a full-stack web developer using " +
                "Typescript, React, C#, PHP & MySQL, and I also have experience with Android/Kotlin, Rust, and C++/Qt/QML. " +
                "You can check out the source code for this website and other projects I've made on GitHub.\n\n" +

                "Besides programming? Hmm... I like cycling, mountain biking, 3D printing & 3D modeling... " +
                "ok instead of boring you with my life story I'm just gonna show you some pictures of my cats."
            }
            style={{ ...FONT_STYLE, fontSize: 20, lineHeight: 24, wordWrap: true }}
        />
        <Container flexContainer layoutStyle={{ marginY: 32, justifyContent: JustifyContent.SpaceAround }}>
            <Cat name="Stormy" caption={"a very fitting name\nbut he's very sweet"} imageUrl="/assets/stormy.webp" />
            <Cat name="Booties" caption={"cause her feet look\nlike little booties"} imageUrl="/assets/booties.webp" />
            <Cat name="G.K." caption={"it stands for gray\nkitty don't judge me"} imageUrl="/assets/gk.webp" />
        </Container>
        <Container flexContainer layoutStyle={{ alignSelf: Align.Center }}>
            <Button
                type={ButtonType.Secondary}
                text="GitHub"
                imageUrl="/assets/github-64px.webp"
                onClick={onGithubClick}
                layoutStyle={{ marginX: 12 }}
            />
            <Button
                type={ButtonType.Secondary}
                text="LinkedIn"
                imageUrl="/assets/linkedin-64px.webp"
                onClick={onLinkedinClick}
                layoutStyle={{ marginX: 12 }}
            />
            <Button
                type={ButtonType.Secondary}
                text="Back to Game"
                onClick={onClose}
                layoutStyle={{ marginX: 12 }}
            />
        </Container>
    </Modal>;
};

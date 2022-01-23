import { Container } from "@pixi/display";
import { Loader } from "@pixi/loaders";
import { TickQueue } from "./engine";
import { Align, FlexDirection, JustifyContent, PositionType } from "./layout";
import { ButtonType, UI_FOREGROUND_COLOR } from "./Theme";
import { Image, Button, LinearGroup, Modal, Text } from "./ui";

export class AboutMeModal extends Modal {
    constructor(params: {
        queue: TickQueue,
        onClose: () => void
    }) {
        super({ queue: params.queue });
        if (!Loader.shared.resources["github-64px.webp"]) {
            Loader.shared.add("github-64px.webp", "assets/github-64px.webp");
        }
        if (!Loader.shared.resources["linkedin-64px.webp"]) {
            Loader.shared.add("linkedin-64px.webp", "assets/linkedin-64px.webp");
        }
        if (!Loader.shared.resources["me.webp"]) {
            Loader.shared.add("me.webp", "assets/me.webp");
        }
        if (!Loader.shared.resources["booties.webp"]) {
            Loader.shared.add("booties.webp", "assets/booties.webp");
        }
        if (!Loader.shared.resources["stormy.webp"]) {
            Loader.shared.add("stormy.webp", "assets/stormy.webp");
        }
        if (!Loader.shared.resources["gk.webp"]) {
            Loader.shared.add("gk.webp", "assets/gk.webp");
        }
        Loader.shared.load();

        const header = new Text("Hi!👋I'm Jacob.", {
            fontSize: 50,
            lineHeight: 60,
            fill: UI_FOREGROUND_COLOR,
            fontWeight: "bold",
        });
        this.layout.style({
            padding: 24,
            width: 660,
        });
        header.layout.style({
            marginTop: 4,
            marginBottom: 12,
        });

        const subheader = new Text("Thanks for checking out my site and my little game :)", {
            fontSize: 28,
            fill: UI_FOREGROUND_COLOR,
            lineHeight: 32,
            fontWeight: "bold",
            wordWrap: true,
            wordWrapWidth: 440,
        });

        const avatar = new Image({
            queue: this.queue,
            resource: "me.webp",
        });
        avatar.layout.style({
            width: 144,
            height: 144,
            position: PositionType.Absolute,
            top: 0,
            right: 0,
        });

        const headerContainer = new Container();
        headerContainer.flexContainer = true;
        headerContainer.layout.style({
            flexDirection: FlexDirection.Column,
            width: [100, "%"],
            marginBottom: 24,
        });

        headerContainer.addChild(header);
        headerContainer.addChild(subheader);
        headerContainer.addChild(avatar);
        // headerContainer.debugLayout = true;

        this.addChild(headerContainer);
        // this.addChild(new Divider(24));

        const bio = new Text("I'm a programmer, among other things. I currently work as a full-stack web developer using Typescript, React, C#, PHP & MySQL, and I also have experience with Android/Kotlin, Rust, and C++/Qt/QML. You can check out the source code for this website and other projects I've made on GitHub.\n\nBesides programming? Hmm... I like cycling, mountain biking, 3D printing & 3D modeling... ok instead of boring you with my life story I'm just gonna show you some pictures of my cats.", {
            fontSize: 20,
            lineHeight: 24,
            fill: UI_FOREGROUND_COLOR,
            wordWrap: true,
        });
        bio.layout.width = [100, "%"];

        this.addChild(bio);

        const cats = new Container();
        cats.flexContainer = true;
        cats.layout.style({
            flexDirection: FlexDirection.Row,
            marginVertical: 32,
            justifyContent: JustifyContent.SpaceAround,
        });

        cats.addChild(new Cat({
            queue: this.queue,
            caption: "Stormy",
            subCaption: "a very fitting name but he's very sweet",
            resource: "stormy.webp",
        }));
        cats.addChild(new Cat({
            queue: this.queue,
            caption: "Booties",
            subCaption: "cause her feet look like little booties",
            resource: "booties.webp",
        }));
        cats.addChild(new Cat({
            queue: this.queue,
            caption: "G.K.",
            subCaption: "it stands for gray kitty don't judge me",
            resource: "gk.webp",
        }));

        this.addChild(cats);

        const buttons = new LinearGroup(FlexDirection.Row, 24, [
            new Button({
                queue: this.queue,
                type: ButtonType.Secondary,
                text: "GitHub",
                imageResource: "github-64px.webp",
                onClick: () => window.open("https://github.com/wuspy", "_blank"),
            }),
            new Button({
                queue: this.queue,
                type: ButtonType.Secondary,
                text: "LinkedIn",
                imageResource: "linkedin-64px.webp",
                onClick: () => window.open("https://linkedin.com/in/jacob-jordan-0b6831128", "_blank"),
            }),
            new Button({
                queue: this.queue,
                type: ButtonType.Secondary,
                text: "Back to Game",
                onClick: params.onClose,
            }),
        ]);
        buttons.layout.alignSelf = Align.Center;
        
        this.addChild(buttons);
    }

    protected override onFadeInStart(): void {
        document.getElementById("branding")!.style.visibility = "hidden";
    }

    protected override onHidden(): void {
        document.getElementById("branding")!.style.visibility = "visible";   
    }
}

class Cat extends Container {
    constructor(params: {
        queue: TickQueue,
        caption: string,
        subCaption: string,
        resource: string,
    }) {
        super();
        this.flexContainer = true;
        this.layout.style({
            flexDirection: FlexDirection.Column,
            alignItems: Align.Center,
            marginHorizontal: 8,
        });
        
        const avatar = new Image({
            queue: params.queue,
            resource: params.resource,
        });
        avatar.layout.style({
            width: 144,
            height: 144,
            marginBottom: 8,
        });

        const text = new Text(params.caption, {
            fontSize: 20,
            lineHeight: 24,
            fill: UI_FOREGROUND_COLOR,
        });
        text.cacheAsBitmap = true;

        this.addChild(avatar);
        this.addChild(text);

        const subText = new Text(params.subCaption, {
            fontSize: 14,
            lineHeight: 16,
            fill: UI_FOREGROUND_COLOR,
            wordWrap: true,
            align: "center",
            wordWrapWidth: 164,
        });
        subText.alpha = 0.5;
        this.addChild(subText);
    }
}

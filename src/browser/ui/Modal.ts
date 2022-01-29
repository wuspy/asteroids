import { Container, DisplayObject } from "@pixi/display";
import { TickQueue } from "@core/engine";
import { Text } from "./Text";
import { Align, FlexDirection, JustifyContent, PositionType } from "../layout";
import { MODAL_BACKGROUND, UI_FOREGROUND_COLOR } from "./theme";
import { Divider } from "./Divider";
import { FadeContainer } from "./FadeContainer";

export class Modal extends FadeContainer {
    public constructor(params: {
        queue: TickQueue,
        header?: {title: string, rightContent?: DisplayObject},
    }) {
        super({
            queue: params.queue,
            fadeInDuration: 200,
            fadeOutDuration: 200,
        });
        this.flexContainer = true;
        this.backgroundStyle = MODAL_BACKGROUND;
        this.layout.style({
            position: PositionType.Absolute,
            flexDirection: FlexDirection.Column,
            padding: 12,
        });

        if (params.header) {
            const headerContainer = new Container();
            headerContainer.flexContainer = true;
            headerContainer.layout.style({
                width: "100%",
                alignItems: Align.Center,
                justifyContent: JustifyContent.SpaceBetween,
            });
            const title = new Text(params.header.title, {
                fontSize: 32,
                fill: UI_FOREGROUND_COLOR,
            });
            title.cacheAsBitmap = true;
            headerContainer.addChild(title);
            if (params.header.rightContent) {
                title.layout.marginRight = 12;
                headerContainer.addChild(params.header.rightContent);
            }
            this.addChild(headerContainer);
            this.addChild(new Divider());
        }
    }
}

import { TickQueue } from "@core/engine";
import { Container } from "@pixi/display";
import { random, EventManager } from "@core/engine";
import { HighScoreResponse } from "@core/api";
import { LeaderboardListItem } from "./LeaderboardListItem";
import { Align, FlexDirection, JustifyContent, PositionType } from "./layout";
import { Button, ButtonType, LinearGroup, LoadingAnimation, Modal, Text, UI_FOREGROUND_COLOR, VirtualizedList } from "./ui";
import { UIEvents } from "./UIEvents";
import { getHighScores } from "./api";

export class LeaderboardModal extends Modal {
    constructor(params: {
        queue: TickQueue;
        events: EventManager<UIEvents>;
        apiRoot: string;
    }) {
        super({
            queue: params.queue,
            header: {
                title: "Leaderboard",
                rightContent: new Button({
                    queue: params.queue,
                    type: ButtonType.Secondary,
                    text: "[x]",
                    onClick: () => params.events.trigger("closeLeaderboard"),
                }),
            },
        });
        const content = new Container();
        content.flexContainer = true;
        content.layout.flexDirection = FlexDirection.Column;
        content.layout.padding = 12;
        this.addChild(content);

        const list = new VirtualizedList({
            queue: params.queue,
            items: [],
            itemRenderer: (item, index) => new LeaderboardListItem(index, item),
            itemHeight: LeaderboardListItem.HEIGHT
        });
        list.layout.style({
            width: 500,
            height: 400,
        });
        content.addChild(list);

        const loader = new LoadingAnimation({
            queue: this.queue,
            diameter: 100,
            color: UI_FOREGROUND_COLOR,
        });
        const loaderText = new Text("Connecting to mainframe...", {
            fontSize: 20,
            fill: UI_FOREGROUND_COLOR
        });
        const loaderContainer = new LinearGroup(FlexDirection.Column, 24, [loader, loaderText]);
        loader.layout.style({
            position: PositionType.Absolute,
            alignItems: Align.Center,
            justifyContent: JustifyContent.Center,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        });
        content.addChild(loaderContainer);
        getHighScores(params.apiRoot).then((response) => {
            if (response.ok) {
                content.removeChild(loaderContainer);
            }
        });
    }
}

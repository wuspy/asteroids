import { TickQueue } from "@core/engine";
import { Container } from "@pixi/display";
import { EventManager } from "@core/engine";
import { LeaderboardListItem } from "./LeaderboardListItem";
import { Align, FlexDirection, JustifyContent, PositionType } from "./layout";
import { Button, ButtonType, Divider, DividerDirection, LinearGroup, LoadingAnimation, Modal, Text, UI_FOREGROUND_COLOR, VirtualizedList } from "./ui";
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
        content.layout.style({
            width: 800,
            height: 390,
        });
        this.addChild(content);

        const loader = new LoadingAnimation({
            queue: this.queue,
            diameter: 120,
            color: UI_FOREGROUND_COLOR,
        });
        const loaderText = new Text("Connecting to mainframe...", {
            fontSize: 20,
            fill: UI_FOREGROUND_COLOR,
            wordWrap: true,
            align: "center",
        });
        const loaderContainer = new LinearGroup(FlexDirection.Column, 24, [loader, loaderText]);
        loaderContainer.layout.style({
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
            if (!response.ok) {
                loader.visible = false;
                loaderText.text = "Error contacting server. Try again later.";
            } else if (!response.data.length) {
                loader.visible = false;
                loaderText.text = "There's nothing here.";
            } else {
                const { data } = response;
                content.removeChild(loaderContainer);

                const list = new VirtualizedList({
                    queue: params.queue,
                    data,
                    itemFactory: () => {
                        const item = new LeaderboardListItem();
                        item.onClick = (data, index) => selectItem(index);
                        return item;
                    },
                    itemHeight: LeaderboardListItem.HEIGHT,
                    overscroll: 12,
                });
                list.layout.style({
                    width: 400,
                    height: "100%",
                    flexShrink: 0,
                });

                const selectedGameContainer = new Container();
                selectedGameContainer.flexContainer = true;
                selectedGameContainer.layout.style({
                    flexDirection: FlexDirection.Column,
                    alignItems: Align.Center,
                });

                const header = new Container();
                header.flexContainer = true;
                header.layout.marginTop = 8;
                selectedGameContainer.addChild(header);

                const rankText = new Text("", { fontSize: 32 });
                rankText.alpha = 0.25;
                rankText.layout.marginRight = 12;
                header.addChild(rankText);
                const nameText = new Text("", { fontSize: 32 });
                header.addChild(nameText);

                let divider = new Divider(DividerDirection.Horizontal, 24);
                divider.layout.width = 200;
                selectedGameContainer.addChild(divider);

                const scoreAndTimeContainer = new Container();
                scoreAndTimeContainer.flexContainer = true;
                scoreAndTimeContainer.layout.width = "100%";
                selectedGameContainer.addChild(scoreAndTimeContainer);

                const scoreHeaderText = new Text("Score", { fontSize: 32 });
                scoreHeaderText.alpha = 0.25;

                const scoreText = new Text("", { fontSize: 32 });
                const scoreContainer = new LinearGroup(FlexDirection.Column, 8, [
                    scoreHeaderText,
                    scoreText,
                ]);
                scoreContainer.layout.width = "50%";
                scoreAndTimeContainer.addChild(scoreContainer);

                const timeHeaderText = new Text("Time", { fontSize: 32 });
                timeHeaderText.alpha = 0.25;

                const timeText = new Text("", { fontSize: 32 });
                const timeContainer = new LinearGroup(FlexDirection.Column, 8, [
                    timeHeaderText,
                    timeText,
                ]);
                timeContainer.layout.width = "50%";
                scoreAndTimeContainer.addChild(timeContainer);

                divider = new Divider(DividerDirection.Horizontal, 24);
                divider.layout.width = 200;
                selectedGameContainer.addChild(divider);

                const detailHeaders = new LinearGroup(FlexDirection.Column, 8, [
                    new Text("Level Reached", { fontSize: 20 }),
                    new Text("Shots Fired", { fontSize: 20 }),
                    new Text("Accuracy", { fontSize: 20 }),
                    new Text("Asteroids Hit", { fontSize: 20 }),
                    new Text("Saucers Hit", { fontSize: 20 }),
                ]);
                detailHeaders.layout.alignItems = Align.FlexEnd;
                detailHeaders.layout.width = "60%";
                detailHeaders.layout.marginRight = 8;
                detailHeaders.alpha = 0.25;

                const levelText = new Text("", { fontSize: 20 });
                const shotsFiredText = new Text("", { fontSize: 20 });
                const accuracyText = new Text("", { fontSize: 20 });
                const asteroidsHitText = new Text("", { fontSize: 20 });
                const saucersHitText = new Text("", { fontSize: 20 });

                const detailValues = new LinearGroup(FlexDirection.Column, 8, [
                    levelText,
                    shotsFiredText,
                    accuracyText,
                    asteroidsHitText,
                    saucersHitText,
                ]);
                detailValues.layout.alignItems = Align.FlexStart;
                detailValues.layout.width = "40%";
                detailValues.layout.marginLeft = 8;

                const detailsContainer = new Container();
                detailsContainer.flexContainer = true;
                detailsContainer.addChild(detailHeaders, detailValues);
                selectedGameContainer.addChild(detailsContainer);

                content.addChild(list);
                content.addChild(new Divider(DividerDirection.Vertical, Modal.MARGIN));
                content.addChild(selectedGameContainer);

                const selectItem = (index: number) => {
                    const game = data[index];
                    if (game) {
                        nameText.text = game.name;
                        rankText.text = `#${index + 1}`;
                        scoreText.text = game.score.toFixed(0);

                        const seconds = Math.floor(game.duration / 1000);
                        timeText.text = `${Math.floor(seconds / 60).toFixed(0)}m ${(seconds % 60).toFixed(0)}s`;

                        levelText.text = game.level.toFixed(0);
                        shotsFiredText.text = game.shots.toFixed(0);
                        accuracyText.text = `${(game.accuracy * 100).toFixed(1)}%`;
                        asteroidsHitText.text = game.asteroids.toFixed(0);
                        saucersHitText.text = game.ufos.toFixed(0);

                        list.selections = [index];
                    }
                };
                selectItem(0);
            }
        });
    }
}

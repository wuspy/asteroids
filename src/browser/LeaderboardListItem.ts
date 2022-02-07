import { Container } from "@pixi/display";
import { HighScoreResponse } from "@core/api";
import { Text, UI_FOREGROUND_COLOR } from "./ui";
import { Align } from "./layout";

const SCORE_DIGITS = 7;

export class LeaderboardListItem extends Container {
    static readonly HEIGHT = 60;

    constructor(rank: number, item: HighScoreResponse) {
        super();

        this.flexContainer = true;
        this.layout.style({
            height: LeaderboardListItem.HEIGHT,
            flexGrow: 1,
            alignItems: Align.Center,
        });

        const rankContainer = new Container();
        rankContainer.flexContainer = true;
        rankContainer.addChild(new Text("[" + rank.toFixed(0) + "]", {
            fontSize: 32,
            fill: UI_FOREGROUND_COLOR,
        }));
        rankContainer.alpha = 0.25;

        this.addChild(rankContainer);

        const nameContainer = new Text(item.playerName, {
            fontSize: 32,
            fill: UI_FOREGROUND_COLOR,
        });
        nameContainer.layout.style({
            marginHorizontal: 12,
            flexGrow: 1,
        });
        this.addChild(nameContainer);

        const scoreText = item.score.toFixed(0);
        const scoreContainer = new Container();
        scoreContainer.flexContainer = true;
        if (scoreText.length < SCORE_DIGITS) {
            const zeroText = new Text(Array(SCORE_DIGITS - scoreText.length).fill("0").join(""), {
                fontSize: 32,
                fill: UI_FOREGROUND_COLOR,
            });
            zeroText.alpha = 0.25;
            scoreContainer.addChild(zeroText);
        }
        scoreContainer.addChild(new Text(scoreText, {
            fontSize: 32,
            fill: UI_FOREGROUND_COLOR,
        }));

        this.addChild(scoreContainer);
    }
}

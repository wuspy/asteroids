import { Container } from "@pixi/display";
import { HighScoreResponse } from "../core/api";
import { Text, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR, VirtualizedListItem } from "./ui";
import { Align, ContainerBackgroundShape  } from "./layout";
import { GlowFilter } from "@pixi/filter-glow";

export class LeaderboardListItem extends Container implements VirtualizedListItem<HighScoreResponse> {
    static readonly HEIGHT = 48;

    private readonly _rankText: Text;
    private readonly _nameText: Text;
    private readonly _scoreText: Text;
    private _data?: HighScoreResponse & { selected?: boolean };
    private _index?: number;
    selected: boolean;
    onClick?: (data: HighScoreResponse & { selected?: boolean }, index: number) => void;

    constructor() {
        super();

        this.selected = false;
        this.flexContainer = true;
        this.interactive = true;
        this.cursor = "pointer";
        this.on("pointertap", () => {
            if (this.onClick && this._data && this._index !== undefined) {
                this.onClick(this._data, this._index);
            }
        });
        this.layout.style({
            height: LeaderboardListItem.HEIGHT,
            alignItems: Align.Center,
            paddingHorizontal: 12,
            paddingVertical: 6,
        });

        this._rankText = new Text("", { fontSize: 24 });
        this._rankText.alpha = 0.25;
        this._rankText.layout.marginRight = 12;
        this.addChild(this._rankText);

        this._nameText = new Text("", { fontSize: 24 });
        this._nameText.layout.flexGrow = 1;
        this.addChild(this._nameText);

        // this._scoreText = new ScoreText(0, 0.25, { fontSize: 24 });
        this._scoreText = new Text("", { fontSize: 24 });
        this.addChild(this._scoreText);
    }

    setListItemData(data: HighScoreResponse, index: number, selected: boolean): void {
        this.setListItemSelected(selected);
        this._data = data;
        this._index = index;

        const rank = index + 1;
        this._rankText.text = `${rank.toFixed(0)}`;
        this._nameText.text = data.name;
        this._scoreText.text = data.score.toFixed(0);
    }

    setListItemSelected(selected: boolean): void {
        this._nameText.style.fill
            = this._rankText.style.fill
            = this._scoreText.style.fill = selected
                ? UI_BACKGROUND_COLOR
                : UI_FOREGROUND_COLOR;

        this._rankText.alpha = selected ? 0.5 : 0.25;

        this.filters = selected
            ? [new GlowFilter({outerStrength: 1, color: UI_FOREGROUND_COLOR})]
            : null;

        this.backgroundStyle = selected
            ? {
                shape: ContainerBackgroundShape.Rectangle,
                fill: {
                    color: 0xffffff,
                    alpha: 0.8,
                },
            } : {
                // Still need a background to recieve input events
                shape: ContainerBackgroundShape.Rectangle,
                fill: {
                    color: 0,
                    alpha: 0.0001,
                },
            };
    }
}

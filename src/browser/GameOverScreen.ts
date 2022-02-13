import { EventManager, TickQueue } from "@core/engine";
import { GameState } from "@core";
import { Align, ContainerBackgroundShape, FlexDirection, PositionType } from "./layout";
import { Button, ButtonType, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR, FadeContainer, LinearGroup, RevealText, ScoreText, Text, BUTTON_THEMES } from "./ui";
import { GlowFilter } from "@pixi/filter-glow";
import { ChromaticAbberationFilter } from "./filters";
import anime from "animejs";
import { UIEvents } from "./UIEvents";
import { Container } from "@pixi/display";

export class GameOverScreen extends FadeContainer {
    private readonly _timeline: anime.AnimeTimelineInstance;
    private readonly _saveButton?: Button;
    private readonly _buttons: LinearGroup;

    constructor(params: {
        queue: TickQueue;
        events: EventManager<UIEvents>;
        state: GameState;
        enableSave: boolean;
    }) {
        super({
            queue: params.queue,
            fadeInDuration: 100,
            fadeOutDuration: 100,
            fadeOutExtraDelay: 100
        });
        this.flexContainer = true;
        this.layout.style({
            position: PositionType.Absolute,
            width: "100%",
            flexDirection: FlexDirection.Column,
            alignItems: Align.Center,
        });
        this.backgroundStyle = {
            shape: ContainerBackgroundShape.Rectangle,
            fill: {
                color: UI_BACKGROUND_COLOR,
                alpha: UI_BACKGROUND_ALPHA,
            },
        };

        const title = new RevealText({
            queue: this.queue,
            text: " GAME OVER ",
            duration: 700,
            textStyle: {
                fontSize: 64,
                fill: UI_FOREGROUND_COLOR,
            }
        });
        title.filters = [
            new GlowFilter({
                outerStrength: 1,
                distance: 24,
            }),
        ];
        title.layout.style({
            margin: 24,
            marginBottom: 18,
        });
        this.addChild(title);

        const score = new ScoreText(params.state.score, 0.2, {
            fontSize: 104,
            fill: UI_FOREGROUND_COLOR,
        });
        const initialScoreGlowFilter = new GlowFilter({
            outerStrength: 0,
            distance: 36,
            quality: 0.02,
        });
        score.filters = [
            initialScoreGlowFilter,
            new GlowFilter({
                outerStrength: 1,
                distance: 24,
                color: UI_FOREGROUND_COLOR,
                quality: 0.05,
            }),
            new ChromaticAbberationFilter(4, 2),
        ];
        this.addChild(score);

        this._buttons = new LinearGroup(FlexDirection.Row, 24, [
            new Button({
                queue: this.queue,
                type: params.enableSave ? ButtonType.Secondary : ButtonType.Primary,
                text: "New Game",
                onClick: () => params.events.trigger("start"),
            }),
        ]);
        if (params.enableSave) {
            this._buttons.addChild(new Button({
                queue: this.queue,
                type: ButtonType.Secondary,
                text: "Leaderboard",
                onClick: () => params.events.trigger("openLeaderboard"),
            }));
            this._buttons.addChild(this._saveButton = new Button({
                queue: this.queue,
                type: ButtonType.Primary,
                text: "Save Score",
                onClick: () => params.events.trigger("openSaveScore"),
            }));
        }
        this._buttons.layout.style({
            margin: 24,
            marginTop: 18,
        });
        this.addChild(this._buttons);

        this._timeline = anime.timeline({ autoplay: false })
            .add({
                targets: initialScoreGlowFilter,
                outerStrength: 1,
                easing: "easeOutElastic",
                delay: 100,
                duration: 600,
            }).add({
                targets: initialScoreGlowFilter,
                outerStrength: 0,
                easing: "linear",
                delay: 250,
                duration: 750,
                complete: () => {
                    initialScoreGlowFilter.enabled = false;
                },
            });

        this.fadeIn();
    }

    override tick(timestamp: number, elapsed: number): void {
        super.tick(timestamp, elapsed);
        this._timeline.tick(timestamp);
    }

    onSaved(): void {
        // Remove the save button and replace it with a placeholder
        if (this._saveButton) {
            this._saveButton.visible = false;
            const placeholder = new Container();
            placeholder.flexContainer = true;
            placeholder.layout.style({
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: FlexDirection.Row,
                alignItems: Align.Center,
            });
            const text = new Text("  Saved!  ", {
                fontSize: 20,
                fill: BUTTON_THEMES[ButtonType.Primary].inactive.fill?.color ?? 0xffffff,
            });
            placeholder.addChild(text);
            placeholder.backgroundStyle = {
                shape: ContainerBackgroundShape.Rectangle,
                cornerRadius: 8,
                stroke: {
                    width: BUTTON_THEMES[ButtonType.Primary].inactive.stroke?.width || 2,
                    color: BUTTON_THEMES[ButtonType.Primary].inactive.fill?.color ?? 0xffffff,
                },
            };
            placeholder.alpha = (BUTTON_THEMES[ButtonType.Primary].inactive.fill?.alpha || 1) * 0.5;
            this._buttons.addChildAt(placeholder, this._buttons.children.indexOf(this._saveButton));
        }
    }
}

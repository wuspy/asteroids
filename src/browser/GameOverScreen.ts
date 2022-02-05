import { EventManager, InputProvider, TickQueue } from "@core/engine";
import { GameState, GameEvents, controls } from "@core";
import { Align, ContainerBackgroundShape, FlexDirection, PositionType } from "./layout";
import { Button, ButtonType, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR, FadeContainer, LinearGroup, RevealText, ScoreText } from "./ui";
import { GlowFilter } from "@pixi/filter-glow";
import { ChromaticAbberationFilter } from "./filters";
import anime from "animejs";

export class GameOverScreen extends FadeContainer {
    private readonly _events: EventManager<GameEvents>;
    private readonly _timeline: anime.AnimeTimelineInstance;

    constructor(params: {
        queue: TickQueue,
        events: EventManager<GameEvents>,
        state: GameState,
        inputProvider: InputProvider<typeof controls>,
    }) {
        super({
            queue: params.queue,
            fadeInDuration: 100,
            fadeOutDuration: 100,
            fadeOutExtraDelay: 100
        });
        this._events = params.events;
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

        const buttons = new LinearGroup(FlexDirection.Row, 24, [
            new Button({
                queue: this.queue,
                type: ButtonType.Primary,
                text: "New Game",
                onClick: () => this._events.trigger("startRequested")
            }),
        ]);
        buttons.layout.style({
            margin: 24,
            marginTop: 18,
        });
        this.addChild(buttons);

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
}

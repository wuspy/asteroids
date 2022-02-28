import { GlowFilter } from "@pixi/filter-glow";
import { EventManager, InputProvider, TickQueue } from "../core/engine";
import { GameState, controls } from "../core";
import anime from "animejs";
import { Align, ContainerBackgroundShape, FlexDirection, PositionType } from "./layout";
import { ButtonType, Button, FadeContainer, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR, LinearGroup, RevealText, ControlDescription, ControlGraphic } from "./ui";
import { ChromaticAbberationFilter } from "./filters";
import { UIEvents } from "./UIEvents";

export class PauseScreen extends FadeContainer {
    private readonly _events: EventManager<UIEvents>;
    private readonly _startGlowFilter: GlowFilter;
    private _timeline?: anime.AnimeTimelineInstance;

    constructor(params: {
        queue: TickQueue,
        state: GameState,
        events: EventManager<UIEvents>,
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
            text: " PAUSED ",
            duration: 500,
            textStyle: {
                fontSize: 64,
                fill: UI_FOREGROUND_COLOR,
            }
        });
        title.filters = [
            new ChromaticAbberationFilter(1, 2),
            new GlowFilter({
                outerStrength: 1,
                distance: 24,
            }),
        ];
        title.layout.style({
            margin: 24,
            marginBottom: 18
        });
        this.addChild(title);

        const startControl = new ControlDescription({
            ...ControlGraphic.getParamsFromMapping("start", params.inputProvider.mapping)!,
            foreground: UI_BACKGROUND_COLOR,
            background: UI_FOREGROUND_COLOR,
            fontSize: 32,
            beforeLabel: "Press",
            afterLabel: "to resume",
            direction: "horizontal",
        });
        this.addChild(startControl);

        startControl.filters = [
            this._startGlowFilter = new GlowFilter({
                innerStrength: 0,
                outerStrength: 0,
                distance: 24,
                color: UI_FOREGROUND_COLOR,
            }),
        ];
        startControl.interactive = true;
        startControl.buttonMode = true;
        startControl.on("pointertap", () => this._events.trigger("resume"));

        const buttons = new LinearGroup(FlexDirection.Row, 24, [
            new Button({
                queue: this.queue,
                type: ButtonType.Danger,
                text: "Quit",
                onClick: () => this._events.trigger("quit"),
            }),
        ]);
        buttons.layout.style({
            margin: 24,
            marginTop: 36,
        });

        this.addChild(buttons);

        this.fadeIn().then(() => {
            this._timeline = anime.timeline({
                autoplay: false,
                loop: true,
                direction: "alternate",
            }).add({
                easing: "linear",
                duration: 1500,
                targets: this._startGlowFilter,
                outerStrength: 2.5,
                innerStrength: 2,
            });
        });
    }

    override tick(timestamp: number, elapsed: number): void {
        super.tick(timestamp, elapsed);
        this._timeline?.tick(timestamp);
    }
}

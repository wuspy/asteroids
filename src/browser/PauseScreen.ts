import { Container } from "@pixi/display";
import { GlowFilter } from "@pixi/filter-glow";
import { EventManager, InputProvider, TickQueue } from "@core/engine";
import { GameEvents, GameState, controls } from "@core";
import anime from "animejs";
import { createControlDescription, getControlProps } from "./controlGraphic";
import { Align, ContainerBackgroundShape, FlexDirection, PositionType } from "./layout";
import { ButtonType, Button, FadeContainer, Text, FONT_FAMILY, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR } from "./ui";

export class PauseScreen extends FadeContainer {
    private readonly _events: EventManager<GameEvents>;
    private readonly _startGlowFilter: GlowFilter;
    private _timeline?: anime.AnimeTimelineInstance;

    constructor(params: {
        queue: TickQueue,
        state: GameState,
        events: EventManager<GameEvents>,
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
            width: [100, "%"],
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

        const title = new Text("PAUSED", {
            fontFamily: FONT_FAMILY,
            fontSize: 64,
            fill: UI_FOREGROUND_COLOR,
        });
        title.cacheAsBitmap = true;
        title.layout.style({
            margin: 24,
            marginBottom: 12
        });
        this.addChild(title);

        const startControl = createControlDescription({
            ...getControlProps("start", params.inputProvider.mapping)!,
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
        startControl.on("click", () => this._events.trigger("resumeRequested"));

        const buttonContainer = new Container();
        buttonContainer.flexContainer = true;
        buttonContainer.layout.style({
            flexDirection: FlexDirection.Row,
            margin: 12,
            marginTop: 24,
        });

        const newGameButton = new Button({
            queue: this.queue,
            type: ButtonType.Danger,
            text: "Quit",
            onClick: () => this._events.trigger("quitRequested"),
        });
        newGameButton.layout.margin = 12;
        buttonContainer.addChild(newGameButton);

        // const optionsButton = new Button(ButtonType.Secondary, "Options", () => undefined);
        // optionsButton.layout.margin = 12;
        // buttonContainer.addChild(optionsButton);

        this.addChild(buttonContainer);

        this.fadeIn(() => {
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

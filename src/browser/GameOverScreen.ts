import { EventManager, InputProvider, TickQueue } from "@core/engine";
import { GameState, GameEvents, controls } from "@core";
import { Align, ContainerBackgroundShape, FlexDirection, PositionType } from "./layout";
import { Button, Text, ButtonType, FONT_FAMILY, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR, FadeContainer } from "./ui";

export class GameOverScreen extends FadeContainer {
    private readonly _events: EventManager<GameEvents>;

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

        const title = new Text("GAME OVER", {
            fontFamily: FONT_FAMILY,
            fontSize: 64,
            fill: UI_FOREGROUND_COLOR,
        });
        title.layout.margin = 24;
        this.addChild(title);

        const newGameButton = new Button({
            queue: this.queue,
            type: ButtonType.Primary,
            text: "New Game",
            onClick: () => this._events.trigger("startRequested")
        });
        newGameButton.layout.style({
            margin: 24,
            marginTop: 0,
        });
        this.addChild(newGameButton);

        this.fadeIn();
    }
}

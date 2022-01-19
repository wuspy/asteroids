import { EventManager, FadeContainer, InputProvider, TickQueue } from "./engine";
import { GameState } from "./GameState";
import { controls } from "./input";
import { Align, ContainerBackgroundShape, FlexDirection } from "./layout";
import { Button, Text } from "./ui";
import { ButtonType, FONT_FAMILY, UI_BACKGROUND_ALPHA, UI_BACKGROUND_COLOR, UI_FOREGROUND_COLOR } from "./Theme";
import { GameEvents } from "./GameEvents";

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

        const newGameButton = new Button(ButtonType.Primary, "New Game", () => this._events.trigger("startRequested"));
        newGameButton.layout.style({
            margin: 24,
            marginTop: 0,
        });
        this.addChild(newGameButton);

        this.fadeIn(() => {});
    }
}

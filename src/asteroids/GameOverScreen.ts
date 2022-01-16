import { Text } from "@pixi/text";
import { Container } from "@pixi/display";
import { Tickable, Widget, CoreWidgetParams, InputProvider } from "./engine";
import { FONT_FAMILY } from "./constants";
import { BlurFilter } from "@pixi/filter-blur";
import anime from "animejs";
import { GameState } from "./GameState";
import { controls } from "./input";
import { AlphaFilter } from "@pixi/filter-alpha";
import { Align, FlexDirection } from "./layout";

export class GameOverScreen extends Widget implements Tickable {
    private _container: Container;
    private _timeline: anime.AnimeTimelineInstance;

    constructor(params: CoreWidgetParams & {
        state: GameState,
        inputProvider: InputProvider<typeof controls>
    }) {
        super({ ...params, queuePriority: 0 });
        this._container = new Container();
        this._container.flexContainer = true;
        this._container.layout.style({
            width: [100, "%"],
            flexDirection: FlexDirection.Column,
            alignItems: Align.Center,
        });
        this._container.backgroundStyle = {
            shape: "rectangle",
            fill: {
                color: params.state.theme.uiBackgroundColor,
                alpha: params.state.theme.uiBackgroundAlpha,
            },
        };

        const title = new Text("GAME OVER", {
            fontFamily: FONT_FAMILY,
            fontSize: 64,
            fill: params.state.theme.uiForegroundColor,
        });
        title.layout.style({
            margin: 24,
        });
        this._container.addChild(title);

        this._container.filters = [
            new AlphaFilter(0),
            new BlurFilter(10),
        ];

        this._timeline = anime.timeline({
            autoplay: false,
            easing: "linear",
            duration: 100,
        }).add({
            targets: this._container.filters[0],
            alpha: 1,
        }).add({
            targets: this._container.filters[1],
            blur: 0,
        }, 0);
    }

    fadeOut(complete: () => void): void {
        this._container.filters = [
            new AlphaFilter(1),
            new BlurFilter(0),
        ];
        this._timeline = anime.timeline({
            autoplay: false,
            duration: 100,
            easing: "linear",
            complete,
        }).add({
            targets: this._container.filters[0],
            alpha: 0,
        }).add({
            targets: this._container.filters[1],
            blur: 10,
        }, 0).add({});
    }

    tick(timestamp: number, elapsed: number): void {
        this._timeline.tick(timestamp);
    }

    get container(): Container {
        return this._container;
    }
}

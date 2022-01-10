import { Text } from "@pixi/text";
import { Container } from "@pixi/display";
import { Tickable, RelativeLayout, Widget, CoreWidgetParams, InputProvider } from "./engine";
import { FONT_FAMILY } from "./constants";
import { BlurFilter } from "@pixi/filter-blur";
import { GlowFilter } from "@pixi/filter-glow";
import anime from "animejs";
import { GameState } from "./GameState";
import { createControlDescription, getControlProps } from "./controlGraphic";
import { controls } from "./input";
import { AlphaFilter } from "@pixi/filter-alpha";

export class PauseScreen extends Widget implements Tickable {
    private _container: RelativeLayout;
    private _timeline: anime.AnimeTimelineInstance;

    constructor(params: CoreWidgetParams & {
        state: GameState,
        inputProvider: InputProvider<typeof controls>,
        onResumeRequested: () => void,
    }) {
        super({ ...params, queuePriority: 0 });
        this._container = new RelativeLayout("matchParent", 0);
        this._container.backgroundStyle = {
            shape: "rectangle",
            fillStyle: {
                color: params.state.theme.uiBackgroundColor,
                alpha: params.state.theme.uiBackgroundAlpha,
            },
        };

        const title = new Text("PAUSED", {
            fontFamily: FONT_FAMILY,
            fontSize: 64,
            fill: params.state.theme.uiForegroundColor,
        });
        const startControl = createControlDescription({
            ...getControlProps("start", params.inputProvider.mapping)!,
            foreground: params.state.theme.foregroundContrastColor,
            background: params.state.theme.foregroundColor,
            fontSize: 32,
            beforeLabel: "Press",
            afterLabel: "to resume",
            direction: "horizontal",
        });

        this._container.addChildWithConstraints(title, {
            margin: { top: 24, bottom: 24 },
            constraints: {
                hcenter: ["parent", "hcenter"],
                top: ["parent", "top"],
            }
        });
        this._container.addChildWithConstraints(startControl, {
            margin: { bottom: 24 },
            constraints: {
                hcenter: ["parent", "hcenter"],
                top: [title, "bottom"],
            }
        });

        this._container.height = title.height + startControl.height + 24 * 3;

        startControl.filters = [
            new GlowFilter({
                innerStrength: 0,
                outerStrength: 0,
                distance: 24,
            }),
        ];
        startControl.interactive = true;
        startControl.buttonMode = true;
        startControl.on("click", params.onResumeRequested);

        this._container.filters = [
            new AlphaFilter(0),
            new BlurFilter(10),
        ];

        this._timeline = anime.timeline({
            autoplay: false,
            easing: "linear",
            duration: 100,
            complete: () => {
                this._container.filters = [];
                this._timeline = anime.timeline({
                    autoplay: false,
                    loop: true,
                    direction: "alternate",
                }).add({
                    easing: "linear",
                    duration: 1200,
                    targets: startControl.filters![0],
                    outerStrength: 2,
                    innerStrength: 2,
                });
            },
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

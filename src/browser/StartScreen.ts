import { Container } from "@pixi/display";
import { DEG_TO_RAD } from "@pixi/math";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { BlurFilter } from "@pixi/filter-blur";
import { GlowFilter } from "@pixi/filter-glow";
import { AlphaFilter } from "@pixi/filter-alpha";
import { GameState, controls } from "../core";
import { InputProvider, InputMapping, TickQueue, EventManager } from "../core/engine";
import anime from "animejs";
import { ShipDisplay } from "./ShipDisplay";
import { Align, FlexDirection, PositionType } from "./layout";
import {
    Button,
    LinearGroup,
    ButtonType,
    FadeContainer,
    HelpPointer,
    ControlDescription,
    ControlGraphic
} from "./ui";
import { GameTheme } from "./GameTheme";
import { UIEvents } from "./UIEvents";

export class StartScreen extends FadeContainer {
    private readonly _state: GameState;
    private readonly _theme: GameTheme;
    private readonly _events: EventManager<UIEvents>;
    private readonly _leaderboardButton: Button;
    private _mapping: InputMapping<typeof controls>;
    private _controlLayoutContainer: Container;
    private _timeline: anime.AnimeTimelineInstance;
    private _controlPointers: HelpPointer[];

    constructor(params: {
        queue: TickQueue,
        theme: GameTheme,
        events: EventManager<UIEvents>,
        state: GameState,
        inputProvider: InputProvider<typeof controls>,
        enableLeaderboard: boolean,
    }) {
        super({
            queue: params.queue,
            fadeInDuration: 500,
            fadeOutDuration: 500,
            fadeOutExtraDelay: 500,
            initiallyVisible: true,
        });
        this._state = params.state;
        this._theme = params.theme;
        this._events = params.events;
        this._mapping = params.inputProvider.mapping;
        this.flexContainer = true;
        this.layout.style({
            position: PositionType.Absolute,
            flexDirection: FlexDirection.Column,
            alignItems: Align.Center,
            paddingTop: 148,
        });

        this._controlLayoutContainer = new Container();
        this._controlLayoutContainer.layout.style({
            marginVertical: 24,
            originAtCenter: true,
        });
        this.addChild(this._controlLayoutContainer);
        this._controlPointers = [];

        params.inputProvider.events.on("mappingChanged", this, this.onMappingChanged);

        const ship = ShipDisplay.createModel(this._theme.foregroundColor);
        const shipShadow = new Graphics(ship.geometry);
        shipShadow.filters = [new BlurFilter()];
        ship.cacheAsBitmap = true;
        this._controlLayoutContainer.addChild(shipShadow, ship);

        const bottomControlsContainer = new Container();
        bottomControlsContainer.flexContainer = true;
        bottomControlsContainer.layout.style({
            flexDirection: FlexDirection.Column,
            alignItems: Align.Center,
        });

        const startControl = new ControlDescription({
            ...ControlGraphic.getParamsFromMapping("start", this._mapping)!,
            foreground: this._theme.foregroundContrastColor,
            background: this._theme.foregroundColor,
            fontSize: 32,
            beforeLabel: "Press",
            afterLabel: "to play",
            direction: "horizontal",
        });
        startControl.interactive = true;
        startControl.buttonMode = true;
        startControl.on("pointertap", () => this._events.trigger("start"));
        startControl.layout.margin = 24;
        bottomControlsContainer.addChild(startControl);

        // const optionsButton = new Button({
        //     queue: this.queue,
        //     type: ButtonType.Secondary,
        //     text: "Options",
        //     onClick: () => { },
        // });

        const aboutButton = new Button({
            queue: this.queue,
            type: ButtonType.Secondary,
            text: "About Me",
            onClick: () => this._events.trigger("openAbout"),
        });

        this._leaderboardButton = new Button({
            queue: this.queue,
            type: ButtonType.Secondary,
            text: "Leaderboard",
            onClick: () => this._events.trigger("openLeaderboard"),
        });
        this._leaderboardButton.visible = params.enableLeaderboard;

        const buttonContainer = new LinearGroup(FlexDirection.Row, 24, [
            aboutButton,
            this._leaderboardButton,
        ]);
        buttonContainer.layout.margin = 12;

        bottomControlsContainer.addChild(buttonContainer);
        this.addChild(bottomControlsContainer);

        bottomControlsContainer.filters = [new AlphaFilter(0)];
        bottomControlsContainer.interactiveChildren = false;
        // For some reason, adding this filter removes the padding specified by the glow filters
        // on the start control and buttons. So it's added back manually here
        bottomControlsContainer.filters[0].padding = 24;
        this._timeline = anime.timeline({
            autoplay: false,
        }).add({
            easing: "linear",
            duration: 500,
            targets: bottomControlsContainer.filters[0],
            alpha: 1,
            begin: () => {
                bottomControlsContainer.interactiveChildren = true;
            },
            complete: () => {
                startControl.filters = [
                    new GlowFilter({
                        innerStrength: 0,
                        outerStrength: 0,
                        distance: 24,
                        color: this._theme.foregroundColor,
                    }),
                ];
                this._timeline = anime.timeline({
                    autoplay: false,
                    loop: true,
                    direction: "alternate",
                }).add({
                    easing: "linear",
                    duration: 1500,
                    targets: startControl.filters[0],
                    outerStrength: 2.5,
                    innerStrength: 2,
                });
            },
        }, 1600);

        this.drawControlMapping(1000);
    }

    set enableLeaderboard(enableLeaderboard: boolean) {
        this._leaderboardButton.visible = enableLeaderboard;
    }

    private onMappingChanged(mapping: InputMapping<typeof controls>) {
        this._mapping = mapping;
        this.drawControlMapping(0);
    }

    private drawControlMapping(delay: number) {
        for (const pointer of this._controlPointers) {
            pointer.destroy({ children: true });
        }
        this._controlPointers = [];

        const controlThemeProps = {
            foreground: this._theme.foregroundContrastColor,
            background: this._theme.foregroundColor,
            fontSize: 24,
        };
        const basePointerProps = {
            queue: this.queue,
            color: this._theme.foregroundColor,
            pointerAlpha: 0.5,
            alpha: this._theme.foregroundAlpha,
        };

        const fireControl = new ControlDescription({
            ...ControlGraphic.getParamsFromMapping("fire", this._mapping)!,
            ...controlThemeProps,
            beforeLabel: "Fire",
            direction: "vertical",
        });
        this._controlPointers.push(new HelpPointer({
            ...basePointerProps,
            content: fireControl,
            position: { x: 0, y: -40 },
            angle1: 0,
            angle2: 0,
            // Since this line is straight, making it slightly shorter makes it
            // appear to be the same length as the ones that have a bend, even though
            // its total length is actually shorter
            segmentLength: 25,
            delay,
            duration: 500,
        }));

        const rightControl = new ControlDescription({
            ...ControlGraphic.getParamsFromMapping("turn", this._mapping, 1)!,
            ...controlThemeProps,
            afterLabel: "Turn Right",
            direction: "horizontal",
        });
        this._controlPointers.push(new HelpPointer({
            ...basePointerProps,
            content: rightControl,
            position: { x: 20, y: -10 },
            angle1: 45 * DEG_TO_RAD,
            angle2: 90 * DEG_TO_RAD,
            segmentLength: 30,
            delay: delay + 100,
            duration: 500,
        }));

        const hyperspaceControl = new ControlDescription({
            ...ControlGraphic.getParamsFromMapping("hyperspace", this._mapping)!,
            ...controlThemeProps,
            afterLabel: "Hyperspace",
            direction: "horizontal",
        });
        this._controlPointers.push(new HelpPointer({
            ...basePointerProps,
            content: hyperspaceControl,
            position: { x: 25, y: 40 },
            angle1: 135 * DEG_TO_RAD,
            angle2: 90 * DEG_TO_RAD,
            segmentLength: 30,
            delay: delay + 200,
            duration: 500,
        }));

        const thrustControl = new ControlDescription({
            ...ControlGraphic.getParamsFromMapping("thrust", this._mapping)!,
            ...controlThemeProps,
            afterLabel: "Thrust",
            direction: "vertical",
        });
        this._controlPointers.push(new HelpPointer({
            ...basePointerProps,
            content: thrustControl,
            position: { x: 0, y: 40 },
            angle1: 180 * DEG_TO_RAD,
            angle2: 180 * DEG_TO_RAD,
            // Since this line is straight, making it slightly shorter makes it
            // appear to be the same length as the ones that have a bend, even though
            // its total length is actually shorter
            segmentLength: 25,
            delay: delay + 300,
            duration: 500,
        }));

        const pauseControl = new ControlDescription({
            ...ControlGraphic.getParamsFromMapping("start", this._mapping)!,
            ...controlThemeProps,
            beforeLabel: "Pause",
            direction: "horizontal",
        });
        this._controlPointers.push(new HelpPointer({
            ...basePointerProps,
            content: pauseControl,
            position: { x: -25, y: 40 },
            angle1: 225 * DEG_TO_RAD,
            angle2: 270 * DEG_TO_RAD,
            segmentLength: 30,
            delay: delay + 400,
            duration: 500,
        }));

        const leftControl = new ControlDescription({
            ...ControlGraphic.getParamsFromMapping("turn", this._mapping, -1)!,
            ...controlThemeProps,
            beforeLabel: "Turn Left",
            direction: "horizontal",
        });
        this._controlPointers.push(new HelpPointer({
            ...basePointerProps,
            content: leftControl,
            position: { x: -20, y: -10 },
            angle1: 315 * DEG_TO_RAD,
            angle2: 270 * DEG_TO_RAD,
            segmentLength: 30,
            delay: delay + 500,
            duration: 500,
        }));

        this._controlLayoutContainer.addChild(...this._controlPointers);
    }

    override tick(timestamp: number, elapsed: number): void {
        super.tick(timestamp, elapsed);
        this._timeline.tick(timestamp);
    }

    protected override onFadeInStart(): void {
        this.drawControlMapping(200);
    }

    protected override onFadeOutStart(): void {
        for (const pointer of this._controlPointers) {
            pointer.reverse();
        }
    }
}

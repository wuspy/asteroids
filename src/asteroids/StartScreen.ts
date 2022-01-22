import { Container } from "@pixi/display";
import { InputProvider, InputMapping, TickQueue, EventManager, FadeContainer } from "./engine";
import { DEG_TO_RAD } from "@pixi/math";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { Ship } from "./Ship";
import { BlurFilter } from "@pixi/filter-blur";
import { GameState } from "./GameState";
import { HelpPointer } from "./HelpPointer";
import { GlowFilter } from "@pixi/filter-glow";
import anime from "animejs";
import { AlphaFilter } from "@pixi/filter-alpha";
import { controls } from "./input";
import { createControlDescription, getControlProps } from "./controlGraphic";
import { Align, ContainerBackgroundShape, FlexDirection, PositionType } from "./layout";
import { GameEvents } from "./GameEvents";
import { ButtonType } from "./Theme";
import { Button, LinearGroup, Text } from "./ui";
import { Modal } from "./ui/Modal";
import { VirtualizedList } from "./ui/VirtualizedList";
import { AboutMeModal } from "./AboutMeModal";

export class StartScreen extends FadeContainer {
    private readonly _state: GameState;
    private readonly _events: EventManager<GameEvents>;
    private _mapping: InputMapping<typeof controls>;
    private _controlLayoutContainer: Container;
    private _timeline: anime.AnimeTimelineInstance;
    private _controlPointers: HelpPointer[];

    constructor(params: {
        queue: TickQueue,
        events: EventManager<GameEvents>,
        state: GameState,
        inputProvider: InputProvider<typeof controls>,
    }) {
        super({
            queue: params.queue,
            fadeInDuration: 500,
            fadeOutDuration: 500,
            fadeOutExtraDelay: 500,
            initiallyVisible: true,
        });
        this._state = params.state;
        this._events = params.events;
        this._mapping = params.inputProvider.mapping;
        this.flexContainer = true;
        // this.debugLayout = true;
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

        const ship = Ship.createModel(params.state.theme.foregroundColor);
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

        const startControl = createControlDescription({
            ...getControlProps("start", params.inputProvider.mapping)!,
            foreground: this._state.theme.foregroundContrastColor,
            background: this._state.theme.foregroundColor,
            fontSize: 32,
            beforeLabel: "Press",
            afterLabel: "to play",
            direction: "horizontal",
        });
        startControl.interactive = true;
        startControl.buttonMode = true;
        startControl.on("click", () => this._events.trigger("startRequested"));
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
            onClick: () => {
                const modal = new AboutMeModal({
                    queue: this.queue,
                    onClose: () => {
                        this.fadeIn();
                        modal.fadeOut(() => {
                            modal.destroy({ children: true });
                            this._events.trigger("aboutClosed");
                        });
                    },
                });
                this.parent.addChild(modal);
                modal.fadeIn();
                this.fadeOut();
                this._events.trigger("aboutOpened");
            },
        });

        // const highScoresButton = new Button({
        //     queue: this.queue,
        //     type: ButtonType.Secondary,
        //     text: "High Scores",
        // });
        
        const buttonContainer = new LinearGroup(FlexDirection.Row, 24, [
            // optionsButton,
            // highScoresButton,
            aboutButton,
        ]);
        buttonContainer.layout.margin = 12;

        bottomControlsContainer.addChild(buttonContainer);
        this.addChild(bottomControlsContainer);

        bottomControlsContainer.filters = [new AlphaFilter(0)];
        // For some reason, adding this filter removes the padding specified by the glow filters
        // on the start control and buttons. So it's added back manually here
        bottomControlsContainer.filters[0].padding = 24;
        this._timeline = anime.timeline({ autoplay: false }).add({
            easing: "linear",
            delay: 2200,
            duration: 500,
            targets: bottomControlsContainer.filters[0],
            alpha: 1,
            complete: () => {
                startControl.filters = [
                    new GlowFilter({
                        innerStrength: 0,
                        outerStrength: 0,
                        distance: 24,
                        color: this._state.theme.foregroundColor,
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
        });

        this.drawControlMapping(1000);
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
            foreground: this._state.theme.foregroundContrastColor,
            background: this._state.theme.foregroundColor,
            fontSize: 24,
        };
        const pointerThemeProps = {
            color: this._state.theme.foregroundColor,
            alpha: this._state.theme.foregroundAlpha * 0.5,
        };

        const fireControl = createControlDescription({
            ...getControlProps("fire", this._mapping)!,
            ...controlThemeProps,
            beforeLabel: "Fire",
            direction: "vertical",
        });
        this._controlPointers.push(new HelpPointer({
            ...pointerThemeProps,
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

        const rightControl = createControlDescription({
            ...getControlProps("turn", this._mapping, 1)!,
            ...controlThemeProps,
            afterLabel: "Turn Right",
            direction: "horizontal",
        });
        this._controlPointers.push(new HelpPointer({
            ...pointerThemeProps,
            content: rightControl,
            position: { x: 20, y: -10 },
            angle1: 45 * DEG_TO_RAD,
            angle2: 90 * DEG_TO_RAD,
            segmentLength: 30,
            delay: delay + 100,
            duration: 500,
        }));

        const hyperspaceControl = createControlDescription({
            ...getControlProps("hyperspace", this._mapping)!,
            ...controlThemeProps,
            afterLabel: "Hyperspace",
            direction: "horizontal",
        });
        this._controlPointers.push(new HelpPointer({
            ...pointerThemeProps,
            content: hyperspaceControl,
            position: { x: 25, y: 40 },
            angle1: 135 * DEG_TO_RAD,
            angle2: 90 * DEG_TO_RAD,
            segmentLength: 30,
            delay: delay + 200,
            duration: 500,
        }));

        const thrustControl = createControlDescription({
            ...getControlProps("thrust", this._mapping)!,
            ...controlThemeProps,
            afterLabel: "Thrust",
            direction: "vertical",
        });
        this._controlPointers.push(new HelpPointer({
            ...pointerThemeProps,
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

        const pauseControl = createControlDescription({
            ...getControlProps("start", this._mapping)!,
            ...controlThemeProps,
            beforeLabel: "Pause",
            direction: "horizontal",
        });
        this._controlPointers.push(new HelpPointer({
            ...pointerThemeProps,
            content: pauseControl,
            position: { x: -25, y: 40 },
            angle1: 225 * DEG_TO_RAD,
            angle2: 270 * DEG_TO_RAD,
            segmentLength: 30,
            delay: delay + 400,
            duration: 500,
        }));

        const leftControl = createControlDescription({
            ...getControlProps("turn", this._mapping, -1)!,
            ...controlThemeProps,
            beforeLabel: "Turn Left",
            direction: "horizontal",
        });
        this._controlPointers.push(new HelpPointer({
            ...pointerThemeProps,
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

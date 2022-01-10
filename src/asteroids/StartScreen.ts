import { Container } from "@pixi/display";
import {
    Tickable,
    InputProvider,
    InputMapping,
    Widget,
    CoreWidgetParams,
} from "./engine";
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

export class StartScreen extends Widget implements Tickable {
    private _state: GameState;
    private _container: Container;
    private _timeline: anime.AnimeTimelineInstance;
    private _controlPointers: HelpPointer[];

    constructor(params: CoreWidgetParams & {
        state: GameState,
        inputProvider: InputProvider<typeof controls>,
        onStartRequested: () => void,
    }) {
        super({ ...params, queuePriority: 0 });

        this._state = params.state;
        this._container = new Container();
        this._controlPointers = [];

        params.inputProvider.events.on("mappingChanged", this.onMappingChanged, this);

        const ship = Ship.createModel(params.state.theme.foregroundColor);
        const shipShadow = new Graphics(ship.geometry);
        shipShadow.filters = [new BlurFilter()];
        ship.cacheAsBitmap = true;
        this._container.addChild(shipShadow, ship);

        // const inputSelector = this.createInputSelector();
        // inputSelector.x = -inputSelector.width / 2;
        // inputSelector.y = -200 - inputSelector.height;

        // this._container.addChild(inputSelector);

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
        startControl.on("click", params.onStartRequested);
        startControl.filters = [
            new AlphaFilter(0),
            new GlowFilter({
                innerStrength: 0,
                outerStrength: 0,
                distance: 24,
            }),
        ];
        startControl.x = -startControl.width / 2;
        startControl.y = 200;

        this._timeline = anime.timeline({ autoplay: false }).add({
            easing: "linear",
            delay: 1600,
            duration: 500,
            targets: startControl.filters[0],
            alpha: 1,
            complete: () => {
                this._timeline = anime.timeline({
                    autoplay: false,
                    loop: true,
                    direction: "alternate",
                }).add({
                    easing: "linear",
                    duration: 1200,
                    targets: startControl.filters![1],
                    outerStrength: 2,
                    innerStrength: 2,
                });
            },
        });

        this._container.addChild(startControl);

        this.drawControlMapping(1000, params.inputProvider.mapping);
    }

    private onMappingChanged(mapping: InputMapping<typeof controls>) {
        this.drawControlMapping(0, mapping);
    }

    private drawControlMapping(delay: number, inputMapping: InputMapping<typeof controls>) {
        for (const pointer of this._controlPointers) {
            pointer.container.parent.removeChild(pointer.container);
            pointer.destroy();
        }
        this._controlPointers = [];

        const themeProps = {
            foreground: this._state.theme.foregroundContrastColor,
            background: this._state.theme.foregroundColor,
            fontSize: 24,
        };

        const fireControl = createControlDescription({
            ...getControlProps("fire", inputMapping)!,
            ...themeProps,
            beforeLabel: "Fire",
            direction: "vertical",
        });
        this._controlPointers.push(new HelpPointer({
            queue: this.queue,
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
            ...getControlProps("turn", inputMapping, 1)!,
            ...themeProps,
            afterLabel: "Turn Right",
            direction: "horizontal",
        });
        this._controlPointers.push(new HelpPointer({
            queue: this.queue,
            content: rightControl,
            position: { x: 20, y: -10 },
            angle1: 45 * DEG_TO_RAD,
            angle2: 90 * DEG_TO_RAD,
            segmentLength: 30,
            delay: delay + 100,
            duration: 500,
        }));

        const hyperspaceControl = createControlDescription({
            ...getControlProps("hyperspace", inputMapping)!,
            ...themeProps,
            afterLabel: "Hyperspace",
            direction: "horizontal",
        });
        this._controlPointers.push(new HelpPointer({
            queue: this.queue,
            content: hyperspaceControl,
            position: { x: 25, y: 40 },
            angle1: 135 * DEG_TO_RAD,
            angle2: 90 * DEG_TO_RAD,
            segmentLength: 30,
            delay: delay + 200,
            duration: 500,
        }));

        const thrustControl = createControlDescription({
            ...getControlProps("thrust", inputMapping)!,
            ...themeProps,
            afterLabel: "Thrust",
            direction: "vertical",
        });
        this._controlPointers.push(new HelpPointer({
            queue: this.queue,
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
            ...getControlProps("start", inputMapping)!,
            ...themeProps,
            beforeLabel: "Pause",
            direction: "horizontal",
        });
        this._controlPointers.push(new HelpPointer({
            queue: this.queue,
            content: pauseControl,
            position: { x: -25, y: 40 },
            angle1: 225 * DEG_TO_RAD,
            angle2: 270 * DEG_TO_RAD,
            segmentLength: 30,
            delay: delay + 400,
            duration: 500,
        }));

        const leftControl = createControlDescription({
            ...getControlProps("turn", inputMapping, -1)!,
            ...themeProps,
            beforeLabel: "Turn Left",
            direction: "horizontal",
        });
        this._controlPointers.push(new HelpPointer({
            queue: this.queue,
            content: leftControl,
            position: { x: -20, y: -10 },
            angle1: 315 * DEG_TO_RAD,
            angle2: 270 * DEG_TO_RAD,
            segmentLength: 30,
            delay: delay + 500,
            duration: 500,
        }));

        this._container.addChild(...this._controlPointers.map((pointer) => pointer.container));
    }

    fadeOut(complete: () => void): void {
        for (const pointer of this._controlPointers) {
            pointer.reverse();
        }
        this._container.filters = [
            new AlphaFilter(1),
            new BlurFilter(0),
        ];
        this._timeline = anime.timeline({
            autoplay: false,
            duration: 500,
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

    // private createInputSelector(): Container {
    //     const fontSize = 32;
    //     const controlSchemes = ["WASD", "IJKL", "Arrows", "Gamepad"];
    //     const maxLength = controlSchemes.reduce((length, label) => Math.max(length, label.length), 0);

    //     const label = new Text("Controls", {
    //         fontFamily: FONT_FAMILY,
    //         fontSize,
    //         fill: 0xffffff,
    //     });
    //     const leftButton = createControlGraphic({
    //         type: "key",
    //         label: "◀",
    //         fontSize: fontSize * 0.75,
    //     });
    //     leftButton.buttonMode = leftButton.interactive = true;
    //     leftButton.on("click", () => console.log("click left"));

    //     const rightButton = createControlGraphic({
    //         type: "key",
    //         label: "▶",
    //         fontSize: fontSize * 0.75,
    //     });
    //     rightButton.buttonMode = rightButton.interactive = true;
    //     rightButton.on("click", () => console.log("click right"));

    //     const selectionContainer = new RelativeLayout(label.width / label.text.length * maxLength, label.height);
    //     const selectionText = new Text(controlSchemes[0], {
    //         fontFamily: FONT_FAMILY,
    //         fontSize,
    //         fill: 0xffffff,
    //     });
    //     selectionContainer.addChildWithConstraints(selectionText, { constraints: RelativeLayout.centeredIn("parent") });

    //     const container = new LinearLayout("row", 12);
    //     container.addChild(label, leftButton, selectionContainer, rightButton);
    //     container.update();
    //     return container;
    // }

    tick(timestamp: number, elapsed: number): void {
        this._timeline.tick(timestamp);
    }

    get container(): Container {
        return this._container;
    }
}

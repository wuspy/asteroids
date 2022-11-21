import { Graphics } from "@pixi/graphics";
import { TickQueue } from "../../core/engine";
import { TickableContainer } from "./TickableContainer";
import { Align, JustifyContent, PositionType } from "../layout";
import { DEG_TO_RAD } from "@pixi/math";

export class LoadingAnimation extends TickableContainer {
    private readonly _graphics: Graphics;

    constructor(params: {
        queue: TickQueue;
        diameter: number;
        color: number;
    }) {
        super(params.queue);
        this.flexContainer = true;
        this.layout.style({
            alignItems: Align.Center,
            justifyContent: JustifyContent.Center,
        });
        this._graphics = new Graphics();
        this._graphics.layout.style({
            originAtCenter: true,
            width: params.diameter,
            height: params.diameter,
        });
        this._graphics.lineStyle({
            width: Math.ceil(params.diameter * 0.12),
            color: params.color,
            alignment: 0,
        });
        const radius = params.diameter / 2;
        this._graphics.moveTo(radius, 0);
        this._graphics.arc(0, 0, radius, 0, 90 * DEG_TO_RAD);
        this._graphics.moveTo(-radius, 0);
        this._graphics.arc(0, 0, radius, Math.PI, 270 * DEG_TO_RAD);

        this.addChild(this._graphics);
    }

    tick(timestamp: number, elapsed: number): void {
        this._graphics.rotation += elapsed * 2 * Math.PI;
    }
}

import { Text } from "@pixi/text";
import { FONT_FAMILY } from "./Theme";
import { TickableContainer, TickQueue } from "./engine";

const FONT_SIZE = 30;

export class FPSIndicator extends TickableContainer {
    private readonly _text: Text;
    private _frameCount: number;
    private _lastUpdate: number;

    constructor(queue: TickQueue) {
        super(queue);
        this._lastUpdate = 0;
        this._frameCount = 0;
        this._text = new Text("", {
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE,
            fill: 0xffffff,
        });
        this.addChild(this._text);
    }

    tick(timestamp: number, elapsed: number): void {
        if (this.visible) {
            this._frameCount++;
            if (timestamp - this._lastUpdate > 1000) {
                this._text.text = `${(this._frameCount / ((timestamp - this._lastUpdate) / 1000)).toFixed()} FPS`;
                this._frameCount = 0;
                this._lastUpdate = timestamp;
            }
        }
    }
}

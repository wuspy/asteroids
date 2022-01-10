import { Text } from "@pixi/text";
import { Container } from "@pixi/display";
import { CoreWidgetParams, Tickable, Widget } from "./engine";
import { FONT_FAMILY } from "./constants";

const FONT_SIZE = 30;

export class FPSIndicator extends Widget implements Tickable {
    private _text: Text;
    private _frameCount: number;
    private _lastUpdate: number;

    constructor(params: CoreWidgetParams) {
        super({ ...params, queuePriority: 0 });
        this._lastUpdate = 0;
        this._frameCount = 0;
        this._text = new Text("", {
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE,
            fill: 0xffffff,
        });
    }

    tick(timestamp: number, elapsed: number): void {
        this._frameCount++;
        if (timestamp - this._lastUpdate > 1000) {
            this._text.text = `${(this._frameCount / ((timestamp - this._lastUpdate) / 1000)).toFixed()} FPS`;
            this._frameCount = 0;
            this._lastUpdate = timestamp;
        }
    }

    get container(): Container {
        return this._text;
    }

    get visible(): boolean {
        return this.container.visible;
    }

    set visible(visible: boolean) {
        if (visible && !this.visible) {
            this.container.visible = true;
            this.queue.add(this.queuePriority, this);
        } else if (!visible && this.visible) {
            this.container.visible = false;
            this.queue.remove(this.queuePriority, this);
        }
    }
}

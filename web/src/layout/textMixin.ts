import { Text } from "@pixi/text";
import { ISize } from "@pixi/core";
import { MeasureMode } from "./FlexLayout";
import { DisplayObject } from "@pixi/display";

Text.prototype.onLayoutMeasure = function (
    width: number,
    widthMeasureMode: MeasureMode,
    height: number,
    heightMeasureMode: MeasureMode
): ISize {
    const styleID = this.style.styleID;

    this.style.wordWrap = widthMeasureMode !== undefined;
    if (this.style.wordWrap) {
        this.style.wordWrapWidth = width / this.scale.x;
    }

    if (styleID !== this.style.styleID) {
        this.getLocalBounds(this.layout.cachedLocalBounds);
    }

    return DisplayObject.prototype.onLayoutMeasure.call(this, width, widthMeasureMode, height, heightMeasureMode);
}

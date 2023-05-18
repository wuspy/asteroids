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
    if (widthMeasureMode === undefined) {
        this.style.wordWrap = false;
    }
    if (this.style.wordWrap) {
        this.style.wordWrapWidth = width / this.scale.x;
    }

    return DisplayObject.prototype.onLayoutMeasure.call(this, width, widthMeasureMode, height, heightMeasureMode);
}

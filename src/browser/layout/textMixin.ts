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
    this.style.wordWrapWidth = this.style.wordWrap && widthMeasureMode !== MeasureMode.Undefined
        ? width / this.scale.x
        : undefined;

    return DisplayObject.prototype.onLayoutMeasure.call(this, width, widthMeasureMode, height, heightMeasureMode);
}

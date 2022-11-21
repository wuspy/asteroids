import { Sprite } from "@pixi/sprite";
import { ISize } from "@pixi/math";
import { MeasureMode } from "./FlexLayout";

const sprite = Sprite.prototype;

sprite.onLayoutMeasure = function (
    width: number,
    widthMeasureMode: MeasureMode,
    height: number,
    heightMeasureMode: MeasureMode
): ISize {
    if (widthMeasureMode === MeasureMode.Exactly && heightMeasureMode === MeasureMode.Exactly) {
        this.width = width;
        this.height = height;
    } else if (widthMeasureMode === MeasureMode.Exactly && heightMeasureMode === MeasureMode.AtMost) {
        this.width = width;
        this.height = Math.min(height, width / this.texture.width * this.texture.height)
    } else if (widthMeasureMode === MeasureMode.Exactly && heightMeasureMode === MeasureMode.Undefined) {
        this.width = width;
        this.height = width / this.texture.width * this.texture.height;
    } else if (widthMeasureMode === MeasureMode.AtMost && heightMeasureMode === MeasureMode.Exactly) {
        this.width = Math.min(width, height / this.texture.height * this.texture.width)
        this.height = height;
    } else if (widthMeasureMode === MeasureMode.Undefined && heightMeasureMode === MeasureMode.Exactly) {
        this.height = height;
        this.width = height / this.texture.height * this.texture.width;
    } else if (widthMeasureMode === MeasureMode.AtMost && heightMeasureMode === MeasureMode.Undefined) {
        this.width = Math.min(width, this.texture.width);
        this.height = width / this.texture.width * this.texture.height;
    } else if (widthMeasureMode === MeasureMode.Undefined && heightMeasureMode === MeasureMode.AtMost) {
        this.height = Math.min(height, this.texture.height);
        this.width = height / this.texture.height * this.texture.width;
    } else if (widthMeasureMode === MeasureMode.AtMost && heightMeasureMode === MeasureMode.AtMost) {
        if (width < this.texture.width && height < this.texture.height) {
            if (this.texture.width / this.texture.height > width / height) {
                this.width = width;
                this.height = width / this.texture.width * this.texture.height;
            } else {
                this.height = height;
                this.width = height / this.texture.height * this.texture.width;
            }
        } else if (width < this.texture.width) {
            this.width = width;
            this.height = width / this.texture.width * this.texture.height;
        } else if (height < this.texture.height) {
            this.height = height;
            this.width = height / this.texture.height * this.texture.width;
        }
    }

    return { width: this.width, height: this.height };
}

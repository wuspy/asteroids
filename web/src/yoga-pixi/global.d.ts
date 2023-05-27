declare namespace GlobalMixins
{
    interface DisplayObjectEvents {
        layout: [computedLayout: import("@pixi/core").Rectangle];
    }

    interface DisplayObject {
        _yoga?: import("./YogaPixi").YogaPixi;
        get yoga(): import("./YogaPixi").YogaPixi;
        get isYogaChild(): boolean;
        onLayoutMeasure(
            width: number,
            widthMeasureMode: import("./YogaPixi").MeasureMode,
            height: number,
            heightMeasureMode: import("./YogaPixi").MeasureMode,
        ): import("@pixi/core").ISize;
    }

    interface Container {
        _yogaContainer: boolean;
        _backgroundGraphics?: import("@pixi/graphics-smooth").SmoothGraphics;
        _backgroundStyle?: import("./containerMixin").ContainerBackground;
        _backgroundSize?: import("@pixi/core").ISize;
        _backgroundGraphicsHandler: (layout: import("@pixi/core").Rectangle) => void;
        _debugGraphics?: import("@pixi/graphics-smooth").SmoothGraphics;
        _debugGraphicsHandler: (layout: import("@pixi/core").Rectangle) => void;
        set backgroundStyle(background: import("./containerMixin").ContainerBackground | undefined);
        get debugLayout(): boolean;
        set debugLayout(debugLayout: boolean);
        get yogaContainer(): boolean;
        set yogaContainer(yogaContainer: boolean);
        get isYogaRoot(): boolean;
    }
}

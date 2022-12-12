import { Renderer } from "@pixi/core";
import { ISize } from "@pixi/math";
import { Container, DisplayObject } from "@pixi/display";
import { IFillStyleOptions, ILineStyleOptions, SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { ComputedLayout } from "./FlexLayout";

declare module "@pixi/display"
{
    export interface Container {
        _flexContainer: boolean;
        _backgroundGraphics?: Graphics;
        _debugGraphics?: Graphics;
        _backgroundStyle?: ContainerBackground;
        _backgroundSize?: ISize;
        set backgroundStyle(background: ContainerBackground | undefined);
        get debugLayout(): boolean;
        set debugLayout(debugLayout: boolean);
        get flexContainer(): boolean;
        set flexContainer(flexContainer: boolean);
        get isLayoutRoot(): boolean;
    }
}

export const enum ContainerBackgroundShape {
    Rectangle,
    Ellipse,
}

export interface ContainerBackground {
    shape: ContainerBackgroundShape,
    fill?: IFillStyleOptions,
    stroke?: ILineStyleOptions;
    cornerRadius?: number;
}

export const drawContainerBackground = (graphics: Graphics, background: ContainerBackground, width: number, height: number) => {
    const { shape, fill, stroke, cornerRadius } = background;
    if (fill) {
        graphics.beginTextureFill(fill);
    }
    if (stroke) {
        graphics.lineStyle(stroke);
    }
    if (shape === ContainerBackgroundShape.Rectangle) {
        if (cornerRadius) {
            graphics.drawRoundedRect(0, 0, width, height, cornerRadius);
        } else {
            graphics.drawRect(0, 0, width, height);
        }
    } else if (shape === ContainerBackgroundShape.Ellipse) {
        graphics.drawEllipse(width / 2, height / 2, width / 2, height / 2);
    }
    if (fill) {
        graphics.endFill();
    }
};

const container = Container.prototype;

container._flexContainer = false;

const _super = {
    render: container.render,
    addChild: container.addChild,
    addChildAt: container.addChildAt,
    removeChild: container.removeChild,
    removeChildAt: container.removeChildAt,
    removeChildren: container.removeChildren,
    swapChildren: container.swapChildren,
    sortChildren: container.sortChildren,
    onLayoutChange: container.onLayoutChange,
};

Object.defineProperties(container, {
    flexContainer: {
        get(this: Container): boolean {
            return this._flexContainer;
        },
        set(this: Container, flexContainer: boolean) {
            if (flexContainer && !this._flexContainer) {
                // Add all children's layout nodes to our node
                for (const child of this.children) {
                    this.layout.appendChild(child.layout);
                }
            } else if (!flexContainer && this._flexContainer) {
                // Remove child nodes
                for (const child of this.children) {
                    this.layout.removeChild(child.layout);
                }
                if (this._debugGraphics) {
                    this._debugGraphics.destroy();
                    this._debugGraphics = undefined;
                }
            }
            this._flexContainer = flexContainer;
        },
    },
    isLayoutRoot: {
        get(this: Container): boolean {
            return this._flexContainer && (!this.parent || !this.parent.flexContainer);
        },
    },
    debugLayout: {
        get(this: Container): boolean {
            return !!this._debugGraphics;
        },
        set(this: Container, debugLayout: boolean) {
            if (process.env.NODE_ENV === "development") {
                if (!this._flexContainer) {
                    console.error("Cannot set debugLayout on a non-flex container");
                    return;
                }
                if (debugLayout && !this._debugGraphics) {
                    this._debugGraphics = new Graphics();
                    this._debugGraphics.layout.excluded = true;
                    this._debugGraphics.zIndex = Number.MAX_SAFE_INTEGER;
                    this.addChild(this._debugGraphics);
                } else if (!debugLayout && this._debugGraphics) {
                    this._debugGraphics.destroy();
                    this._debugGraphics = undefined;
                }
            }
        },
    },
    backgroundStyle: {
        get(this: Container): ContainerBackground | undefined {
            return this._backgroundStyle;
        },
        set(this: Container, background: ContainerBackground | undefined) {
            if (background === this._backgroundStyle) {
                return;
            }
            if (background && !this._backgroundGraphics) {
                this._backgroundGraphics = new Graphics();
                this._backgroundGraphics.layout.excluded = true;
                this.addChildAt(this._backgroundGraphics, 0);
                this._backgroundSize = { width: 0, height: 0 };
            } else if (!background && this._backgroundGraphics) {
                this._backgroundGraphics.destroy();
                this._backgroundGraphics = undefined;
                this._backgroundSize = undefined;
            } else if (background && this._backgroundGraphics) {
                const { width, height } = this.layout.computedLayout;
                if (width && height) {
                    this._backgroundGraphics!.clear();
                    drawContainerBackground(this._backgroundGraphics!, background, width, height);
                    this._backgroundSize = { width, height };
                }
            }
            this._backgroundStyle = background;
        },
    },
});

container.addChild = function <T extends DisplayObject[]>(...children: T): T[0] {
    const result = _super.addChild.call(this, ...children);
    // Container calls addChild recursively on every item in children
    if (this._flexContainer && children.length === 1) {
        this.layout.appendChild(children[0].layout);
    }
    return result;
}

container.addChildAt = function <T extends DisplayObject>(child: T, index: number): T {
    const result = _super.addChildAt.call(this, child, index) as T;
    if (this._flexContainer) {
        this.layout.insertChild(child.layout, index);
    }
    return result;
}

container.removeChild = function <T extends DisplayObject[]>(...children: T): T[0] {
    const result = _super.removeChild.call(this, ...children);
    // Container calls removeChild recursively on every item in children
    if (this._flexContainer && children.length === 1) {
        this.layout.removeChild(children[0].layout);
    }
    return result;
}

container.removeChildAt = function (index: number): DisplayObject {
    const result = _super.removeChildAt.call(this, index);
    if (this._flexContainer) {
        this.layout.removeChild(result.layout);
    }
    return result;
}

container.swapChildren = function (child: DisplayObject, child2: DisplayObject): void {
    _super.swapChildren.call(this, child, child2);
    if (this._flexContainer) {
        this.layout.removeChild(child.layout);
        this.layout.removeChild(child2.layout);
        let firstChild = undefined, secondChild = undefined;
        let i1 = -1, i2 = -1;
        for (let i = 0; i < this.children.length; i++) {
            const currentChild = this.children[i];
            if (currentChild === child || currentChild === child2) {
                if (i1 === -1) {
                    firstChild = currentChild;
                    i1 = i;
                } else {
                    secondChild = currentChild;
                    i2 = i;
                    break;
                }
            }
        }
        this.layout.insertChild(firstChild!.layout, i1);
        this.layout.insertChild(secondChild!.layout, i2);
    }
}

container.sortChildren = function (): void {
    _super.sortChildren.call(this);
    if (this._flexContainer) {
        // Remove and re-add all children in the new order
        for (const child of this.children) {
            this.layout.removeChild(child.layout);
        }
        for (const child of this.children) {
            this.layout.appendChild(child.layout);
        }
    }
}

container.render = function (renderer: Renderer) {
    if (this.isLayoutRoot) {
        this.layout.update();
        this.updateTransform();
    }
    _super.render.call(this, renderer);
}

container.onLayoutChange = function (layout: ComputedLayout): void {
    _super.onLayoutChange.call(this, layout);
    const { width, height } = layout;
    if (this._backgroundStyle && (width !== this._backgroundSize!.width || height !== this._backgroundSize!.height)) {
        this._backgroundGraphics!.clear();
        drawContainerBackground(this._backgroundGraphics!, this._backgroundStyle, width, height);
        this._backgroundSize = { width, height };
    }
    if (process.env.NODE_ENV === "development" && this._debugGraphics) {
        // Draw container padding, and the margin and border for all children
        this._debugGraphics.clear();
        const padding = this.layout.computedPadding;

        // Draw padding
        this._debugGraphics.beginFill(0x3300ff, 0.125, false);
        if (padding.top) {
            this._debugGraphics.drawRect(0, 0, width, padding.top);
        }
        if (padding.bottom) {
            this._debugGraphics.drawRect(0, height - padding.bottom, width, padding.bottom);
        }
        if (padding.left) {
            this._debugGraphics.drawRect(0, padding.top, padding.left, height - padding.top - padding.bottom);
        }
        if (padding.right) {
            this._debugGraphics.drawRect(width - padding.right, padding.top, padding.right, height - padding.top - padding.bottom);
        }
        this._debugGraphics.endFill();

        for (const child of this.children) {
            if (child.layout.excluded || !child.visible) {
                continue;
            }
            const border = child.layout.computedBorder;
            const margin = child.layout.computedMargin;

            const { left: childLeft, top: childTop, width: childWidth, height: childHeight } = child.layout.computedLayout;

            // Draw margin
            this._debugGraphics.beginFill(0xffff00, 0.125, false);
            if (margin.top) {
                this._debugGraphics.drawRect(childLeft, childTop - margin.top, childWidth, margin.top);
            }
            if (margin.bottom) {
                this._debugGraphics.drawRect(childLeft, childTop + childHeight, childWidth, margin.bottom);
            }
            if (margin.left) {
                this._debugGraphics.drawRect(childLeft - margin.left, childTop - margin.top, margin.left, childHeight + margin.top + margin.bottom);
            }
            if (margin.right) {
                this._debugGraphics.drawRect(childLeft + childWidth, childTop - margin.top, margin.right, childHeight + margin.top + margin.bottom);
            }
            this._debugGraphics.endFill();

            // Draw border
            this._debugGraphics.lineStyle({
                color: 0x808080,
                alpha: 1,
                width: Math.max(2, border.top),
                smooth: false,
            });
            this._debugGraphics.moveTo(childLeft - border.left / 2, childTop - border.top / 2);
            this._debugGraphics.lineTo(childLeft + childWidth + border.right / 2, childTop - border.top / 2);
            this._debugGraphics.lineStyle({
                color: 0x808080,
                alpha: 1,
                width: Math.max(2, border.right),
                smooth: false,
            });
            this._debugGraphics.lineTo(childLeft + childWidth + border.right / 2, childTop + childHeight + border.bottom / 2);
            this._debugGraphics.lineStyle({
                color: 0x808080,
                alpha: 1,
                width: Math.max(2, border.bottom),
                smooth: false,
            });
            this._debugGraphics.lineTo(childLeft - border.left / 2, childTop + childHeight + border.bottom / 2);
            this._debugGraphics.lineStyle({
                color: 0x808080,
                alpha: 1,
                width: Math.max(2, border.left),
                smooth: false,
            });
            this._debugGraphics.lineTo(childLeft - border.left / 2, childTop - border.top / 2);
            this._debugGraphics.lineStyle({ width: 0 });
        }
    }
}

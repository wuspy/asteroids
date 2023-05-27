import { Rectangle, Renderer } from "@pixi/core";
import { Container, DisplayObject } from "@pixi/display";
import { SmoothGraphics as Graphics, IFillStyleOptions, ILineStyleOptions } from "@pixi/graphics-smooth";

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

export function drawContainerBackground(
    graphics: Graphics,
    background: ContainerBackground,
    width: number,
    height: number
 ) {
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
}

const container = Container.prototype;

container._yogaContainer = false;

const _super = {
    render: container.render,
    addChild: container.addChild,
    addChildAt: container.addChildAt,
    removeChild: container.removeChild,
    removeChildAt: container.removeChildAt,
    removeChildren: container.removeChildren,
    swapChildren: container.swapChildren,
    sortChildren: container.sortChildren,
};

Object.defineProperties(container, {
    yogaContainer: {
        get(this: Container): boolean {
            return this._yogaContainer;
        },
        set(this: Container, yogaContainer: boolean) {
            if (yogaContainer && !this._yogaContainer) {
                // Add all children's layout nodes to our node
                for (const child of this.children) {
                    this.yoga.appendChild(child.yoga);
                }
            } else if (!yogaContainer && this._yogaContainer) {
                // Remove child nodes
                for (const child of this.children) {
                    this.yoga.removeChild(child.yoga);
                }
                if (this._debugGraphics) {
                    this._debugGraphics.destroy();
                    this._debugGraphics = undefined;
                }
            }
            this._yogaContainer = yogaContainer;
        },
    },
    isYogaRoot: {
        get(this: Container): boolean {
            return this._yogaContainer && (!this.parent || !this.parent._yogaContainer);
        },
    },
    debugLayout: {
        get(this: Container): boolean {
            return !!this._debugGraphics;
        },
        set(this: Container, debugLayout: boolean) {
            if (process.env.NODE_ENV === "development") {
                if (!this._yogaContainer) {
                    console.error("Cannot set debugLayout on a non-yoga container");
                    return;
                }
                if (debugLayout && !this._debugGraphics) {
                    this._debugGraphics = new Graphics();
                    this._debugGraphics.yoga.excluded = true;
                    this._debugGraphics.zIndex = Number.MAX_SAFE_INTEGER;
                    this.addChild(this._debugGraphics);
                    this.addListener("layout", this._debugGraphicsHandler);
                } else if (!debugLayout && this._debugGraphics) {
                    this._debugGraphics.destroy();
                    this._debugGraphics = undefined;
                    this.removeListener("layout", this._debugGraphicsHandler);
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
                this._backgroundGraphics.yoga.excluded = true;
                this.addChildAt(this._backgroundGraphics, 0);
                this._backgroundSize = { width: 0, height: 0 };
                this.addListener("layout", this._backgroundGraphicsHandler);
            } else if (!background && this._backgroundGraphics) {
                this._backgroundGraphics.destroy();
                this._backgroundGraphics = undefined;
                this._backgroundSize = undefined;
                this.removeListener("layout", this._backgroundGraphicsHandler);
            } else if (background && this._backgroundGraphics) {
                const { width, height } = this.yoga.computedLayout;
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
    if (this._yogaContainer && children.length === 1) {
        this.yoga.appendChild(children[0].yoga);
    }
    return result;
}

container.addChildAt = function <T extends DisplayObject>(child: T, index: number): T {
    const result = _super.addChildAt.call(this, child, index) as T;
    if (this._yogaContainer) {
        this.yoga.insertChild(child.yoga, index);
    }
    return result;
}

container.removeChild = function <T extends DisplayObject[]>(...children: T): T[0] {
    const result = _super.removeChild.call(this, ...children);
    // Container calls removeChild recursively on every item in children
    if (this._yogaContainer && children.length === 1) {
        this.yoga.removeChild(children[0].yoga);
    }
    return result;
}

container.removeChildAt = function (index: number): DisplayObject {
    const result = _super.removeChildAt.call(this, index);
    if (this._yogaContainer) {
        this.yoga.removeChild(result.layout);
    }
    return result;
}

container.swapChildren = function (child: DisplayObject, child2: DisplayObject): void {
    _super.swapChildren.call(this, child, child2);
    if (this._yogaContainer) {
        this.yoga.removeChild(child.yoga);
        this.yoga.removeChild(child2.yoga);
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
        this.yoga.insertChild(firstChild!.layout, i1);
        this.yoga.insertChild(secondChild!.layout, i2);
    }
}

container.sortChildren = function (): void {
    _super.sortChildren.call(this);
    if (this._yogaContainer) {
        // Remove and re-add all children in the new order
        for (const child of this.children) {
            this.yoga.removeChild(child.layout);
        }
        for (const child of this.children) {
            this.yoga.appendChild(child.layout);
        }
    }
}

container.render = function (renderer: Renderer) {
    if (this.isYogaRoot) {
        this.yoga.update();
        this.updateTransform();
    }
    _super.render.call(this, renderer);
}

container._backgroundGraphicsHandler = function (layout: Rectangle) {
    const { width, height } = layout;
    if (width !== this._backgroundSize!.width || height !== this._backgroundSize!.height) {
        this._backgroundGraphics!.clear();
        drawContainerBackground(this._backgroundGraphics!, this._backgroundStyle!, width, height);
        this._backgroundSize = { width, height };
    }
}

if (process.env.NODE_ENV === "development") {
    container._debugGraphicsHandler = function (layout: Rectangle) {
        const { width, height } = layout;
        if (!this._debugGraphics) {
            return;
        }

        // Draw container padding, and the margin and border for all children
        this._debugGraphics.clear();
        const padding = this.yoga.computedPadding;

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
            this._debugGraphics.drawRect(
                width - padding.right,
                padding.top,
                padding.right,
                height - padding.top - padding.bottom
            );
        }
        this._debugGraphics.endFill();

        for (const child of this.children) {
            if (child.layout.excluded || !child.visible) {
                continue;
            }
            const border = child.layout.computedBorder;
            const margin = child.layout.computedMargin;

            const {
                left: childLeft,
                top: childTop,
                width: childWidth,
                height: childHeight
            } = child.layout.computedLayout;

            // Draw margin
            this._debugGraphics.beginFill(0xffff00, 0.125, false);
            if (margin.top) {
                this._debugGraphics.drawRect(childLeft, childTop - margin.top, childWidth, margin.top);
            }
            if (margin.bottom) {
                this._debugGraphics.drawRect(childLeft, childTop + childHeight, childWidth, margin.bottom);
            }
            if (margin.left) {
                this._debugGraphics.drawRect(
                    childLeft - margin.left, childTop - margin.top,
                    margin.left, childHeight + margin.top + margin.bottom
                );
            }
            if (margin.right) {
                this._debugGraphics.drawRect(
                    childLeft + childWidth, childTop - margin.top,
                    margin.right, childHeight + margin.top + margin.bottom
                );
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
            this._debugGraphics.lineTo(
                childLeft + childWidth + border.right / 2,
                childTop + childHeight + border.bottom / 2
            );
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


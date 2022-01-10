import { Container, DisplayObject } from "@pixi/display";
import { IPointData, ISize, Rectangle } from "@pixi/math";
import { Layout, LayoutSizeSpec } from "./Layout";

type Margin = {
    left: number,
    top: number,
    right: number,
    bottom: number,
};

type ConstraintOptions = {
    offsetPx?: number,
    offsetPercent?: number,
};

type Target = Container | "parent";
type VerticalConstraintAnchor = "top" | "vcenter" | "bottom";
type HorizontalConstraintAnchor = "left" | "hcenter" | "right";
type ConstraintAnchor = VerticalConstraintAnchor | HorizontalConstraintAnchor;
type VerticalConstraint = [Target, VerticalConstraintAnchor, ConstraintOptions?];
type HorizontalConstraint = [Target, HorizontalConstraintAnchor, ConstraintOptions?];
export type Constraints = Partial<{ [Key in HorizontalConstraintAnchor]: HorizontalConstraint } & { [Key in VerticalConstraintAnchor]: VerticalConstraint }>;

// Used to manually type Object.entries calls on constraints
type ConstraintEntriesType = ([HorizontalConstraintAnchor, HorizontalConstraint] | [VerticalConstraintAnchor, VerticalConstraint])[];

const childMissingMessage = "Specified child is is not added to this layout";
const childExistsMessage = "Specified child is already added to this layout";

export class RelativeLayout extends Layout {
    private _layoutChildren: Container[];
    private _originsAtCenter: boolean[];
    private _margins: Margin[];
    private _constraints: Constraints[];

    /**
     * Helper function that creates constraints to center-align a child. Equivalent to
     * ```js
     * {
     *     hcenter: [target, "hcenter"],
     *     vcenter: [target, "vcenter"],
     * }
     * ```
     */
    static centeredIn(target: Target): Constraints {
        return {
            hcenter: [target, "hcenter"],
            vcenter: [target, "vcenter"],
        };
    }

    /**
     * Helper function that creates constraints to top-left-align a child. Equivalent to
     * ```js
     * {
     *     top: [target, "top"],
     *     left: [target, "left"],
     * }
     * ```
     */
    static topLeftOf(target: Target): Constraints {
        return {
            top: [target, "top"],
            left: [target, "left"],
        };
    }

    constructor(width?: LayoutSizeSpec, height?: LayoutSizeSpec) {
        super(width, height);
        this._layoutChildren = [];
        this._constraints = [];
        this._margins = [];
        this._originsAtCenter = [];
    }

    addChildWithConstraints<T extends Container>(child: T, options?: {
        margin?: number | Partial<Margin>,
        constraints?: Constraints,
        originAtCenter?: boolean,
    }): T {
        if (this._layoutChildren.indexOf(child) !== -1) {
            throw new Error(childExistsMessage);
        }
        const { margin, constraints, originAtCenter } = options ?? {};
        this._layoutChildren.push(child);
        this.setMargin(child, margin);
        this._originsAtCenter.push(!!originAtCenter);
        this._constraints.push({});
        if (constraints) {
            this.addConstraints(child, constraints);
        }
        return super.addChild(child);
    }

    addConstraints(child: Container, constraints: Constraints) {
        const i = this._layoutChildren.indexOf(child);
        if (i === -1) {
            throw new Error(childMissingMessage);
        }

        // TODO validate constraint

        this._constraints[i] = {
            ...this._constraints[i],
            ...constraints,
        };
    }

    setMargin(child: Container, margin?: number | Partial<Margin>) {
        const i = this._layoutChildren.indexOf(child);
        if (i === -1) {
            throw new Error(childMissingMessage);
        }
        if (typeof (margin) === "number") {
            this._margins[i] = { left: margin, top: margin, right: margin, bottom: margin };
        } else {
            this._margins[i] = { left: 0, top: 0, right: 0, bottom: 0, ...margin };
        }
    }

    getMargin(child: Container): Margin {
        const i = this._layoutChildren.indexOf(child);
        if (i === -1) {
            throw new Error(childMissingMessage);
        }
        return this._margins[i];
    }

    removeConstraints(child: Container, ...constraints: ConstraintAnchor[]) {
        const i = this._layoutChildren.indexOf(child);
        if (i === -1) {
            return;
        }
        for (const anchor of constraints) {
            delete this._constraints[i][anchor];
        }
    }

    override addChild<T extends DisplayObject[]>(...children: T): T[0] {
        for (const child of children) {
            if (child instanceof Container) {
                if (this._layoutChildren.indexOf(child) !== -1) {
                    throw new Error(childExistsMessage);
                }
                this._layoutChildren.push(child);
                this._margins.push({ left: 0, top: 0, right: 0, bottom: 0 });
                this._originsAtCenter.push(false);
                this._constraints.push({});
            }
        }
        return super.addChild(...children);
    }

    override addChildAt<T extends DisplayObject>(child: T, index: number): T {
        if (child instanceof Container && this._layoutChildren.indexOf(child) !== -1) {
            throw new Error(childExistsMessage);
        }
        const result = super.addChildAt(child, index);
        if (child instanceof Container) {
            this._layoutChildren.push(child);
            this._margins.push({ left: 0, top: 0, right: 0, bottom: 0 });
            this._originsAtCenter.push(false);
            this._constraints.push({});
        }
        return result;
    }

    override removeChild<T extends DisplayObject[]>(...children: T): T[0] {
        for (const child of children) {
            if (!(child instanceof Container)) {
                continue;
            }
            const i = this._layoutChildren.indexOf(child);
            if (!i) {
                continue;
            }
            this._layoutChildren.splice(i, 1);
            this._margins.splice(i, 1);
            this._originsAtCenter.splice(i, 1);
            this._constraints.splice(i, 1);
            // Remove any constraints referencing this child
            for (let i = this._constraints.length - 1; i >= 0; i--) {
                for (const [anchor, [target]] of Object.entries(this._constraints[i]) as ConstraintEntriesType) {
                    if (target === child) {
                        delete this._constraints[i][anchor];
                    }
                }
            }
        }
        return super.removeChild(...children);
    }

    update(): void {
        if (this.widthSpec === "matchParent") {
            this.layoutBounds.width = this.parent ? this.parent.width : 0;
        } else if (this.widthSpec === "matchContent") {
            this.layoutBounds.width = 0;
        }

        if (this.heightSpec === "matchParent") {
            this.layoutBounds.height = this.parent ? this.parent.height : 0;
        } else if (this.heightSpec === "matchContent") {
            this.layoutBounds.height = 0;
        }

        for (let i = 0; i < this._layoutChildren.length; i++) {
            let child = this._layoutChildren[i];
            const constraints = this._constraints[i];
            const margin = this._margins[i];
            const centerOrigin = this._originsAtCenter[i];
            const bounds = new Rectangle(
                child.x - margin.left - (centerOrigin ? child.width / 2 : 0),
                child.y - margin.top - (centerOrigin ? child.height / 2 : 0),
                child.width + margin.left + margin.right,
                child.height + margin.top + margin.bottom,
            );
            const newPosition: IPointData = { x: child.x, y: child.y };
            for (const [anchor, [target, targetAnchor, options]] of Object.entries(constraints) as ConstraintEntriesType) {
                let targetBounds;
                if (target === "parent") {
                    targetBounds = this.layoutBounds;
                    if ((this.widthSpec === "matchContent" && (targetAnchor === "right" || targetAnchor === "hcenter"))
                        || (this.heightSpec === "matchContent" && (targetAnchor === "bottom" || targetAnchor === "vcenter"))
                    ) {
                        throw new Error("matchContent layout size does not support center or end-aligned children");
                    }
                } else {
                    const ti = this._layoutChildren.indexOf(target);
                    const targetMargin = this._margins[ti];
                    const isTargetCenterOrigin = this._originsAtCenter[ti];
                    const isCenterTargetAnchor = targetAnchor === "hcenter" || targetAnchor === "vcenter";
                    targetBounds = new Rectangle(
                        target.x - (isCenterTargetAnchor ? 0 : targetMargin.left) - (isTargetCenterOrigin ? target.width / 2 : 0),
                        target.y - (isCenterTargetAnchor ? 0 : targetMargin.top) - (isTargetCenterOrigin ? target.height / 2 : 0),
                        target.width + (isCenterTargetAnchor ? 0 : targetMargin.left + targetMargin.right),
                        target.height + (isCenterTargetAnchor ? 0 : targetMargin.top + targetMargin.bottom),
                    );
                }
                let currentPosition, targetStart, targetEnd;
                let offsetDirection = 1;
                let axis: keyof IPointData;
                if (anchor === "left" || anchor === "right" || anchor === "hcenter") {
                    axis = "x";
                    targetStart = targetBounds.left;
                    targetEnd = targetBounds.right;
                    if (anchor === "left") {
                        currentPosition = bounds.left;
                    } else if (anchor === "right") {
                        currentPosition = bounds.right;
                        offsetDirection = -1;
                    } else if (anchor === "hcenter") {
                        currentPosition = (bounds.left + bounds.right + margin.left - margin.right) / 2;
                    } else {
                        continue;
                    }
                } else if (anchor === "top" || anchor === "bottom" || anchor === "vcenter") {
                    axis = "y";
                    targetStart = targetBounds.top;
                    targetEnd = targetBounds.bottom;
                    if (anchor === "top") {
                        currentPosition = bounds.top;
                    } else if (anchor === "bottom") {
                        currentPosition = bounds.bottom;
                        offsetDirection = -1;
                    } else if (anchor === "vcenter") {
                        currentPosition = (bounds.top + bounds.bottom + margin.top - margin.bottom) / 2;
                    } else {
                        continue;
                    }
                } else {
                    continue;
                }
                let delta;
                if ((targetAnchor === "top" && axis === "y") || (targetAnchor === "left" && axis === "x")) {
                    delta = targetStart - currentPosition;
                } else if ((targetAnchor === "bottom" && axis === "y") || (targetAnchor === "right" && axis === "x")) {
                    delta = targetEnd - currentPosition;
                } else if ((targetAnchor === "vcenter" && axis === "y") || (targetAnchor === "hcenter" && axis === "x")) {
                    delta = (targetStart + targetEnd) / 2 - currentPosition;
                } else {
                    continue;
                }
                if (options?.offsetPercent) {
                    delta += offsetDirection * (targetEnd - targetStart) * (options.offsetPercent / 100);
                }
                if (options?.offsetPx) {
                    delta += offsetDirection * options.offsetPx;
                }
                newPosition[axis] = child[axis] + delta;
            }
            if (!child.position.equals(newPosition)) {
                child.position.copyFrom(newPosition);
                child.updateTransform();
            }

            if (this.widthSpec === "matchContent") {
                this.layoutBounds.width = Math.max(this.layoutBounds.width, child.x - margin.left - (centerOrigin ? child.width / 2 : 0) + bounds.width);
            }
            if (this.heightSpec === "matchContent") {
                this.layoutBounds.height = Math.max(this.layoutBounds.height, child.y - margin.top - (centerOrigin ? child.height / 2 : 0) + bounds.height);
            }
        }
    }
}

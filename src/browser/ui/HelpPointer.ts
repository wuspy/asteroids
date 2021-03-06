import anime from "animejs";
import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LINE_JOIN } from "@pixi/graphics";
import { DEG_TO_RAD, PI_2 } from "@pixi/math";
import { Renderer } from "@pixi/core";
import { Vec2, TickQueue, PI_1_2 } from "../../core/engine";
import { TickableContainer } from "./TickableContainer";

export class HelpPointer extends TickableContainer {
    private readonly _timeline: anime.AnimeTimelineInstance;
    private readonly _pointerGraphics: Graphics;
    private readonly _content: Container;
    private readonly _color: number;
    private readonly _angle1: number;
    private readonly _angle2: number;
    private readonly _angle1Sin: number;
    private readonly _angle1Cos: number;
    private readonly _angle2Sin: number;
    private readonly _angle2Cos: number;
    private readonly _segmentLength: number;
    private readonly _contentPosition: Vec2;
    circleProgress: number;
    segment1Progress: number;
    segment2Progress: number;

    constructor(params: {
        queue: TickQueue,
        position: Vec2,
        content: Container,
        color: number,
        alpha?: number,
        pointerAlpha?: number,
        segmentLength: number,
        angle1: number,
        angle2: number,
        duration: number,
        delay: number,
    }) {
        super(params.queue);
        this.position.set(params.position.x, params.position.y);
        this._timeline = anime.timeline({ autoplay: false, easing: "linear" });

        this._pointerGraphics = new Graphics();
        this._content = params.content;
        this._color = params.color;
        this._pointerGraphics.alpha = params.pointerAlpha ?? 1;
        this.alpha = params.alpha ?? 1;
        this.addChild(this._pointerGraphics, this._content);
        this._segmentLength = params.segmentLength;
        this._angle1 = params.angle1 % PI_2;
        this._angle2 = params.angle2 % PI_2;
        this._angle1Sin = Math.sin(params.angle1);
        this._angle1Cos = Math.cos(params.angle1);
        this._angle2Sin = Math.sin(params.angle2);
        this._angle2Cos = Math.cos(params.angle2);
        this._contentPosition = {
            x: (4 + this._segmentLength) * this._angle1Sin + this._segmentLength * this._angle2Sin,
            y: (4 + this._segmentLength) * -this._angle1Cos + this._segmentLength * -this._angle2Cos,
        };

        this._content.alpha = 0;
        this.circleProgress = this.segment1Progress = this.segment2Progress = 0;
        this._timeline.add({
            targets: this,
            delay: params.delay,
            circleProgress: 1,
            duration: params.duration / 3,
        }).add({
            targets: this,
            segment1Progress: 1,
            duration: params.duration / 3,
        }).add({
            targets: this,
            segment2Progress: 1,
            duration: params.duration / 3,
        });
    }

    reverse() {
        this._timeline.reverse();
    }

    tick(timestamp: number, elapsed: number): void {
        if (!this._timeline.completed) {
            this._timeline.tick(timestamp);
            this._pointerGraphics.clear();
            this._pointerGraphics.lineStyle({
                color: this._color,
                width: 2,
                join: LINE_JOIN.BEVEL,
            });
            const circleAngle = this._angle1 - PI_1_2;
            this._pointerGraphics.arc(0, 0, 4, circleAngle, circleAngle + this.circleProgress * PI_2);

            const currentPosition = { x: 4 * this._angle1Sin, y: 4 * -this._angle1Cos };
            if (this.segment1Progress) {
                const length = this._segmentLength * this.segment1Progress;
                currentPosition.x += length * this._angle1Sin;
                currentPosition.y += length * -this._angle1Cos;
                this._pointerGraphics.lineTo(currentPosition.x, currentPosition.y);
            }
            if (this.segment2Progress) {
                const length = this._segmentLength * this.segment2Progress;
                currentPosition.x += length * this._angle2Sin;
                currentPosition.y += length * -this._angle2Cos;
                this._pointerGraphics.lineTo(currentPosition.x, currentPosition.y);
            }
            // The content also fades in with segment 2
            this._content.alpha = this.segment2Progress;
        }
    }

    override render(renderer: Renderer): void {
        if (this._angle2 >= 315 * DEG_TO_RAD || this._angle2 <= 45 * DEG_TO_RAD) {
            this._content.position.set(this._contentPosition.x - this._content.width / 2, this._contentPosition.y - this._content.height);
        } else if (this._angle2 < 135 * DEG_TO_RAD) {
            this._content.position.set(this._contentPosition.x, this._contentPosition.y - this._content.height / 2);
        } else if (this._angle2 > 225 * DEG_TO_RAD) {
            this._content.position.set(this._contentPosition.x - this._content.width, this._contentPosition.y - this._content.height / 2);
        } else {
            this._content.position.set(this._contentPosition.x - this._content.width / 2, this._contentPosition.y);
        }
        super.render(renderer);
    }
}

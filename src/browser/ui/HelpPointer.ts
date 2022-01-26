import anime from "animejs";
import { Container } from "@pixi/display";
import { SmoothGraphics as Graphics } from "@pixi/graphics-smooth";
import { LINE_JOIN } from "@pixi/graphics";
import { DEG_TO_RAD, PI_2 } from "@pixi/math";
import { Renderer } from "@pixi/core";
import { Vec2 } from "@core/engine";

export class HelpPointer extends Container {
    private readonly _timeline: anime.AnimeTimelineInstance;
    private readonly _graphics: Graphics;
    private readonly _content: Container;
    private readonly _color: number;
    private readonly _alpha: number;
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
        position: Vec2,
        content: Container,
        color: number,
        alpha: number,
        segmentLength: number,
        angle1: number,
        angle2: number,
        duration: number,
        delay: number,
    }) {
        super();
        this.position.set(params.position.x, params.position.y);
        this._timeline = anime.timeline({ autoplay: false, easing: "linear" });

        this._graphics = new Graphics();
        this._content = params.content;
        this._color = params.color;
        this._alpha = params.alpha;
        this.addChild(this._graphics, this._content);
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

    override render(renderer: Renderer): void {
        if (!this._timeline.completed) {
            this._timeline.tick(Date.now());
            this._graphics.clear();
            this._graphics.lineStyle({
                color: this._color,
                alpha: this._alpha,
                width: 2,
                join: LINE_JOIN.BEVEL,
            });
            const circleAngle = this._angle1 - Math.PI / 2;
            this._graphics.arc(0, 0, 4, circleAngle, circleAngle + this.circleProgress * PI_2);

            const currentPosition = { x: 4 * this._angle1Sin, y: 4 * -this._angle1Cos };
            if (this.segment1Progress) {
                const length = this._segmentLength * this.segment1Progress;
                currentPosition.x += length * this._angle1Sin;
                currentPosition.y += length * -this._angle1Cos;
                this._graphics.lineTo(currentPosition.x, currentPosition.y);
            }
            if (this.segment2Progress) {
                const length = this._segmentLength * this.segment2Progress;
                currentPosition.x += length * this._angle2Sin;
                currentPosition.y += length * -this._angle2Cos;
                this._graphics.lineTo(currentPosition.x, currentPosition.y);
            }
            // The content also fades in with segment 2
            this._content.alpha = this.segment2Progress;
        }
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

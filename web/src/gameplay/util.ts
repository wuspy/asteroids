import { Container } from "@pixi/display";
import { GameObject } from "@wuspy/asteroids-core";

export function trackGameObject(object: GameObject, container: Container): void {
    container.position.copyFrom(object.position);
    container.rotation = object.rotation;

    object.onPositionChange = position => container.position.copyFrom(position);
    object.onRotationChange = rotation => container.rotation = rotation;
}

export function untrackGameObject(object: GameObject): void {
    object.onPositionChange = undefined;
    object.onRotationChange = undefined;
}

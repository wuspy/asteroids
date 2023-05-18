precision mediump float;

attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;
varying vec2 vFilterCoord;

uniform vec4 inputSize;
uniform vec4 outputFrame;

void main(void)
{
    vFilterCoord = aVertexPosition * outputFrame.zw + outputFrame.xy;
    vTextureCoord = aVertexPosition * (outputFrame.zw * inputSize.zw);
    gl_Position = vec4((projectionMatrix * vec3(vFilterCoord, 1.0)).xy, 0.0, 1.0);
}

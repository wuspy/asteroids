varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec2 dimensions;
uniform float warpAmount;

vec2 warp(vec2 pos)
{
    pos = pos * 2.0 - 1.0;
    pos *= vec2(
        1.0 + (pos.y * pos.y) * warpAmount,
        1.0 + (pos.x * pos.x) * warpAmount
    );
    return pos * 0.5 + 0.5;
}

void main(void)
{
    gl_FragColor = texture2D(uSampler, warp(vTextureCoord));
}

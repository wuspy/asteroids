varying vec2 vTextureCoord;
uniform vec4 filterArea;

uniform sampler2D uSampler;
uniform float maxDisplacement;
uniform float exponent;
uniform bool swap;

void main(void)
{
    vec2 displacement = vTextureCoord * 2.0 - 1.0;
    if (exponent != 1.0) {
        displacement = sign(displacement) * pow(abs(displacement), vec2(exponent, exponent));
    }
    displacement *= maxDisplacement;
    vec2 pxTextureCoord = vTextureCoord * filterArea.xy;
    vec2 outwardCoord = (pxTextureCoord - displacement) / filterArea.xy;
    vec2 inwardCoord = (pxTextureCoord + displacement) / filterArea.xy;
    gl_FragColor.r = texture2D(uSampler, swap ? inwardCoord : outwardCoord).r;
    gl_FragColor.b = texture2D(uSampler, swap ? outwardCoord : inwardCoord).b;
    gl_FragColor.ga = texture2D(uSampler, vTextureCoord).ga;
}

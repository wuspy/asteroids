precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec4 filterArea;
uniform float maxDisplacement;
uniform float exponent;
uniform bool swap;

vec2 mapCoord(vec2 coord)
{
    coord *= filterArea.xy;
    coord += filterArea.zw;

    return coord;
}

vec2 unmapCoord(vec2 coord)
{
   coord -= filterArea.zw;
   coord /= filterArea.xy;

   return coord;
}

void main(void)
{
   vec2 displacement = vTextureCoord * 2.0 - 1.0;
   if (exponent != 1.0) {
      displacement = sign(displacement) * pow(abs(displacement), vec2(exponent, exponent));
   }
   displacement *= maxDisplacement;
   vec2 pxTextureCoord = mapCoord(vTextureCoord);
   vec2 outwardCoord = unmapCoord(pxTextureCoord - displacement);
   vec2 inwardCoord = unmapCoord(pxTextureCoord + displacement);
   gl_FragColor.r = texture2D(uSampler, swap ? inwardCoord : outwardCoord).r;
   gl_FragColor.g = texture2D(uSampler, vTextureCoord).g;
   gl_FragColor.b = texture2D(uSampler, swap ? outwardCoord : inwardCoord).b;
   gl_FragColor.a = texture2D(uSampler, vTextureCoord).a;
}

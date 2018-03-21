precision highp float;
varying vec2 vPos;
uniform float time;

float r;

float Q(float a, float b, float c, float d, float e) {
  float v = 0.5 + 0.5 * sin(time * a + atan(vPos.y, vPos.x) * b + sin(log(r * c) * d * sin(time * e)));
  return v*v*v;
}
void main() {
  r = length(vPos);

  gl_FragColor.a = 1.0;
  gl_FragColor.r = Q(1.000, 5.0, 0.54, 5.00, 0.2471);
  gl_FragColor.g = Q(1.123, 3.0, 0.59, 4.97, 0.2871);
  gl_FragColor.b = Q(1.722, 4.0, 0.57, 5.13, 0.2371);
}
precision highp float;

uniform sampler2D tHeight;
uniform vec3 sunDir;
uniform float horizon;

varying vec2 uv;

float noise(vec2 p) {
  p = (p + horizon) / (horizon * 2.0);
  return texture2D(tHeight, p).r;
}

void main() {
  vec2 r0_2d = horizon * (uv * 2.0 - 1.0);
  vec3 r0 = vec3(r0_2d.x, noise(r0_2d.xy), r0_2d.y);
  float t = 0.1;
  float dt = 8.0;
  float hShadow = 0.0;
  for (int i = 0; i < 8192; i++) {
    vec3 r = r0 + sunDir * t;
    float h = noise(r.xz) - sunDir.y * t;
    hShadow = max(hShadow, h);
    t += dt;
  }
  gl_FragColor = vec4(hShadow);
}

precision highp float;

uniform sampler2D tNoise;
uniform float tNoiseSize, scale, height, dist;
uniform bool origin;

varying vec2 uv;

#pragma glslify: heightmap = require(./noise/height.glsl)

void main() {
  vec2 p = uv * 2.0 - 1.0;
  if (origin) p = vec2(0);
  float h = heightmap(p * dist, scale, height, tNoise, tNoiseSize);
  gl_FragColor = vec4(h);
}

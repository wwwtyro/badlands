precision highp float;

uniform sampler2D tPosition, tNoise;
uniform float tNoiseSize, scale, height;

varying vec2 uv;

#pragma glslify: heightmap = require(./noise/height.glsl)

void main() {
  vec4 src = texture2D(tPosition, uv);
  if (src.a == 0.0) discard;
  vec2 p = src.xz;
  float dr = 0.1;
  float n0, nx, nz;
  n0 = heightmap(p, scale, height, tNoise, tNoiseSize);
  nx = heightmap(p + vec2(dr, 0), scale, height, tNoise, tNoiseSize);
  nz = heightmap(p + vec2(0, dr), scale, height, tNoise, tNoiseSize);
  vec3 n0nx = vec3(dr, nx - n0, 0);
  vec3 n0nz = vec3(0,  nz - n0, dr);
  gl_FragColor = vec4(normalize(cross(n0nz, n0nx)), 1);
}

precision highp float;

attribute vec3 position;

uniform sampler2D tNoise;
uniform mat4 model, view, projection;
uniform float tNoiseSize, height, scale;

varying vec3 vPos;


#pragma glslify: heightmap = require(./noise/height.glsl)


void main() {
  vec4 p = model * vec4(position, 1);
  p.y = heightmap(p.xz, scale, height, tNoise, tNoiseSize);
  gl_Position = projection * view * p;
  vPos = p.xyz;
}

precision highp float;

uniform sampler2D tPosition, tNormal, tNoise;
uniform vec3 highFlat0, highFlat1, highSteep0, highSteep1, lowFlat0, lowFlat1, lowSteep0, lowSteep1;
uniform float tNoiseSize;

#pragma glslify: cursive_noise = require(./noise/cursive.glsl)

varying vec2 uv;

void main() {
  vec4 pos = texture2D(tPosition, uv).rgba;
  if (pos.a == 0.0) discard;
  vec3 n = texture2D(tNormal, uv).xyz;
  float slope = clamp(dot(n, vec3(0,1,0)), 0.0, 1.0);
  slope = pow(slope, 4.0);
  float h = clamp(pos.y/51200.0, 0.0, 1.0);
  vec3 lowFlat = mix(lowFlat0, lowFlat1, cursive_noise(pos.xz * 0.001 + 1.0, 1.0, tNoise, tNoiseSize));
  vec3 highFlat = mix(highFlat0, highFlat1, cursive_noise(pos.xz * 0.001 - 1.0, 1.0, tNoise, tNoiseSize));
  vec3 lowSteep = mix(lowSteep0, lowSteep1, cursive_noise(pos.xz * 0.001 + 2.0, 1.0, tNoise, tNoiseSize));
  vec3 highSteep = mix(highSteep0, highSteep1, cursive_noise(pos.xz * 0.001 - 2.0, 1.0, tNoise, tNoiseSize));
  vec3 _flat = mix(lowFlat, highFlat, h);
  vec3 steep = mix(lowSteep, highSteep, h);
  vec3 c = mix(steep, _flat, slope) * 0.25;
  gl_FragColor = vec4(c, 1);
}

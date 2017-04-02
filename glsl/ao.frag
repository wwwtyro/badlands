precision highp float;

uniform samplerCube tSky;
uniform sampler2D tPosition, tNormal, tAOSampling, tNoise;
uniform float tNoiseSize, scale, height, tAOSamplingSize;

varying vec2 uv;

#pragma glslify: heightmap = require(./noise/height.glsl)

void main() {
  vec4 src = texture2D(tPosition, uv);
  if (src.a == 0.0) discard;
  vec3 n = texture2D(tNormal, uv).xyz;
  vec3 p = src.xyz;
  p.y = heightmap(p.xz, scale, height, tNoise, tNoiseSize);
  vec3 ambient = vec3(0);
  float occlusion = 0.0;
  for (int i = 0; i < 65536; i++) {
    if (float(i) > tAOSamplingSize) break;
    vec3 r = texture2D(tAOSampling, vec2(float(i)/tAOSamplingSize)).xyz;
    if (dot(n, r) < 0.0) {
      r = -r;
    }
    vec3 p2 = p + r;
    if (p2.y <= heightmap(p2.xz, scale, height, tNoise, tNoiseSize)) {
      occlusion += 1.0;
    }
    r.y = abs(r.y);
    ambient += textureCube(tSky, normalize(r)).rgb;
  }
  ambient = ambient / tAOSamplingSize;
  float ao = 1.0 - occlusion / tAOSamplingSize;
  gl_FragColor = vec4(ambient, ao);
}

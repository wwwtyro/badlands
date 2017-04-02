precision highp float;

uniform samplerCube tSky;
uniform sampler2D tPosition, tNormal, tHeight, tShadow;
uniform vec3 sunDir;
uniform float horizon;

varying vec2 uv;

float noise(vec2 p) {
  p = (p + horizon) / (horizon * 2.0);
  return texture2D(tHeight, p).r;
}

float shadow(vec2 p) {
  p = (p + horizon) / (horizon * 2.0);
  return texture2D(tShadow, p).r;
}

float light(vec3 r0) {
  return clamp(0.01 * (r0.y - shadow(r0.xz)), 0.0, 1.0);
}

void main() {
  vec4 src = texture2D(tPosition, uv);
  if (src.a == 0.0) discard;
  vec3 n = texture2D(tNormal, uv).xyz;
  vec3 p = src.xyz;
  p.y = noise(p.xz);
  float angle = clamp(dot(n, sunDir), 0.0, 1.0);
  vec3 sunlight = textureCube(tSky, sunDir).rgb * light(p + n * 64.0) * angle;
  gl_FragColor = vec4(sunlight, 1);
}

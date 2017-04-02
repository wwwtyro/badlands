precision highp float;

uniform samplerCube tSky;
uniform sampler2D tPosition, tShadow;
uniform mat4 invpv;
uniform vec3 sunDir, campos;
uniform float horizon, fog, groundFog, groundFogAlt;

varying vec2 uv;

float shadow(vec2 p) {
  p = (p + horizon) / (horizon * 2.0);
  return texture2D(tShadow, p).r;
}

float light(vec3 r0) {
  return clamp(0.01 * (r0.y - shadow(r0.xz)), 0.0, 1.0);
}

float density(vec3 p) {
  float constant_fog = fog;
  float ground_fog = (1.0 - exp(-0.001 * max(0.0, groundFogAlt - p.y))) * groundFog;
  return constant_fog + ground_fog;
}

void main() {
  vec4 pos = texture2D(tPosition, uv);
  vec3 sunColor = textureCube(tSky, sunDir).rgb;
  vec3 skyColor = textureCube(tSky, vec3(0,1,0)).rgb;
  float extinction = 1.0;
  vec3 scattering = vec3(0);
  const int steps = 256;
  const float scatteringFactor = 0.01;
  const float extinctionFactor = 0.05;
  float dist;
  vec3 rd;
  if (pos.a == 0.0) {
    dist = horizon;
    vec4 r4 = invpv * vec4(2.0 * uv - 1.0, 1, 1);
    rd = normalize(r4.xyz/r4.w);
  } else {
    dist = distance(pos.xyz, campos);
    rd = normalize(pos.xyz - campos);
  }
  float dt = dist/float(steps - 1);
  float t = 0.0;
  for (int i = 0; i < steps; i++) {
    vec3 r = campos + rd * t;
    float dens = density(r);
    float coeffScattering = scatteringFactor * dens;
    float coeffExtinction = extinctionFactor * dens;
    extinction *= exp(-coeffExtinction * dt);
    vec3 sun = skyColor * 8.0;
    sun += light(r) * sunColor;
    vec3 stepScattering = coeffScattering * dt * sun;
    scattering += extinction * stepScattering;
    t += dt;
  }
  gl_FragColor = vec4(scattering, extinction);
}

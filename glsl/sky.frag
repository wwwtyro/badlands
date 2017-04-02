precision highp float;

uniform mat4 _invpv;
uniform vec3 sunDir;

varying vec2 uv;

#pragma glslify: atmosphere = require(glsl-atmosphere)

void main() {
  vec4 r4 = _invpv * vec4(2.0 * uv - 1.0, 1, 1);
  vec3 r = normalize(r4.xyz/r4.w);
  vec3 c = atmosphere(
      r,                              // normalized ray direction
      vec3(0,6372e3,0),               // ray origin
      sunDir,                         // direction of the sun
      22.0,                           // intensity of the sun
      6371e3,                         // radius of the planet in meters
      6471e3,                         // radius of the atmosphere in meters
      vec3(5.5e-6, 13.0e-6, 22.4e-6), // Rayleigh scattering coefficient
      21e-6,                          // Mie scattering coefficient
      8e3,                            // Rayleigh scale height
      1.2e3,                          // Mie scale height
      0.758                           // Mie preferred scattering direction
    );
  // super duper hacky approximation of sun intensity & radius
  float d = clamp(dot(r, sunDir), 0.0, 1.0);
  float d2 = clamp(dot(vec3(0,1,0), sunDir), 0.0, 1.0);
  c = mix(c, c * mix(4.0, 8.0, d2), smoothstep(0.999, 0.9999, d));
  gl_FragColor = vec4(c, 1);
}

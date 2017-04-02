precision highp float;

uniform samplerCube tSky;
uniform sampler2D tPosition, tDirect, tAO, tDiffuse, tMedia;
uniform mat4 invpv;
uniform vec3 sunDir;

varying vec2 uv;

void main() {

  vec4 pos = texture2D(tPosition, uv);
  vec4 r4 = invpv * vec4(2.0 * uv - 1.0, 1, 1);
  vec3 rd = normalize(r4.xyz/r4.w);
  vec3 sky = textureCube(tSky, rd).rgb;
  vec3 sun = textureCube(tSky, sunDir).rgb;
  vec3 direct = texture2D(tDirect, uv).rgb;
  vec4 ao = texture2D(tAO, uv);
  vec3 diffuse = texture2D(tDiffuse, uv).rgb;
  vec4 pmedia = texture2D(tMedia, uv);

  vec3 c;
  if (pos.a == 0.0) {
    c = sky;
  } else {
    c = diffuse * (1.0 * direct + ao.rgb * pow(ao.a, 8.0));
  }

  c = pmedia.rgb + pmedia.a * c;
  c = pow(c, vec3(1.0/2.2));
  gl_FragColor = vec4(c, 1);

}

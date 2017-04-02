precision highp float;

uniform sampler2D tSource;

varying vec2 uv;

void main() {
  gl_FragColor = texture2D(tSource, uv);
}

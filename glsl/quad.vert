precision highp float;

attribute vec2 position;

varying vec2 uv;

void main() {
  gl_Position = vec4(position, 0, 1);
  uv = 0.5 + 0.5 * position;
}

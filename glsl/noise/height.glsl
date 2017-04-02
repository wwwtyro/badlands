
#pragma glslify: cursive_noise = require(./cursive.glsl)
#pragma glslify: perlin2D_normal = require(./perlin_normal.glsl)

float height(vec2 p, float scale, float height, sampler2D tNoise, float tNoiseSize) {
    p = p * 0.001 * scale;
    p += 11.0;
    float h = cursive_noise(p, scale, tNoise, tNoiseSize) * height * 1.0;
    h += pow(perlin2D_normal(p * 0.25, tNoise, tNoiseSize) + 0.25, 4.0) * height * 3.0;
    h = mix(perlin2D_normal(p * 0.4, tNoise, tNoiseSize) * height * 1.0, h, h/(height*4.0));
    return h;
}

#pragma glslify: export(height)

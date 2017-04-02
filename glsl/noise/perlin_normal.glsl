
#pragma glslify: perlin2D = require(./perlin.glsl)

float perlin2D_normal(vec2 p, sampler2D tNoise, float tNoiseSize) {
    return perlin2D(p, tNoise, tNoiseSize) * 0.5 + 0.5;
}

#pragma glslify: export(perlin2D_normal)

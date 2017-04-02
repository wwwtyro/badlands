
#pragma glslify: perlin2D_normal = require(./perlin_normal.glsl)

float cursive_noise(vec2 p, float scale, sampler2D tNoise, float tNoiseSize) {
    const int steps = 13;
    float sigma = 0.7;
    float gamma = pow(1.0/sigma, float(steps));
    vec2 displace = vec2(0);
    for (int i = 0; i < steps; i++) {
        displace = 1.5 * vec2(
          perlin2D_normal(p.xy * gamma + displace, tNoise, tNoiseSize),
          perlin2D_normal(p.yx * gamma + displace, tNoise, tNoiseSize)
        );
        gamma *= sigma;
    }
    return perlin2D_normal(p * gamma + displace, tNoise, tNoiseSize);
}

#pragma glslify: export(cursive_noise)

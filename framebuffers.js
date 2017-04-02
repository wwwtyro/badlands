'use strict';

const fb = {};

module.exports = function(regl, screenRes, hmapRes, skyRes) {

  fb.position = fb.position || regl.framebuffer();
  fb.height = fb.height || regl.framebuffer();
  fb.sky = fb.sky || regl.framebufferCube();
  fb.shadow = fb.shadow || regl.framebuffer();
  fb.normal = fb.normal || regl.framebuffer();
  fb.media = fb.media || regl.framebuffer();
  fb.diffuse = fb.diffuse || regl.framebuffer();
  fb.ao = fb.ao || regl.framebuffer();
  fb.direct = fb.direct || regl.framebuffer();
  fb.compose = fb.compose || regl.framebuffer();

  fb.position ({
    width: screenRes.x,
    height: screenRes.y,
    colorFormat: "rgba",
    colorType: "float32",
  });

  fb.height ({
    width: hmapRes.x,
    height: hmapRes.y,
    color: regl.texture({
      width: hmapRes.x, height: hmapRes.y,
      mag: 'linear', min: 'linear',
      format: 'rgba', type: 'float32'
    })
  });

  fb.sky ({
    radius: skyRes,
    color: regl.cube({
      width: skyRes,
      height: skyRes,
      format: 'rgba', type: 'float32',
      mag: 'linear', min: 'linear'
    })
  });

  fb.shadow ({
    width: hmapRes.x,
    height: hmapRes.y,
    color: regl.texture({
      width: hmapRes.x, height: hmapRes.y,
      mag: 'linear', min: 'linear',
      format: 'rgba', type: 'float32'
    })
  });

  fb.normal ({
    width: screenRes.x,
    height: screenRes.y,
    colorFormat: "rgba",
    colorType: "float32",
  });

  fb.media ({
    width: screenRes.x,
    height: screenRes.y,
    color: regl.texture({
      width: screenRes.x, height: screenRes.y,
      mag: 'linear', min: 'linear',
      format: 'rgba', type: 'float32'
    })
  });

  fb.diffuse ({
    width: screenRes.x,
    height: screenRes.y,
    colorFormat: "rgba",
    colorType: "float32",
  });

  fb.ao ({
    width: screenRes.x,
    height: screenRes.y,
    colorFormat: "rgba",
    colorType: "float32",
  });

  fb.direct ({
    width: screenRes.x,
    height: screenRes.y,
    colorFormat: "rgba",
    colorType: "float32",
  });

  fb.compose ({
    width: screenRes.x,
    height: screenRes.y,
    colorFormat: "rgba",
    colorType: "float32",
  });

  return fb;

};

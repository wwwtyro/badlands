'use strict';

const mat4 = require('gl-matrix').mat4;
const vec3 = require('gl-matrix').vec3;

const createOrUpdateFramebuffers = require('./framebuffers');
const createCommands = require('./commands');

let cmd, tNoise, tAOSampling, chunkMesh, progressiveCmd;

async function render(regl, params) {
  const statusCallback = params.callback || function() {};
  const canvas = params.canvas;
  const fov = params.fov/360 * Math.PI * 2.0;
  const sunDir = tod2sundir(params.tod);
  const fog = params.fog;
  const groundFog = params.groundFog;
  const groundFogAlt = params.groundFogAlt;

  statusCallback('Compiling shaders...')
  await display();
  cmd = cmd || createCommands(regl);

  const res = {x: canvas.width, y: canvas.height};
  const hmapRes = {x: 1024, y: 1024};
  const skyres = 1024;

  statusCallback('Creating framebuffers...')
  await display();
  const fb = createOrUpdateFramebuffers(regl, res, hmapRes, skyres);

  const distance = 65536;
  const terrainResolution = 32;
  const chunks = 32;
  const chunkSize = distance * 2.0 / chunks;
  const chunkResolution = chunkSize / terrainResolution;
  const height = 1024;
  const scale = 1.0;
  const tNoiseSize = 256;
  const tAOSamplingSize = 128;
  const tAOSamplingRate = 1/100;

  statusCallback('Creating AO sampling vectors...')
  await display();
  generateAOSamplingTexture(regl, tAOSamplingSize, tAOSamplingRate);

  statusCallback('Creating noise...')
  await display();
  generateNoiseTexture(regl, tNoiseSize);

  cmd.height({
    tNoise: tNoise,
    tNoiseSize: tNoiseSize,
    scale: scale,
    height: height,
    horizon: distance,
    vpHmap: {x: 0, y: 0, width: 1, height: 1},
    destination: fb.height,
    origin: true
  });

  let terrainHeight;
  regl({framebuffer: fb.height})(() => {
    let pixels = regl.read();
    terrainHeight = pixels[0];
  });

  const campos = [0, terrainHeight + params.alt, 0];
  const dirrad = params.dir/360 * Math.PI * 2;
  const view  = mat4.lookAt([], campos, [Math.cos(dirrad), campos[1], Math.sin(dirrad)], vec3.normalize([], [0, 1, 0]));
  const proj  = mat4.perspective([], fov, res.x/res.y, 1, 65536);

  statusCallback('Generating chunk mesh...')
  await display();
  if (chunkMesh === undefined) {
    chunkMesh = generateChunkMeshIndexed(chunkSize, chunkResolution);
    chunkMesh.cells = regl.elements({
      data: chunkMesh.cells,
      type: 'uint32'
    });
  }


  const pv = mat4.multiply([], proj, view);
  const invpv = mat4.invert([], pv);

  const cmdctx = {
    tPosition: fb.position,
    tHeight: fb.height,
    tSky: fb.sky,
    tShadow: fb.shadow,
    tNormal: fb.normal,
    tMedia: fb.media,
    tDiffuse: fb.diffuse,
    tAO: fb.ao,
    tDirect: fb.direct,
    tCompose: fb.compose,
    tNoise: tNoise,
    tNoiseSize: tNoiseSize,
    tAOSampling: tAOSampling,
    tAOSamplingSize: tAOSamplingSize,
    height: height,
    scale: scale,
    invpv: invpv,
    horizon: distance,
    sunDir: sunDir,
    campos: campos,
    fog: fog,
    highFlat0: params.colors.high.flat[0],
    highFlat1: params.colors.high.flat[1],
    highSteep0: params.colors.high.steep[0],
    highSteep1: params.colors.high.steep[1],
    lowFlat0: params.colors.low.flat[0],
    lowFlat1: params.colors.low.flat[1],
    lowSteep0: params.colors.low.steep[0],
    lowSteep1: params.colors.low.steep[1],
    groundFog: groundFog,
    groundFogAlt: groundFogAlt,
    vpScreen: {x: 0, y: 0, width: res.x, height: res.y},
    vpHmap: {x: 0, y: 0, width: hmapRes.x, height: hmapRes.y},
    vpSky: {x: 0, y: 0, width: skyres, height: skyres},
  };

  function ctx(src) {
    return Object.assign(cmdctx, src);
  }

  let visibleChunks = [];
  for (let z = 0; z < chunks; z++) {
    let cz = z - chunks/2;
    for (let x = 0; x < chunks; x++) {
      let cx = x - chunks/2;
      visibleChunks.push({
        x: cx * chunkSize,
        z: cz * chunkSize
      });
    }
  }

  let renderCount = 0, renderCountTarget = 1, totalCount = 0;
  let tLast = performance.now();
  for (let chunk of visibleChunks) {
    let model = mat4.create([]);
    model = mat4.translate(model, model, [chunk.x, 0, chunk.z]);
    cmd.position(ctx({
      position: chunkMesh.positions,
      elements: chunkMesh.cells,
      model: model,
      view: view,
      projection: proj,
      destination: fb.position,
    }));
    renderCount++;
    totalCount++;
    if (renderCount === renderCountTarget) {
      statusCallback('Calculating terrain positions', totalCount/visibleChunks.length);
      await display();
      if (performance.now() - tLast >= 1000/50) {
        renderCountTarget = Math.max(1, renderCountTarget - 1);
      } else {
        renderCountTarget = renderCountTarget * 2;
      }
      renderCount = 0;
      tLast = performance.now();
    }
  }

  let pr;

  pr = new ProgressiveRenderer(cmd.height, ctx({destination: fb.height, origin: false}), hmapRes.x, hmapRes.y);
  while (true) {
    let fract = pr.render();
    statusCallback('Generating height map', fract);
    await display();
    if (fract >= 1) break;
  }


  for (let i = 0; i < 6; i++) {
    let cam = [
      {target: [1, 0, 0],  up: [0, -1, 0]},
      {target: [-1, 0, 0], up: [0, -1, 0]},
      {target: [0, 1, 0],  up: [0, 0, 1]},
      {target: [0, -1, 0], up: [0, 0, -1]},
      {target: [0, 0, 1],  up: [0, -1, 0]},
      {target: [0, 0, -1], up: [0, -1, 0]},
    ][i];
    let _view = mat4.lookAt([], [0,0,0], cam.target, cam.up);
    let _proj = mat4.perspective([], Math.PI/2, 1, 0.01, 100);
    let _pv = mat4.multiply([], _proj, _view);
    let _invpv = mat4.invert([], _pv);
    cmd.sky(ctx({_invpv: _invpv, destination: fb.sky.faces[i]}));
    statusCallback('Generating sky cubemap', i/5);
    await display();
  }


  pr = new ProgressiveRenderer(cmd.shadow, ctx({destination: fb.shadow}), hmapRes.x, hmapRes.y);
  while (true) {
    let fract = pr.render();
    statusCallback('Generating shadow volume', fract);
    await display();
    if (fract >= 1) break;
  }

  pr = new ProgressiveRenderer(cmd.normal, ctx({destination: fb.normal}), res.x, res.y);
  while (true) {
    let fract = pr.render();
    statusCallback('Generating normal map', fract);
    await display();
    if (fract >= 1) break;
  }

  pr = new ProgressiveRenderer(cmd.media, ctx({destination: fb.media}), res.x, res.y);
  while (true) {
    let fract = pr.render();
    statusCallback('Calculating participating media', fract);
    await display();
    if (fract >= 1) break;
  }

  pr = new ProgressiveRenderer(cmd.diffuse, ctx({destination: fb.diffuse}), res.x, res.y);
  while (true) {
    let fract = pr.render();
    statusCallback('Determining diffuse colors', fract);
    await display();
    if (fract >= 1) break;
  }

  pr = new ProgressiveRenderer(cmd.ao, ctx({destination: fb.ao}), res.x, res.y);
  while (true) {
    let fract = pr.render();
    statusCallback('Calculating ambient occlusion', fract);
    await display();
    if (fract >= 1) break;
  }

  pr = new ProgressiveRenderer(cmd.direct, ctx({destination: fb.direct}), res.x, res.y);
  while (true) {
    let fract = pr.render();
    statusCallback('Calculating direct lighting', fract);
    await display();
    if (fract >= 1) break;
  }

  pr = new ProgressiveRenderer(cmd.compose, ctx({destination: fb.compose}), res.x, res.y);
  while (true) {
    let fract = pr.render();
    statusCallback('Composing image', fract);
    await display();
    if (fract >= 1) break;
  }

  cmd.copy(ctx({source: fb.compose, destination: null}));
  statusCallback(null, null, true);
  await display();

}


class ProgressiveRenderer {
  constructor(command, context, width, height) {
    this.y = 0;
    this.yStep = 1;
    this.cmd = command;
    this.ctx = context;
    this.w = width;
    this.h = height;
  }

  render() {
    if (this.last !== undefined) {
      if (performance.now() - this.last > 1000/10) {
        this.yStep = Math.max(1, this.yStep - 1);
      } else {
        this.yStep = this.yStep * 2;
      }
    }
    this.last = performance.now();
    this.cmd(Object.assign(this.ctx, {
      scissorbox: { x: 0, y: this.y, width: this.w, height: this.yStep }
    }));
    this.y = this.y + this.yStep;
    return Math.min(1, this.y/this.h);
  }
}


function generateNoiseTexture(regl, size) {
  tNoise = tNoise || regl.texture();
  let l = size * size * 2;
  let array = new Float32Array(l);
  for (let i = 0; i < l; i++) {
    let r = Math.random() * Math.PI * 2.0;
    array[i * 2 + 0] = Math.cos(r);
    array[i * 2 + 1] = Math.sin(r);
  }
  tNoise({
    format: 'luminance alpha',
    type: 'float',
    width: size,
    height: size,
    wrapS: 'repeat',
    wrapT: 'repeat',
    data: array
  });
}


function generateAOSamplingTexture(regl, size, rate) {
  tAOSampling = tAOSampling || regl.texture();
  let l = size * 3;
  let array = new Float32Array(l);
  for (let i = 0; i < l; i++) {
    let len = 1.0 * Math.log(1 - Math.random())/-rate;
    let r = Math.random() * 2.0 * Math.PI;
    let z = (Math.random() * 2.0) - 1.0;
    let zScale = Math.sqrt(1.0-z*z) * len;
    array[i * 3 + 0] = Math.cos(r) * zScale;
    array[i * 3 + 1] = Math.sin(r) * zScale;
    array[i * 3 + 2] = z * len;
  }
  tAOSampling({
    format: 'rgb',
    type: 'float',
    width: size,
    height: 1,
    wrapS: 'repeat',
    wrapT: 'repeat',
    data: array
  });
}


function generateChunkMeshIndexed(size, terrainResolution) {
  const rp1 = terrainResolution + 1;
  let positions = [];
  let step = size/terrainResolution;
  for (let i = 0; i < rp1; i++) {
    let x = i * step;
    for (let j = 0; j < rp1; j++) {
      let z = j * step;
      positions.push([x, 0, z]);
    }
  }
  let cells = [];
  let k = 0;
  for (let i = 0; i < terrainResolution; i++) {
    for (let j = 0; j < terrainResolution; j++) {
      cells.push([k, k + 1, k + rp1 + 1]);
      cells.push([k, k + rp1 + 1, k + rp1])
      k++;
    }
    k++;
  }
  return {
    positions: positions,
    cells: cells
  };
}

function display() {
  return new Promise(resolve => {
    requestAnimationFrame(function() {
      resolve();
    });
  });
}

function tod2sundir(tod) {
  let phi = tod/24 * Math.PI * 2 - Math.PI/2;
  return vec3.normalize([], [
    1,
    Math.sin(phi),
    -Math.cos(phi)
  ]);
}

module.exports.render = render;

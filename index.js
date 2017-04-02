'use strict';

const sprintf = require('sprintf').sprintf;
const reglib = require('regl');
const saveAs = require('filesaver.js').saveAs;
const renderer = require('./render.js');

const status = document.getElementById('status');
const next = document.getElementById('next');
const download = document.getElementById('download');
const canvas = document.getElementById('render-canvas');


let regl;


document.addEventListener('DOMContentLoaded', main, false);
window.addEventListener('resize', reflow, false);
next.addEventListener('click', render);
download.addEventListener('click', downloadImage);
window.addEventListener('error', handleError);


function main() {
  regl = reglib({
    canvas: canvas,
    extensions: ['OES_texture_float', 'OES_texture_float_linear', 'OES_element_index_uint'],
    attributes: {
      preserveDrawingBuffer: true,
    }
  });
  reflow();
  render();
}


function render() {
  status.style.display = 'block';
  status.style.lineHeight = window.innerHeight + 'px';
  renderer.render(regl, {
    callback: updateStatus,
    canvas: canvas,
    fov: Math.random() * 50 + 20,
    dir: Math.random() * 360,
    alt: Math.random() * 1024*2 + 1,
    tod: 6 + Math.random(),
    colors: {
      high: {
        steep: [[0.5,0.25,0], [0.5,0.25,0]],
        flat: [[1,1,1], [1,1,1]],
      },
      low: {
        steep: [[0.5,0.25,0], [0.5,0.25,0]],
        flat: [[1,1,1], [1,1,1]],
      }
    },
    fog: Math.random() * 0.0001,
    groundFog: Math.random() * 0.01,
    groundFogAlt: Math.random() * 1024 * 2,
  });
}


function updateStatus(task, fraction, done) {
  if (fraction !== undefined) {
    status.innerText = sprintf('%s: %d%%', task, Math.round(fraction * 100));
  } else {
    status.innerText = task;
  }
  if (done) {
    status.style.display = 'none';
  }
}


function reflow() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}


function downloadImage() {
  canvas.toBlob(function(blob) {
      saveAs(blob, "badlands.png");
  });
}


function handleError(e, url, line) {
  status.style.display = 'block';
  status.style.lineHeight = '128px';
  status.innerHTML = `<div>Sorry, couldn't render the badlands because of the following error:</div> <div style='color:red'>${e.message}</div>`
}

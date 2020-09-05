const { src, dest } = require('gulp');
const replace = require('gulp-replace');

function replaceWasmSyncPath(done) {
  return src(['tmp/_lz4.sync.js'])
  .pipe(replace('_lz4.sync.wasm', '_lz4.wasm'))
  .pipe(dest('tmp'));
}

module.exports = {
    replaceWasmSyncPath,
}
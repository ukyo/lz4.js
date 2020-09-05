const { src, dest } = require('gulp');
const concat = require('gulp-concat');

function concatDev(done) {
  return src(['dev/_lz4.js', 'dev/post-compiled.js'])
    .pipe(concat('lz4.js'))
    .pipe(dest('dev'));
}

function concatAsmRelease(done) {
  return src(['src/header.js', 'tmp/_lz4.asm.js', 'src/footer.js'])
    .pipe(concat('lz4asm.js'))
    .pipe(dest('dist'));
}

function concatWasmRelease(done) {
  src(['src/header.js', 'tmp/_lz4.js', 'src/footer.js'])
    .pipe(concat('lz4wasm.js'))
    .pipe(dest('dist'));

  return src(['tmp/_lz4.wasm'])
    .pipe(dest('dist'));
}

function concatWasmSyncRelease(done) {
  return src(['src/header.js', 'tmp/_lz4.sync.js', 'src/footer.js'])
    .pipe(concat('lz4wasm.sync.js'))
    .pipe(dest('dist'));

  // No need to generate separate WASM file for synchronous mode
  // The only difference in between syn/async in JS initialization
}

module.exports = {
  concatDev,
  concatAsmRelease,
  concatWasmRelease,
  concatWasmSyncRelease,
}
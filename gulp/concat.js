const { src, dest } = require('gulp');
const concat = require('gulp-concat');

function concatDev(done) {
  return src(['dev/_lz4.js', 'dev/post-compiled.js'])
    .pipe(concat('lz4.js'))
    .pipe(dest('dev'));
}

function concatAsmRelease(done) {
  return src(['src/header.js', '_lz4asm.js', 'src/footer.js'])
    .pipe(concat('lz4asm.js'))
    .pipe(dest('.'));
}

function concatWasmRelease(done) {
  return src(['src/header.js', '_lz4wasm.js', 'src/footer.js'])
    .pipe(concat('lz4wasm.js'))
    .pipe(dest('.'));
}

module.exports = {
  concatDev,
  concatAsmRelease,
  concatWasmRelease
}
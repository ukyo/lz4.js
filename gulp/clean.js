const { src } = require('gulp');
const clean = require('gulp-clean');

function cleanTest(done) {
  return src(['test/_dst1.txt', 'test/_dst2.txt'], { read: false })
    .pipe(clean());
}

function cleanRelease(done) {
  return src(['tmp/_lz4.js', 'tmp/_lz4.wasm'], { read: false, allowEmpty: true })
    .pipe(clean());
}

module.exports = {
  cleanTest,
  cleanRelease
}
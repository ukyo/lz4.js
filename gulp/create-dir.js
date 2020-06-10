const { src, dest } = require("gulp");

const createDevDir = function (done) {
  return src('/')
    .pipe(dest('dev')); // create folder
}

const createTmpDir = function (done) {
  return src('/')
    .pipe(dest('tmp')); // create folder
}

module.exports = {
  createDevDir,
  createTmpDir
}
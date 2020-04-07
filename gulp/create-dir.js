const { src, dest } = require("gulp");

const createDevDir = function (done) {
  return src('/')
    .pipe(dest('dev')); // create folder
}

module.exports = {
  createDevDir
}
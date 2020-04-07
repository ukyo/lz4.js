const { src } = require("gulp");
const mocha = require('gulp-mocha');

function setupTests(options) {
  return function runMocha(done) {
    return src('test/lz4Spec.js')
      .pipe(mocha(options))
      .once('error', err => {
        console.error(err);
        process.exit(1);
      })
      .once('end', () => {
        done();
      });
  }

}

module.exports = {
  setupTests
}
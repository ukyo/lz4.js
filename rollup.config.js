const resolve = require('@rollup/plugin-node-resolve');
const buble = require('@rollup/plugin-buble');
// import babel from 'rollup-plugin-babel';

module.exports = {
  input: 'src/post.js',
  output: {
    file: 'dev/post-compiled.js',
    format: 'es',
  },
  external: ['utils', 'stream'],
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    buble({
      include: 'src/**', // only transpile our source code
    }),
    // babel({
    //   exclude: 'node_modules/**'
    // }),
  ],
};

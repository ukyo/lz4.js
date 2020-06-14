const { series, parallel } = require("gulp");

const rollupBundle = require("./gulp/rollup-bundle");
const { cleanTest, cleanRelease } = require("./gulp/clean");
const { concatDev, concatWasmRelease, concatAsmRelease } = require("./gulp/concat");
const { setupTests } = require("./gulp/test");
const { createDevDir, createTmpDir } = require("./gulp/create-dir");
const { initWatchDev } = require("./gulp/watch");
const {
  buildLib,
  compileDev,
  compileAsmRelease,
  compileWasmRelease, // default
  fetchLib,
} = require("./gulp/emscripten");

const debugTests = setupTests({ inspectBrk: true });
const runTests = setupTests();

const prepareDirs = series(createDevDir, createTmpDir);
const initTask = series(prepareDirs, fetchLib, buildLib, rollupBundle, compileDev);
const release = series(
  prepareDirs,
  rollupBundle,
  compileAsmRelease, concatAsmRelease,
  compileWasmRelease, concatWasmRelease,
  cleanRelease
);
const releaseAsmTask = series(prepareDirs, rollupBundle, compileAsmRelease, concatAsmRelease, cleanRelease);
const releaseWasmTask = series(prepareDirs, rollupBundle, compileWasmRelease, concatWasmRelease, cleanRelease);
const testDevTask = series(prepareDirs, rollupBundle, compileDev, runTests, cleanTest);

const watchDev = initWatchDev(testDevTask);

exports.buildLib = buildLib;
exports.cleanTest = cleanTest;
exports.cleanRelease = cleanRelease;
exports.compileDev = compileDev;
exports.compileAsmRelease = compileAsmRelease;
exports.compileWasmRelease = compileWasmRelease;
exports.concatDev = concatDev;
exports.concatAsmRelease = concatAsmRelease;
exports.concatWasmRelease = concatWasmRelease;
exports.debugTests = debugTests
exports.fetchLib = fetchLib;
exports.rollup = rollupBundle;
exports.runTests = runTests;
exports.watchDev = watchDev;

exports.init = initTask;
exports.release = release;
exports.releaseAsm = releaseAsmTask;
exports.releaseWasm = releaseWasmTask;
exports.testDev = testDevTask;
const { series, parallel } = require("gulp");

const rollupBundle = require("./gulp/rollup-bundle");
const { cleanTest, cleanRelease } = require("./gulp/clean");
const { concatDev, concatWasmRelease, concatWasmSyncRelease, concatAsmRelease } = require("./gulp/concat");
const { setupTests } = require("./gulp/test");
const { createDevDir, createTmpDir } = require("./gulp/create-dir");
const { replaceWasmSyncPath } = require("./gulp/replace");
const { initWatchDev } = require("./gulp/watch");
const {
  buildLib,
  compileDev,
  compileAsmRelease,
  compileWasmRelease, // default
  compileWasmSyncRelease,
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
  compileWasmSyncRelease, replaceWasmSyncPath, concatWasmSyncRelease,
  cleanRelease
);
const releaseAsmTask = series(prepareDirs, rollupBundle, compileAsmRelease, concatAsmRelease, cleanRelease);
const releaseWasmTask = series(prepareDirs, rollupBundle, compileWasmRelease, concatWasmRelease, compileWasmSyncRelease, concatWasmRelease, cleanRelease);
const testDevTask = series(prepareDirs, rollupBundle, compileDev, runTests, cleanTest);

const watchDev = initWatchDev(testDevTask);

exports.buildLib = buildLib;
exports.cleanTest = cleanTest;
exports.cleanRelease = cleanRelease;
exports.compileDev = compileDev;
exports.compileAsmRelease = compileAsmRelease;
exports.compileWasmRelease = compileWasmRelease;
exports.compileWasmSyncRelease = compileWasmSyncRelease;
exports.concatDev = concatDev;
exports.concatAsmRelease = concatAsmRelease;
exports.concatWasmRelease = concatWasmRelease;
exports.concatWasmRelease = concatWasmSyncRelease;
exports.debugTests = debugTests
exports.fetchLib = fetchLib;
exports.rollup = rollupBundle;
exports.runTests = runTests;
exports.replaceWasmSyncPath = replaceWasmSyncPath;
exports.watchDev = watchDev;

exports.init = initTask;
exports.release = release;
exports.releaseAsm = releaseAsmTask;
exports.releaseWasm = releaseWasmTask;
exports.testDev = testDevTask;
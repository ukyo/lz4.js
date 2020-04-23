const { exec, execSync } = require("child_process");

const EXPORTED_FUNCTIONS =
  '-s EXPORTED_FUNCTIONS="[' +
  [
    "_main",
    "_LZ4JS_init",
    "_LZ4JS_createCompressionContext",
    "_LZ4JS_createDecompressionContext",
    "_LZ4JS_freeCompressionContext",
    "_LZ4JS_freeDecompressionContext",
    "_LZ4JS_compressBegin",
    "_LZ4JS_compressUpdate",
    "_LZ4JS_compressEnd",
    "_LZ4JS_decompress"
  ]
    .map(name => `'${name}'`)
    .join() +
  ']"';
const C_FILES = ["src/lz4js.c"].join(" ");
const LIBS = ["lz4/lib/liblz4.a"].join(" ");
const INCLUDES = "-Ilz4/lib -Isrc";
const POST_JS = "--post-js dev/post-compiled.js";
const TOTAL_MEMORY = 32 * 1024 * 1024;
const DEV_ARGS = [
  `-s NO_FILESYSTEM=1`,
  `-s EXTRA_EXPORTED_RUNTIME_METHODS=[]`,
  `-s TOTAL_MEMORY=${TOTAL_MEMORY}`,
  `-s ENVIRONMENT=web,node`,
  `-s MODULARIZE=1`,
  `-s 'EXPORT_NAME="lz4"'`,
  // `-s EXPORT_ES6=1`,
  // `-s USE_ES6_IMPORT_META=0`,
  // `-s WASM=0`,
  `-s WASM_ASYNC_COMPILATION=0`
];

const RELEASE_ARGS = [
  ...DEV_ARGS,
  `-O3`,
  `--memory-init-file 0`,
  `--closure 1`,
  `--llvm-lto 1`,
  ,
];

const WASM_RELEASE_ARGS = RELEASE_ARGS.concat([
  // WASM arguments
]).join(" ");

const ASM_RELEASE_ARGS = RELEASE_ARGS.concat([
  // ASM.js arguments
  "-s WASM=0",
  // "-s WASM_ASYNC_COMPILATION=0"
]).join(" ");

function buildLib(cb) {
  exec(`emmake make lib`, { cwd: 'lz4' }, cb);
}

function compileDev(cb) {
  exec(`emcc -v ${INCLUDES} ${C_FILES} ${LIBS} -o dev/lz4.js ${POST_JS} ${DEV_ARGS.join(" ")} ${EXPORTED_FUNCTIONS}`, cb);
}

function compileAsmRelease(cb) {
  exec(`emcc ${ASM_RELEASE_ARGS} ${INCLUDES} ${C_FILES} ${LIBS} -o tmp/_lz4.js ${POST_JS} ${EXPORTED_FUNCTIONS}`, cb);
}

function compileWasmRelease(cb) {
  exec(`emcc ${WASM_RELEASE_ARGS} ${INCLUDES} ${C_FILES} ${LIBS} -o tmp/_lz4.js ${POST_JS} ${EXPORTED_FUNCTIONS}`, cb);
}

function fetchLib(cb) {
  exec(`git submodule update --init lz4`, cb);
}

module.exports = {
  buildLib,
  compileDev,
  compileAsmRelease,
  compileWasmRelease,
  fetchLib,
};

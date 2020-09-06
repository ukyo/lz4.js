# lz4.js

LZ4 WASM, ASM.js and CLI for browser and Node with almost native performance.
This package includes WASM, ASM.js module and variant that can be used in CLI.

## Install and Use

html

```html
<script src="node_modules/lz4/dist/lz4wasm.js"></script>

OR

<script src="node_modules/lz4/dist/lz4asm.js"></script>

```

### npm

```
npm install lz4-asm
```

### npm global

```
npm install lz4-asm -g
lz4-asm -h
```

### WASM Module modes

### Asynchronouse module mode ( default )

By default module will be exposed as UMD module. In browsers will be defined as `window.lz4init`
Since WASM modules can't be easily loaded synchronously in browsers some setup for initialization have to be proceed:
- `lz4init()` call will trigger asyncronous loading of `.wasm` file and return instance of lz4module
- `lz4module` accessible right after lz4init call, but the only safe method to ensure that `.wasm` file loading finished - wait for lz4module.ready Promise
- `lz4module.ready` Promise will return fully loaded lz4module instance that can be named `lz4`
- From usage perspective not really useful to work directly with `wasm` module, there is predefined `lz4.lz4js` property that contains all useful methods and helpers.

In short all this flow can be described with next code example:
```javascript
  const lz4module = lz4init();
  lz4module.ready.then((lz4) => {
    const lz4js = lz4.lz4js;
  })
```

Or even shorter with async/await and Object destructuring
```javascript
  const { lz4js } = await lz4init().ready;
```

Also we are able to directly set path for WASM module:
```javascript
lz4init({
    locateFile: () => '/public/lz4/_lz4.wasm'
});
```

### Synchronous module mode

Synchronous loader module build by default in `dist/lz4.sync.js`

#### NodeJS

It can be accessed pretty easily `const lz4 = lz4init();` that's it.

#### Browser

There is a big issue in browsers because WASM modules restricted for synchronous load in the main thread.

The Easiest way to resolve this issue - include binary sources directly in module loader.

Just add parameter `-s SINGLE_FILE=1` to `WASM_SYNC_ARGS` variable placed in `/gulp/emscripten.js`. It should looks like
```javascript
const WASM_SYNC_ARGS = [
  `-s WASM=1`, // default: 1
  `-s WASM_ASYNC_COMPILATION=0`,
  `-s SINGLE_FILE=1`,
];
```

It is recommended to provide module instance into init function for synchronous mode, because in MODULARIZE mode init function always return Promise.

```javascript
const lz4init = require('lz4-asm');
const lz4Module = {};
const isReadyPromise = lz4init(lz4Module);
// For sync mode we can be sure that now lz4Module contain all required WASM methods
const lz4 = lz4Module.lz4js;
```

Under the hood this option encode `.wasm` module as base64 and include in bundle, on runtime decode base64 to arrayBuffer and init
```javascript
function _base64ToArrayBuffer(base64) {
   const binary_string = window.atob(base64);
   const binary_length = binary_string.length;
   const bytes = new Uint8Array(binary_length);
   for (var i = 0; i < binary_length; i++) {
       bytes[i] = binary_string.charCodeAt(i);
   }
   return bytes.buffer;
}

const wasmModuleAsArrayBuffer = _base64ToArrayBuffer(wasmAsBase64);
const lz4 = lz4init({ wasmBinary: wasmModuleAsArrayBuffer });
```

Another way is bypassing argument into init function `lz4init({ wasmBinary: wasmModuleAsArrayBuffer });` where wasmModuleAsArrayBuffer - preloaded file as ArrayBuffer in Uint8Array view representation: 
```javascript
// Manually load/preload module through XHR/fetch, etc. then transform to arrayBuffer and call
fetch('PATH_TO_WASM_FILE')
  .then(response => response.arrayBuffer())
  .then(wasmModuleAsArrayBuffer => lz4init({ wasmBinary: wasmModuleAsArrayBuffer }))
  .catch(err => {
    throw new Error('Failed to load WASM module');
  })
```

### ASM.js Module modes

Both `async` (default) and `sync` modes available for ASM.js module but with one important difference.
For `sync` variant there **NO NEED for any extra setup**. Set `-s WASM_ASYNC_COMPILATION=0` option in `gulp/emscripten.js` and simply use as:
```javascript
const lz4 = lz4init();
```

It is much easier operate with ASM.js variant is sync mode, but for some cases it operate slower than WASM variant. You can see difference in tests if target different variants in top `require` statement.

## API

### static values

- `lz4.BLOCK_MAX_SIZE['64KB']`
- `lz4.BLOCK_MAX_SIZE['256KB']`
- `lz4.BLOCK_MAX_SIZE['1MB']`
- `lz4.BLOCK_MAX_SIZE['4MB']`

### lz4.compress(source, options)

compress to a lz4 buffer.

- source `Uint8Array | Buffer`
- options
  - frameInfo
    - blockSizeID: `Number [4-7]` or as alias `lz4.BLOCK_MAX_SIZE["4MB"]`. Available sizes: `{ "64KB": 4, "256KB": 5, "1MB": 6, "4MB" 7 }`
    - blockMode: `Number [0-1]. Default: 0`, 0: blocks linked, 1: blocks independent
    - contentChecksumFlag: `Number [0-1]. Default: 0`, 0: Checksum not available. 1: frame terminated with 32-bit checksum of decompressed data
    - dictID: `Number [0-1]. Default: 0`, Dictionary ID, sent by compressor to help decoder select correct dictionary; 0: no dictID provided
    - blockChecksumFlag: `Number [0-1]. Default: 0`, 1: each block followed by a checksum of block's compressed data; 0: disabled
  - preferences
    - compressionLevel: `Number [0-16]. Default: 0`, 0: faster but low compression, 16: slower but best compression
    - autoFlush: `Number [0-1]. Default: 1`, 1: always flush, reduces usage of internal buffers. 0 - flush disabled
    - favorDecSpeed: `Number [0-1]. Default: 1`, 1: parser favors decompression speed vs compression ratio. Only works for high compression modes
- return `Uint8Array | Buffer`

More about options you can find at LZ4 frame description: https://github.com/lz4/lz4/blob/master/doc/lz4_Frame_format.md

### lz4.decompress(source)

decompress a lz4 buffer.

- source `Uint8Array | Buffer`
- return `Uint8Array | Buffer`

### lz4.createCompressStream(options)

create a nodejs transform stream.

- options
  - frameInfo
    - blockSizeID: `Number [4-7]` or as alias `lz4.BLOCK_MAX_SIZE["4MB"]`. Available sizes: `{ "64KB": 4, "256KB": 5, "1MB": 6, "4MB" 7 }`
    - blockMode: `Number [0-1]. Default: 0`, 0: blocks linked, 1: blocks independent
    - contentChecksumFlag: `Number [0-1]. Default: 0`, 0: Checksum not available. 1: frame terminated with 32-bit checksum of decompressed data
    - dictID: `Number [0-1]. Default: 0`, Dictionary ID, sent by compressor to help decoder select correct dictionary; 0: no dictID provided
    - blockChecksumFlag: `Number [0-1]. Default: 0`, 1: each block followed by a checksum of block's compressed data; 0: disabled
  - preferences
    - compressionLevel: `Number [0-16]. Default: 0`, 0: faster but low compression, 16: slower but best compression
    - autoFlush: `Number [0-1]. Default: 1`, 1: always flush, reduces usage of internal buffers. 0 - flush disabled
    - favorDecSpeed: `Number [0-1]. Default: 1`, 1: parser favors decompression speed vs compression ratio. Only works for high compression modes

More about options you can find at LZ4 frame description: https://github.com/lz4/lz4/blob/master/doc/lz4_Frame_format.md

### lz4.createDecompressStream()

create a nodejs transform stream.

## Development

### Require

- latest emscripten
- nodejs 10+

### Init

Clone the repo.

```
git clone https://github.com/ukyo/lz4.js.git
```

Install the dev dependencies.

```
cd path/to/lz4.js
npm install
```

Download the original LZ4 repo and compile for development.

```
npx gulp init
```

### Write code

Watch for code updates and run tests.

```
npx gulp watchDev
```

Run development tests

### Release

Release build.

```
npx gulp release
```

### List of available gulp commands
```
buildLib
cleanTest
cleanRelease
compileDev
compileAsmRelease
compileWasmRelease
compileWasmSyncRelease
concatDev
concatAsmRelease
concatWasmRelease
concatWasmSyncRelease
debugTests
fetchLib
rollup
runTests
watchDev

initTask
release
releaseAsm
releaseWasm
testDev
replaceWasmSyncPath
```

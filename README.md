# lz4.js

LZ4 for browser

## Install and Use

### bower

```
bower install lz4
```

html

```html
<script src="node_modules/lz4/dist/lz4asm.js"></script>

OR

<script src="node_modules/lz4/dist/lz4wasm.js"></script>
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

## API

### static values

- `lz4.BLOCK_MAX_SIZE_64KB`
- `lz4.BLOCK_MAX_SIZE_256KB`
- `lz4.BLOCK_MAX_SIZE_1MB`
- `lz4.BLOCK_MAX_SIZE_4MB`

### lz4.compress(source, options)

compress to a lz4 buffer.

- source `Uint8Array | Buffer`
- options
  - compressionLevel `number` (range of `0-16`, default is `0`)
  - blockMaxSize `number` (`lz4.BLOCK_MAX_SIZE_XX`, default is `lz4.BLOCK_MAX_SIZE_4MB`)
  - blockIndependent `boolean` (default is false)
  - contentChecksum `boolean` (default is false)
- return `Uint8Array | Buffer`

### lz4.decompress(source)

decompress a lz4 buffer.

- source `Uint8Array | Buffer`
- return `Uint8Array | Buffer`

### lz4.createCompressStream(options)

create a nodejs transform stream.

- options
  - frameInfo
    - blockSizeID: lz4.BLOCK_MAX_SIZE["4MB"], /* 64KB, 256KB, 1MB, 4MB */
    - blockMode: 0, /* LZ4F_blockLinked, LZ4F_blockIndependent; 0 == default */
    - contentChecksumFlag: 0, /* 1: frame terminated with 32-bit checksum of decompressed data; 0: disabled (default) */
    - frameType: 0, /* read-only field : LZ4F_frame or LZ4F_skippableFrame */
    - dictID: 0, /* Dictionary ID, sent by compressor to help decoder select correct dictionary; 0 == no dictID provided */
    - blockChecksumFlag: 0, /* 1: each block followed by a checksum of block's compressed data; 0: disabled (default) */
  - preferences
    - compressionLevel: 0, /* 0: default (fast mode); values > LZ4HC_CLEVEL_MAX count as LZ4HC_CLEVEL_MAX; values < 0 trigger "fast acceleration" */
    - autoFlush: 1, /* 1: always flush; reduces usage of internal buffers */
    - favorDecSpeed: 1, /* 1: parser favors decompression speed vs compression ratio. Only works for high compression modes (>= LZ4HC_CLEVEL_OPT_MIN) */  /* v1.8.2+ */

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

### Release

Release build.

```
npx gulp release
```

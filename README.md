# lz4.js

LZ4 for browser

## Install and Use

### bower

```
bower install lz4
```

html

```html
<script src="bower_components/lz4/lz4.js"></script>
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

* `lz4.BLOCK_MAX_SIZE_64KB`
* `lz4.BLOCK_MAX_SIZE_256KB`
* `lz4.BLOCK_MAX_SIZE_1MB`
* `lz4.BLOCK_MAX_SIZE_4MB`

### lz4.compress(source, options)

compress to a lz4 buffer.

* source `Uint8Array | Buffer`
* options
    * compressionLevel `number` (range of `0-16`, default is `0`)
    * blockMaxSize `number` (`lz4.BLOCK_MAX_SIZE_XX`, default is `lz4.BLOCK_MAX_SIZE_4MB`)
    * blockIndependent `boolean` (default is false)
    * contentChecksum `boolean` (default is false)
* return `Uint8Array | Buffer`

### lz4.decompress(source)

decompress a lz4 buffer.

* source `Uint8Array | Buffer`
* return `Uint8Array | Buffer`

### lz4.createCompressStream(options)

create a nodejs transform stream.

* options
    * compressionLevel `number` (range of `0-16`, default is `0`)
    * blockMaxSize `number` (`lz4.BLOCK_MAX_SIZE_XX`, default is `lz4.BLOCK_MAX_SIZE_4MB`)
    * blockIndependent `boolean` (default is false)
    * contentChecksum `boolean` (default is false)

### lz4.createDecompressStream()

create a nodejs transform stream.


## Development

### Require

* latest emscripten
* nodejs v5.0~

### Init

Clone the repo.

```
git clone https://github.com/ukyo/lz4.js.git
```

If you don't have grunt-cli installed, run the following.

```
npm install -g grunt-cli
```

Install the dev dependencies.

```
cd path/to/lz4.js
npm install
```

Download the original LZ4 repo and compile for development.

```
grunt init
```

### Write code

Watch for code updates and run tests.

```
grunt watch
```

### Release

Release build.

```
grunt release
```


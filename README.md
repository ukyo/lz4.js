# lz4.js

LZ4 for browser

## Install and Use

console

```
bower install lz4
```

html

```html
<script src="bower_components/lz4/lz4.js"></script>
```

## High Level API

### lz4.compress(source, blockSize)

* source `Uint8Array`
* blockSize `number`
* return `Uint8Array`

### lz4.decompress(source)

* source `Uint8Array`
* return `Uint8Array`

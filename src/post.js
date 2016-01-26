var lz4 = this;
if (typeof define === 'function' && define['amd']) {
  define('lz4', function () { return lz4 });
} else if (ENVIRONMENT_IS_NODE) {
  module['exports'] = lz4;
}

_LZ4JS_init();

var LZ4JS_instances = {};
var BUF_SIZE = 8192;
var defaultCompressOptions = {
  bufferSize: 8 * 1024,
  compressionLevel: 0
};
var defaultDecompressOptions = {
  bufferSize: 8 * 1024
};


function LZ4JS_assign(source) {
  Array.prototype.slice.call(arguments, 1).forEach(function(o) {
    if (o == null || typeof o !== 'object') return;
    Object.keys(o).forEach(function(k) {
      source[k] = o[k];
    });
  });
  return source;
}

function LZ4JS_read(id, srcPtr, size) {
  return LZ4JS_instances[id].$read(srcPtr, size);
}

function LZ4JS_write(id, dstPtr, size) {
  return LZ4JS_instances[id].$write(dstPtr, size);
}

function LZ4JS_error(id, ptr) {
  LZ4JS_instances[id].$error = new Error(UTF8ToString(ptr));
}

function LZ4JS_concat(buffers) {
  var n, ret, offset = 0;
  n = buffers.map(function(buffer) {
    return buffer.length;
  }).reduce(function(a, b) {
    return a + b;
  }, 0);
  ret = new Uint8Array(n);
  buffers.forEach(function(buffer) {
    ret.set(buffer, offset);
    offset += buffer.length;
  });
  return ret;
}


ENVIRONMENT_IS_NODE && (function() {
  var Transform = require('stream').Transform;
  var inherits = require('util').inherits;

  inherits(CompressStream, Transform);
  function CompressStream(options) {
    this.options = LZ4JS_assign({}, defaultCompressOptions, options);
    this.cctxPtr = _LZ4JS_createCompressionContext(this.options.compressionLevel);
    if (!this.cctxPtr) throw new Error('LZ4JS_createCompressionContext');
    Transform.call(this, this.options);
    this.initialized = false;
    this.srcSize = 0;
    this.dstSize = 0;
    this.srcBuf = new Buffer(0);
    this.dstBuf = new Buffer(0);
    LZ4JS_instances[this.cctxPtr] = this;
  }

  CompressStream.prototype.$read = function(srcPtr, size) {
    HEAPU8.set(new Uint8Array(this.srcBuf.buffer, this.srcBuf.byteOffset, this.srcSize), srcPtr);
    return this.srcSize;
  };

  CompressStream.prototype.$write = function(dstPtr, size) {
    this.dstBuf = new Buffer(HEAPU8.buffer).slice(dstPtr, dstPtr + size);
    this.push(new Buffer(this.dstBuf));
  }

  CompressStream.prototype.cleanup = function() {
    _LZ4JS_freeCompressionContext(this.cctxPtr);
    delete LZ4JS_instances[this.cctxPtr];
    if (this.$error) throw this.$error;
  };

  CompressStream.prototype._transform = function(chunk, encoding, callback) {
    try {
      if (!this.initialized) {
        if (!_LZ4JS_compressBegin(this.cctxPtr)) this.cleanup();
        this.initialized = true;
      }
      var offset;

      for (offset = 0; offset < chunk.length; offset += this.options.bufferSize) {
        this.srcSize = Math.min(chunk.length - offset, this.options.bufferSize);
        this.srcBuf = chunk.slice(offset, offset + this.srcSize);
        if (!_LZ4JS_compressUpdate(this.cctxPtr)) this.cleanup();
      }
      callback();
    } catch (error) {
      callback(error);
    }
  };

  CompressStream.prototype._flush = function(callback) {
    try {
      _LZ4JS_compressEnd(this.cctxPtr);
      this.cleanup();
      callback();
    } catch (error) {
      callback(error);
    }
  };

  lz4['createCompressStream'] = createCompressStream;
  function createCompressStream(options) {
    return new CompressStream(options);
  }

  inherits(DecompressStream, Transform);
  function DecompressStream(options) {
    this.options = LZ4JS_assign({}, defaultDecompressOptions, options);
    this.dctxPtr = _LZ4JS_createDecompressionContext();
    if (!this.dctxPtr) throw new Error('LZ4JS_createDecompressionContext');
    Transform.call(this, this.options);
    this.srcSize = 0;
    this.dstSize = 0;
    this.srcBuf = new Buffer(0);
    this.dstBuf = new Buffer(0);
    LZ4JS_instances[this.dctxPtr] = this;
  }

  DecompressStream.prototype.$read = function(srcPtr, size) {
    HEAPU8.set(new Uint8Array(this.srcBuf.buffer, this.srcBuf.byteOffset, this.srcSize), srcPtr);
    return this.srcSize;
  };

  DecompressStream.prototype.$write = function(dstPtr, size) {
    this.dstBuf = new Buffer(HEAPU8.buffer).slice(dstPtr, dstPtr + size);
    this.push(new Buffer(this.dstBuf));
  };

  DecompressStream.prototype.cleanup = function() {
    _LZ4JS_freeDecompressionContext(this.dctxPtr);
    delete LZ4JS_instances[this.dctxPtr];
    if (this.$error) throw this.$error;
  };

  DecompressStream.prototype._transform = function(chunk, encoding, callback) {
    try {
      var offset;
      var bufs = [];
      var totalLength = 0;
      for(offset = 0; offset < chunk.length; offset += this.options.bufferSize) {
        this.srcSize = Math.min(chunk.length - offset, this.options.bufferSize);
        this.srcBuf = chunk.slice(offset, offset + this.srcSize);
        if (!_LZ4JS_decompress(this.dctxPtr)) this.cleanup();
      }
      callback();
    } catch (error) {
      callback(error);
    }
  };

  DecompressStream.prototype._flush = function(callback) {
    this.cleanup();
    callback();
  };

  lz4['createDecompressStream'] = createDecompressStream;
  function createDecompressStream(options) {
    return new DecompressStream(options);
  }
})();


function Compressor(src, options) {
  this.options = LZ4JS_assign({}, defaultCompressOptions, options);
  this.cctxPtr = _LZ4JS_createCompressionContext(this.options.compressionLevel);
  if (!this.cctxPtr) throw new Error('LZ4JS_createCompressionContext');
  this.src = src;
  this.offset = 0;
  this.buffers = [];
  this.srcSize = 0;
  this.$error = null;
  LZ4JS_instances[this.cctxPtr] = this;
}

Compressor.prototype.$write = function (dstPtr, size) {
  this.buffers.push(new Uint8Array(HEAPU8.subarray(dstPtr, dstPtr + size)));
};

Compressor.prototype.$read = function(srcPtr, size) {
  HEAPU8.set(this.src.subarray(this.offset, this.offset + this.srcSize), srcPtr);
  return this.srcSize;
};

Compressor.prototype.cleanup = function() {
  _LZ4JS_freeCompressionContext(this.cctxPtr);
  delete LZ4JS_instances[this.cctxPtr];
  if (this.$error) throw this.$error;
};

Compressor.prototype.begin = function() {
  if (!_LZ4JS_compressBegin(this.cctxPtr)) this.cleanup();
};

Compressor.prototype.compress = function() {
  for (; this.offset < this.src.length; this.offset += BUF_SIZE) {
    this.srcSize = Math.min(this.src.length - this.offset, BUF_SIZE);
    if (!_LZ4JS_compressUpdate(this.cctxPtr)) this.cleanup();
  }
};

Compressor.prototype.end = function() {
  if (!_LZ4JS_compressEnd(this.cctxPtr)) this.cleanup();
};

lz4['compress'] = LZ4JS_compress;
function LZ4JS_compress(src, options) {
  var compressor = new Compressor(src, options);
  compressor.begin();
  compressor.compress();
  compressor.end();
  compressor.cleanup();
  return LZ4JS_concat(compressor.buffers);
}

function Decompressor(src, options) {
  this.options = LZ4JS_assign({}, defaultDecompressOptions, options);
  this.dctxPtr = _LZ4JS_createDecompressionContext();
  if (!this.dctxPtr) throw new Error('LZ4JS_createDecompressionContext');
  this.src = src;
  this.offset = 0;
  this.buffers = [];
  this.srcSize = 0;
  this.$error = null;
  LZ4JS_instances[this.dctxPtr] = this;
}

Decompressor.prototype.$write = function(dstPtr, size) {
  this.buffers.push(new Uint8Array(HEAPU8.subarray(dstPtr, dstPtr + size)));
};

Decompressor.prototype.$read = function(srcPtr, size) {
  HEAPU8.set(this.src.subarray(this.offset, this.offset + this.srcSize), srcPtr);
  return this.srcSize;
};

Decompressor.prototype.cleanup = function() {
  _LZ4JS_freeDecompressionContext(this.dctxPtr);
  delete LZ4JS_instances[this.dctxPtr];
  if (this.$error) throw this.$error;
};

Decompressor.prototype.decompress = function() {
  for (; this.offset < this.src.length; this.offset += BUF_SIZE) {
    this.srcSize = Math.min(this.src.length - this.offset, BUF_SIZE);
    if (!_LZ4JS_decompress(this.dctxPtr)) this.cleanup();
  }
};

lz4['decompress'] = LZ4JS_decompress;
function LZ4JS_decompress(src, options) {
  var decompressor = new Decompressor(src, options);
  decompressor.decompress();
  decompressor.cleanup();
  return LZ4JS_concat(decompressor.buffers);
}

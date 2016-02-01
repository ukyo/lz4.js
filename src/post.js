var LZ4JS_instances = {};

function LZ4JS_read(id, srcPtr, size) {
  return LZ4JS_instances[id].$read(srcPtr, size);
}

function LZ4JS_write(id, dstPtr, size) {
  return LZ4JS_instances[id].$write(dstPtr, size);
}

function LZ4JS_error(id, ptr) {
  LZ4JS_instances[id].$error = new Error(UTF8ToString(ptr));
}

(function(){
  var lz4 = this;
  if (typeof define === 'function' && define['amd']) {
    define('lz4', function () { return lz4 });
  } else if (ENVIRONMENT_IS_NODE) {
    module['exports'] = lz4;
  }
  _LZ4JS_init();

  var BUF_SIZE = 8192;
  var BLOCK_SIZE_MAX64KB = lz4['BLOCK_SIZE_MAX64KB'] = 4;
  var BLOCK_SIZE_MAX256KB = lz4['BLOCK_SIZE_MAX256KB'] = 5;
  var BLOCK_SIZE_MAX1MB = lz4['BLOCK_SIZE_MAX1MB'] = 6;
  var BLOCK_SIZE_MAX4MB = lz4['BLOCK_SIZE_MAX4MB'] = 7;

  var defaultCompressOptions = {
    blockMaxSize: BLOCK_SIZE_MAX64KB,
    blockIndependent: false,
    contentChecksum: false,
    compressionLevel: 0,
  };

  function assign(source) {
    Array.prototype.slice.call(arguments, 1).forEach(function(o) {
      if (o == null || typeof o !== 'object') return;
      Object.keys(o).forEach(function(k) {
        source[k] = o[k];
      });
    });
    return source;
  }

  function concat(buffers) {
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

  function BaseCompressor(options) {
    this.options = assign({}, defaultCompressOptions, options);
    this.cctxPtr = _LZ4JS_createCompressionContext(
      this.options.blockMaxSize,
      +this.options.blockIndependent,
      +this.options.contentChecksum,
      this.options.compressionLevel
    );
    if (!this.cctxPtr) throw new Error('LZ4JS_createCompressionContext');
    LZ4JS_instances[this.cctxPtr] = this;
    this.$error = null;
  }

  BaseCompressor.prototype.compressBegin = function(first_argument) {
    _LZ4JS_compressBegin(this.cctxPtr) || this.cleanup();
  };

  BaseCompressor.prototype.compressUpdate = function(first_argument) {
    _LZ4JS_compressUpdate(this.cctxPtr) || this.cleanup();
  };

  BaseCompressor.prototype.compressEnd = function(first_argument) {
    _LZ4JS_compressEnd(this.cctxPtr);
    this.cleanup();
  };

  BaseCompressor.prototype.cleanup = function() {
    _LZ4JS_freeCompressionContext(this.cctxPtr);
    delete LZ4JS_instances[this.cctxPtr];
    if (this.$error) throw this.$error;
  };


  function BaseDecompressor() {
    this.dctxPtr = _LZ4JS_createDecompressionContext();
    if (!this.dctxPtr) throw new Error('LZ4JS_createDecompressionContext');
    LZ4JS_instances[this.dctxPtr] = this;
  }

  BaseDecompressor.prototype.decompress = function() {
    _LZ4JS_decompress(this.dctxPtr) || this.cleanup();
  };

  BaseDecompressor.prototype.cleanup = function() {
    _LZ4JS_freeDecompressionContext(this.dctxPtr);
    delete LZ4JS_instances[this.dctxPtr];
    if (this.$error) throw this.$error;
  };


  ENVIRONMENT_IS_NODE && (function() {
    var Transform = require('stream').Transform;
    var inherits = require('util').inherits;

    function CompressStream(options) {
      BaseCompressor.call(this, options);
      Transform.call(this, this.options);
      this.initialized = false;
      this.srcSize = 0;
      this.dstSize = 0;
      this.src = new Buffer(0);
      this.dst = new Buffer(0);
    }
    inherits(CompressStream, Transform);
    assign(CompressStream.prototype, BaseCompressor.prototype);


    CompressStream.prototype.$read = function(srcPtr, size) {
      HEAPU8.set(new Uint8Array(this.src.buffer, this.src.byteOffset, this.srcSize), srcPtr);
      return this.srcSize;
    };

    CompressStream.prototype.$write = function(dstPtr, size) {
      this.dst = new Buffer(HEAPU8.buffer).slice(dstPtr, dstPtr + size);
      this.push(new Buffer(this.dst));
    }

    CompressStream.prototype['_transform'] = function(chunk, encoding, callback) {
      try {
        if (!this.initialized) {
          this.compressBegin();
          this.initialized = true;
        }
        var offset;

        for (offset = 0; offset < chunk.length; offset += BUF_SIZE) {
          this.srcSize = Math.min(chunk.length - offset, BUF_SIZE);
          this.src = chunk.slice(offset, offset + this.srcSize);
          this.compressUpdate();
        }
        callback();
      } catch (error) {
        callback(error);
      }
    };

    CompressStream.prototype['_flush'] = function(callback) {
      try {
        this.compressEnd();
        callback();
      } catch (error) {
        callback(error);
      }
    };

    lz4['createCompressStream'] = function(options) {
      return new CompressStream(options);
    };

    function DecompressStream() {
      BaseDecompressor.call(this);
      Transform.call(this, {});
      this.srcSize = 0;
      this.dstSize = 0;
      this.src = new Buffer(0);
      this.dst = new Buffer(0);
    }
    inherits(DecompressStream, Transform);
    assign(DecompressStream.prototype, BaseDecompressor.prototype);

    DecompressStream.prototype.$read = function(srcPtr, size) {
      HEAPU8.set(new Uint8Array(this.src.buffer, this.src.byteOffset, this.srcSize), srcPtr);
      return this.srcSize;
    };

    DecompressStream.prototype.$write = function(dstPtr, size) {
      this.dst = new Buffer(HEAPU8.buffer).slice(dstPtr, dstPtr + size);
      this.push(new Buffer(this.dst));
    };

    DecompressStream.prototype['_transform'] = function(chunk, encoding, callback) {
      try {
        var offset;
        var bufs = [];
        var totalLength = 0;
        for(offset = 0; offset < chunk.length; offset += BUF_SIZE) {
          this.srcSize = Math.min(chunk.length - offset, BUF_SIZE);
          this.src = chunk.slice(offset, offset + this.srcSize);
          this.decompress();
        }
        callback();
      } catch (error) {
        callback(error);
      }
    };

    DecompressStream.prototype['_flush'] = function(callback) {
      this.cleanup();
      callback();
    };

    lz4['createDecompressStream'] = function() {
      return new DecompressStream();
    }
  })();


  function Compressor(src, options) {
    BaseCompressor.call(this, options);
    this.src = src;
    this.offset = 0;
    this.buffers = [];
    this.srcSize = 0;
  }
  assign(Compressor.prototype, BaseCompressor.prototype);

  Compressor.prototype.$write = function (dstPtr, size) {
    this.buffers.push(new Uint8Array(HEAPU8.subarray(dstPtr, dstPtr + size)));
  };

  Compressor.prototype.$read = function(srcPtr, size) {
    HEAPU8.set(this.src.subarray(this.offset, this.offset + this.srcSize), srcPtr);
    return this.srcSize;
  };

  Compressor.prototype.compressBody = function() {
    for (; this.offset < this.src.length; this.offset += BUF_SIZE) {
      this.srcSize = Math.min(this.src.length - this.offset, BUF_SIZE);
      this.compressUpdate();
    }
  };

  lz4['compress'] = function(src, options) {
    var compressor = new Compressor(src, options);
    compressor.compressBegin();
    compressor.compressBody();
    compressor.compressEnd();
    return concat(compressor.buffers);
  };

  function Decompressor(src, options) {
    BaseDecompressor.call(this);
    this.src = src;
    this.offset = 0;
    this.buffers = [];
    this.srcSize = 0;
  }
  assign(Decompressor.prototype, BaseDecompressor.prototype);

  Decompressor.prototype.$write = function(dstPtr, size) {
    this.buffers.push(new Uint8Array(HEAPU8.subarray(dstPtr, dstPtr + size)));
  };

  Decompressor.prototype.$read = function(srcPtr, size) {
    HEAPU8.set(this.src.subarray(this.offset, this.offset + this.srcSize), srcPtr);
    return this.srcSize;
  };

  Decompressor.prototype.decompressAll = function() {
    for (; this.offset < this.src.length; this.offset += BUF_SIZE) {
      this.srcSize = Math.min(this.src.length - this.offset, BUF_SIZE);
      this.decompress();
    }
    this.cleanup();
  };

  lz4['decompress'] = function(src) {
    var decompressor = new Decompressor(src);
    decompressor.decompressAll();
    return concat(decompressor.buffers);
  };

}).call(this);

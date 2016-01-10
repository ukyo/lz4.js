var lz4 = this;
if (typeof define === 'function' && define['amd']) {
  define('lz4', function () { return lz4 });
} else if (ENVIRONMENT_IS_NODE) {
  module['exports'] = lz4;
}


var LZ4JS_instances = {};

function LZ4JS_assign(source) {
  Array.prototype.slice.call(arguments, 1).forEach(function(o) {
    if (o == null || typeof o !== 'object') return;
    Object.keys(o).forEach(function(k) {
      source[k] = o[k];
    });
  });
  return source;
}

var Compressor = Module['Compressor'];
var Decompressor = Module['Decompressor'];

var defaultCompressOptions = {
  bufferSize: 8 * 1024,
  compressionLevel: 0
};

var defaultDecompressOptions = {
  bufferSize: 8 * 1024
};

ENVIRONMENT_IS_NODE && (function() {
  var Transform = require('stream').Transform;
  var inherits = require('util').inherits;

  inherits(CompressStream, Transform);
  function CompressStream(options) {
    this.options = LZ4JS_assign({}, defaultCompressOptions, options);
    Transform.call(this, options);
    this.id = LZ4JS_getId();
    this.compressor = new Compressor(this.id, this.options.compressionLevel);
    this.initialized = false;
    this.srcSize = 0;
    this.dstSize = 0;
    this.srcBuf = new Buffer(0);
    this.dstBuf = new Buffer(0);
    var that = this;
    LZ4JS_instances[this.id] = {
      read: function(srcPtr, size) {
        HEAPU8.set(new Uint8Array(that.srcBuf.buffer, that.srcBuf.byteOffset, that.srcSize), srcPtr);
        return that.srcSize;
      },
      write: function (dstPtr, size) {
        that.dstBuf = new Buffer(HEAPU8.buffer).slice(dstPtr, dstPtr + size);
        that.push(new Buffer(that.dstBuf));
      }
    };
  }

  CompressStream.prototype._transform = function(chunk, encoding, callback) {
    console.log(chunk, chunk.length);
    try {
      if (!this.initialized) {
        this.compressor.begin();
        this.initialized = true;
      }
      var offset;

      for (offset = 0; offset < chunk.length; offset += this.options.bufferSize) {
        this.srcSize = Math.min(chunk.length - offset, this.options.bufferSize);
        this.srcBuf = chunk.slice(offset, offset + this.srcSize);
        this.compressor.write();
      }
      callback();
    } catch (e) {
      var error = LZ4JS_instances[this.id].error || e;
      console.log(error.stack);
      delete LZ4JS_instances[this.id];
      this.compressor.delete();
      callback(error);
    }
  };

  CompressStream.prototype._flush = function(callback) {
    try {
      this.compressor.end();
      callback();
    } catch (e) {
      var error = LZ4JS_instances[this.id].error || e;
      callback(error);
    } finally {
      delete LZ4JS_instances[this.id];
      this.compressor.delete();
    }
  };

  lz4['createCompressStream'] = createCompressStream;
  function createCompressStream(options) {
    return new CompressStream(options);
  }

  var count = 0;
  inherits(DecompressStream, Transform);
  function DecompressStream(options) {
    this.options = LZ4JS_assign({}, defaultDecompressOptions, options);
    Transform.call(this, options);
    this.id = LZ4JS_getId();
    this.decompressor = new Decompressor(this.id);
    this.srcSize = 0;
    this.dstSize = 0;
    this.srcBuf = new Buffer(0);
    this.dstBuf = new Buffer(0);
    var that = this;
    LZ4JS_instances[this.id] = {
      read: function(srcPtr, size) {
        HEAPU8.set(new Uint8Array(that.srcBuf.buffer, that.srcBuf.byteOffset, that.srcSize), srcPtr);
        return that.srcSize;
      },
      write: function (dstPtr, size) {
        that.dstBuf = new Buffer(HEAPU8.buffer).slice(dstPtr, dstPtr + size);
        that.push(new Buffer(that.dstBuf));
      }
    };;
  }

  DecompressStream.prototype._transform = function(chunk, encoding, callback) {
    try {
      var offset;
      var bufs = [];
      var totalLength = 0;
      var that = this;
      for(offset = 0; offset < chunk.length; offset += this.options.bufferSize) {
        this.srcSize = Math.min(chunk.length - offset, this.options.bufferSize);
        this.srcBuf = chunk.slice(offset, offset + this.srcSize);
        that.decompressor.write();
      }
      callback();
    } catch (e) {
      var error = LZ4JS_instances[this.id].error || e;
      console.log(error.stack);
      delete LZ4JS_instances[this.id];
      this.decompressor.delete();
      callback(error);
    }
  };

  DecompressStream.prototype._flush = function(callback) {
    delete LZ4JS_instances[this.id];
    this.decompressor.delete();
    callback();
  };

  lz4['createDecompressStream'] = createDecompressStream;
  function createDecompressStream(options) {
    return new DecompressStream(options);
  }
})();

function LZ4JS_read(id, srcPtr, size) {
  return LZ4JS_instances[id].read(srcPtr, size);
}

function LZ4JS_write(id, dstPtr, size) {
  return LZ4JS_instances[id].write(dstPtr, size);
}

function LZ4JS_error(id, ptr) {
  LZ4JS_instances[id].error = new Error(UTF8ToString(ptr));
}

var _LZ4JS_id = 0;
function LZ4JS_getId() {
  if (_LZ4JS_id === 0x1FFFFFFFFFFFFF) _LZ4JS_id = 0;
  return _LZ4JS_id++;
}

function LZ4JS_concat(buffers) {
  var n, ret, offset = 0;
  n = buffers.map(function(buffer) {
    return buffer.length;
  }).reduce(function(a, b) {
    return a + b;
  });
  ret = new Uint8Array(n);
  buffers.forEach(function(buffer) {
    ret.set(buffer, offset);
    offset += buffer.length;
  });
  return ret;
}

lz4['compress'] = LZ4JS_compress;
function LZ4JS_compress(src, options) {
  options = LZ4JS_assign({}, defaultCompressOptions, options);
  var id = LZ4JS_getId();
  var compressor = new Compressor(id, options.compressionLevel);
  var offset;
  var buffers = [];
  var srcSize;
  LZ4JS_instances[id] = {
    write: function(dstPtr, size) {
      buffers.push(new Uint8Array(HEAPU8.subarray(dstPtr, dstPtr + size)));
    },
    read: function(srcPtr, size) {
      HEAPU8.set(src.subarray(offset, offset + srcSize), srcPtr);
      return srcSize;
    }
  };

  try {
    compressor.begin();
    for (offset = 0; offset < src.length; offset += options.bufferSize) {
      srcSize = Math.min(src.length - offset, options.bufferSize);
      compressor.write();
    }
    compressor.end();
    return LZ4JS_concat(buffers);
  } catch (e) {
    var error = LZ4JS_instances[id].error || e;
    throw error;
  } finally {
    delete LZ4JS_instances[id];
    compressor.delete();
  }
}

lz4['decompress'] = LZ4JS_decompress;
function LZ4JS_decompress(src, options) {
  options = LZ4JS_assign({}, defaultDecompressOptions, options);
  var id = LZ4JS_getId();
  var decompressor = new Decompressor(id);
  var offset;
  var buffers = [];
  var srcSize;
  LZ4JS_instances[id] = {
    write: function(dstPtr, size) {
      buffers.push(new Uint8Array(HEAPU8.subarray(dstPtr, dstPtr + size)));
    },
    read: function(srcPtr, size) {
      HEAPU8.set(src.subarray(offset, offset + srcSize), srcPtr);
      return srcSize;
    }
  };

  try {
    for (offset = 0; offset < src.length; offset += options.bufferSize) {
      srcSize = Math.min(src.length - offset, options.bufferSize);
      decompressor.write();
    }
    return LZ4JS_concat(buffers);
  } catch (e) {
    var error = LZ4JS_instances[id].error || e;
    throw error;
  } finally {
    delete LZ4JS_instances[id];
    decompressor.delete();
  }
}

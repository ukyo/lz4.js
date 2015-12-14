var LZ4JS_errorName;
var LZ4JS_src;
var LZ4JS_srcOffset;
var LZ4JS_outputBuffers;

function LZ4JS_init(src) {
  LZ4JS_src = src;
  LZ4JS_srcOffset = 0;
  LZ4JS_outputBuffers = [];
}

function LZ4JS_cleanup() {
  LZ4JS_src = null;
  LZ4JS_outputBuffers = null;
}

function LZ4JS_finalize(errorCode) {
  var n;
  var offset = 0;
  var ret;

  if (errorCode) {
    LZ4JS_cleanup();
    throw new Error('lz4js: ' + LZ4JS_errorName);
  }

  n = LZ4JS_outputBuffers.map(function(buffer) {
    return buffer.length;
  }).reduce(function(a, b) {
    return a + b;
  });
  ret = new Uint8Array(n);
  LZ4JS_outputBuffers.forEach(function(buffer) {
    ret.set(buffer, offset);
    offset += buffer.length;
  });
  LZ4JS_cleanup();
  return ret;
}

function LZ4JS_read(ptr, n) {
  var subarray = LZ4JS_src.subarray(LZ4JS_srcOffset, LZ4JS_srcOffset + n);
  LZ4JS_srcOffset += subarray.length;
  HEAPU8.set(subarray, ptr);
  return subarray.length;
}

function LZ4JS_write(ptr, n) {
  var buffer = new Uint8Array(n);
  buffer.set(HEAPU8.subarray(ptr, ptr + n));
  LZ4JS_outputBuffers.push(buffer);
}

function LZ4JS_setError(ptr) {
  LZ4JS_errorName = UTF8ToString(ptr);
}

function LZ4JS_compress(src, compressionLevel) {
  compressionLevel = Math.max(Math.min(compressionLevel || 0, 16), 0);
  LZ4JS_init(src);
  return LZ4JS_finalize(_compress(compressionLevel));
}

function LZ4JS_decompress(src) {
  LZ4JS_init(src);
  return LZ4JS_finalize(_decompress());
}

var lz4 = this;
lz4['compress'] = LZ4JS_compress;
lz4['decompress'] = LZ4JS_decompress;

if (typeof define === 'function' && define['amd']) {
  define('lz4', function () { return lz4 });
} else if (ENVIRONMENT_IS_NODE) {
  module['exports'] = lz4;
}

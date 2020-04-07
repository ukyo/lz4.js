import Compressor from './js/Compressor';
import Decompressor from './js/Decompressor';
import { LZ4JS_instances, LZ4JS_read, LZ4JS_write, LZ4JS_error } from './js/instance.service';

import CompressStream from './js/node/CompressStream';
import DecompressStream from './js/node/DecompressStream';

import { BLOCK_MAX_SIZE } from './js/constants';

var lz4js = {
  'BLOCK_MAX_SIZE': BLOCK_MAX_SIZE,
  'LZ4JS_instances': LZ4JS_instances,
  'LZ4JS_read': LZ4JS_read,
  'LZ4JS_write': LZ4JS_write,
  'LZ4JS_error': LZ4JS_error,
};

lz4js['compress'] = function (src, options) {
  const compressor = new Compressor(options);
  return compressor.compress(src);
};

lz4js['decompress'] = function (src) {
  const decompressor = new Decompressor();
  return decompressor.decompress(src);
};

if (ENVIRONMENT_IS_NODE) {
  lz4js['createCompressStream'] = function (options) {
    return new CompressStream(options);
  };

  lz4js['createDecompressStream'] = function () {
    return new DecompressStream();
  };
}

// Replace Thenable interface with Promise for Asynchronous modules
if (Module['then']) {
  delete Module['then'];
  Module['ready'] = new Promise((resolve, reject) => {
    if (Module['calledRun']) {
      return resolve(Module);
    }
    addOnPostRun(function () {
      return resolve(Module);
    });
    Module['onAbort'] = function (what) {
      return reject(what);
    };
  });
}

Module['lz4js'] = lz4js;

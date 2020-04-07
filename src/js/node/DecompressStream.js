import BaseDecompressor from '../BaseDecompressor';
import ReadWriteMixin from './ReadWriteMixin';

import { aggregation } from '../utils';

import { BUF_SIZE } from '../constants';

let Transform, DecompressStream;

try {
  Transform = require('stream').Transform;

  DecompressStream = class extends aggregation(Transform, BaseDecompressor, ReadWriteMixin) {
    constructor(options) {
      super(options);
      BaseDecompressor.call(this);
      this.srcSize = 0;
      this.dstSize = 0;
      this.src = Buffer['alloc'](0);
      this.dst = Buffer['alloc'](0);
    }

    _transform(chunk, encoding, callback) {
      try {
        let offset;
        for (offset = 0; offset < chunk.length; offset += BUF_SIZE) {
          this.srcSize = Math.min(chunk.length - offset, BUF_SIZE);
          this.src = chunk.slice(offset, offset + this.srcSize);
          this._decompress();
        }
        callback();
      } catch (error) {
        callback(error);
      }
    }

    _flush(callback) {
      this.cleanup();
      callback();
    }
  }
} catch (err) { }

export default DecompressStream;
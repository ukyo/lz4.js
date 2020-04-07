import BaseCompressor from '../BaseCompressor';
import ReadWriteMixin from './ReadWriteMixin';

import { aggregation } from '../utils';

import { BUF_SIZE } from '../constants';

let Transform, CompressStream;

try {
  Transform = require('stream').Transform;

  CompressStream = class extends aggregation(Transform, BaseCompressor, ReadWriteMixin) {
    constructor(options) {
      super(options);
      BaseCompressor.call(this, options);
      this.initialized = false;
      this.srcSize = 0;
      this.dstSize = 0;
      this.src = Buffer['alloc'](0);
      this.dst = Buffer['alloc'](0);
    }

    _transform(chunk, encoding, callback) {
      try {
        if (!this.initialized) {
          this.compressBegin();
          this.initialized = true;
        }
        let offset;

        for (offset = 0; offset < chunk.length; offset += BUF_SIZE) {
          this.srcSize = Math.min(chunk.length - offset, BUF_SIZE);
          this.src = chunk.slice(offset, offset + this.srcSize);
          this.compressUpdate();
        }
        callback();
      } catch (error) {
        callback(error);
      }
    }

    _flush(callback) {
      try {
        this.compressEnd();
        callback();
      } catch (error) {
        callback(error);
      }
    }
  }
} catch (err) { }

export default CompressStream;
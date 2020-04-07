import BaseDecompressor from './BaseDecompressor';
import ReadWriteMixin from './ReadWriteMixin';

import { BUF_SIZE } from './constants';
import { aggregation, concatBuffers } from './utils';

export default class Decompressor extends aggregation(BaseDecompressor, ReadWriteMixin) {
  constructor() {
    super();
    this.resetInitials();
  }

  decompressAll() {
    for (; this.offset < this.src.length; this.offset += BUF_SIZE) {
      this.srcSize = Math.min(this.src.length - this.offset, BUF_SIZE);
      this._decompress();
    }
    this.cleanup();
  }

  decompress(src) {
    let result;

    this.src = src;
    this.decompressAll();
    const uint8buf = concatBuffers(this.buffers);
    if (ENVIRONMENT_IS_NODE) {
      result = Buffer.isBuffer(src) ? Buffer.from(uint8buf.buffer) : uint8buf;
      // result = Buffer.from(result.buffer, result.byteOffset, result.byteOffset + result.length);
    } else {
      result = uint8buf;
    }
    this.resetInitials();
    return result;
  }

  resetInitials() {
    this.src = null;
    this.offset = 0;
    this.buffers = [];
    this.srcSize = 0;
  }
}
  


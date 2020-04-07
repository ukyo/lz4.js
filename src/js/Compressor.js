import BaseCompressor from './BaseCompressor';
import ReadWriteMixin from './ReadWriteMixin';

import { BUF_SIZE } from './constants';
import { aggregation, concatBuffers } from './utils';

export default class Compressor extends aggregation(BaseCompressor, ReadWriteMixin) {
  constructor(options) {
    super(options);
    this.resetInitials();
  }

  compressBody() {
    for (; this.offset < this.src.length; this.offset += BUF_SIZE) {
      this.srcSize = Math.min(this.src.length - this.offset, BUF_SIZE);
      this.compressUpdate();
    }
  }

  compress(src) {
    let result;

    this.src = src;
    this.compressBegin();
    this.compressBody();
    this.compressEnd();

    const uint8 = concatBuffers(this.buffers);
    if (ENVIRONMENT_IS_NODE && Buffer.isBuffer(src)) {
      result = Buffer.from(uint8.buffer, uint8.byteOffset, uint8.byteOffset + uint8.length)
    } else {
      result = uint8;
    }

    this.resetInitials();
    return result;
  }

  resetInitials() {
    this.src = null;
    this.offset = 0;
    this.srcSize = 0;
    this.buffers = [];
  }
}

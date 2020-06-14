import { LZ4JS_instances } from './instance.service';

export default class BaseDecompressor {
  constructor() {
    this.dctxPtr = _LZ4JS_createDecompressionContext();
    if (!this.dctxPtr) throw new Error('LZ4JS_createDecompressionContext');
    LZ4JS_instances[this.dctxPtr] = this;
  }

  _decompress() {
    _LZ4JS_decompress(this.dctxPtr) || this.cleanup();
  }

  cleanup() {
    _LZ4JS_freeDecompressionContext(this.dctxPtr);
    delete LZ4JS_instances[this.dctxPtr];
    if (this.$error) throw this.$error;
  }
}

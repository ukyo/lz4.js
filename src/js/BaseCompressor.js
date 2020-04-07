import { LZ4JS_instances } from './instance.service';
import { BLOCK_MAX_SIZE } from './constants'

export default class BaseCompressor {
  constructor(options) {
    this.defaultCompressOptions = {
      blockMaxSize: BLOCK_MAX_SIZE["4MB"],
      blockIndependent: false,
      contentChecksum: false,
      compressionLevel: 0
    };

    this.options = Object.assign({}, this.defaultCompressOptions, options);
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

  compressBegin(first_argument) {
    _LZ4JS_compressBegin(this.cctxPtr) || this.cleanup();
  }

  compressUpdate(first_argument) {
    _LZ4JS_compressUpdate(this.cctxPtr) || this.cleanup();
  }

  compressEnd(first_argument) {
    _LZ4JS_compressEnd(this.cctxPtr);
    this.cleanup();
  }

  cleanup() {
    _LZ4JS_freeCompressionContext(this.cctxPtr);
    delete LZ4JS_instances[this.cctxPtr];
    if (this.$error) throw this.$error;
  }
}

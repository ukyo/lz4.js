import { LZ4JS_instances } from './instance.service';
import { BLOCK_MAX_SIZE } from './constants'

export default class BaseCompressor {
  constructor(options = {}) {
    this.defaultFrameInfo = {
      blockSizeID: BLOCK_MAX_SIZE["4MB"], /* max64KB, max256KB, max1MB, max4MB; 0 == default */
      blockMode: 0, /* LZ4F_blockLinked, LZ4F_blockIndependent; 0 == default */
      contentChecksumFlag: 0, /* 1: frame terminated with 32-bit checksum of decompressed data; 0: disabled (default) */
      frameType: 0, /* read-only field : LZ4F_frame or LZ4F_skippableFrame */
      dictID: 0, /* Dictionary ID, sent by compressor to help decoder select correct dictionary; 0 == no dictID provided */
      blockChecksumFlag: 0, /* 1: each block followed by a checksum of block's compressed data; 0: disabled (default) */
    };

    this.defaultPreferences = {
      // frameInfo should be included further
      compressionLevel: 0, /* 0: default (fast mode); values > LZ4HC_CLEVEL_MAX count as LZ4HC_CLEVEL_MAX; values < 0 trigger "fast acceleration" */
      autoFlush: 1, /* 1: always flush; reduces usage of internal buffers */
      favorDecSpeed: 1, /* 1: parser favors decompression speed vs compression ratio. Only works for high compression modes (>= LZ4HC_CLEVEL_OPT_MIN) */  /* v1.8.2+ */
    };

    this.options = {};
    this.options.frameInfo = Object.assign({}, this.defaultFrameInfo, options.frameInfo);
    this.options.preferences = Object.assign({}, this.options.frameInfo, this.preferences, options.preferences);

    this.$error = null;
  }

  createCompressionContext(contentSize) {
    this.cctxPtr = _LZ4JS_createCompressionContext(
      this.options.blockSizeID,
      this.options.blockMode,
      this.options.contentChecksumFlag,
      this.options.frameType,
      contentSize || 0, /* Size of uncompressed content ; 0 == unknown */
      this.options.dictID,
      this.options.blockChecksumFlag,
      this.options.compressionLevel,
      this.options.autoFlush,
      this.options.favorDecSpeed,
      this.options.reserved,
    );
    if (!this.cctxPtr) throw new Error('LZ4JS_createCompressionContext');
    LZ4JS_instances[this.cctxPtr] = this;
  }

  compressBegin() {
    _LZ4JS_compressBegin(this.cctxPtr) || this.cleanup();
  }

  compressUpdate() {
    _LZ4JS_compressUpdate(this.cctxPtr) || this.cleanup();
  }

  compressEnd() {
    _LZ4JS_compressEnd(this.cctxPtr);
    this.cleanup();
  }

  cleanup() {
    _LZ4JS_freeCompressionContext(this.cctxPtr);
    delete LZ4JS_instances[this.cctxPtr];
    if (this.$error) throw this.$error;
  }
}

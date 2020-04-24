import { LZ4JS_instances } from './instance.service';
import { BLOCK_MAX_SIZE } from './constants'

/*

GENERAL STRUCTURE of LZ4 FRAME FORMAT
+-------------------------------+               +-------------------------+
|         FRAME HEADER          |               |       FRAME FOOTER      |
+---------------+---------------+-------+-------+-----------+-------------+
| MagicNb(...)  | F. Descriptor | Block | (...) | EndMark   | C. Checksum |
+---------------+---------------+-------+-------+-----------+-------------+
| 4 bytes       | 3-15 bytes    |       |       | 0-4 bytes | 0-4 bytes   |
+---------------+---------------+-------+-------+-----------+-------------+

FRAME DESCRIPTOR
+-----+----+----------------+-------------+----+
| FLG | BD | (Content Size) | DictId      | HC |
+-----+----+----------------+-------------+----+
| 1   | 1  | 0 - 8 bytes    | 0 - 4 bytes | 1  |
+-----+----+----------------+-------------+----+

FLG byte
+-----------+---------+---------+------------+--------+------------+----------+--------+
| BitNb     | 7-6     | 5       | 4          | 3      | 2          | 1        | 0      |
+-----------+---------+---------+------------+--------+------------+----------+--------+
| FieldName | Version | B.Indep | B.Checksum | C.Size | C.Checksum | Reserved | DictId |
+-----------+---------+---------+------------+--------+------------+----------+--------+

BD byte
+-----------+---------------+----------+
| BitNb     | 6-5-4         | 3-2-1-0  |
+-----------+---------------+----------+
| FieldName | Block MaxSize | Reserved |
+-----------+---------------+----------+

BLOCK MAXIMUM SIZE
+-----+-----+-----+-----+-------+--------+------+------+
| 0   | 1   | 2   | 3   | 4     | 5      | 6    | 7    |
+-----+-----+-----+-----+-------+--------+------+------+
| N/A | N/A | N/A | N/A | 64 KB | 256 KB | 1 MB | 4 MB |
+-----+-----+-----+-----+-------+--------+------+------+

DATA BLOCKS
+------------+------+------------------+
| Block Size | data | (Block Checksum) |
+------------+------+------------------+
| 4 bytes    |      | 0 - 4 bytes      |
+------------+------+------------------+

Reserved bits MUST be 0
Version should be 0x01
EndMark: The flow of blocks ends when the last data block has a size of “0”. The size is expressed as a 32-bits value.

*/

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
      this.options.frameInfo.blockSizeID,
      this.options.frameInfo.blockMode,
      this.options.frameInfo.contentChecksumFlag,
      this.options.frameInfo.frameType,
      contentSize || 0, /* Size of uncompressed content ; 0 == unknown */
      this.options.frameInfo.dictID,
      this.options.frameInfo.blockChecksumFlag,
      this.options.preferences.compressionLevel,
      this.options.preferences.autoFlush,
      this.options.preferences.favorDecSpeed,
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

#include <stdlib.h>
#include <stdio.h>
#include <emscripten.h>
#include <lz4frame.h>

typedef struct
{
  size_t dstMaxSize;
  LZ4F_compressionContext_t cctx;
  LZ4F_preferences_t preferences;
} LZ4JS_compressionContext_t;

int main() {
  EM_ASM(void _LZ4JS_init());
};

LZ4JS_compressionContext_t *LZ4JS_createCompressionContext(
  LZ4F_blockSizeID_t     blockSizeID,         /* max64KB, max256KB, max1MB, max4MB; 0 == default */
  LZ4F_blockMode_t       blockMode,           /* LZ4F_blockLinked, LZ4F_blockIndependent; 0 == default */
  LZ4F_contentChecksum_t contentChecksumFlag, /* 1: frame terminated with 32-bit checksum of decompressed data; 0: disabled (default) */
  LZ4F_frameType_t       frameType,           /* read-only field : LZ4F_frame or LZ4F_skippableFrame */
  unsigned long long     contentSize,         /* Size of uncompressed content ; 0 == unknown */
  unsigned               dictID,              /* Dictionary ID, sent by compressor to help decoder select correct dictionary; 0 == no dictID provided */
  LZ4F_blockChecksum_t   blockChecksumFlag,   /* 1: each block followed by a checksum of block's compressed data; 0: disabled (default) */
  int                    compressionLevel,    /* 0: default (fast mode); values > LZ4HC_CLEVEL_MAX count as LZ4HC_CLEVEL_MAX; values < 0 trigger "fast acceleration" */
  unsigned               autoFlush,           /* 1: always flush; reduces usage of internal buffers */
  unsigned               favorDecSpeed        /* 1: parser favors decompression speed vs compression ratio. Only works for high compression modes (>= LZ4HC_CLEVEL_OPT_MIN) */  /* v1.8.2+ */
);
LZ4F_decompressionContext_t *LZ4JS_createDecompressionContext();
void LZ4JS_freeCompressionContext(LZ4JS_compressionContext_t *cctxPtr);
void LZ4JS_freeDecompressionContext(LZ4F_decompressionContext_t *dctxPtr);
int LZ4JS_compressBegin(LZ4JS_compressionContext_t *cctxPtr);
int LZ4JS_compressUpdate(LZ4JS_compressionContext_t *cctxPtr);
int LZ4JS_compressEnd(LZ4JS_compressionContext_t *cctxPtr);
int LZ4JS_decompress(LZ4F_decompressionContext_t *dctxPtr);

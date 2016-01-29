#include <stdlib.h>
#include <stdio.h>
#include <emscripten.h>
#include <lz4frame.h>


typedef struct {
  size_t dstMaxSize;
  LZ4F_compressionContext_t cctx;
  LZ4F_preferences_t preferences;
} LZ4JS_compressionContext_t;

void LZ4JS_init();

LZ4JS_compressionContext_t* LZ4JS_createCompressionContext(LZ4F_blockSizeID_t blockSizeID, LZ4F_blockMode_t blockMode, LZ4F_contentChecksum_t contentChecksum, unsigned int compressionLevel);
LZ4F_decompressionContext_t* LZ4JS_createDecompressionContext();
void LZ4JS_freeCompressionContext(LZ4JS_compressionContext_t* cctxPtr);
void LZ4JS_freeDecompressionContext(LZ4F_decompressionContext_t* dctxPtr);
int LZ4JS_compressBegin(LZ4JS_compressionContext_t* cctxPtr);
int LZ4JS_compressUpdate(LZ4JS_compressionContext_t* cctxPtr);
int LZ4JS_compressEnd(LZ4JS_compressionContext_t* cctxPtr);
int LZ4JS_decompress(LZ4F_decompressionContext_t* dctxPtr);

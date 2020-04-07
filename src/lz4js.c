#include "lz4js.h"

#define BUF_SIZE 8192

char* src;
char* dst;
size_t dstMaxSize = BUF_SIZE;

void LZ4JS_init() {
  src = (char*)malloc(BUF_SIZE);
  dst = (char*)malloc(BUF_SIZE);
}

size_t LZ4JS_read(void* ptr, char* buf, size_t size) {
  return EM_ASM_INT({return LZ4JS_read($0, $1, $2)}, ptr, buf, size);
}

void LZ4JS_write(void* ptr, char* buf, size_t size) {
  EM_ASM_INT({LZ4JS_write($0, $1, $2)}, ptr, buf, size);
}

int LZ4JS_validate(void* ptr, LZ4F_errorCode_t r) {
  int isError;
  if ( (isError = LZ4F_isError(r)) ) {
    const char* errorName = LZ4F_getErrorName(r);
    EM_ASM_INT({LZ4JS_error($0, $1)}, ptr, errorName);
  }
  return isError ? 0 : 1;
}

LZ4JS_compressionContext_t* LZ4JS_createCompressionContext(LZ4F_blockSizeID_t blockSizeID, LZ4F_blockMode_t blockMode, LZ4F_contentChecksum_t contentChecksum, unsigned int compressionLevel) {
  LZ4JS_compressionContext_t* cctxPtr;

  cctxPtr = malloc(sizeof(LZ4JS_compressionContext_t));
  if (LZ4F_isError(LZ4F_createCompressionContext(&cctxPtr->cctx, LZ4F_VERSION))) {
    free(cctxPtr);
    return NULL;
  };

  cctxPtr->preferences = (LZ4F_preferences_t){
    { blockSizeID, blockMode, contentChecksum, LZ4F_frame, 0, 0, 0 },
    compressionLevel,   /* compression level */
    0,   /* autoflush */
    { 0, 0, 0, 0 },  /* reserved, must be set to 0 */
  };
  size_t _dstMaxSize = LZ4F_compressBound(BUF_SIZE, &cctxPtr->preferences);
  if (_dstMaxSize > dstMaxSize) {
    free(dst);
    dstMaxSize = _dstMaxSize;
    dst = (char*)malloc(dstMaxSize);
  }
  return cctxPtr;
}

void LZ4JS_freeCompressionContext(LZ4JS_compressionContext_t* cctxPtr) {
  LZ4F_freeCompressionContext(cctxPtr->cctx);
  free(cctxPtr);
}

int LZ4JS_compressBegin(LZ4JS_compressionContext_t* cctxPtr) {
  size_t n = LZ4F_compressBegin(cctxPtr->cctx, dst, dstMaxSize, &cctxPtr->preferences);
  if (LZ4JS_validate(cctxPtr, n)) {
    LZ4JS_write(cctxPtr, dst, n);
    return 1;
  }
  return 0;
}

int LZ4JS_compressUpdate(LZ4JS_compressionContext_t* cctxPtr) {
  size_t n = LZ4F_compressUpdate(cctxPtr->cctx, dst, dstMaxSize, src, LZ4JS_read(cctxPtr, src, BUF_SIZE), NULL);
  if (LZ4JS_validate(cctxPtr, n)) {
    LZ4JS_write(cctxPtr, dst, n);
    return 1;
  }
  return 0;
}

int LZ4JS_compressEnd(LZ4JS_compressionContext_t* cctxPtr) {
  size_t n = LZ4F_compressEnd(cctxPtr->cctx, dst, dstMaxSize, NULL);
  if (LZ4JS_validate(cctxPtr, n)) {
    LZ4JS_write(cctxPtr, dst, n);
    return 1;
  }
  return 0;
}

LZ4F_decompressionContext_t* LZ4JS_createDecompressionContext() {
  LZ4F_decompressionContext_t* dctxPtr;
  dctxPtr = malloc(sizeof(LZ4F_decompressionContext_t));
  if (LZ4F_isError(LZ4F_createDecompressionContext(dctxPtr, LZ4F_VERSION))) {
    return NULL;
  }
  if (BUF_SIZE > dstMaxSize) {
    free(dst);
    dstMaxSize = BUF_SIZE;
    dst = (char*)malloc(dstMaxSize);
  }
  return dctxPtr;
}

void LZ4JS_freeDecompressionContext(LZ4F_decompressionContext_t* dctxPtr) {
  LZ4F_freeDecompressionContext(*dctxPtr);
}

int LZ4JS_decompress(LZ4F_decompressionContext_t* dctxPtr) {
  size_t k = LZ4JS_read(dctxPtr, src, BUF_SIZE);
  size_t dstSize = BUF_SIZE;
  size_t offset = 0;

  while ((offset < k) || (dstSize == BUF_SIZE)) {
    size_t srcSize = k - offset;
    size_t n = LZ4F_decompress(*dctxPtr, dst, &dstSize, src + offset, &srcSize, NULL);
    if (!LZ4JS_validate(dctxPtr, n)) return 0;
    offset += srcSize;
    if (dstSize) LZ4JS_write(dctxPtr, dst, dstSize);
    if (!n) break;
  }
  return 1;
}

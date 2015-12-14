#include <stdlib.h>
#include <stdio.h>
#include <emscripten.h>
#include <lz4frame.h>

#define BUF_SIZE (16*1024)
#define DECOMPRESS_BUF_SIZE (64*1024)
#define LZ4_HEADER_SIZE 19
#define LZ4_FOOTER_SIZE 4


LZ4F_errorCode_t compress(int compressionlevel) {
  LZ4F_errorCode_t r;
  LZ4F_compressionContext_t ctx;
  LZ4F_preferences_t lz4_preferences = {
  	{ LZ4F_max256KB, LZ4F_blockLinked, LZ4F_noContentChecksum, LZ4F_frame, 0, { 0, 0 } },
  	compressionlevel,   /* compression level */
  	0,   /* autoflush */
  	{ 0, 0, 0, 0 },  /* reserved, must be set to 0 */
  };
  char *src, *buf = NULL;
  size_t size, n, k, offset = 0, frame_size;

  r = LZ4F_createCompressionContext(&ctx, LZ4F_VERSION);
  if (LZ4F_isError(r)) {
    EM_ASM_INT({LZ4JS_setError($0)}, LZ4F_getErrorName(r));
    return r;
  }
  r = 1;

  src = malloc(BUF_SIZE);

  frame_size = LZ4F_compressBound(BUF_SIZE, &lz4_preferences);
  size =  frame_size + LZ4_HEADER_SIZE + LZ4_FOOTER_SIZE;
  buf = malloc(size);

  n = offset = LZ4F_compressBegin(ctx, buf, size, &lz4_preferences);
	if (LZ4F_isError(n)) {
		r = n;
		goto cleanup;
	}

  for (;;) {
    k = EM_ASM_INT({return LZ4JS_read($0, $1)}, src, BUF_SIZE);
    if (k == 0) break;

    n = LZ4F_compressUpdate(ctx, buf + offset, size - offset, src, k, NULL);
    if (LZ4F_isError(n)) {
      r = n;
      goto cleanup;
    }

    offset += n;
    if (size - offset < frame_size + LZ4_FOOTER_SIZE) {
      k = EM_ASM_INT({LZ4JS_write($0, $1)}, buf, offset);
      offset = 0;
    }
  }

  n = LZ4F_compressEnd(ctx, buf + offset, size - offset, NULL);
  if (LZ4F_isError(n)) {
    r = n;
    goto cleanup;
  }

  EM_ASM_INT({LZ4JS_write($0, $1)}, buf, offset + n);
  r = 0;

 cleanup:
  if (ctx) LZ4F_freeCompressionContext(ctx);
  if (LZ4F_isError(r)) EM_ASM_INT({LZ4JS_setError($0)}, LZ4F_getErrorName(r));
  free(src);
  free(buf);
  return r;
}

LZ4F_errorCode_t decompress() {
  LZ4F_errorCode_t r;
  LZ4F_decompressionContext_t ctx;
  char *src, *buf = NULL;
  size_t n, k;

  r = LZ4F_createDecompressionContext(&ctx, LZ4F_VERSION);
  if (LZ4F_isError(r)) {
    EM_ASM_INT({LZ4JS_setError($0)}, LZ4F_getErrorName(r));
    return r;
  }
  r = 1;

  src = malloc(BUF_SIZE);
  buf = malloc(DECOMPRESS_BUF_SIZE);

  for (;;) {
    size_t dstSize = DECOMPRESS_BUF_SIZE;
    size_t srcSize = BUF_SIZE;
    size_t offset = 0;

    k = EM_ASM_INT({return LZ4JS_read($0, $1)}, src, BUF_SIZE);
    if (!k) break;

    while ((offset < k) || (dstSize == DECOMPRESS_BUF_SIZE)) {
      size_t remaining = k - offset;
      dstSize = DECOMPRESS_BUF_SIZE;
      n = LZ4F_decompress(ctx, buf, &dstSize, src + offset, &remaining, NULL);
      if (LZ4F_isError(n)) {
        r = n;
        goto cleanup;
      }

      offset += remaining;
      if (dstSize) EM_ASM_INT({LZ4JS_write($0, $1)}, buf, dstSize);
      if (!n) break;
    }
  }

  r = 0;

 cleanup:
  if (ctx) LZ4F_freeDecompressionContext(ctx);
  if (LZ4F_isError(r)) EM_ASM_INT({LZ4JS_setError($0)}, LZ4F_getErrorName(r));
  free(src);
  free(buf);
  return r;
}

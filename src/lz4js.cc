#include "lz4js.h"

namespace LZ4JS {
  Base::Base(int _id): id{_id} {}

  size_t Base::_read(char* buf, size_t size) {
    return EM_ASM_INT({return LZ4JS_read($0, $1, $2)}, id, buf, size);
  }
  void Base::_write(char* buf, size_t size) {
    EM_ASM_INT({LZ4JS_write($0, $1, $2)}, id, buf, size);
  }
  void Base::_validate(LZ4F_errorCode_t r) {
    if (LZ4F_isError(r)) {
      const char* errorName = LZ4F_getErrorName(r);
      EM_ASM_INT({LZ4JS_error($0, $1)}, id, errorName);
      throw errorName;
    }
  }

  const size_t bufSize = 8196;
  char* src = new char[bufSize];
  char* dst;
  size_t dstMaxSize = 0;


  Compressor::Compressor(int _id, int compressionLevel): Base(_id) {
    lz4_preferences = (LZ4F_preferences_t){
      { LZ4F_max4MB, LZ4F_blockLinked, LZ4F_noContentChecksum, LZ4F_frame, 0, { 0, 0 } },
      compressionLevel,   /* compression level */
      0,   /* autoflush */
      { 0, 0, 0, 0 },  /* reserved, must be set to 0 */
    };

    _validate(LZ4F_createCompressionContext(&ctx, LZ4F_VERSION));
    size_t _dstMaxSize = LZ4F_compressBound(bufSize, &lz4_preferences);
    if (_dstMaxSize > dstMaxSize) {
      delete[] dst;
      dstMaxSize = _dstMaxSize;
      dst = new char[dstMaxSize];
    }
  }

  Compressor::~Compressor() {
    LZ4F_freeCompressionContext(ctx);
  }

  void Compressor::begin() {
    size_t n = LZ4F_compressBegin(ctx, dst, dstMaxSize, &lz4_preferences);
    _validate(n);
    _write(dst, n);
  }

  void Compressor::write() {
    size_t n = LZ4F_compressUpdate(ctx, dst, dstMaxSize, src, _read(src, bufSize), NULL);
    _validate(n);
    _write(dst, n);
  }

  void Compressor::end() {
    size_t n = LZ4F_compressEnd(ctx, dst, dstMaxSize, NULL);
    _validate(n);
    _write(dst, n);
  }


  Decompressor::Decompressor(int _id) : Base(_id) {
    _validate(LZ4F_createDecompressionContext(&ctx, LZ4F_VERSION));
    if (bufSize > dstMaxSize) {
      delete[] dst;
      dstMaxSize = bufSize;
      dst = new char[dstMaxSize];
    }
  }

  Decompressor::~Decompressor() {
    LZ4F_freeDecompressionContext(ctx);
  }

  void Decompressor::write() {
    size_t k = _read(src, bufSize);
    size_t dstSize = bufSize;
    size_t offset = 0;

    while ((offset < k) || (dstSize == bufSize)) {
      size_t srcSize = k - offset;
      size_t n = LZ4F_decompress(ctx, dst, &dstSize, src + offset, &srcSize, NULL);
      _validate(n);
      offset += srcSize;
      if (dstSize) _write(dst, dstSize);
      if (!n) break;
    }
  }

  EMSCRIPTEN_BINDINGS(my_module) {
    class_<Compressor>("Compressor")
      .constructor<int, int>()
      .function("begin", &Compressor::begin)
      .function("write", &Compressor::write)
      .function("end", &Compressor::end)
      ;

    class_<Decompressor>("Decompressor")
      .constructor<int>()
      .function("write", &Decompressor::write)
      ;
  }
}

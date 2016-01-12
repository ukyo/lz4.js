#include <cstddef>
#include <lz4frame.h>
#include <emscripten.h>


typedef struct {
  unsigned int id,
  size_t dstMaxSize,
  LZ4F_compressionContext_t ctx,
  LZ4F_preferences_t preferences
} LZ4JS_compressionContext_t;

typedef struct {
  unsigned int id;
  LZ4F_decompressionContext_t ctx
} LZ4JS_decompressionContext_t;

LZ4JS_compressionContext_t* LZ4JS_createCompressionContext(unsigned int id, unsigned int compressionLevel);
void LZ4JS_freeCompressionContext(LZ4JS_compressionContext_t* ctx);
void LZ4JS_compressBegin(LZ4JS_compressionContext_t* ctx);
void LZ4JS_compressUpdate(LZ4JS_compressionContext_t* ctx);
void LZ4JS_compressEnd(LZ4JS_compressionContext_t* ctx);
LZ4JS_decompressionContext_t* LZ4JS_createDecompressContext(unsigned int id);
void LZ4JS_freeDecompressContext(LZ4JS_decompressionContext_t* ctx);
void LZ4JS_decompress(LZ4JS_decompressionContext_t* ctx)

#include <emscripten/bind.h>

using namespace std;
using namespace emscripten;

namespace LZ4JS {
  class Base {
  protected:
    int id;
    size_t _read(char* buf, size_t size);
    void _write(char* buf, size_t size);
    void _validate(LZ4F_errorCode_t r);
  public:
    Base(int id);
  };

  class Compressor: Base {
  protected:
    int id;
    LZ4F_compressionContext_t ctx;
    LZ4F_preferences_t lz4_preferences;
    size_t dstMaxSize;
  public:
    Compressor(int id, int compressionLevel);
    ~Compressor();
    void begin();
    void write();
    void end();
  };

  class Decompressor: Base {
  protected:
    int id;
    LZ4F_decompressionContext_t ctx;
  public:
    Decompressor(int id);
    ~Decompressor();
    void write();
  };
}

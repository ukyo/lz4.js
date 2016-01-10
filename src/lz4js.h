#include <cstddef>
#include <lz4frame.h>
#include <emscripten.h>
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

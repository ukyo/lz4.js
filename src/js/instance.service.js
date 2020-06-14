export const LZ4JS_instances = {};

export const LZ4JS_read = function LZ4JS_read(id, srcPtr, size) {
  return LZ4JS_instances[id].$read(srcPtr, size);
}

export const LZ4JS_write = function LZ4JS_write(id, dstPtr, size) {
  return LZ4JS_instances[id].$write(dstPtr, size);
}

export const LZ4JS_error = function LZ4JS_error(id, ptr) {
  LZ4JS_instances[id].$error = new Error(UTF8ToString(ptr));
}
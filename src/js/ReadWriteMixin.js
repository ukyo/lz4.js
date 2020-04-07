export default class AbstractReadWrite {
  $write(dstPtr, size) {
    this.buffers.push(new Uint8Array(HEAPU8.subarray(dstPtr, dstPtr + size)));
  }

  $read(srcPtr, size) {
    HEAPU8.set(this.src.subarray(this.offset, this.offset + this.srcSize), srcPtr);
    return this.srcSize;
  }
}

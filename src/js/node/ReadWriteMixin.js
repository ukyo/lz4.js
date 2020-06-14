export default class ReadWriteMixin {
  $read(srcPtr, size) {
    HEAPU8.set(new Uint8Array(this.src.buffer, this.src.byteOffset, this.srcSize), srcPtr);
    return this.srcSize;
  }

  $write(dstPtr, size) {
    this.dst = Buffer.from(HEAPU8.buffer).slice(dstPtr, dstPtr + size);
    this.push(Buffer.from(this.dst));
  }
}

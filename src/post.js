var LZ4_compressBound = function (isize) { return isize + (isize / 255 | 0) + 16 };
var LZ4_DEFAULT_BLOCKSIZE = 1024 * 1024;
var LZ4_MAGIC_NUMBER = 0x184d2204;
var LZ4_BLOCK_MAXIMUM_SIZE_TABLE = [
  null,
  null,
  null,
  null,
  64 * 1024,
  256 * 1024,
  1024 * 1024,
  4 * 1024 * 1024
];


function compress (source, blockSize) {
  blockSize = Math.min(source.length, blockSize || LZ4_DEFAULT_BLOCKSIZE);
  
  var inBuffPtr,
      outBuffPtr,
      headerBuffPtr,
      offset = 0,
      destSize,
      ret,
      blocks = [],
      block,
      header,
      headerChecksum,
      blockMaximumSizeIndex;

  // detect the block maximum size index
  LZ4_BLOCK_MAXIMUM_SIZE_TABLE.some(function (size, i) {
    blockMaximumSizeIndex = i;
    if (size === null) return;
    return size >= blockSize;
  });

  // allocate buffers
  inBuffPtr = _malloc(blockSize);
  outBuffPtr = _malloc(LZ4_compressBound(blockSize));
  headerBuffPtr = _malloc(7);

  // compress blocks
  while (offset < source.length) {
    HEAPU8.set(source.subarray(offset, Math.min(offset + blockSize, source.length)), inBuffPtr);
    destSize = _LZ4_compress(inBuffPtr, outBuffPtr, Math.min(blockSize, source.length - offset));
    block = new Uint8Array(destSize + 4);
    block.set(HEAPU8.subarray(outBuffPtr, outBuffPtr + destSize), 4);
    new DataView(block.buffer).setUint32(0, destSize, true);
    blocks.push(block);
    offset += blockSize;
  }

  // create the header
  header = new DataView(new ArrayBuffer(7));
  header.setUint32(0, LZ4_MAGIC_NUMBER, true);
  header.setUint8(4, 0x60);
  header.setUint8(5, blockMaximumSizeIndex << 4);
  HEAPU8.set(new Uint8Array(header.buffer), headerBuffPtr);
  headerChecksum = _XXH32(headerBuffPtr + 4, 2, 0);
  header.setUint8(6, (headerChecksum >> 8) & 0xff);

  // concat blocks
  ret = new Uint8Array(
    7 + // header size
    blocks.map(function (b) { return b.length }).reduce(function (a, b) { return a + b }) + // sum of compressed blocks length
    4 // EoS
  );
  offset = 0;
  ret.set(new Uint8Array(header.buffer), offset);
  offset += 7;
  blocks.forEach(function (block) {
    ret.set(block, offset);
    offset += block.length;
  });

  _free(inBuffPtr);
  _free(outBuffPtr);
  _free(headerBuffPtr);

  return ret;
}


function decompress (source) {
  var inBuffPtr,
      outBuffPtr,
      offset = 0,
      ret,
      view = new DataView(source.buffer, source.byteOffset, source.byteLength),
      magicNumber,
      headerChecksum,
      blockMaximumSize,
      blockSize,
      blocks = [],
      destSize,
      flags = {};

  magicNumber = view.getUint32(offset, true);
  if (magicNumber !== LZ4_MAGIC_NUMBER) throw new Error('lz4: invalid magic number');
  offset += 4;

  // FLG
  flags.version = view.getUint8(offset) >> 6;
  flags.blockIndependence = (view.getUint8(offset) >> 5) & 0x1;
  flags.blockChecksum = (view.getUint8(offset) >> offset) & 0x1;
  flags.streamSize = (view.getUint8(offset) >> 3) & 0x1;
  flags.streamChecksum = (view.getUint8(offset) >> 2) & 0x1;
  flags.presetDictionary = view.getUint8(offset) & 0x1;
  offset++;
  
  // BD
  flags.blockMaximumSizeIndex = (view.getUint8(5) >> 0x4) & 0x7;
  blockMaximumSize = LZ4_BLOCK_MAXIMUM_SIZE_TABLE[flags.blockMaximumSizeIndex];
  offset++;

  // allocate buffers
  inBuffPtr = _malloc(LZ4_compressBound(blockMaximumSize));
  outBuffPtr = _malloc(blockMaximumSize);

  // header checksum
  HEAPU8.set(source.subarray(4, 6), inBuffPtr);
  headerChecksum = _XXH32(inBuffPtr, 2, 0);
  if (((headerChecksum >> 8) & 0xff) !== source[offset]) throw new Error('lz4: invalid checksum');
  offset++;

  // skip uncompressed stream size
  offset += flags.streamSize ? 8 : 0;
  
  // decompress blocks
  while (1) {
    blockSize = view.getUint32(offset, true);
    offset += 4;
    // uncompressed data block
    if (blockSize >>> 31) {
      blocks.push(source.subarray(offset, offset + blockSize));
    }
    // skippable chunk
    else if (0x184D2A50 <= blockSize && blockSize <= 0x184D2A59) {
      offset+=view.getUint32(offset, true) + 4;
      continue;
    }
    // compressed data block
    else if (blockSize > 0) {
      HEAPU8.set(source.subarray(offset, offset + blockSize), inBuffPtr);
      destSize = _LZ4_decompress_safe(inBuffPtr, outBuffPtr, blockSize, blockMaximumSize);
      blocks.push(new Uint8Array(HEAPU8.subarray(outBuffPtr, outBuffPtr + destSize)));
    }
    // EoS
    else {
      break;
    }
    offset += blockSize;
    offset += flags.blockChecksum ? 4 : 0;
  }

  // concat blocks
  ret = new Uint8Array(blocks.map(function (b) { return b.length }).reduce(function (a, b) { return a + b }));
  offset = 0;
  blocks.forEach(function (block) {
    ret.set(block, offset);
    offset += block.length;
  });

  _free(inBuffPtr);
  _free(outBuffPtr);

  return ret;
}

var lz4 = this;
lz4['compress'] = compress;
lz4['decompress'] = decompress;
Module['_LZ4_compressBound'] = LZ4_compressBound;

if (typeof define === 'function' && define['amd']) {
  define('lz4', function () { return lz4 });
} else if (ENVIRONMENT_IS_NODE) {
  module['exports'] = lz4;
}
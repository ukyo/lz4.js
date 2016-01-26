var lz4 = require('../dev/lz4.js');
var expect = require('chai').expect;
var fs = require('fs');

describe('lz4', function () {
  it('should be defined', function () {
    expect(lz4).to.be.an('object');
  });

  var source = new Uint8Array(fs.readFileSync('test/source.txt'));
  var compressed = new Uint8Array(fs.readFileSync('test/compressed.lz4'));

  function sameAll(a, b) {
    return Array.prototype.every.call(a, function (v, i) {
      return v === b[i];
    });
  }

  describe('lz4.decompress', function () {
    it('should be defined', function () {
      expect(lz4.decompress).to.be.a('function');
    });

    it('should return the source file from the compressed file', function () {
      var s = lz4.decompress(compressed);
      expect(s.length).to.equal(source.length);
      expect(sameAll(s, source)).to.be.true;
    });
  });

  describe('lz4.compress', function () {
    it('should be defined', function () {
      expect(lz4.compress).to.be.a('function');
    });

    it('should return the valid lz4 file', function () {
      var c = lz4.compress(lz4.decompress(compressed));
      var s = lz4.decompress(c);
      expect(s.length).to.equal(source.length);
      expect(sameAll(s, source)).to.be.true;
    });
  });

  describe('lz4.createDecompressStream', function() {
    it('should bd defined', function() {
      expect(lz4.createDecompressStream).to.be.a('function');
    });

    it('should return the source file from the compressed file', function (done) {
      var rs = fs.createReadStream('test/compressed.lz4');
      var ds = lz4.createDecompressStream();
      var ws = fs.createWriteStream('test/_dst1.txt');
      rs.pipe(ds).pipe(ws);
      ws.on('close', function () {
        expect(fs.readFileSync('test/source.txt').equals(fs.readFileSync('test/_dst1.txt'))).to.be.true;
        done();
      });
    });
  });

  describe('lz4.createCompressStream', function() {
    it('should bd defined', function() {
      expect(lz4.createCompressStream).to.be.a('function');
    });

    it('should return the valid lz4 file', function (done) {
      var rs = fs.createReadStream('test/source.txt');
      var cs = lz4.createCompressStream();
      var ds = lz4.createDecompressStream();
      var ws = fs.createWriteStream('test/_dst2.txt');
      rs.pipe(cs).pipe(ds).pipe(ws);
      ws.on('close', function () {
        expect(fs.readFileSync('test/source.txt').equals(fs.readFileSync('test/_dst2.txt'))).to.be.true;
        done();
      });
    });
  });
});

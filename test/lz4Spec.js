var expect = require('chai').expect;
var fs = require('fs');

describe('lz4', function () {
  it('should be defined', function () {
    expect(lz4).to.be.an('object');
  });

  var source = new Uint8Array(Array.prototype.slice.call(fs.readFileSync('test/source.txt')));
  var compressed = new Uint8Array(Array.prototype.slice.call(fs.readFileSync('test/compressed.lz4')));

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

    it('should reaturn the valid malti block lz4 file', function () {
      var c = lz4.compress(lz4.decompress(compressed), 4 * 1024);
      var s = lz4.decompress(c);
      expect(s.length).to.equal(source.length);
      expect(sameAll(s, source)).to.be.true;
    })
  });
})
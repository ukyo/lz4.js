export const concatBuffers = function(buffers) {
  let offset = 0;
  const size = buffers.reduce(function(acc, buffer) {
    return acc + buffer.length;
  }, 0);
  const u8a = new Uint8Array(size);
  buffers.forEach(function(buffer) {
    u8a.set(buffer, offset);
    offset += buffer.length;
  });
  return u8a;
};

export const aggregation = function(base, ...mixins) {
  let aggregate = class __Aggregate extends base {
      constructor (...args) {
          super(...args)
          mixins.forEach(function(mixin) {
              if (typeof mixin.prototype.initializer === "function")
                  mixin.prototype.initializer.apply(this, args)
          })
      }
  };
  let copyProps = function(target, source) {
      Object.getOwnPropertyNames(source)
          .concat(Object.getOwnPropertySymbols(source))
          .forEach(function(prop) {
          if (prop.match(/^(?:initializer|constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/)) {
            return;
          }
          Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop))
      })
  };
  mixins.forEach(function(mixin) {
      copyProps(aggregate.prototype, mixin.prototype)
      copyProps(aggregate, mixin)
  });
  return aggregate;
}

export const wrapForNode = function(fn) {
  return function(src) {
    var uint8 = fn.apply(null, arguments);
    return Buffer.isBuffer(src) ? Buffer.from(uint8.buffer, uint8.byteOffset, uint8.byteOffset + uint8.length) : uint8;
  };
};

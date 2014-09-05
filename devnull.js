var util = require('util');
var stream = require('stream')
var Writable = stream.Writable

module.exports = DevNull;

util.inherits(DevNull, Writable);

function DevNull(opts) {
  if (!(this instanceof DevNull)) return new DevNull(opts);
  opts = opts || {};
  Writable.call(this, opts);
}

DevNull.prototype._write = function(chunk, encoding, cb) {
  cb();
};

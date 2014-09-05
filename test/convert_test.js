var app = require('./../app');
var assert = require('assert');
var fs = require('fs');
var request = require('supertest');

describe('the convert method', function() {
  it('should convert tex to xml', function(done) {
    request(app)
      .post('/convert')
      .set('Accept', 'application/mods+xml')
      .set('Content-Type', 'application/x-bibtex')
      .send(fs.readFileSync('test/test.bib', { encoding: 'utf8' }))
      .end(function(err, res) {
        assert(res.text.match(/<identifier type="citekey">citeulike:1620612<\/identifier>/));
        done();
      });
  });
});

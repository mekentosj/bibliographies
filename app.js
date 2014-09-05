var express = require('express');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var app = express();
var platform = require('os').platform();
var bib2xmlPath = platform === 'darwin' ? './bin/bib2xml-mac' : './bin/bib2xml';
var formats = require('./formats');
var DevNull = require('./devnull');
var errPipe = process.env.NODE_ENV === 'test' ? new DevNull() : process.stderr;

function binaryPath(input, output) {
  var binname = input + '2' + output;
  return platform === 'darwin' ? './bin/' + binname + '-mac' : './bin/' + binname;
}

function convertPipe(inFormat, outFormat, inStream, outStream) {
  if (inFormat == 'xml' || outFormat == 'xml') {
    var bin = binaryPath(inFormat, outFormat);
    var converter = spawn(bin);
    inStream.pipe(converter.stdin);
    converter.stdout.pipe(outStream);
    converter.stderr.pipe(errPipe);
  } else {
    var converter1 = spawn(binaryPath(inFormat, 'xml'));
    var converter2 = spawn(binaryPath('xml', outFormat));
    converter2.stderr.pipe(process.stderr);
    converter1.stderr.pipe(process.stderr);
    inStream.pipe(converter1.stdin);
    converter1.stdout.pipe(converter2.stdin);
    converter2.stdout.pipe(outStream);
  }
}

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());

if (process.env.NODE_ENV !== 'test') {
  app.use(express.logger('dev'));
}

app.use(function(req, res, next) {
  req.setEncoding('utf8');
  next();
});

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.post('/convert', function(req, res) {
  var data = req.body;
  var inFormat = formats[req.get('Content-Type')] || 'xml';
  var outFormat = formats[req.get('Accept')] || 'xml';
  convertPipe(inFormat, outFormat, req, res);
});

app.post('/bib2xml', function(req, res) {
  var bib = req.body;
  var bib2xml = spawn(bib2xmlPath);
  req.pipe(bib2xml.stdin);
  bib2xml.stdout.pipe(res);
  bib2xml.stderr.pipe(process.stderr);
});

module.exports = app;

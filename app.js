var express = require('express');
var fs = require('fs');
var http = require('http');
var path = require('path');
var spawn = require('child_process').spawn;
var app = express();
var platform = require('os').platform();
var bib2xmlPath = platform === 'darwin' ? './bin/bib2xml-mac' : './bin/bib2xml';
var formats = require('./formats');
var PassThrough = require('stream').PassThrough;
var xmlparser = require('xml2json');
var es = require('event-stream');
var papermill = require('./functions/papermill');

function binaryPath(input,output){
  var binname = input + '2' + output;
  console.log("got binary", binname);
  return platform === 'darwin' ? './bin/' + binname + '-mac' : './bin/' + binname;
}

function wrapSpawnedProcess(proc){
  proc.stderr.pipe(process.stderr);
  return es.duplex(proc.stdin,proc.stdout);
}

function fromModsStream(mime){
  if (formats[mime] == 'xml'){
    return new PassThrough();
  }
  if (formats[mime]){
    return wrapSpawnedProcess(spawn(binaryPath('xml',formats[mime])));
  }
  if (mime == 'application/mods+json'){
    var outStream = es.through();
    var inStream = es.wait(function(err,input){
      outStream.push(xmlparser.toJson(input.toString(),{reversible:true}));
      outStream.end();
    });
    return es.duplex(inStream, outStream);
  }
}

function toModsStream(mime){
  if (formats[mime] == 'xml'){
    console.log("CAT");
    return new PassThrough();
  }
  if (formats[mime]){
    return wrapSpawnedProcess(spawn(binaryPath(formats[mime],'xml')));
  }
  if (mime == 'application/mods+json'){
    var outStream = es.through();
    var inStream = es.wait(function(err,input){
      outStream.push(xmlparser.toXml(input.toString()));
      outStream.end();
    });
    return es.duplex(inStream, outStream);
  }
  if (mime == 'application/papers+json'){
    var outStream = es.through();
    var inStream = es.wait(function(err,input){
      var mods = papermill.papermillToMODS(JSON.parse(input.toString()));
      console.log("SHOULD BE MODS", mods);
      var modsXML = xmlparser.toXml(mods);
      console.log("SHOULD BE MODS XML", modsXML);
      outStream.push(modsXML);
      outStream.end();
    });
    return es.duplex(inStream, outStream);
  }
}

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));

app.use(function(req, res, next) {
  req.setEncoding('utf8');
  next();
});

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.post('/convert', function(req, res){
  var inStream = toModsStream(req.get('Content-Type'));
  if (!inStream){
    return res.status(400).send("Can't handle " + req.get('Content-Type') + " input");
  }
  var outStream = fromModsStream(req.get('Accept'));
  if (!outStream){
    return res.status(400).send("Can't handle " + req.get('Accept') + " output");
  }
  req.pipe(inStream).pipe(outStream).pipe(res);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port:', app.get('port'));
});



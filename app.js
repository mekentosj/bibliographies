var express = require('express');
var http = require('http');
var path = require('path');
var spawn = require('child_process').spawn;
var app = express();
var platform = require('os').platform();
var bib2xmlPath = platform === 'darwin' ? './bin/bib2xml-mac' : './bin/bib2xml';

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

app.post('/bib2xml', function(req, res) {
  var bib = req.body;
  var bib2xml = spawn(bib2xmlPath);
  req.pipe(bib2xml.stdin);
  bib2xml.stdout.pipe(res);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port:', app.get('port'));
});

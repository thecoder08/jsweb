#!/usr/bin/env node
var http = require('http');
var fs = require('fs');
var url = require('url');
var htmlEscaper = require('html-escaper');
var JSDOM = require('jsdom').JSDOM;
var cp = require('child_process');
http.createServer(function(req, res) {
  var reqdata = '';
  req.on('data', function(data) {
    reqdata += data.toString();
  });
  var parsedurl = url.parse(req.url, true);
  if (parsedurl.pathname == '/') {
    parsedurl.pathname = '/index.html';
  }
  fs.readFile('.' + parsedurl.pathname, function(err, data) {
    if (err) {
      fs.readFile('404.html', function(err, data) {
        if (err) {
          var page404 = `<!DOCTYPE html>

<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title>404 not found!</title>
  </head>
  <body>
    <h1>404 not found!</h1>
    <p>That file was not found on this server.</p>
    <a href="/">Go Home</a>
  </body>
</html>
`;
          res.writeHead(404, { 'Content-Type': 'text/html', 'Content-Length': page404.length });
          res.end(page404);
        }
        else {
          res.writeHead(404, { 'Content-Type': 'text/html', 'Content-Length': data.length });
          res.end(data);
        }
      });
    }
    else {
      if (parsedurl.pathname.split('.')[1] == 'html') {
        var parsed = parsePython(data.toString(), reqdata, req.url);
        res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': parsed.length });
        res.end(parsed);
      }
      else if (parsedurl.pathname.split('.')[1] == 'txt') {
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Length': data.length });
        res.end(data);
      }
      else if (parsedurl.pathname.split('.')[1] == 'js') {
        res.writeHead(200, { 'Content-Type': 'text/js', 'Content-Length': data.length });
        res.end(data);
      }
      else if (parsedurl.pathname.split('.')[1] == 'css') {
        res.writeHead(200, { 'Content-Type': 'text/css', 'Content-Length': data.length });
        res.end(data);
      }
      else {
        res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': data.length });
        res.end(data);
      }
    }
  });
}).listen(process.argv[2]);

function parsePython(pythonCode, reqdata, requrl) {
  var document = new JSDOM(pythonCode).window.document;
  var scripts = document.querySelectorAll('serverscript');
  for (var script = 0; script < scripts.length; script++) {
    var thesescripts = scripts;
    fs.writeFileSync('tempfile.py', 'import sys\nreqdata = sys.argv[1]\nrequrl = sys.argv[2]\n' + htmlEscaper.unescape(scripts[script].innerHTML));
    var stdout = cp.execSync('python tempfile.py "' + reqdata + '" "' + requrl + '"');
    thesescripts[script].outerHTML = stdout.toString();
    fs.unlinkSync('tempfile.py');
    scripts = thesescripts;
  }
  return '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
}

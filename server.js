var http = require('http');
var fs = require('fs');
var url = require('url');
var render = require('@thecoder08/markdown');
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
          parsePython(data.toString(), reqdata, req.url, function(result) {
            res.writeHead(404, { 'Content-Type': 'text/html', 'Content-Length': result.length });
            res.end(result);
          });
        }
      });
    }
    else {
      if (parsedurl.pathname.split('.')[1] == 'html') {
        parsePython(data.toString(), reqdata, req.url, function(result) {
          res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': result.length });
          res.end(result);
        });
      }
      else if (parsedurl.pathname.split('.')[1] == 'txt') {
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Length': data.length });
        res.end(data);
      }
      else if (parsedurl.pathname.split('.')[1] == 'js') {
        res.writeHead(200, { 'Content-Type': 'text/js', 'Content-Length': data.length });
        res.end(data);
      }
      else if (parsedurl.pathname.split('.')[1] == 'mp4') {
        res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': data.length });
        res.end(data);
      }
      else if (parsedurl.pathname.split('.')[1] == 'mp3') {
        res.writeHead(200, { 'Content-Type': 'audio/mp3', 'Content-Length': data.length });
        res.end(data);
      }
      else if (parsedurl.pathname.split('.')[1] == 'wav') {
        res.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': data.length });
        res.end(data);
      }
      else if (parsedurl.pathname.split('.')[1] == 'json') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': data.length });
        res.end(data);
      }
      else if (parsedurl.pathname.split('.')[1] == 'md') {
        parsePython(render(data.toString()), reqdata, req.url, function(result) {
          res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8', 'Content-Length': result.length });
          res.end(result);
        });
      }
      else if (parsedurl.pathname.split('.')[1] == 'css') {
        res.writeHead(200, { 'Content-Type': 'text/css', 'Content-Length': data.length });
        res.end(data);
      }
      else if (parsedurl.pathname.split('.')[1] == 'ico') {
        res.writeHead(200, { 'Content-Type': 'image/x-icon', 'Content-Length': data.length });
        res.end(data);
      }
      else {
        res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': data.length });
        res.end(data);
      }
    }
  });
}).listen(process.argv[2]);

function parsePython(pythonCode, reqdata, requrl, callback) {
  var document = new JSDOM(pythonCode).window.document;
  var scripts = document.querySelectorAll('serverscript');
  var donescripts = 0;
  if (scripts.length == 0) {
    callback(pythonCode);
  }
  else {
  for (let script = 0; script < scripts.length; script++) {
    var code = 'var reqdata = process.argv[1];\nvar requrl = process.argv[2];\n' + htmlEscaper.unescape(scripts[script].innerHTML).replace(/"/g, '\\"');
    var proc = cp.exec('node -e "' + code + '" "' + reqdata + '" "' + requrl + '"', function(err, stdout, stderr) {
      donescripts++;
      if (err) {
        scripts[script].outerHTML = '<xmp>' + stderr.toString() + '\nIf you are a normal user using this site, contact the webmaster and give them this error message. If you are the webmaster, frick you!</xmp>';
      }
      else {
        scripts[script].outerHTML = stdout.toString();
      }
      if (donescripts == scripts.length) {
        callback('<!DOCTYPE html>\n' + document.documentElement.outerHTML);
      }
    });
  }
  }
}

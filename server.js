const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
};

http.createServer(function(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = path.join(ROOT, urlPath);

  // Security: don't serve outside root
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, function(err, data) {
    if (err) {
      // Try index.html for directory paths
      fs.readFile(path.join(ROOT, 'index.html'), function(e2, d2) {
        if (e2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(d2);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, '0.0.0.0', function() {
  console.log('Server running on port ' + PORT);
});

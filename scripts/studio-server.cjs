// Local, read-only static server. Client records live in the browser, not in this folder.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, 'site');
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.svg':'image/svg+xml', '.json':'application/json' };
http.createServer((req,res) => {
  const host = req.headers.host;
  if (host !== '127.0.0.1:4587' && host !== 'localhost:4587') { res.writeHead(403); return res.end('Invalid host'); }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  if (req.url === '/__studio_health') { res.setHeader('Content-Type','text/plain'); return res.end('HyperScale-local-studio-v1'); }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://127.0.0.1:4587').pathname); } catch { res.writeHead(400); return res.end(); }
  if (pathname.startsWith('/api/')) { res.writeHead(404,{'Content-Type':'application/json'}); return res.end('{"available":false}'); }
  const candidate = path.resolve(root, '.' + pathname);
  if (!candidate.startsWith(root + path.sep) && candidate !== root) { res.writeHead(403); return res.end(); }
  const file = fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : path.join(root,'index.html');
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','no-store');
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).on('error',()=>{res.statusCode=500;res.end('Could not read file');}).pipe(res);
}).listen(4587,'127.0.0.1',()=>console.log('HyperScale Studio http://127.0.0.1:4587/dashboard'));

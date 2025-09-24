import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4173;
const ROOT = resolve(new URL('.', import.meta.url).pathname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const url = req.url?.split('?')[0] ?? '/';
  const relativePath = url === '/' ? '/index.html' : url;
  const filePath = join(ROOT, relativePath);

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Blyx static server listening on http://localhost:${PORT}`);
});

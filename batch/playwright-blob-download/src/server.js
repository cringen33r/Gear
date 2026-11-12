import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3000);
const blobContent = 'Hello from the Blob server!\n';
const blobBytes = Buffer.from(blobContent, 'utf8');

const routes = {
  '/': {
    contentType: 'text/html; charset=utf-8',
    body: () => readFile(path.join(__dirname, 'index.html')),
  },
  '/save-file.js': {
    contentType: 'text/javascript; charset=utf-8',
    body: () => readFile(path.join(__dirname, 'save-file.js')),
  },
  '/blob': {
    contentType: 'application/octet-stream',
    body: async () => blobBytes,
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const route = routes[url.pathname];

  if (!route || req.method !== 'GET') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  try {
    const body = await route.body();
    res.writeHead(200, {
      'Content-Type': route.contentType,
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
      ...(url.pathname === '/blob' ? { 'Content-Disposition': 'inline' } : {}),
    });
    res.end(body);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal server error');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Server listening on http://127.0.0.1:${port}`);
});

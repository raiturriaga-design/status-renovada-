import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }

  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const decodedPath = decodeURIComponent(url.pathname);
    const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
    const filePath = path.resolve(root, `.${requestedPath}`);
    if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    const contents = request.method === 'HEAD' ? null : await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'Content-Length': fileInfo.size,
      'Cache-Control': 'no-store'
    });
    response.end(contents);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 400).end(error.code === 'ENOENT' ? 'Not found' : 'Bad request');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`ESTADÍSTICAS CHILE disponible en http://127.0.0.1:${port}`);
});

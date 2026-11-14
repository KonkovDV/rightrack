// Статический сервер для тестов: отдаёт репозиторий по пути /rightrack/, как GitHub Pages.
// Неизвестный путь внутри сайта получает 404.html со статусом 404.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PREFIX = '/rightrack/';
const PORT = Number(process.env.PORT || 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.ics': 'text/calendar'
};
const BLOCKED = /^(\.|node_modules|tests|tools|test-results|playwright-report|package)/;

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith(PREFIX)) { res.writeHead(302, { Location: PREFIX }); return res.end() }
  let rel = decodeURIComponent(url.pathname.slice(PREFIX.length));
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  const file = normalize(join(ROOT, rel));
  const send = async (path, status) => {
    const body = await readFile(path);
    res.writeHead(status, { 'Content-Type': TYPES[extname(path).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  try {
    if (!file.startsWith(ROOT) || BLOCKED.test(rel)) throw new Error('forbidden');
    if ((await stat(file)).isDirectory()) throw new Error('dir');
    await send(file, 200);
  } catch {
    await send(join(ROOT, '404.html'), 404);
  }
}).listen(PORT, '127.0.0.1', () => console.log(`http://127.0.0.1:${PORT}${PREFIX}`));

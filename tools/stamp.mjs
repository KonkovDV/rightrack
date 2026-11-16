// Ставит версию в адреса стилей, скриптов и сменяемых картинок: ?v=<первые 8 знаков sha1 файла>.
// Страница всегда получает свои свежие файлы, даже если браузер держит старые в кэше. Запуск: npm run stamp
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const hash = async file => createHash('sha1').update(await readFile(file)).digest('hex').slice(0, 8);

/** Правило: какие адреса в каких файлах получают версию. Экспортируется для проверки в тестах. */
export const RULES = [
  { dir: 'site_v2', files: f => f.endsWith('.html'), re: /((?:href|src)=")(assets\/(?:css|js)\/[\w.-]+\.(?:css|js))(?:\?v=[0-9a-f]{8})?(")/g },
  { dir: '.', files: f => f === 'index.html', re: /(src=")(art\/(?:site|site-laptop|site-tablet|site-phone|twin)\.webp)(?:\?v=[0-9a-f]{8})?(")/g }
];

export async function stamp({ write = true } = {}) {
  const stale = [];
  for (const { dir, files, re } of RULES) {
    for (const name of (await readdir(join(ROOT, dir))).filter(files)) {
      const path = join(ROOT, dir, name), src = await readFile(path, 'utf8');
      const jobs = [...src.matchAll(re)];
      const hashes = new Map();
      for (const m of jobs) if (!hashes.has(m[2])) hashes.set(m[2], await hash(join(dirname(path), m[2])));
      const out = src.replace(re, (_, a, url, z) => `${a}${url}?v=${hashes.get(url)}${z}`);
      if (out !== src) { stale.push(join(dir, name)); if (write) await writeFile(path, out) }
    }
  }
  return stale;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const changed = await stamp();
  console.log(changed.length ? 'версии обновлены: ' + changed.join(', ') : 'версии уже свежие');
}

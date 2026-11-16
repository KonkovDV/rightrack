// Версии в адресах стилей, скриптов и сменяемых картинок совпадают с содержимым файлов.
// Иначе браузер со старым кэшем покажет новую страницу со старыми стилями: блоки наедут друг на друга.
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { stamp } from '../tools/stamp.mjs';

test('версии файлов свежие: после правки стилей и скриптов выполнен npm run stamp', async () => {
  expect(await stamp({ write: false }), 'страницы с устаревшими версиями').toEqual([]);
});

test('каждая страница сайта подключает стили и скрипты только с версией', async () => {
  for (const p of ['index', 'shift', 'club', 'tools', 'trackers', 'thanks']) {
    const html = await readFile(new URL(`../site_v2/${p}.html`, import.meta.url), 'utf8');
    const urls = [...html.matchAll(/(?:href|src)="(assets\/(?:css|js)\/[^"]+)"/g)].map(m => m[1]);
    expect(urls.length, p).toBeGreaterThan(1);
    for (const u of urls) expect(u, p).toMatch(/\?v=[0-9a-f]{8}$/);
  }
});

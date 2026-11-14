// Закрытое до чекапа: в файлах репозитория нет платного содержания, только заглушки.
// Сам список закрытых фраз в репозитории не хранится. Он лежит у команды и подключается одним из двух способов:
//   файл tests/private/secrets.json (папка не попадает в git) или переменная окружения RT_SECRETS с тем же JSON.
// Без списка проверка текста пропускается, проверки заглушек идут всегда.
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SKIP_DIR = /^(\.git|node_modules|test-results|playwright-report|blob-report|_site)$/;
const TEXT = /\.(html|js|mjs|cjs|css|md|json|ya?ml|svg|txt|webmanifest)$|^LICENSE$|^\.[a-z]+$/;
const walk = (d, rel = '') => readdirSync(d).flatMap(f => {
  const p = join(d, f), r = rel ? rel + '/' + f : f;
  if (r === 'tests/private' || SKIP_DIR.test(f)) return [];
  return statSync(p).isDirectory() ? walk(p, r) : (TEXT.test(f) && f !== 'package-lock.json' ? [r] : []);
});
const FILES = walk(ROOT);

const FILE = join(ROOT, 'tests/private/secrets.json');
const raw = process.env.RT_SECRETS || (existsSync(FILE) ? readFileSync(FILE, 'utf8') : '');
const SECRET = raw ? Object.entries(JSON.parse(raw)).flatMap(([group, list]) => list.map((w, i) => ({ w, id: `${group} №${i + 1}` }))) : [];
// фраза считается найденной, только если стоит отдельным словом: случайные совпадения внутри других слов не в счёт
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rx = w => new RegExp(`(?<![\\p{L}\\p{N}+/=])${esc(w)}(?![\\p{L}\\p{N}+/=])`, 'u');

test.describe('закрыто до чекапа', () => {
  test('в репозитории нет закрытого содержания', () => {
    test.skip(!SECRET.length, 'список закрытых фраз не подключён: tests/private/secrets.json или RT_SECRETS');
    const found = [];
    for (const f of FILES) {
      const lines = readFileSync(join(ROOT, f), 'utf8').replace(/data:[^"')\s]+/g, '').split('\n');
      // в отчёте называем файл, строку и номер фразы по списку: саму фразу в журнал не пишем
      for (const s of SECRET) { const n = lines.findIndex(l => rx(s.w).test(l)); if (n >= 0) found.push(`${f}:${n + 1} — ${s.id}`) }
    }
    expect(found).toEqual([]);
  });

  test('список проверяет все текстовые файлы, а не только страницы', () => {
    for (const f of ['index.html', '2_demo_otchet.html', 'README.md', 'site_v2/club.html', 'site_v2/assets/js/site.js', 'tests/lock.spec.mjs', 'tools/build-pdf.mjs', '.github/workflows/pages.yml'])
      expect(FILES, f).toContain(f);
    expect(FILES.some(f => f.startsWith('tests/private'))).toBe(false);
  });

  test('слайд «Ходы»: три открыты, пять под замком с подписью', async ({ page }) => {
    await page.goto('index.html');
    const s = page.locator('section.s').filter({ hasText: 'Восемь ходов' });
    await expect(s.locator('.c:not(.lock)')).toHaveCount(3);
    const locked = s.locator('.c.lock');
    await expect(locked).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(locked.nth(i).locator('h3')).toHaveCount(0);
      await expect(locked.nth(i).locator('.kk')).toContainText('В чекапе');
      await expect(locked.nth(i).locator('.ph')).toHaveAttribute('aria-hidden', 'true');
    }
  });

  test('клуб: открыт первый уровень, два закрыты, чата со сценарием нет', async ({ page }) => {
    await page.goto('site_v2/club.html#plans');
    await expect(page.locator('.price:not(.lock)')).toHaveCount(1);
    await expect(page.locator('.price.lock')).toHaveCount(2);
    await expect(page.locator('.price.lock .sum')).toHaveCount(0);
    await expect(page.locator('.price.lock .lockcap').first()).toContainText('после чекапа');
    await expect(page.locator('#between .lockpill')).toHaveText('Откроем в чекапе');
    await expect(page.locator('#replies')).toHaveCount(0);
  });
});

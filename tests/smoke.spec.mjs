// Каждая страница: загружается без ошибок, правильные метаданные, все внутренние ссылки и ресурсы живые.
import { test, expect } from '@playwright/test';
import { PAGES, watch, scrollThrough } from './helpers.mjs';

for (const p of PAGES) {
  test.describe(p, () => {
    test('без ошибок консоли и упавших запросов', async ({ page }) => {
      const problems = watch(page);
      const res = await page.goto(p);
      expect(res.status(), 'статус ответа').toBe(p === '404.html' ? 200 : 200);
      await scrollThrough(page);
      expect(problems).toEqual([]);
    });

    test('метаданные: язык, заголовок, описание, превью, noindex', async ({ page, request }) => {
      await page.goto(p);
      await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
      expect((await page.title()).length).toBeGreaterThan(10);
      await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow, noarchive');
      await expect(page.locator('link[rel="icon"]')).toHaveCount(1);
      if (p === '404.html') return;
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
      const og = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(og).toMatch(/^https:\/\/konkovdv\.github\.io\/rightrack\/og\/\w+\.png$/);
      const local = await request.get(og.replace('https://konkovdv.github.io/rightrack/', ''));
      expect(local.status(), 'картинка превью лежит в репозитории').toBe(200);
      expect(local.headers()['content-type']).toBe('image/png');
    });

    test('все внутренние ссылки и ресурсы отвечают 200', async ({ page, request }) => {
      await page.goto(p);
      const urls = await page.evaluate(() => {
        const out = new Set();
        document.querySelectorAll('a[href],link[href],img[src],source[srcset],script[src]').forEach(el => {
          const list = el.hasAttribute('srcset') ? el.getAttribute('srcset').split(',').map(s => s.trim().split(/\s+/)[0]) : [el.getAttribute('href') || el.getAttribute('src') || ''];
          list.filter(Boolean).forEach(u => {
            if (/^(https?:|mailto:|tel:|#|data:|javascript:)/.test(u)) return;
            out.add(new URL(u, location.href).href.split('#')[0]);
          });
        });
        return [...out];
      });
      expect(urls.length).toBeGreaterThan(2);
      for (const u of urls) {
        const r = await request.get(u);
        expect.soft(r.status(), u).toBe(200);
      }
    });
  });
}

test('несуществующий адрес отдаёт фирменную 404 со ссылками на материалы', async ({ page }) => {
  const res = await page.goto('nichego-net/');
  expect(res.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Такой страницы здесь нет');
  for (const name of ['Презентация', 'Отчёт', 'Сайт']) await expect(page.getByRole('link', { name })).toBeVisible();
});

test('внешние ссылки открываются безопасно', async ({ page }) => {
  for (const p of PAGES) {
    await page.goto(p);
    const bad = await page.evaluate(() => [...document.querySelectorAll('a[target="_blank"][href^="http"]')].filter(a => !/noopener/.test(a.rel)).map(a => a.href));
    expect(bad, p).toEqual([]);
    const insecure = await page.evaluate(() => [...document.querySelectorAll('a[href^="http:"],img[src^="http:"],script[src^="http:"]')].map(e => e.outerHTML.slice(0, 80)));
    expect(insecure, p).toEqual([]);
  }
});

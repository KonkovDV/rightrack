// Вёрстка на всех ширинах: нет горизонтальной прокрутки, блоки не вылезают за экран, крупные цели нажатия.
import { test, expect } from '@playwright/test';
import { PAGES } from './helpers.mjs';

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560];

test.describe.configure({ mode: 'parallel' });
for (const w of WIDTHS) {
  test(`ширина ${w}px: без горизонтальной прокрутки`, async ({ browser, browserName }) => {
    test.skip(browserName !== 'chromium', 'сетка ширин проверяется в одном движке');
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 800 : 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(p);
      await page.waitForTimeout(150);
      const r = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const wide = [...document.querySelectorAll('body *')].filter(el => {
          if (el.closest('.marq,.sr-only,[aria-hidden="true"],svg') || ['fixed', 'absolute'].includes(getComputedStyle(el).position)) return false;
          const b = el.getBoundingClientRect(); return b.width > 0 && b.right > vw + 1;
        }).slice(0, 5).map(el => el.tagName.toLowerCase() + '.' + [...el.classList].join('.'));
        return { over: document.documentElement.scrollWidth - vw, wide };
      });
      expect.soft(r.over, `${p} @${w}: прокрутка вбок`).toBeLessThanOrEqual(0);
      expect.soft(r.wide, `${p} @${w}: блоки за краем`).toEqual([]);
    }
    await ctx.close();
  });
}

test('цели нажатия на телефоне не меньше 24×24 (WCAG 2.5.8)', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'проверка для сенсорного экрана');
  for (const p of ['site_v2/index.html', 'site_v2/shift.html', 'site_v2/club.html', 'index.html']) {
    await page.goto(p);
    const small = await page.evaluate(() => [...document.querySelectorAll('button,a.btn,.pillb,.opt,input[type=checkbox],input[type=range]')].filter(el => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      if (el.matches('input') && el.closest('label')) { const l = el.closest('label').getBoundingClientRect(); if (l.height >= 24) return false }
      return r.width > 0 && s.visibility !== 'hidden' && !el.closest('[hidden],.modal:not(.o),.drawer:not(.o)') && (r.width < 24 || r.height < 24);
    }).map(el => el.outerHTML.slice(0, 70)));
    expect.soft(small, p).toEqual([]);
  }
});

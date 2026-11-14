// Отчёт: цифры совпадают с презентацией, пример включается клавишей, печать даёт ровно три страницы.
import { test, expect } from '@playwright/test';

test('итоги отчёта совпадают с моделью презентации', async ({ page }) => {
  await page.goto('2_demo_otchet.html');
  const tot = await page.locator('.tot').innerText();
  for (const s of ['6,45', '9,57–16,06', '3,12–9,61']) expect(tot).toContain(s);
  await expect(page.locator('.k.hl b')).toContainText('3,12–9,61');
  const rows = await page.locator('#money .mr b').allInnerTexts();
  const sumNow = rows.map(r => Number(r.split('→')[0].replace(',', '.'))).reduce((a, b) => a + b, 0);
  const sumCan = rows.map(r => Number(r.split('→')[1].replace(/[^\d,]/g, '').replace(',', '.'))).reduce((a, b) => a + b, 0);
  expect(sumNow.toFixed(2)).toBe('6.45');
  expect(sumCan.toFixed(2)).toBe('16.06');
  expect(await page.locator('#zones .zr').count()).toBe(8);
  expect(await page.locator('#top10 .lr:not(.h)').count()).toBe(10);
});

test('пример включается кнопкой и клавишей E, сочетания с Ctrl игнорируются', async ({ page, isMobile }) => {
  await page.goto('2_demo_otchet.html');
  const btn = page.locator('#exbtn'), ex = page.locator('.ex');
  await expect(ex).toBeVisible();
  await btn.click();
  await expect(ex).toBeHidden(); await expect(btn).toHaveAttribute('aria-pressed', 'false');
  if (isMobile) return;
  await page.keyboard.press('Control+e'); await expect(ex).toBeHidden();
  await page.keyboard.press('e'); await expect(ex).toBeVisible(); await expect(btn).toHaveText('Скрыть пример');
});

test('печать: четыре листа, пример и навигация не попадают в PDF', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'PDF печатает только Chromium');
  await page.setViewportSize({ width: 1000, height: 1414 });
  await page.goto('2_demo_otchet.html');
  await page.waitForTimeout(600);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.docs')).toBeHidden();
  await expect(page.locator('.ex')).toBeHidden();
  const layout = await page.evaluate(() => ({
    clipped: [...document.querySelectorAll('.sheet')].map((s, i) => [i + 1, s.scrollHeight - s.clientHeight]).filter(([, d]) => d > 1),
    twoCols: getComputedStyle(document.querySelector('.two')).gridTemplateColumns.split(' ').length,
    pk: getComputedStyle(document.querySelector('.pkr')).gridTemplateColumns.split(' ').length
  }));
  expect(layout.clipped, 'содержимое не обрезано на листах').toEqual([]);
  expect(layout.twoCols, 'печать в две колонки').toBe(2);
  expect(layout.pk, 'пакеты в три колонки').toBe(3);
  const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  expect(pages).toBe(4);
});

test('лист «Что дальше»: восемь проблем, три пакета, закрытые ходы без названий', async ({ page }) => {
  await page.goto('2_demo_otchet.html');
  const rows = page.locator('.solr tbody tr');
  await expect(rows).toHaveCount(8);
  await expect(page.locator('.solr .lkc')).toHaveCount(5);
  await expect(page.locator('.pkr .card')).toHaveCount(3);
  await expect(page.locator('.pkr .card').first()).toContainText('Система');
  await expect(page.locator('.pkr .card.d')).toContainText('Рекомендуем');
});

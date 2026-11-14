// Доступность: WCAG 2.2 AA без нарушений, клавиатура, фокус, уменьшенная анимация.
import { test, expect } from '@playwright/test';
import { PAGES, axe, scrollThrough, hiddenReveals } from './helpers.mjs';

for (const p of PAGES) {
  test(`WCAG 2.2 AA без нарушений: ${p}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(p);
    await page.waitForTimeout(400);
    expect(await axe(page)).toEqual([]);
  });
}

test('лучшие практики axe: ориентиры и заголовки на страницах сайта', async ({ page }) => {
  for (const p of ['site_v2/index.html', 'site_v2/shift.html', 'index.html', '2_demo_otchet.html']) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(p);
    expect(await axe(page, ['best-practice']), p).toEqual([]);
  }
});

test('при уменьшенной анимации весь контент виден сразу', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const p of ['index.html', 'site_v2/index.html', 'site_v2/club.html']) {
    await page.goto(p);
    expect(await hiddenReveals(page), p).toBe(0);
  }
});

test.describe('окно заявки', () => {
  test('фокус заперт внутри, Esc закрывает и возвращает фокус', async ({ page }) => {
    await page.goto('site_v2/index.html');
    await page.waitForFunction(() => !!window.RT && document.readyState === 'complete');
    const opener = page.getByRole('button', { name: 'Задать вопрос' });
    await opener.scrollIntoViewIfNeeded(); await opener.click();
    const dialog = page.locator('#modal');
    await expect(dialog).toHaveClass(/\bo\b/);
    await expect(page.locator('#fn')).toBeFocused();
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement.closest('#modal')), 'фокус внутри окна').toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveClass(/\bo\b/);
    await expect(opener).toBeFocused();
  });

  test('закрытые окна и меню не попадают в порядок Tab', async ({ page }) => {
    await page.goto('site_v2/index.html');
    const leaked = await page.evaluate(() => [...document.querySelectorAll('#modal *, #exit *, #drawer *, #ncard *, #cookie.h *')]
      .filter(el => el.matches('a[href],button,input') && getComputedStyle(el).visibility !== 'hidden').length);
    expect(leaked).toBe(0);
  });
});

test('мобильное меню: aria-expanded, Esc закрывает, фокус возвращается', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'меню-бургер есть только на узком экране');
  await page.goto('site_v2/shift.html');
  const burger = page.locator('.burger');
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await burger.click();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#drawer')).toHaveClass(/\bo\b/);
  await page.keyboard.press('Escape');
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await expect(burger).toBeFocused();
});

test('пропуск навигации ведёт к содержанию', async ({ page, isMobile }) => {
  test.skip(isMobile, 'проверяем клавиатурой на компьютере');
  await page.goto('site_v2/club.html');
  await page.keyboard.press('Tab');
  const skip = page.locator('a.skip');
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('после прокрутки колесом на любой ширине не остаётся скрытых блоков', async ({ page }) => {
  for (const p of ['index.html', 'site_v2/index.html', 'site_v2/shift.html', 'site_v2/club.html', 'site_v2/tools.html', 'site_v2/trackers.html']) {
    await page.goto(p);
    await scrollThrough(page);
    expect(await hiddenReveals(page), p).toBe(0);
  }
});

// Общие помощники тестов: страницы, слежение за ошибками, прокрутка как у человека, axe.
import { expect } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const AXE_PATH = require.resolve('axe-core/axe.min.js');

export const PAGES = [
  'index.html', '2_demo_otchet.html',
  'site_v2/index.html', 'site_v2/shift.html', 'site_v2/club.html', 'site_v2/tools.html', 'site_v2/trackers.html', 'site_v2/thanks.html',
  '404.html'
];
export const SITE = PAGES.filter(p => p.startsWith('site_v2/'));

/** Собирает ошибки консоли, исключения и упавшие запросы. */
export function watch(page) {
  const problems = [];
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push('console: ' + m.text()) });
  page.on('requestfailed', r => problems.push('requestfailed: ' + r.url() + ' ' + (r.failure()?.errorText || '')));
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) problems.push(r.status() + ' ' + r.url()) });
  return problems;
}

/** Прокрутка на dy: колесом мыши, а где колеса нет (мобильный WebKit) — прокруткой окна. */
export async function wheel(page, dy) {
  try { await page.mouse.wheel(0, dy) }
  catch { await page.evaluate(d => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollBy({ top: d, left: 0, behavior: 'instant' }) }, dy) }
}

/** Прокрутка до конца страницы: так раскрываются блоки, как у живого читателя. */
export async function scrollThrough(page, step = 320) {
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H + 1600; y += step) { await wheel(page, step); await page.waitForTimeout(25) }
  await page.waitForTimeout(900);
}

export async function hiddenReveals(page) {
  return page.evaluate(() => [...document.querySelectorAll('.rv')].filter(el => getComputedStyle(el).display !== 'none' && +getComputedStyle(el).opacity < 0.5).length);
}

export async function axe(page, tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']) {
  await page.addScriptTag({ path: AXE_PATH });
  return page.evaluate(async t => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: t }, resultTypes: ['violations'] });
    return r.violations.map(v => `${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
  }, tags);
}

export const text = (page, sel) => page.locator(sel).first().innerText();
export const num = s => Number(String(s).replace(/\s| | /g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
export { expect };

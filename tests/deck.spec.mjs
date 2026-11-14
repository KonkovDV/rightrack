// Презентация: навигация и колея слайдов, калькулятор (сверка со своей моделью на случайных данных), экономика на цифрах клиента,
// ссылка на расчёт, конструктор решения, таймеры, офлайн.
import { test, expect } from '@playwright/test';
import fc from 'fast-check';
import { fileURLToPath } from 'node:url';
import { watch, scrollThrough, hiddenReveals } from './helpers.mjs';

/* Эталонная модель калькулятора, написанная независимо от кода страницы */
const ROWS = [
  { now: [2, 30, 85000], s: [[2, 30, 85000], [3, 30, 85000]], k: 1.1, keepFill: true },
  { now: [1, 15, 42000], s: [[2, 15, 42000], [3, 18, 42000]], k: 1 },
  { now: [0, 0, 90000], s: [[1, 8, 90000], [1, 14, 90000]], k: 1 },
  { now: [12, 8, 7000], s: [[12, 20, 7000], [12, 40, 7000]], k: 1, fixed: 0 },
  { now: [3, 20, 900], s: [[10, 15, 2000], [10, 25, 3000]], k: 1 }
];
const r10 = n => Math.round(n / 1e4) * 1e4;
const mln = n => (Math.round(n / 1e4) / 100).toFixed(2).replace('.', ',');
function model(inp, sc, margin) {
  const gaps = ROWS.map((row, i) => {
    const c = inp[i].map((v, j) => (row.fixed === j ? row.now[j] : Math.max(0, v)));
    const t = row.s[sc].slice(); if (row.keepFill) t[1] = Math.max(t[1], c[1]);
    const n = r10(c[0] * c[1] * c[2]), s = r10(t[0] * t[1] * t[2] * row.k);
    return Math.max(s, n) - n;
  });
  const gap = gaps.reduce((a, b) => a + b, 0), profit = Math.round(gap * margin / 100);
  return { gaps, gap, profit, pay: profit > 0 ? Math.ceil(60000 / (profit / 365)) : 0 };
}
const days = n => { const k = n % 10, h = n % 100; return n + ' ' + (h > 10 && h < 20 ? 'дней' : k === 1 ? 'день' : k > 1 && k < 5 ? 'дня' : 'дней') };

async function readCalc(page) {
  return page.evaluate(() => ({
    cP: document.querySelector('#cP').textContent, fxR: document.querySelector('#fxR').textContent, pay: document.querySelector('#cPay').textContent,
    rows: [0, 1, 2, 3, 4].map(i => document.querySelector('#cg' + i).textContent.trim())
  }));
}

test.describe('калькулятор', () => {
  test.beforeEach(async ({ page }) => { await page.goto('index.html'); await page.locator('#ct').scrollIntoViewIfNeeded() });

  test('исходные цифры: базовый и консервативный сценарий', async ({ page }) => {
    let c = await readCalc(page);
    expect([c.cP, c.fxR, c.pay]).toEqual(['6,73', '9,61 млн ₽', '4 дня']);
    await page.click('#sc2 button[data-v="0"]');
    c = await readCalc(page);
    expect([c.cP, c.fxR, c.pay]).toEqual(['2,18', '3,12 млн ₽', '11 дней']);
    await expect(page.locator('#sc2 button[data-v="0"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('сумма строк равна итогу, цифры сходятся с эталонной моделью на случайных данных', async ({ page }) => {
    const inputs = page.locator('#ct input');
    await expect(inputs).toHaveCount(14);
    const arb = fc.record({
      sc: fc.constantFrom(0, 1),
      margin: fc.integer({ min: 6, max: 20 }).map(x => x * 5),
      v: fc.array(fc.tuple(fc.integer({ min: 0, max: 40 }), fc.integer({ min: 0, max: 80 }), fc.integer({ min: 0, max: 300000 })), { minLength: 5, maxLength: 5 })
    });
    await fc.assert(fc.asyncProperty(arb, async ({ sc, margin, v }) => {
      await page.click(`#sc2 button[data-v="${sc}"]`);
      await page.locator('#mg').fill(String(margin));
      for (let k = 0; k < 14; k++) {
        const el = inputs.nth(k), i = +(await el.getAttribute('data-i')), j = +(await el.getAttribute('data-j'));
        await el.fill(String(v[i][j]));
      }
      const exp = model(v, sc, margin), got = await readCalc(page);
      expect(got.cP).toBe(mln(exp.profit));
      expect(got.fxR).toBe(mln(exp.gap) + ' млн ₽');
      expect(got.rows).toEqual(exp.gaps.map(g => (g ? mln(g) + ' млн ₽' : 'нет')));
      expect(got.pay).toBe(exp.pay ? days(exp.pay) : '—');
      for (const g of exp.gaps) expect(g).toBeGreaterThanOrEqual(0);
    }), { numRuns: 40, seed: 20261113 });
  });

  test('третий поток «Сдвига» считается при текущей наполняемости зала', async ({ page }) => {
    await page.fill('input[data-i="0"][data-j="1"]', '40');
    await expect(page.locator('#tg01')).toHaveText('в сценарии 40');
    expect((await readCalc(page)).rows[0]).toBe(mln(r10(3 * 40 * 85000 * 1.1) - r10(2 * 40 * 85000)) + ' млн ₽');
  });

  test('отрицательные и пустые значения считаются нулём, NaN не появляется', async ({ page }) => {
    await page.fill('input[data-i="1"][data-j="1"]', '-50');
    await page.fill('input[data-i="4"][data-j="2"]', '');
    const body = await page.locator('.calc').innerText();
    expect(body).not.toMatch(/NaN|undefined|Infinity/);
  });

  test('кнопка возвращает исходные цифры', async ({ page }) => {
    await page.fill('input[data-i="0"][data-j="0"]', '9');
    await page.locator('#mg').fill('40');
    await page.click('#creset');
    expect((await readCalc(page)).cP).toBe('6,73');
    await expect(page.locator('#mgv')).toHaveText('70%');
  });
});

test.describe('навигация', () => {
  test('стрелки, Home, End и счётчик слайдов', async ({ page, isMobile }) => {
    test.skip(isMobile, 'клавиатура проверяется на компьютере');
    await page.goto('index.html');
    const n = await page.locator('section.s').count();
    expect(n).toBe(17);
    await expect(page.locator('#cnt')).toHaveText(`1 / ${n}`);
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    await expect(page.locator('#cnt')).toHaveText(`5 / ${n}`);
    await page.keyboard.press('End'); await expect(page.locator('#cnt')).toHaveText(`${n} / ${n}`);
    await page.keyboard.press('Home'); await expect(page.locator('#cnt')).toHaveText(`1 / ${n}`);
  });

  test('F включает весь экран, а Ctrl+F и Cmd+F остаются поиском браузера', async ({ page, isMobile }) => {
    test.skip(isMobile, 'клавиатура проверяется на компьютере');
    await page.goto('index.html');
    await page.evaluate(() => { window.__fs = 0; document.documentElement.requestFullscreen = () => { window.__fs++; return Promise.resolve() } });
    await page.keyboard.press('Control+f'); await page.keyboard.press('Meta+f'); await page.keyboard.press('Alt+f');
    expect(await page.evaluate(() => window.__fs)).toBe(0);
    await page.keyboard.press('f');
    expect(await page.evaluate(() => window.__fs)).toBe(1);
  });

  test('все слайды раскрываются при прокрутке, в том числе высокие на телефоне', async ({ page }) => {
    await page.goto('index.html');
    await scrollThrough(page);
    expect(await hiddenReveals(page)).toBe(0);
  });
});

test.describe('таймеры', () => {
  test('окно решения: отсчёт до 1 декабря, после даты блок исчезает и не перезапускается', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-20T12:00:00+03:00') });
    await page.goto('index.html');
    const dl = page.locator('#dl');
    await expect(dl).toBeVisible();
    await expect(page.locator('#dlT')).toHaveText(/^10 дней (12 ч 00|11 ч 59) мин$/);
    await page.clock.setSystemTime(new Date('2026-12-01T00:00:05+03:00'));
    await page.clock.runFor(31_000);
    await expect(dl).toBeHidden();
    await page.reload();
    await expect(page.locator('#dl')).toBeHidden();
  });

  test('счётчик потерь идёт в реальном времени', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-13T10:00:00+03:00') });
    await page.goto('index.html');
    const read = async () => Number((await page.locator('#cY2').textContent()).replace(/[^\d,]/g, '').replace(',', '.'));
    const a = await read();
    await page.clock.runFor(60_000);
    const b = await read();
    expect(b).toBeGreaterThan(a);
    expect(b - a).toBeCloseTo(6727000 * 60 / (365 * 86400), 0);
  });
});

test('презентация и отчёт открываются из файла без сети', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'достаточно одного движка');
  for (const f of ['index.html', '2_demo_otchet.html']) {
    const problems = watch(page);
    await page.goto('file://' + fileURLToPath(new URL('../' + f, import.meta.url)));
    expect(problems.filter(p => !/\.(png|pdf)\b/.test(p)), f).toEqual([]);
    expect(await page.evaluate(() => document.fonts.check('700 20px Manrope'))).toBe(true);
  }
});

test.describe('предложение', () => {
  test('решения: восемь проблем, у каждой три варианта с ценой, пять ходов закрыты', async ({ page }) => {
    await page.goto('index.html');
    const t = page.locator('table.sol');
    await expect(t.locator('tbody tr')).toHaveCount(8);
    for (const row of await t.locator('tbody tr').all()) {
      await expect(row.locator('td')).toHaveCount(3);
      for (const td of await row.locator('td i').all()) await expect(td).toContainText('₽');
    }
    await expect(t.locator('.lkc')).toHaveCount(5);
  });

  test('пакеты идут от дорогого к лёгкому, рекомендуемый в центре, модулями дороже', async ({ page }) => {
    await page.goto('index.html');
    const cards = page.locator('.pks .pk');
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText('Система');
    await expect(cards.nth(1)).toContainText('Рекомендуем');
    await expect(cards.nth(2)).toContainText('Старт');
    const parse = s => { const m = s.match(/([\d,]+)–([\d,]+)\s*(млн|тыс)/); const k = m[3] === 'млн' ? 1000 : 1; return [parseFloat(m[1].replace(',', '.')) * k, parseFloat(m[2].replace(',', '.')) * k] };
    let prev = Infinity;
    for (let i = 0; i < 3; i++) {
      const [lo, hi] = parse(await cards.nth(i).locator('.pkp').innerText());
      const [slo, shi] = parse(await cards.nth(i).locator('.pkp small').innerText());
      expect(lo).toBeLessThan(slo); expect(hi).toBeLessThan(shi);
      expect(hi).toBeLessThan(prev); prev = hi;
    }
  });

  test('после решений и пакетов идёт чекап: сначала масштаб, потом первый шаг', async ({ page }) => {
    await page.goto('index.html');
    const order = await page.evaluate(() => [...document.querySelectorAll('section.s')].map(s => s.querySelector('.eb')?.textContent.trim()));
    const i = k => order.findIndex(x => x && x.startsWith(k));
    expect(i('Шаг 2 подробно')).toBeLessThan(i('Пакеты'));
    expect(i('Пакеты')).toBeLessThan(i('Шаг 1 подробно'));
    expect(i('Шаг 1 подробно')).toBeLessThan(i('Экономика решения'));
  });
});

test.describe('колея слайдов и ссылки', () => {
  test('станция на каждый слайд: подпись из надзаголовка, нажатие открывает слайд', async ({ page, isMobile }) => {
    test.skip(isMobile, 'колея видна на компьютере');
    await page.goto('index.html');
    const st = page.locator('#rail button');
    await expect(st).toHaveCount(17);
    await expect(st.nth(0)).toHaveAttribute('aria-current', 'step');
    await expect(st.nth(13)).toHaveAttribute('aria-label', 'Слайд 14: Пакеты');
    await st.nth(13).click();
    await expect(page.locator('#cnt')).toHaveText('14 / 17');
    await expect(st.nth(13)).toHaveAttribute('aria-current', 'step');
    await expect(st.nth(0)).not.toHaveAttribute('aria-current', 'step');
    await expect(page).toHaveURL(/#14$/);
  });

  test('адрес с номером открывает нужный слайд, первый слайд адрес не трогает', async ({ page }) => {
    await page.goto('index.html');
    expect(new URL(page.url()).hash).toBe('');
    await page.goto('index.html#16');
    await expect(page.locator('#cnt')).toHaveText('16 / 17');
    await page.goto('index.html#7');
    await expect(page.locator('#cnt')).toHaveText('7 / 17');
    await page.goto('index.html#99');
    await expect(page.locator('#cnt')).toHaveText('7 / 17');
    await page.goto('about:blank');
    await page.goto('index.html#99');
    await expect(page.locator('#cnt')).toHaveText('1 / 17');
  });

  test('на телефоне колея скрыта и не мешает нажатиям', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'проверка для узкого экрана');
    await page.goto('index.html');
    await expect(page.locator('#rail')).toBeHidden();
  });
});

test('на телефоне таблица чекапа читается: слова не рвутся, цены в одну строку', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'проверка для узкого экрана');
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('index.html');
    await page.locator('.mx').scrollIntoViewIfNeeded();
    const r = await page.locator('.mx').evaluate(t => {
      const lines = el => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
      const box = t.getBoundingClientRect();
      return {
        heads: [...t.querySelectorAll('thead th b')].map(lines),
        sum: [...t.querySelectorAll('tr.sum td')].map(td => { const g = document.createRange(); g.selectNodeContents(td); const q = g.getBoundingClientRect(); return [g.getClientRects().length, q.right <= box.right + .5] }),
        wide: t.scrollWidth - t.clientWidth
      };
    });
    expect(r.heads, `ширина ${width}: «Чекап» в одну строку, «Полный чекап» не больше двух`).toEqual([1, expect.any(Number)]);
    expect(r.heads[1]).toBeLessThanOrEqual(2);
    for (const [rects, inside] of r.sum) { expect(rects, `ширина ${width}: цена в одну строку`).toBe(1); expect(inside, `ширина ${width}: цена не выходит за таблицу`).toBe(true) }
    expect(r.wide).toBeLessThanOrEqual(1);
  }
});

test.describe('экономика на цифрах клиента', () => {
  test('исходные цифры дают те же числа, что стояли в тексте слайда', async ({ page }) => {
    await page.goto('index.html');
    const t = async id => (await page.locator(id).textContent()).replace(/\s/g, ' ');
    expect(await t('#eM')).toBe('180–560');
    expect(await t('#eY')).toBe('2,18–6,73');
    expect(await t('#eD')).toBe('4–11 дней');
    expect(await t('#eDay')).toBe('6 000–18 400');
    expect(await t('#e4')).toBe('0,7–2,2');
    await expect(page.locator('#sy1')).toHaveAttribute('style', /width:\s*32\.47%/);
    await expect(page.locator('body')).not.toHaveClass(/mine/);
    await expect(page.locator('.mine-chip')).toBeHidden();
  });

  test('цифры клиента в калькуляторе пересчитывают окупаемость, шкалу и ставят метку', async ({ page }) => {
    await page.goto('index.html');
    await page.locator('#ct').scrollIntoViewIfNeeded();
    await page.fill('input[data-i="0"][data-j="1"]', '40');
    await page.locator('#mg').fill('50');
    const m = (sc) => model([[2, 40, 85000], [1, 15, 42000], [0, 0, 90000], [12, 8, 7000], [3, 20, 900]], sc, 50);
    const lo = m(0).profit, hi = m(1).profit;
    await expect(page.locator('body')).toHaveClass(/mine/);
    await expect(page.locator('#eY')).toHaveText(mln(lo) + '–' + mln(hi));
    await expect(page.locator('#eD')).toHaveText(`${m(1).pay}–${days(m(0).pay)}`);
    await expect(page.locator('#eMg')).toHaveText('50');
    const w = await page.locator('#sy1').evaluate(el => parseFloat(el.style.width));
    expect(w).toBeCloseTo(lo / hi * 100, 1);
    await page.click('#creset');
    await expect(page.locator('body')).not.toHaveClass(/mine/);
    await expect(page.locator('#eD')).toHaveText('4–11 дней');
  });

  test('заголовок обещает срок, который выдерживают цифры клиента', async ({ page }) => {
    await page.goto('index.html');
    const head = async () => (await page.locator('.eco').locator('xpath=preceding-sibling::h2').innerText()).replace(/\s+/g, ' ').trim();
    expect(await head()).toBe('Чекап стоит меньше, чем две недели ожидания');
    await page.locator('#ct').scrollIntoViewIfNeeded();
    // школа уже ближе к сценарию: осторожный разрыв окупает чекап дольше двух недель
    await page.fill('input[data-i="1"][data-j="0"]', '2');
    await page.fill('input[data-i="3"][data-j="1"]', '18');
    await page.fill('input[data-i="4"][data-j="0"]', '10');
    await page.fill('input[data-i="4"][data-j="2"]', '2000');
    const inp = [[2, 30, 85000], [2, 15, 42000], [0, 0, 90000], [12, 18, 7000], [10, 20, 2000]];
    const pay = model(inp, 0, 70).pay;
    expect(pay).toBeGreaterThan(14); expect(pay).toBeLessThanOrEqual(31);
    await expect(page.locator('#eD')).toHaveText(`${model(inp, 1, 70).pay}–${days(pay)}`);
    expect(await head()).toBe('Чекап стоит меньше, чем месяц ожидания');
    // сценарий выполнен целиком: остаётся сравнение с местом на «Сдвиге»
    for (const [i, v] of [[0, [9, 90, 300000]], [1, [9, 90, 300000]], [2, [9, 90, 300000]], [3, [null, 90, 300000]], [4, [40, 90, 300000]]])
      for (let j = 0; j < 3; j++) if (v[j] != null) await page.fill(`input[data-i="${i}"][data-j="${j}"]`, String(v[j]));
    expect(await head()).toBe('Чекап стоит меньше, чем одно место на «Сдвиге»');
    await page.click('#creset');
    expect(await head()).toBe('Чекап стоит меньше, чем две недели ожидания');
  });

  test('разрыв в местах «Сдвига» называется целым числом', async ({ page }) => {
    await page.goto('index.html');
    await page.locator('#ct').scrollIntoViewIfNeeded();
    await expect(page.locator('#cSeats')).toHaveText('около 96 мест');
    await page.click('#sc2 button[data-v="0"]');
    await expect(page.locator('#cSeats')).toHaveText('около 31 места');
    for (const [i, v] of [[0, [9, 90, 300000]], [1, [9, 90, 300000]], [2, [9, 90, 300000]], [3, [null, 90, 300000]], [4, [40, 90, 300000]]])
      for (let j = 0; j < 3; j++) if (v[j] != null) await page.fill(`input[data-i="${i}"][data-j="${j}"]`, String(v[j]));
    await expect(page.locator('#cSeats')).toHaveText('0 мест');
    expect(await page.locator('.cres').innerText()).not.toMatch(/NaN|undefined|Infinity|\d,\d места/);
  });

  test('если сценарий уже выполнен, слайд не показывает NaN и бесконечность', async ({ page }) => {
    await page.goto('index.html');
    await page.locator('#ct').scrollIntoViewIfNeeded();
    for (const [i, v] of [[0, [9, 90, 300000]], [1, [9, 90, 300000]], [2, [9, 90, 300000]], [3, [null, 90, 300000]], [4, [40, 90, 300000]]])
      for (let j = 0; j < 3; j++) if (v[j] != null) await page.fill(`input[data-i="${i}"][data-j="${j}"]`, String(v[j]));
    await expect(page.locator('#cP')).toHaveText('0,00');
    await expect(page.locator('#eD')).toHaveText('—');
    const eco = await page.locator('.eco').innerText() + await page.locator('.scale').innerText();
    expect(eco).not.toMatch(/NaN|undefined|Infinity/);
  });
});

test.describe('ссылка на расчёт', () => {
  test('цифры из адреса встают в поля, маржа и сценарий тоже', async ({ page }) => {
    await page.goto('index.html?c=2.40.90000_1.15.42000_0.0.90000_12.25.7000_3.20.900&m=50&k=0#5');
    await expect(page.locator('#cnt')).toHaveText('5 / 17');
    await expect(page.locator('input[data-i="0"][data-j="1"]')).toHaveValue('40');
    await expect(page.locator('input[data-i="3"][data-j="1"]')).toHaveValue('25');
    await expect(page.locator('#mgv')).toHaveText('50%');
    await expect(page.locator('#sc2 button[data-v="0"]')).toHaveAttribute('aria-pressed', 'true');
    const exp = model([[2, 40, 90000], [1, 15, 42000], [0, 0, 90000], [12, 25, 7000], [3, 20, 900]], 0, 50);
    await expect(page.locator('#cP')).toHaveText(mln(exp.profit));
    await expect(page.locator('body')).toHaveClass(/mine/);
  });

  for (const bad of ['?c=<script>alert(1)</script>', '?c=1.2.3', '?c=a.b.c_d.e.f_g.h.i_j.k.l_m.n.o&m=9999&k=7', '?c=-5.1e9.NaN_1.1.1_1.1.1_1.1.1_1.1.1']) {
    test(`испорченный адрес «${bad.slice(0, 26)}» не ломает расчёт`, async ({ page }) => {
      let dialog = false; page.on('dialog', d => { dialog = true; d.dismiss() });
      await page.goto('index.html' + bad);
      await page.locator('#ct').scrollIntoViewIfNeeded();
      expect(await page.locator('.calc').innerText()).not.toMatch(/NaN|undefined|Infinity/);
      const vals = await page.locator('#ct input').evaluateAll(els => els.map(e => +e.value));
      for (const v of vals) { expect(Number.isFinite(v)).toBe(true); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1e7) }
      expect(dialog).toBe(false);
    });
  }

  test('кнопка собирает ссылку с текущими цифрами', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'буфер обмена читаем в одном движке');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('index.html');
    await page.locator('#ct').scrollIntoViewIfNeeded();
    await page.fill('input[data-i="0"][data-j="1"]', '36');
    await page.click('#cshare');
    await expect(page.locator('#toast')).toHaveText('Ссылка на расчёт скопирована');
    const url = new URL(await page.evaluate(() => navigator.clipboard.readText()));
    expect(url.searchParams.get('c')).toBe('2.36.85000_1.15.42000_0.0.90000_12.8.7000_3.20.900');
    expect(url.searchParams.get('m')).toBe('70');
    expect(url.hash).toBe('#5');
  });
});

test.describe('решение: формат и дата старта', () => {
  test('ближайшие понедельники и срок готовности по рабочим дням', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-13T12:00:00+03:00') });
    await page.goto('index.html');
    const d = page.locator('#decD button');
    await expect(d).toHaveText(['пн, 16 ноября', 'пн, 23 ноября', 'пн, 30 ноября']);
    await expect(page.locator('#decR')).toContainText('Чекап готов: пт, 20 ноября');
    await page.locator('#decF button[data-i="1"]').click();
    await expect(page.locator('#decR')).toContainText('Полный чекап готов: пт, 27 ноября');
    await d.nth(2).click();
    await expect(d.nth(2)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#decR')).toContainText('Полный чекап готов: пт, 11 декабря');
  });

  test('в день встречи, в понедельник, старт сегодня остаётся первым вариантом', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-16T11:00:00+03:00') });
    await page.goto('index.html');
    await expect(page.locator('#decD button')).toHaveText(['пн, 16 ноября', 'пн, 23 ноября', 'пн, 30 ноября']);
    await expect(page.locator('#decR')).toContainText('Чекап готов: пт, 20 ноября');
  });

  test('пока открыто окно до 1 декабря, старты после него не предлагаются', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-24T10:00:00+03:00') });
    await page.goto('index.html');
    await expect(page.locator('#dl')).toBeVisible();
    await expect(page.locator('#decD button')).toHaveText(['пн, 30 ноября']);
    await expect(page.locator('#decR')).toContainText('Чекап готов: пт, 4 декабря');
    // в последний день окна понедельник 30 ноября ещё на месте, таймер идёт без «0 дней»
    await page.clock.setSystemTime(new Date('2026-11-30T23:00:00+03:00'));
    await page.reload();
    await expect(page.locator('#decD button')).toHaveText(['пн, 30 ноября']);
    await expect(page.locator('#dlT')).toHaveText(/^0 ч 5\d мин$/);
    // окно закрылось: снова три ближайших понедельника
    await page.clock.setSystemTime(new Date('2026-12-01T09:00:00+03:00'));
    await page.reload();
    await expect(page.locator('#dl')).toBeHidden();
    await expect(page.locator('#decD button')).toHaveText(['пн, 7 декабря', 'пн, 14 декабря', 'пн, 21 декабря']);
  });

  test('праздничные дни в срок не входят', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-12-24T12:00:00+03:00') });
    await page.goto('index.html');
    await expect(page.locator('#decD button').first()).toHaveText('пн, 28 декабря');
    await expect(page.locator('#decR')).toContainText('Чекап готов: вт, 12 января');
  });

  test('итог для отправки: гарантия только у чекапа за 60 000 ₽', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-13T12:00:00+03:00') });
    await page.goto('index.html');
    const txt = async () => (await page.locator('#dec').getAttribute('data-txt')).replace(/[\u00a0\u202f]/g, ' ');
    expect(await txt()).toContain('Старт: пн, 16 ноября');
    expect(await txt()).toContain('вернём 60 000 ₽');
    await page.locator('#decF button[data-i="1"]').click();
    expect(await txt()).toContain('Стоимость: 140 000 ₽, 10 рабочих дней');
    expect(await txt()).not.toContain('вернём');
    await page.locator('#decC').click();
    await expect(page.locator('#toast')).toContainText('Итог скопирован');
  });
});

test.describe('графика', () => {
  test('у слайдов своя гравюра серии, титул открывается победой школы', async ({ page }) => {
    await page.goto('index.html');
    const arts = await page.locator('img.hart').evaluateAll(els => els.map(e => e.getAttribute('src')));
    expect(arts).toEqual(['art/river.webp', 'art/moves.webp', 'art/rings.webp', 'art/steps.webp', 'art/routes.webp', 'art/columns.webp', 'art/checkup.webp', 'art/spring.webp']);
    await expect(page.locator('.hero .hm .win')).toContainText('100%');
    await expect(page.locator('.hero .hm')).not.toContainText('недополучено');
    // первый экран говорит о росте его словами; цена разрыва появляется позже, в расчёте
    await expect(page.locator('.hero h1')).toContainText('Кратный рост');
    await expect(page.locator('.hero')).not.toContainText('недополуч');
    await expect(page.locator('.hero .hm')).toContainText('×1,5–2,5');
  });

  test('радар зон и мост рычагов строятся из данных модели', async ({ page }) => {
    await page.goto('index.html');
    await expect(page.locator('#rad .rd')).toHaveCount(8);
    await expect(page.locator('#rad .rd.crit')).toHaveCount(4);
    await expect(page.locator('#zones .zq')).toHaveCount(8);
    const crit = await page.locator('#zones .zq em').allInnerTexts();
    expect(crit.map(s => parseInt(s, 10)).reduce((a, b) => a + b, 0)).toBe(9);
    const labels = await page.locator('#wfsvg .wv').allTextContents();
    expect(labels).toEqual(['6,45', '+0,51…3,32', '+1,01…2,69', '+1,35…2,90', '+0,25…0,70', '9,57–16,06']);
    await expect(page.locator('#orbit .od')).toHaveCount(12);
    await expect(page.locator('#orbit .od.n')).toHaveCount(3);
  });

  test('окно сайта: постер лежит всегда, живая страница подгружается на слайде', async ({ page, isMobile }) => {
    test.skip(isMobile, 'на телефоне рамка скрыта');
    await page.goto('index.html');
    await expect(page.locator('#sitefr iframe')).toHaveCount(0);
    await expect(page.locator('#sitefr img.brp')).toHaveAttribute('src', 'art/site.webp');
    await page.goto('index.html#11');
    const fr = page.frameLocator('#sitefr iframe');
    await expect(fr.locator('.concept')).toHaveText('Концепт v.2');
    await expect(fr.locator('html')).toHaveClass(/embed/);
    await expect(fr.locator('#mm')).toBeHidden();
    await expect(page.locator('#sitefr iframe')).toHaveAttribute('inert', '');
  });

  test('кратность роста: 2,5 в базовом сценарии и 1,5 в консервативном', async ({ page }) => {
    await page.goto('index.html');
    await expect(page.locator('#tX')).toHaveText('2,5');
    await expect(page.locator('#bars .br em').nth(3)).toHaveText('×5,0');
    await expect(page.locator('#bars .br em').nth(2)).toHaveText('новый');
    await page.click('#sc button[data-v="0"]');
    await expect(page.locator('#tX')).toHaveText('1,5');
    await expect(page.locator('#tCan')).toHaveText('9,57');
  });
});

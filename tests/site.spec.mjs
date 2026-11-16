import { wheel } from './helpers.mjs';
// Сайт v.2: диагностика, заявка и согласие, фаззинг полей, бронь и цены, таймеры к настоящим датам, клуб, календарь.
import { test, expect } from '@playwright/test';

test.describe('диагностика «Узкое место»', () => {
  test('десять ответов дают профиль и узкое место', async ({ page }) => {
    await page.goto('site_v2/index.html');
    const quiz = page.locator('#quiz');
    await quiz.scrollIntoViewIfNeeded();
    for (let i = 0; i < 10; i++) {
      await expect(quiz.locator('.qtop span').first()).toHaveText(`Вопрос ${i + 1} из 10`);
      await quiz.locator('.opt').nth(i === 4 || i === 5 ? 0 : 3).click();
    }
    await expect(quiz.locator('.res h3')).toHaveText('Продажи');
    await expect(quiz.locator('.qtop span').nth(1)).toHaveText(/\d+ из 100/);
    const crm = quiz.locator('[data-crm]');
    await crm.click(); await expect(crm).toHaveAttribute('aria-expanded', 'true');
    await expect(quiz.locator('.crm')).toBeVisible();
    await quiz.locator('[data-again]').click();
    await expect(quiz.locator('.qtop span').first()).toHaveText('Вопрос 1 из 10');
  });

  test('«Назад» возвращает к прошлому вопросу', async ({ page }) => {
    await page.goto('site_v2/index.html');
    const quiz = page.locator('#quiz');
    await quiz.scrollIntoViewIfNeeded();
    await quiz.locator('.opt').first().click();
    await quiz.locator('[data-back]').click();
    await expect(quiz.locator('.qtop span').first()).toHaveText('Вопрос 1 из 10');
  });
});

test.describe('заявка', () => {
  test.beforeEach(async ({ page }) => { await page.goto('site_v2/index.html'); await page.getByRole('button', { name: 'Задать вопрос' }).click() });

  test('без имени, контакта и согласия заявка не уходит', async ({ page }) => {
    await page.click('#msend');
    await expect(page.locator('#fn')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#fc')).toHaveAttribute('aria-invalid', 'true');
    await page.fill('#fn', 'Анна'); await page.fill('#fc', '@anna');
    await page.click('#msend');
    await expect(page.locator('#fpd')).toHaveClass(/err/);
    await expect(page.locator('#mok')).toBeHidden();
  });

  test('согласие на обработку данных отдельное, рассылка не отмечена по умолчанию', async ({ page }) => {
    await expect(page.locator('#fpdc')).not.toBeChecked();
    await expect(page.locator('#fnews')).not.toBeChecked();
    await expect(page.locator('#fpd a')).toHaveAttribute('href', 'https://rightrack.ru/privacy');
    await expect(page.locator('#mform .real a').first()).toHaveAttribute('href', 'https://t.me/Kireeva_13');
  });

  const NASTY = ['<img src=x onerror=window.__x=1>', '"><svg onload=window.__x=1>', "'; window.__x=1; //", '{{constructor.constructor("window.__x=1")()}}', 'Ёжик 🦔 ‮RTL', 'A'.repeat(200)];
  for (const s of NASTY) {
    test(`фаззинг: «${s.slice(0, 24)}» выводится как текст`, async ({ page }) => {
      let dialog = false; page.on('dialog', d => { dialog = true; d.dismiss() });
      await page.fill('#fn', s); await page.fill('#fc', s); await page.check('#fpdc');
      await page.click('#msend');
      await expect(page.locator('#mok')).toBeVisible();
      expect(await page.locator('#okname').evaluate(el => el.children.length)).toBe(0);
      expect(await page.evaluate(() => window.__x)).toBeUndefined();
      expect(dialog).toBe(false);
      expect((await page.locator('#okname').textContent()).length).toBeLessThanOrEqual(60);
    });
  }
});

test.describe('«Сдвиг»: бронь по правилам школы', () => {
  const cases = [[1, false, '100 000 ₽', '15 000 ₽', '85 000 ₽'], [1, true, '80 000 ₽', '15 000 ₽', '65 000 ₽'], [2, false, '200 000 ₽', '30 000 ₽', '170 000 ₽'], [2, true, '180 000 ₽', '30 000 ₽', '150 000 ₽']];
  for (const [n, rel, total, fee, rest] of cases) {
    test(`${n} ${n === 1 ? 'место' : 'места'}${rel ? ', со скидкой 20%' : ''}: ${total}`, async ({ page }) => {
      await page.goto('site_v2/shift.html#book');
      if (n === 2) await page.click('#bn button[data-v="2"]');
      if (rel) await page.check('#brel');
      const norm = s => s.replace(/\s/g, ' ');
      expect(norm(await page.locator('#bsum').textContent())).toBe(total);
      expect(norm(await page.locator('#bdep').textContent())).toBe(fee);
      expect(norm(await page.locator('#brest').textContent())).toBe(rest);
      expect(await page.locator('.seat.mine').count()).toBe(n);
    });
  }

  test('место выбирается с клавиатуры, фокус остаётся на месте', async ({ page, isMobile }) => {
    test.skip(isMobile, 'клавиатура проверяется на компьютере');
    await page.goto('site_v2/shift.html#book');
    const seat = page.locator('.seat[data-i="5"]');
    await seat.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('.seat[data-i="5"]')).toHaveClass(/mine/);
    await expect(page.locator('.seat[data-i="5"]')).toBeFocused();
    await expect(page.locator('.seat[data-i="5"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('карта династии называет короткое звено после движения шкалы и сохраняется картинкой', async ({ page }) => {
    await page.goto('site_v2/shift.html#map');
    await page.locator('#rings').scrollIntoViewIfNeeded();
    await page.locator('#cp4').fill('10'); await page.locator('#cp3').fill('1');
    await expect(page.locator('#verdict')).toContainText('человеческий капитал');
    await expect(page.locator('#verdict')).toContainText('только на ваше поколение');
    await page.fill('#fam', 'Ивановых');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#savemap')]);
    expect(dl.suggestedFilename()).toBe('karta-dinastii.png');
  });

  test('окно цены предзаписи видно до даты из настроек и исчезает после', async ({ page }) => {
    await page.clock.install({ time: new Date('2027-01-30T23:59:50+03:00') });
    await page.goto('site_v2/shift.html#book');
    await expect(page.locator('#preWin')).toBeVisible();
    await expect(page.locator('#cdShift')).toHaveText(/^\d{2}:\d{2}:\d{2}$|^1 день/);
    await page.clock.setSystemTime(new Date('2027-02-01T00:00:01+03:00'));
    await page.clock.runFor(2_000);
    await expect(page.locator('#preWin')).toBeHidden();
  });

  test('придуманных условий на странице нет', async ({ page }) => {
    await page.goto('site_v2/shift.html');
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/до 25 человек|депозит возвращается|Депозит предзаписи/);
    await page.goto('site_v2/trackers.html');
    expect(await page.locator('body').innerText()).not.toContain('Удостоверение');
  });
});

test.describe('портреты основателя', () => {
  const loaded = img => img.evaluate(el => el.complete && el.naturalWidth > 0);

  test('первый экран: вырезанный портрет загружен и не закрыт плашками', async ({ page }) => {
    await page.goto('site_v2/index.html');
    const fig = page.locator('#portrait .fig');
    await expect(fig).toHaveAttribute('alt', /Александр Бакеев/);
    await expect.poll(() => loaded(fig)).toBe(true);
    // лицо занимает середину карточки: плашки стоят по углам и не заходят на него
    const box = await page.locator('#portrait .ph').boundingBox();
    const face = { x: box.x + box.width * .36, y: box.y + box.height * .2, r: box.x + box.width * .7, b: box.y + box.height * .62 };
    for (const chip of await page.locator('#portrait .chip').all()) {
      const c = await chip.boundingBox();
      const overlap = c.x < face.r && c.x + c.width > face.x && c.y < face.b && c.y + c.height > face.y;
      expect(overlap, 'плашка на лице').toBe(false);
    }
    await expect(page.locator('#portrait .pcap')).toContainText('добродетельными');
  });

  test('цифровой двойник: профиль из точек, под ним живой снимок', async ({ page }) => {
    await page.goto('site_v2/index.html');
    const face = page.locator('#tface');
    await face.scrollIntoViewIfNeeded();
    await expect(face).toHaveClass(/\bon\b/);
    expect(await page.evaluate(() => RT.twin.points)).toBe(6321);
    // точки действительно нарисованы: на холсте есть непрозрачные пиксели
    await expect.poll(() => page.evaluate(() => { const c = document.getElementById('tcv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n }), { timeout: 8000 }).toBeGreaterThan(1500);
    const btn = page.locator('#tbtn');
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await expect(btn).toContainText('цифровая копия');
    await btn.focus(); await page.keyboard.press('Enter');
    await expect(face).toHaveClass(/\blive\b/);
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(btn).toContainText('живой снимок');
    await expect.poll(() => loaded(page.locator('#tface .tph'))).toBe(true);
    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  test('«Сдвиг»: блок об авторе методики со снимком и цитатой из канала', async ({ page }) => {
    await page.goto('site_v2/shift.html#author');
    const img = page.locator('#author .apic img');
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => loaded(img)).toBe(true);
    await expect(page.locator('#author h2')).toContainText('ради');
    await expect(page.locator('#author .aq figcaption')).toHaveText('Канал Александра, 13 октября 2026');
    await expect(page.locator('#author a[href="index.html#twin"]')).toBeVisible();
  });

  test('клуб: первый экран — кадр онлайн-встречи с подписью', async ({ page }) => {
    await page.goto('site_v2/club.html');
    const img = page.locator('.phero .pic.call img');
    await expect(img).toHaveAttribute('alt', /онлайн-встрече/);
    await expect.poll(() => loaded(img)).toBe(true);
    await expect(page.locator('.clive')).toContainText('19:00 МСК');
    await expect(page.locator('.cname b')).toHaveText('Александр Бакеев');
  });

  test('линия прочтения в шапке растёт с прокруткой', async ({ page }) => {
    await page.goto('site_v2/index.html');
    const sx = () => page.evaluate(() => new DOMMatrixReadOnly(getComputedStyle(document.getElementById('prog')).transform).a);
    expect(await sx()).toBeLessThan(.02);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect.poll(sx).toBeGreaterThan(.97);
  });
});

test.describe('«Сдвиг»: метаанализ «Династия за сто лет»', () => {
  test('цифры взяты из статьи, правила «70/90» на странице нет', async ({ page }) => {
    await page.goto('site_v2/shift.html');
    const cards = page.locator('.ev .card');
    await expect(cards).toHaveCount(4);
    expect((await cards.locator('.big').allInnerTexts()).map(t => t.replace(/[\u00a0\u202f]/g, ' '))).toEqual(['60%', '−18%', '600 лет', '$84,4 трлн']);
    expect(await cards.locator('.lv').allInnerTexts()).toEqual(['B', 'A', 'A', 'B']);
    await expect(page.locator('.evn')).toContainText('Династия за сто лет');
    const body = await page.locator('main').innerText();
    expect(body).not.toMatch(/70\s?%/);
    expect(body).not.toContain('3 250 семей');
    // цифра не вылезает из карточки
    for (const c of await cards.all()) { const cb = await c.boundingBox(), nb = await c.locator('.big').boundingBox(); expect(nb.x + nb.width).toBeLessThanOrEqual(cb.x + cb.width) }
  });

  test('карта рисков: тринадцать сигналов, зоны и противоядия', async ({ page }) => {
    await page.goto('site_v2/shift.html#risks');
    await expect(page.locator('#rksig .rks')).toHaveCount(13);
    await expect(page.locator('#rkgrid .rkc')).toHaveCount(25);
    await expect(page.locator('#rkgrid [data-r]')).toHaveCount(13);
    await expect(page.locator('#rkgrid .rkc.z2 [data-r]')).toHaveCount(4);
    await expect(page.locator('#rkres')).toContainText('Пока ничего не отмечено');
    const pick = async i => page.locator(`.rks[data-r="${i}"]`).click();
    await pick(0);
    await expect(page.locator('.rks[data-r="0"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#rkgrid [data-r="0"]')).toHaveClass(/on/);
    await expect(page.locator('#rkres .rkt')).toHaveText('1 из 13 сигнал, из них 1 в критической зоне.');
    await expect(page.locator('#rkres li').first()).toContainText('конкурсный отбор');
    await pick(9); await pick(11);
    await expect(page.locator('#rkres .rkt')).toHaveText('3 из 13 сигнала, из них 1 в критической зоне.');
    for (const i of [1, 2, 3, 4]) await pick(i);
    await expect(page.locator('#rkres .rkt')).toHaveText('7 из 13 сигналов, из них 4 в критической зоне.');
    await expect(page.locator('#rkres li')).toHaveCount(4);
    await expect(page.locator('#rkres .rkm')).toContainText('И ещё 3');
    await pick(0);
    await expect(page.locator('#rkgrid [data-r="0"]')).not.toHaveClass(/on/);
    // заявка на метаанализ открывает то же окно с двумя полями
    await page.locator('#risks [data-open]').click();
    await expect(page.locator('#mtitle')).toHaveText('Метаанализ «Династия за сто лет»');
  });

  test('карта династии называет пять капиталов так же, как статья', async ({ page }) => {
    await page.goto('site_v2/shift.html#map');
    const caps = await page.locator('#caps').innerText();
    for (const c of ['Финансовый', 'Социальный', 'Интеллектуальный', 'Человеческий', 'Смысловой']) expect(caps).toContain(c);
  });

  test('двойник первым отвечает цитатой из метаанализа и называет источник', async ({ page }) => {
    await page.goto('site_v2/index.html');
    await page.locator('#tqa').scrollIntoViewIfNeeded();
    await expect(page.locator('#tq button')).toHaveCount(7);
    await expect(page.locator('#tq button').first()).toHaveClass(/on/);
    await expect(page.locator('#tsrc')).toContainText('Метаанализ «Династия за сто лет», ноябрь 2026', { timeout: 15000 });
    await expect(page.locator('#tt')).toContainText('чем из-за рынка');
  });
});

test.describe('расписание и клуб на фиктивных часах', () => {
  test('ближайшая встреча и отсчёт до неё', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-20T10:00:00+03:00') });
    await page.goto('site_v2/index.html#sched');
    await expect(page.locator('#schedList')).toContainText('24 ноября');
    await expect(page.locator('#cdGroup')).toHaveText(/^4 дня (09:00:00|08:59:[0-5]\d)$/);
    await page.goto('site_v2/club.html');
    await expect(page.locator('#fNext')).toContainText('24 ноября, вторник');
    await expect(page.locator('.date.first b')).toHaveText('24 ноября');
  });

  test('первый экран считает дни до встречи по календарю: через 8 дней, завтра, сегодня', async ({ page }) => {
    const chip = page.locator('#chipNext i');
    for (const [now, want] of [
      ['2026-11-16T11:00:00+03:00', 'через 8 дней, 19:00 МСК'], ['2026-11-16T23:30:00+03:00', 'через 8 дней, 19:00 МСК'],
      ['2026-11-23T08:00:00+03:00', 'завтра, 19:00 МСК'], ['2026-11-23T23:59:00+03:00', 'завтра, 19:00 МСК'],
      ['2026-11-24T00:10:00+03:00', 'сегодня, 19:00 МСК'], ['2026-11-24T18:30:00+03:00', 'сегодня, 19:00 МСК']
    ]) {
      await page.clock.install({ time: new Date(now) });
      await page.goto('site_v2/index.html');
      await expect(chip, now).toHaveText(want);
      await page.goto('about:blank');
    }
  });

  test('после последней даты расписание честно просит оставить контакт', async ({ page }) => {
    await page.clock.install({ time: new Date('2027-02-15T10:00:00+03:00') });
    await page.goto('site_v2/club.html');
    await expect(page.locator('#dates')).toContainText('Расписание обновляется');
    await page.goto('site_v2/index.html');
    await expect(page.locator('#schedList')).not.toContainText('Групповой трекинг');
  });

  test('год: 12 месяцев по цене 10 и экономия на виду', async ({ page }) => {
    await page.goto('site_v2/club.html#plans');
    await page.click('#per button[data-v="y"]');
    const first = page.locator('.price .sum').first();
    await expect(first).toContainText('70 000 ₽');
    await expect(first.locator('.save')).toHaveText('экономия 14 000 ₽');
    await expect(page.locator('#per button[data-v="y"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('встреча добавляется в календарь файлом .ics с правильным временем', async ({ page, browserName }) => {
    await page.clock.install({ time: new Date('2026-11-20T10:00:00+03:00') });
    // в WebKit событие download в эмуляции нестабильно: там читаем сам файл, который сайт отдаёт браузеру
    await page.addInitScript(() => { const o = URL.createObjectURL; window.__blobs = []; URL.createObjectURL = x => { window.__blobs.push(x); return o.call(URL, x) } });
    await page.goto('site_v2/club.html#plans');
    let ics;
    if (browserName === 'webkit') {
      await page.locator('[data-ics]').first().click();
      ics = await page.evaluate(async () => { const x = window.__blobs[window.__blobs.length - 1]; return x ? await x.text() : '' });
    } else {
      const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-ics]').first().click()]);
      ics = Buffer.concat(await (await dl.createReadStream()).toArray()).toString('utf8');
    }
    expect(ics).toContain('DTSTART:20261124T160000Z');
    expect(ics).toContain('SUMMARY:Групповой трекинг Right Track');
  });
});

test.describe('общий слой', () => {
  test('cookie: не закрывает первый экран, отказ запоминается', async ({ page }) => {
    await page.goto('site_v2/tools.html');
    const ck = page.locator('#cookie');
    await expect(ck).toBeHidden();
    await wheel(page, 400);
    await expect(ck).toBeVisible();
    await ck.getByRole('button', { name: 'Отклонить' }).click();
    await expect(ck).toBeHidden();
    await page.reload();
    await expect(page.locator('#cookie')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('rt_cookie'))).toBe('min');
  });

  test('заметки для встречи: N включает, Ctrl+N не трогает', async ({ page, isMobile }) => {
    test.skip(isMobile, 'режим показа для компьютера');
    await page.goto('site_v2/index.html');
    await page.keyboard.press('Control+n');
    await expect(page.locator('body')).not.toHaveClass(/notes/);
    await page.keyboard.press('n');
    await expect(page.locator('body')).toHaveClass(/notes/);
    await expect(page.locator('#mm')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.npin').first().click();
    await expect(page.locator('#ncard')).toBeVisible();
    await expect(page.locator('#ncardt')).not.toBeEmpty();
  });

  test('лид-магнит при уходе: один раз за сессию и не раньше 8 секунд', async ({ page, isMobile }) => {
    test.skip(isMobile, 'только на компьютере с мышью');
    await page.clock.install({ time: new Date('2026-11-20T10:00:00+03:00') });
    await page.goto('site_v2/shift.html');
    const leave = () => page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseout', { clientY: 0, relatedTarget: null, bubbles: true })));
    await leave(); await expect(page.locator('#exit')).not.toHaveClass(/\bo\b/);
    await page.clock.runFor(9_000);
    await leave(); await expect(page.locator('#exit')).toHaveClass(/\bo\b/);
    await expect(page.locator('#exit a.btn')).toHaveAttribute('href', 'https://rightrack.ru/naslednik');
    await page.keyboard.press('Escape');
    await leave(); await expect(page.locator('#exit')).not.toHaveClass(/\bo\b/);
  });

  test('метка концепта и честная строка в форме на месте', async ({ page }) => {
    await page.goto('site_v2/index.html');
    await expect(page.locator('.concept')).toHaveText('Концепт v.2');
    await expect(page.locator('.legal')).toContainText('Концепт сайта v.2');
  });

  test('уровни трекера: требования совпадают с реестром Right Track', async ({ page }) => {
    await page.goto('site_v2/trackers.html#levels');
    await page.click('#lvl button[data-i="3"]');
    const reqs = await page.locator('#reqs .req b').allInnerTexts();
    expect(reqs.map(s => s.replace(/\s/g, ' '))).toEqual(['4 000+ часов', '800+ часов', '200+ часов', '200+ часов', '200+ часов', 'обязательна', '10+ учеников']);
  });
});

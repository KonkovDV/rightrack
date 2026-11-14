/* Right Track · концепт сайта v.2 · общий слой: шапка, подвал, заявка, таймеры, режим показа */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* сайт показан в рамке презентации: служебные плашки не нужны */
if (window.self !== window.top) document.documentElement.classList.add('embed');
const ARR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ---------- настройки концепта (правятся в одном месте) ---------- */
const CFG = {
  phone: '+7 (905) 715-36-97', tel: '+79057153697',
  booking: { name: '@Kireeva_13', url: 'https://t.me/Kireeva_13' },
  privacy: 'https://rightrack.ru/privacy', offer: 'https://rightrack.ru/dogovor-oferta',
  channels: [['Telegram', 'https://t.me/RT_by_Bakeev'], ['ВКонтакте', 'https://vk.com/rightrack'], ['YouTube', 'https://www.youtube.com/@Rightrack'], ['Подкаст', 'https://rightrack.ru/podcast']],
  /* окно цены предзаписи «Сдвига»: школа ставит свою дату, после неё блок исчезает сам */
  presale: { price: 100000, until: '2027-01-31T23:59:59+03:00' },
  guide: { title: 'Гайд «Как вырастить наследника, которому можно доверить капитал»', url: 'https://rightrack.ru/naslednik' }
};

/* ---------- единое расписание: один источник для всех страниц ---------- */
/* Даты группового трекинга из канала @RT_by_Bakeev (посты от 07.10.2026 и 09.11.2026). Прошедшие даты скрываются сами. */
const GROUP = ['2026-11-24', '2026-12-08', '2026-12-22', '2027-01-12', '2027-01-26'].map(d => new Date(d + 'T19:00:00+03:00'));
const MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const fmt = d => d.getDate() + ' ' + MON[d.getMonth()];
const nextGroup = () => GROUP.filter(d => d > new Date());
const pl = (n, a, b, c) => { n = Math.abs(n) % 100; const k = n % 10; return n > 10 && n < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c };
const RT = window.RT = { $, $$, CFG, ARR, GROUP, MON, fmt, nextGroup, reduce, pl };

/* ---------- обратный отсчёт до настоящей даты: не сбрасывается, после даты скрывает блок ---------- */
const timers = new Set();
RT.countdown = (el, to, onEnd) => {
  const end = +new Date(to); if (!el || !end) return;
  const f = () => { const ms = end - Date.now();
    if (ms <= 0) { timers.delete(f); onEnd ? onEnd(el) : el.closest('[data-window]')?.setAttribute('hidden', ''); return }
    const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3), z = n => String(n).padStart(2, '0');
    el.textContent = (d ? d + ' ' + pl(d, 'день', 'дня', 'дней') + ' ' : '') + z(h) + ':' + z(m) + ':' + z(s);
    el.setAttribute('datetime', new Date(end).toISOString()) };
  f(); timers.add(f) };
setInterval(() => timers.forEach(f => f()), 1000);

/* ---------- шапка и подвал ---------- */
const page = (location.pathname.split('/').pop() || 'index.html');
const NAV = [['tools.html', 'Бизнесу'], ['shift.html', 'Семье'], ['club.html', 'Клуб'], ['trackers.html', 'Трекерам'], ['index.html#sched', 'Расписание'], ['index.html#about', 'Бакеев']];
const logo = `<a href="index.html" class="logo"><svg viewBox="0 0 34 40" aria-hidden="true"><path d="M17 1 32 5v15c0 9-6.5 15.5-15 19C8.5 35.5 2 29 2 20V5z" fill="#0b0a08" stroke="#ffc81e" stroke-width="1.6"/><path d="M17 4.2 4.8 7.4V20H17z" fill="#ffc81e"/><path d="M17 20h12.2c0 7-4.6 12.2-12.2 15.6z" fill="#ffc81e"/></svg><span>RIGHT TRACK<small>университет кратного роста</small></span></a>`;
document.body.insertAdjacentHTML('afterbegin', `
<a class="sr-only skip" href="#main">К содержанию</a>
<header class="nav" id="nav"><div class="wrap">${logo}<span class="concept" title="Концепт новой версии сайта для обсуждения с Right Track">Концепт v.2</span>
  <nav aria-label="Основное меню">${NAV.map(([h, t]) => `<a href="${h}"${h === page ? ' class="on" aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
  <a class="btn btn-gold btn-sm" href="index.html#diag">Найти узкое место</a>
  <button type="button" class="burger" aria-label="Открыть меню" aria-expanded="false" aria-controls="drawer" data-drawer><i></i></button>
</div></header>
<div class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Меню"><button type="button" class="x" data-drawer aria-label="Закрыть меню">✕</button>
  <nav aria-label="Меню">${NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}<a href="index.html#diag" class="gold">Найти узкое место →</a></nav></div>`);
const main = $('main'); if (main && !main.id) main.id = 'main';

const ng = nextGroup()[0];
const cta = (document.body.dataset.cta || 'Диагностика|index.html#diag').split('|');
document.body.insertAdjacentHTML('beforeend', `
<footer class="foot"><div class="wrap">
  <div class="cols">
    <div>${logo}<p style="margin-top:16px;max-width:34ch">Школа трекинга Александра Бакеева. Рост бизнеса кратно и стратегия семьи на 144 года. С 2017 года.</p>
      <p style="margin-top:14px"><a href="tel:${CFG.tel}" style="font-size:20px;color:#fff;font-weight:700">${CFG.phone}</a>Ответ в мессенджере в течение 15 минут в рабочее время</p></div>
    <div><p class="fh">Программы</p><a href="tools.html">Инструменты трекинга</a><a href="shift.html">Сдвиг. Семейная стратегия</a><a href="club.html">Клуб и групповой трекинг</a><a href="tools.html#company">Компаниям</a><a href="trackers.html">Обучение трекеров</a></div>
    <div><p class="fh">Right Track</p><a href="index.html#about">Александр Бакеев</a><a href="trackers.html#award">Премия «Трекер года»</a><a href="trackers.html#levels">Реестр и уровни</a><a href="index.html#faq">Вопросы и ответы</a></div>
    <div data-note="Свои каналы связи|Аудитория сама выбирает, где получать материалы. Контакт остаётся у школы."><p class="fh">Где нас читать</p>
      <div class="chan">${CFG.channels.map(([t, h]) => `<a href="${h}" target="_blank" rel="noopener"><i></i>${t}</a>`).join('')}</div>
      ${ng ? `<p style="margin-top:14px">Ближайший групповой трекинг: <b style="color:#fff">${fmt(ng)}, 19:00 МСК</b></p>` : ''}</div>
  </div>
  <div class="legal"><span>© 2026 Right Track. ИП Киреева А. А. · <a href="${CFG.privacy}" target="_blank" rel="noopener">Политика конфиденциальности</a> · <a href="${CFG.offer}" target="_blank" rel="noopener">Договор-оферта</a></span><span>Концепт сайта v.2 · <a href="../index.html">Презентация</a> · <a href="../2_demo_otchet.html">Отчёт</a> · <a href="../2_demo_otchet.pdf">PDF</a> · <a href="thanks.html">Страница после заявки</a></span></div>
</div></footer>
<nav class="mbar" id="mbar" aria-label="Быстрые действия"><a class="btn btn-ghost" href="index.html#sched">Расписание</a><a class="btn btn-gold" href="${cta[1]}">${cta[0]}</a></nav>
<div class="cookie h" id="cookie" role="region" aria-label="Cookie"><span>Аналитические cookie включаем только с вашего согласия. <a href="${CFG.privacy}" target="_blank" rel="noopener">Подробнее</a></span><button type="button" data-ck="all">Принять</button><button type="button" class="ghost" data-ck="min">Отклонить</button></div>
<button type="button" class="mm" id="mm" title="Клавиша N" aria-pressed="false"><i></i>Заметки для встречи</button>
<div class="ncard" id="ncard" role="dialog" aria-labelledby="ncardt"><button type="button" class="x" aria-label="Закрыть заметку">✕</button><small></small><p class="nt" id="ncardt"></p><p></p></div>
<div class="toast" id="toast" role="status"></div>
<div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="mtitle"><div class="mbox">
  <button type="button" class="x" data-close aria-label="Закрыть">✕</button>
  <div id="mform"><h3 id="mtitle">Заявка</h3><p id="msub">Два поля. Ответим там, где вам удобно.</p>
    <div class="field"><label for="fn">Как к вам обращаться</label><input class="inp" id="fn" type="text" placeholder="Имя" autocomplete="given-name" maxlength="60"></div>
    <div class="field"><label for="fc">Контакт</label><input class="inp" id="fc" type="text" placeholder="@username, телефон или почта" autocomplete="off" maxlength="80"></div>
    <span class="flabel" id="fchl">Где ответить</span>
    <div class="pills" id="fch" role="group" aria-labelledby="fchl">${['Telegram', 'MAX', 'WhatsApp', 'Почта', 'Звонок'].map((c, i) => `<button type="button" class="pillb${i ? '' : ' on'}" aria-pressed="${!i}">${c}</button>`).join('')}</div>
    <label class="consent" id="fpd"><input type="checkbox" id="fpdc"><span>Согласен на обработку персональных данных по <a href="${CFG.privacy}" target="_blank" rel="noopener">политике конфиденциальности</a></span></label>
    <label class="consent"><input type="checkbox" id="fnews"><span>Хочу получать письмо Right Track раз в неделю</span></label>
    <button type="button" class="btn btn-gold" id="msend">Отправить заявку ${ARR}</button>
    <small class="real">Это концепт сайта, форма данные не передаёт. Записаться прямо сейчас: <a href="${CFG.booking.url}" target="_blank" rel="noopener">${CFG.booking.name}</a> или <a href="tel:${CFG.tel}">${CFG.phone}</a></small></div>
  <div id="mok" hidden><svg class="okico" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28"/><path d="M20 33l8 8 16-18"/></svg>
    <h3 tabindex="-1" id="oktitle">Спасибо, <span id="okname"></span></h3>
    <ol class="steps"><li><span><b>Подтверждение</b> придёт в <span id="okch"></span>.</span></li><li><span><b>Ответ</b> в рабочее время — в течение 15 минут.</span></li><li><span><b>Следующий шаг</b> — методичка «Инструменты кратного роста».</span></li></ol>
    <a class="btn btn-gold" href="thanks.html">Что дальше ${ARR}</a></div>
</div></div>
<div class="modal" id="exit" role="dialog" aria-modal="true" aria-labelledby="extitle"><div class="mbox">
  <button type="button" class="x" data-close aria-label="Закрыть">✕</button>
  <span class="badge">Бесплатно</span><h3 id="extitle" style="margin-top:14px">Заберите гайд, пока не ушли</h3>
  <p style="color:var(--soft);margin:10px 0 0">${CFG.guide.title}. 3 урока и 9 семейных ритуалов на карманных деньгах, для детей 4–17 лет. PDF на 23 страницы.</p>
  <a class="btn btn-gold" href="${CFG.guide.url}" target="_blank" rel="noopener">Получить гайд ${ARR}</a>
</div></div>`);

/* ---------- поведение ---------- */
const nav = $('#nav'), mbar = $('#mbar');
const onScroll = () => { nav.classList.toggle('s', scrollY > 30); mbar.classList.toggle('v', scrollY > innerHeight * .7 && scrollY < document.body.scrollHeight - innerHeight * 1.5) };
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const store = { get: k => { try { return localStorage.getItem(k) } catch (e) { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) { } } };
const sess = { get: k => { try { return sessionStorage.getItem(k) } catch (e) { return null } }, set: (k, v) => { try { sessionStorage.setItem(k, v) } catch (e) { } } };
RT.store = store;
/* баннер cookie не перекрывает первый экран: появляется после первой прокрутки или через 6 секунд */
const cookie = $('#cookie');
if (!store.get('rt_cookie')) { const show = () => { cookie.classList.remove('h'); removeEventListener('scroll', show) }; addEventListener('scroll', show, { passive: true, once: true }); setTimeout(show, 6000) }
cookie.addEventListener('click', e => { const b = e.target.closest('[data-ck]'); if (!b) return; cookie.classList.add('h'); store.set('rt_cookie', b.dataset.ck) });
const toast = t => { const el = $('#toast'); el.textContent = t; el.classList.add('v'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('v'), 2600) };
RT.toast = toast;

/* reveal, счётчики, шкалы */
function count(el) { const n = +el.dataset.n, s = el.dataset.s || '', t0 = performance.now(), d = reduce ? 1 : 1500;
  (function f(t) { const k = Math.min(1, (t - t0) / d), v = Math.round(n * (1 - Math.pow(1 - k, 4))); el.textContent = v.toLocaleString('ru-RU') + (k === 1 ? s : ''); if (k < 1) requestAnimationFrame(f) })(t0) }
const reveal = t => { if (t.classList.contains('in')) return; t.classList.add('in');
  $$('[data-n]', t).forEach(count); $$('[data-w]', t).forEach(m => m.style.width = m.dataset.w + '%'); io.unobserve(t) };
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) reveal(e.target) }), { rootMargin: '0px 0px -8% 0px' });
RT.observe = () => $$('.rv:not(.in)').forEach(el => io.observe(el)); RT.observe();
/* страховка: при резкой прокрутке и восстановленной позиции всё, что уже выше нижнего края экрана, раскрывается */
let sweepQ = 0; const sweep = () => { sweepQ = 0; const lim = innerHeight * .92; $$('.rv:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < lim) reveal(el) }) };
addEventListener('scroll', () => { if (!sweepQ) sweepQ = requestAnimationFrame(sweep) }, { passive: true }); addEventListener('pageshow', sweep);
if (matchMedia('(hover: hover)').matches) document.addEventListener('pointermove', e => { const c = e.target.closest && e.target.closest('.glow'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px') });

/* ---------- окна: фокус внутри, Esc закрывает, фокус возвращается ---------- */
let opener = null;
const FOC = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';
/* фокус переходит в окно, как только браузер готов его принять; если человек уже начал ввод, фокус не трогаем */
const openLayer = (el, first) => { opener = document.activeElement; el.classList.add('o'); document.body.classList.add('lock');
  let tries = 0; const land = () => { if (!el.classList.contains('o') || el.contains(document.activeElement)) return;
    (first || $(FOC, el))?.focus({ preventScroll: true }); if (!el.contains(document.activeElement) && ++tries < 40) setTimeout(land, 50) };
  setTimeout(land, reduce ? 0 : 60) };
const closeLayer = el => { if (!el.classList.contains('o')) return; el.classList.remove('o'); if (!$('.modal.o, .drawer.o')) document.body.classList.remove('lock'); opener && opener.focus && opener.focus(); opener = null };
const layer = () => $('.modal.o') || $('.drawer.o');
addEventListener('keydown', e => {
  const l = layer();
  if (e.key === 'Escape') { if (l) { closeLayer(l); syncBurger() } $('#ncard').classList.remove('v'); return }
  if (e.key === 'Tab' && l) { const f = $$(FOC, l).filter(x => x.offsetParent !== null); if (!f.length) return; const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() } }
});
const drawer = $('#drawer'), burger = $('.burger');
const syncBurger = () => burger.setAttribute('aria-expanded', drawer.classList.contains('o'));

/* заявка: два поля, канал ответа и отдельное согласие на обработку данных */
const modal = $('#modal'); let channel = 'Telegram';
RT.open = (title, sub) => { $('#mtitle').textContent = title; $('#msub').textContent = sub || 'Два поля. Ответим там, где вам удобно.'; $('#mform').hidden = false; $('#mok').hidden = true; openLayer(modal, $('#fn')) };
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-drawer]')) { drawer.classList.contains('o') ? closeLayer(drawer) : openLayer(drawer); return syncBurger() }
  if (t.closest('#drawer a')) { drawer.classList.remove('o'); document.body.classList.remove('lock'); syncBurger() }
  const o = t.closest('[data-open]'); if (o) { e.preventDefault(); RT.open(o.dataset.open, o.dataset.sub) }
  const m = t.closest('.modal'); if (m && (t.closest('[data-close]') || t === m)) closeLayer(m);
  const p = t.closest('#fch .pillb'); if (p) { $$('#fch .pillb').forEach(b => { const on = b === p; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on) }); channel = p.textContent }
  const ics = t.closest('[data-ics]'); if (ics) { e.preventDefault(); makeIcs(ics.dataset.ics) }
});
$('#msend').onclick = () => { const n = $('#fn'), c = $('#fc'), pd = $('#fpdc'); let ok = true;
  [n, c].forEach(i => { const bad = !i.value.trim(); i.classList.toggle('err', bad); i.setAttribute('aria-invalid', bad); if (bad) ok = false });
  $('#fpd').classList.toggle('err', !pd.checked); if (!pd.checked) ok = false;
  if (!ok) { ($('.inp.err', modal) || pd).focus(); return }
  $('#okname').textContent = n.value.trim(); $('#okch').textContent = channel; $('#mform').hidden = true; $('#mok').hidden = false; $('#oktitle').focus() };

/* лид-магнит при уходе со страницы: один раз за сессию, только на компьютере */
if (page !== 'thanks.html' && matchMedia('(hover: hover) and (pointer: fine)').matches && !sess.get('rt_exit')) {
  const t0 = Date.now();
  document.addEventListener('mouseout', e => { if (e.relatedTarget || e.clientY > 8 || Date.now() - t0 < 8000 || layer() || sess.get('rt_exit')) return; sess.set('rt_exit', '1'); openLayer($('#exit')) });
}

/* событие в календарь одним нажатием */
function makeIcs(iso) { const d = new Date(iso), z = x => x.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', e = new Date(+d + 2 * 36e5);
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Right Track//RU', 'BEGIN:VEVENT', 'UID:' + (+d) + '@rightrack', 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(d), 'DTEND:' + z(e), 'SUMMARY:Групповой трекинг Right Track', 'DESCRIPTION:Онлайн-встреча в Zoom. Двигаемся к целям на год\\, квартал\\, месяц.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'), url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.href = url; a.download = 'right-track-' + iso.slice(0, 10) + '.ics'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Событие сохранено в календарь') }

/* ---------- режим показа: заметки для встречи (клавиша N) ---------- */
const ncard = $('#ncard'), mm = $('#mm');
function pins() { $$('[data-note]').forEach((el, i) => { if (el.querySelector(':scope>.npin')) return; if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const b = document.createElement('button'); b.type = 'button'; b.className = 'npin'; b.textContent = i + 1; b.setAttribute('aria-label', 'Заметка ' + (i + 1)); el.appendChild(b) }) }
function toggleNotes(on) { document.body.classList.toggle('notes', on); mm.setAttribute('aria-pressed', on); if (on) { pins(); toast('Заметки включены: нажимайте на жёлтые метки') } else ncard.classList.remove('v'); store.set('rt_notes', on ? '1' : '') }
mm.onclick = () => toggleNotes(!document.body.classList.contains('notes'));
addEventListener('keydown', e => { if (e.ctrlKey || e.metaKey || e.altKey || layer()) return; if (/^[nNтТ]$/.test(e.key) && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) toggleNotes(!document.body.classList.contains('notes')) });
document.addEventListener('click', e => { const p = e.target.closest('.npin'); if (p) { e.preventDefault(); e.stopPropagation(); const [h, t] = p.parentElement.dataset.note.split('|');
    ncard.querySelector('small').textContent = 'Заметка ' + p.textContent; $('#ncardt').textContent = h; ncard.querySelector('#ncardt + p').textContent = t; ncard.classList.add('v') }
  if (e.target.closest('#ncard .x')) ncard.classList.remove('v') }, true);
RT.pins = pins;
if (store.get('rt_notes')) { document.body.classList.add('notes'); mm.setAttribute('aria-pressed', 'true'); requestAnimationFrame(pins) }
})();

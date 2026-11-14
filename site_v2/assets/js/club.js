/* Клуб: карта «1000 семей», тарифы, календарь */
(() => {
'use strict';
const { $, $$, fmt, nextGroup, reduce } = RT;
const ng = nextGroup();
const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
if (ng[0]) { $('#fNext').innerHTML = fmt(ng[0]) + ', ' + days[ng[0].getDay()] + '<small style="display:block;margin-top:4px;font-size:12px;color:var(--mute)">до встречи <time class="cd" id="cdClub"></time></small>'; $('#finNext').textContent = 'Ближайшая встреча · ' + fmt(ng[0]) + ', 19:00 МСК'; RT.countdown($('#cdClub'), ng[0]) }

/* ---------- 1000 семей ---------- */
(function () {
  const cv = $('#famcv'), c = cv.getContext('2d'), W = cv.width, H = cv.height, COLS = 50, ROWS = 20, N = 1000;
  // порядок зажигания: от центра к краям, с небольшим разбросом
  const pts = []; for (let i = 0; i < N; i++) { const col = i % COLS, row = Math.floor(i / COLS); pts.push({ x: (col + .5) * W / COLS, y: (row + .5) * H / ROWS, d: Math.hypot((col - 24.5) / 25, (row - 9.5) / 10) + Math.sin(i * 12.9898) * .13, a: 0 }) }
  const order = pts.map((p, i) => i).sort((a, b) => pts[a].d - pts[b].d);
  const rank = new Array(N); order.forEach((id, k) => rank[id] = k);
  const M = [[12, 'Ядро', 'Первый этап миссии: семьи, которые задают культуру клуба.'], [100, 'Первая сотня', 'Этап основателей: их знают по именам, они принимают следующих.'], [500, 'Сообщество', 'Этап городов: общие проекты и наставничество между семьями.'], [1000, 'Миссия', 'Тысяча семей, которые помогают друг другу растить детей и внуков.']];
  let target = 12, shown = 0, raf;
  $('#miles').innerHTML = M.map((m, i) => `<div class="mile${i ? '' : ' on'}" data-i="${i}" tabindex="0" role="button"><b>${m[0].toLocaleString('ru-RU')}</b>${m[1]}${m[3] ? ' <span class="tagx">' + m[3] + '</span>' : ''}</div>`).join('');
  function draw() { c.clearRect(0, 0, W, H);
    for (let i = 0; i < N; i++) { const p = pts[i], on = rank[i] < shown; p.a += ((on ? 1 : 0) - p.a) * .18;
      c.beginPath(); c.arc(p.x, p.y, 4 + p.a * 5, 0, 6.2832); c.fillStyle = p.a > .02 ? `rgba(255,200,30,${.18 + p.a * .82})` : 'rgba(255,255,255,.09)'; c.fill();
      if (p.a > .5 && rank[i] < 12) { c.beginPath(); c.arc(p.x, p.y, 15, 0, 6.2832); c.strokeStyle = 'rgba(255,200,30,.35)'; c.lineWidth = 1.5; c.stroke() } } }
  function run() { cancelAnimationFrame(raf); let settle = 0; $('#famN').textContent = target.toLocaleString('ru-RU'); (function f() { const diff = target - shown; shown += Math.abs(diff) < 1 ? diff : diff * (reduce ? 1 : .09); draw();
      if (Math.abs(target - shown) < .01) settle++; if (settle < 45) raf = requestAnimationFrame(f) })() }
  function set(i) { target = M[i][0]; $('#famT').textContent = M[i][2]; $('#famS').textContent = i === 3 ? 'семей в миссии' : 'этап «' + M[i][1] + '»'; $$('.mile').forEach((m, k) => m.classList.toggle('on', k === i)); run() }
  $('#miles').addEventListener('click', e => { const m = e.target.closest('.mile'); if (m) set(+m.dataset.i) });
  $('#miles').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const m = e.target.closest('.mile'); if (m) { e.preventDefault(); set(+m.dataset.i) } } });
  draw(); let st = false; new IntersectionObserver(([e]) => { if (e.isIntersecting && !st) { st = true; set(0) } }, { threshold: .3 }).observe(cv);
})();

/* ---------- тарифы: месяц или год ---------- */
/* годовой взнос: 12 месяцев по цене 10, экономия видна сразу */
const num = t => +String(t).replace(/\D/g, '');
$('#per').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#per button').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on) }); const y = b.dataset.v === 'y';
  $$('.price .sum').forEach(s => { const save = num(s.dataset.m) * 12 - num(s.dataset.y);
    s.innerHTML = `${y ? s.dataset.y : s.dataset.m} <small>${y ? s.dataset.ys : s.dataset.ms}</small>${y && save > 0 ? `<span class="save">экономия ${save.toLocaleString('ru-RU')} ₽</span>` : ''}` }) });

/* ---------- календарь ---------- */
const DOW = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
$('#dates').innerHTML = ng.length ? ng.map((d, i) => `<div class="date${i ? '' : ' first'}"><small>${i ? DOW[d.getDay()] : 'ближайшая · ' + DOW[d.getDay()]}</small><b>${fmt(d)}</b><small>19:00 МСК · Zoom</small><a href="#" data-ics="${d.toISOString()}">В календарь</a></div>`).join('')
  : '<div class="date first"><b>Расписание обновляется</b><small>Оставьте контакт, пришлём даты первыми</small><a href="#" data-open="Расписание клуба">Сообщить о датах</a></div>';
})();

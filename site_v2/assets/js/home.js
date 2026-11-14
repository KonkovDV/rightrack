/* Главная: поток в первом экране, диагностика, расписание */
(() => {
'use strict';
const { $, $$, ARR, fmt, nextGroup, reduce, store, CFG, pl } = RT;

/* бегущая строка */
const names = ['Сбер', 'МТС', 'Яндекс', 'Лаборатория Касперского', 'КРОК', 'НИУ ВШЭ', 'Сколково', 'Toyota', 'Microsoft', 'Газпром нефть', 'Skillfactory', 'Product Vision'];
$('#mq').innerHTML = [...names, ...names].map((n, i) => `<span>${n}</span>${i % 4 === 3 ? '<em>с кем работали</em>' : ''}`).join('');
$('#mqt').textContent = 'С кем работали основатель и команда: ' + names.join(', ') + '.';

/* плашка с ближайшей встречей */
const ng = nextGroup();
/* сколько дней до встречи: по календарю Москвы, а не по суткам от текущей минуты */
if (ng[0]) { const day = t => Math.floor((+t + 3 * 36e5) / 864e5), d = Math.max(0, day(ng[0]) - day(Date.now()));
  $('#chipNext').innerHTML = `<b>Групповой трекинг · ${fmt(ng[0])}</b><i>${d > 1 ? 'через ' + d + ' ' + pl(d, 'день', 'дня', 'дней') : d ? 'завтра' : 'сегодня'}, 19:00 МСК</i>` }

/* ---------- поле потоков в первом экране ---------- */
(function () { const cv = $('#flow'); if (!cv || reduce) return; const cx = cv.getContext('2d'); let W, H, D, ps = [], mx = -9999, my = -9999, run = true, t = 0;
  function size() { D = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * D; cv.height = H * D; cx.setTransform(D, 0, 0, D, 0, 0); cx.fillStyle = '#0b0a08'; cx.fillRect(0, 0, W, H);
    ps = Array.from({ length: Math.round(Math.min(240, W / 6)) }, spawn) }
  function spawn() { return { x: Math.random() * W, y: H * (.25 + Math.random() * .85), l: 0, m: 120 + Math.random() * 260, s: .6 + Math.random() * 1.3, a: .12 + Math.random() * .5 } }
  function ang(x, y) { return -.42 + Math.sin(x * .0042 + t * .6) * .55 + Math.cos(y * .006 - t * .4) * .5 + Math.sin((x + y) * .002 + t) * .25 }
  function step() { if (!run) return; t += .004; cx.fillStyle = 'rgba(11,10,8,.055)'; cx.fillRect(0, 0, W, H); cx.lineWidth = 1;
    for (const p of ps) { let a = ang(p.x, p.y); const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy; if (d2 < 32000) a += Math.atan2(dy, dx) * .35 * (1 - d2 / 32000);
      const nx = p.x + Math.cos(a) * p.s * 1.7, ny = p.y + Math.sin(a) * p.s * 1.7 - .25, k = Math.sin(Math.PI * p.l / p.m);
      cx.strokeStyle = `rgba(255,200,30,${p.a * k * (.35 + .65 * p.x / W)})`; cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(nx, ny); cx.stroke(); p.x = nx; p.y = ny;
      if (++p.l > p.m || nx > W + 10 || ny < -10 || ny > H + 10 || nx < -10) Object.assign(p, spawn(), { x: Math.random() * W * .7 }) }
    requestAnimationFrame(step) }
  addEventListener('resize', size); cv.parentElement.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top });
  new IntersectionObserver(([e]) => { const was = run; run = e.isIntersecting; if (run && !was) step() }).observe(cv); size(); step() })();

/* ---------- диагностика «Узкое место» ---------- */
const DIMS = ['Стратегия', 'Команда', 'Продажи', 'Деньги', 'Собственник'];
const Q = [
  [0, 'Есть ли у компании цель на 3 года, которую знает вся команда?', ['Цели нет, живём текущим месяцем', 'Есть у меня в голове', 'Записана, команда слышала', 'Записана, разложена на кварталы, по ней сверяемся']],
  [0, 'Как часто вы пересматриваете гипотезы роста?', ['Не формулируем гипотезы', 'Когда что-то ломается', 'Раз в квартал', 'Каждую неделю или две, с цифрами']],
  [1, 'Что происходит с задачей после планёрки?', ['Чаще всего ничего', 'Делается, если я напомню', 'Делается, но с переносами', 'Делается в срок, без моего участия']],
  [1, 'Кто из команды может заменить вас на месяц?', ['Никто, всё встанет', 'Частично, по простым вопросам', 'Есть сильный заместитель', 'Команда уже работала без меня']],
  [2, 'Насколько предсказуем поток новых клиентов?', ['Клиенты приходят случайно', 'Один канал, на нём всё держится', 'Два-три канала, считаем цену заявки', 'Знаем, сколько вложить, чтобы получить нужный объём']],
  [2, 'Знаете ли вы, на каком шаге теряете больше всего сделок?', ['Не считаем', 'Догадываемся', 'Знаем, но пока не исправили', 'Знаем и работаем с этим шагом постоянно']],
  [3, 'Выручка растёт. Что с прибылью?', ['Не знаю точно', 'Стоит или падает', 'Растёт медленнее выручки', 'Растёт вместе с выручкой или быстрее']],
  [3, 'Есть ли финансовая подушка на случай провального квартала?', ['Нет, живём от оплаты до оплаты', 'На месяц', 'На два-три месяца', 'На полгода и больше']],
  [4, 'Сколько часов в неделю вы отдаёте стратегии?', ['Нисколько', 'Час-два, урывками', 'Полдня', 'День и больше, это в календаре']],
  [4, 'Как вы чувствуете себя в конце обычной недели?', ['Выжат, думаю всё бросить', 'Устал, держусь на воле', 'Нормально, но без запаса', 'Есть силы и интерес двигаться дальше']]
];
const RES = [
  { t: 'Стратегия', d: 'Команда занята, но движется в разные стороны. Пока нет общей цели и ритма проверки гипотез, усилия не складываются в рост.', s: 'Запишите цель на три года одной фразой и проверьте, совпадает ли она у трёх главных людей в команде.', p: 'Интенсив «Инструменты трекинга»', h: 'tools.html' },
  { t: 'Команда', d: 'Решения принимаются, но не исполняются без вас. Вы стали узким горлышком собственной системы.', s: 'Выберите одну задачу недели и передайте её целиком: заказчик, исполнитель и контролёр должны быть разными людьми.', p: 'Интенсив «Инструменты трекинга» или трекинг команды', h: 'tools.html' },
  { t: 'Продажи', d: 'Рост упирается в непредсказуемый поток клиентов. Пока неизвестно, где теряются сделки, вложения в рекламу не дают отдачи.', s: 'Посчитайте путь клиента за последний месяц по шагам и найдите шаг с самой большой потерей.', p: 'Интенсив «Инструменты трекинга»', h: 'tools.html' },
  { t: 'Деньги', d: 'Выручка есть, а денег не прибавляется. Без управления прибылью рост оборота только увеличивает нагрузку.', s: 'Разделите деньги компании на три счёта: операционный, резерв и развитие. Начните с 5% в резерв.', p: 'Личная сессия с Александром Бакеевым', h: 'index.html#about' },
  { t: 'Собственник', d: 'Бизнес упёрся в ваш ресурс: время, энергию, картину мира. Это самое частое ограничение и самое недооценённое.', s: 'Заблокируйте в календаре три часа на стратегию и проведите их вне офиса.', p: 'Интенсив «Сдвиг» или групповой трекинг', h: 'shift.html' }
];
const quiz = $('#quiz'); let qi = 0, ans = [];
try { const s = JSON.parse(store.get('rt_quiz') || 'null'); if (s && s.length === Q.length) { ans = s; qi = Q.length } } catch (e) { }
function qRender() {
  if (qi >= Q.length) return qResult();
  const [d, text, opts] = Q[qi];
  quiz.innerHTML = `<div class="qtop"><span>Вопрос ${qi + 1} из ${Q.length}</span><span>≈ ${Math.max(1, Math.ceil((Q.length - qi) * .3))} мин</span></div>
  <div class="bar"><i style="width:${qi / Q.length * 100}%"></i></div>
  <div class="qstep"><div class="qdim">${DIMS[d]}</div><div class="qtext">${text}</div>
  <div class="opts">${opts.map((o, i) => `<button type="button" class="opt" data-v="${i + 1}"><span>${'АБВГ'[i]}</span>${o}</button>`).join('')}</div></div>
  <div class="qfoot"><button type="button" data-back ${qi ? '' : 'style="visibility:hidden"'}>← Назад</button><button type="button" data-auto>Показать готовый результат</button></div>`;
  requestAnimationFrame(() => { $('.bar i', quiz).style.width = (qi + 1) / Q.length * 100 - 5 + '%' });
  RT.pins && document.body.classList.contains('notes') && RT.pins();
}
quiz.addEventListener('click', e => {
  const o = e.target.closest('.opt'); if (o) { ans[qi] = +o.dataset.v; qi++; return qRender() }
  if (e.target.closest('[data-back]')) { qi = Math.max(0, qi - 1); return qRender() }
  if (e.target.closest('[data-auto]')) { ans = Q.map(q => q[0] === 2 ? 1 : 4); qi = Q.length; return qRender() }
  if (e.target.closest('[data-again]')) { qi = 0; ans = []; store.set('rt_quiz', ''); return qRender() }
  if (e.target.closest('[data-crm]')) { const v = $('.crm', quiz).classList.toggle('v'); e.target.closest('[data-crm]').setAttribute('aria-expanded', v) }
});
function qResult() {
  store.set('rt_quiz', JSON.stringify(ans));
  const sc = DIMS.map((_, d) => { const v = Q.map((q, i) => q[0] === d ? ans[i] : null).filter(Boolean); return v.reduce((a, b) => a + b, 0) / v.length });
  const low = sc.indexOf(Math.min(...sc)), R = RES[low], total = Math.round(sc.reduce((a, b) => a + b) / 20 * 100);
  const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [Math.cos(a) * r, Math.sin(a) * r] };
  const P = pts => pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
  const grid = [.25, .5, .75, 1].map(k => `<polygon points="${P(DIMS.map((_, i) => pt(i, 92 * k)))}" fill="none" stroke="rgba(255,255,255,.12)"/>`).join('');
  const axes = DIMS.map((_, i) => { const [x, y] = pt(i, 92); return `<line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,.1)"/>` }).join('');
  const poly = k => P(DIMS.map((_, i) => pt(i, 92 * (sc[i] / 4) * k)));
  const labels = DIMS.map((n, i) => { const [x, y] = pt(i, 112); return `<text class="${i === low ? 'low' : ''}" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${Math.abs(x) < 10 ? 'middle' : x > 0 ? 'start' : 'end'}">${n}</text>` }).join('');
  const dots = DIMS.map((_, i) => { const [x, y] = pt(i, 92 * sc[i] / 4); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === low ? 6 : 3.5}" fill="${i === low ? '#ffc81e' : '#fff'}"/>` }).join('');
  quiz.innerHTML = `<div class="qtop"><span>Результат диагностики</span><span>${total} из 100</span></div><div class="bar"><i style="width:100%"></i></div>
  <div class="res qstep"><svg class="radar" viewBox="-178 -132 356 262" role="img" aria-label="Профиль по пяти зонам">${grid}${axes}<polygon id="rp" points="${poly(.01)}" fill="rgba(255,200,30,.22)" stroke="#ffc81e" stroke-width="2" stroke-linejoin="round"/>${dots}${labels}</svg>
  <div><div class="qdim">Ваше узкое место</div><h3>${R.t}</h3><p>${R.d}</p>
  <div class="rec"><b>Шаг на эту неделю.</b> ${R.s}</div>
  <div class="rec"><b>Что подойдёт.</b> <a class="link" href="${R.h}">${R.p}</a></div></div></div>
  <div class="cta" style="margin-top:20px"><button type="button" class="btn btn-gold" data-open="Полный разбор диагностики: ${R.t}" data-sub="Разбор по всем пяти зонам и первый инструмент.">Получить полный разбор</button><button type="button" class="btn btn-ghost btn-sm" data-crm aria-expanded="false">Что увидит менеджер</button><button type="button" class="btn btn-ghost btn-sm" data-again>Заново</button></div>
  <div class="crm"><b>Карточка, которую увидит менеджер</b>
    <div class="k"><span>Узкое место</span><span>${R.t}, ${total} из 100</span><span>Профиль</span><span>${DIMS.map((n, i) => n.slice(0, 4) + '. ' + sc[i].toFixed(1)).join(' · ')}</span><span>Рекомендация</span><span>${R.p}</span><span>Источник</span><span>ссылка, по которой пришёл человек</span><span>Срок ответа</span><span>15 минут в рабочее время</span></div></div>`;
  const rp = $('#rp'), t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); rp.setAttribute('points', poly(e)); if (k < 1) requestAnimationFrame(f) })(t0);
}
qRender();

/* ---------- цифровой двойник: ответы из публичных материалов с источником ---------- */
(function () {
  const T = [
    ['С чего начинается стратегия?', 'Мы спрашиваем: «Как масштабировать?», «Как заработать больше?», «Как успеть всё?». Эти вопросы полезны. Они латают поверхность. Аристотель начинал с telos — конечной причины. С того, ради чего существует дело, семья, жизнь.', 'Канал, 13 октября 2026'],
    ['Зачем планировать на 144 года?', 'Планирование на 144 года — прекрасное упражнение, меняющее ум и представление о реальности. Мы по-настоящему увидели новые возможности и превращали свои фантазии в набор конкретных действий и выработку конкретных привычек.', 'Канал, 10 ноября 2026'],
    ['На чём держится семейная стратегия?', 'На четырёх причинах. Материальная — ваш род, капитал, опыт, травмы, таланты, связи. Действующая — вы, ваша воля и выбор. Формальная — ритуалы, решения, принципы, семейные правила, финансовые модели. Целевая — наследие на 144 года. Четвёртая задаёт направление первым трём.', 'Канал, 13 октября 2026'],
    ['Сейчас много дел. Когда лучше начать?', 'Знаю, что многие читают и думают: «Вот сейчас разберусь с делами и приду». Так вот, дела не закончатся никогда, а возможность начать может ускользнуть.', 'Канал, 3 ноября 2026'],
    ['Кто такой трекер?', 'Трекер — это специалист по кратному росту бизнеса путём работы с узкими местами в компании и проблемами в голове основателя.', 'Сайт Right Track']
  ];
  const tq = $('#tq'), tqa = $('#tqa'), src = $('#tsrc'), wave = $('#wave'); if (!tq) return;
  tq.innerHTML = T.map((t, i) => `<button type="button" data-i="${i}">${t[0]}</button>`).join('');
  wave.innerHTML = '<i></i>'.repeat(16); const bars = $$('i', wave); let timer, wv;
  const speak = on => { clearInterval(wv); if (on && !reduce) wv = setInterval(() => bars.forEach(b => b.style.height = 5 + Math.random() * 28 + 'px'), 110); else bars.forEach(b => b.style.height = '6px') };
  function ask(i) { clearInterval(timer); $$('button', tq).forEach((b, k) => b.classList.toggle('on', k === i)); const [q, a, s] = T[i]; src.innerHTML = '';
    tqa.innerHTML = `<span class="q">${q}</span><span id="tt"></span><span class="cur"></span>`; const tt = $('#tt'); let n = 0; speak(true);
    const done = () => { clearInterval(timer); tt.textContent = a; speak(false); src.innerHTML = `<span>Источник: <b>${s}</b></span><span>По публичным материалам Александра</span>` };
    if (reduce) return done();
    timer = setInterval(() => { n += 2; tt.textContent = a.slice(0, n); if (n >= a.length) done() }, 22) }
  tq.addEventListener('click', e => { const b = e.target.closest('button'); if (b) ask(+b.dataset.i) });
  let st = false; new IntersectionObserver(([e]) => { if (e.isIntersecting && !st) { st = true; ask(1) } }, { threshold: .35 }).observe(tqa);
})();

/* ---------- расписание ---------- */
const rows = [], presale = new Date(CFG.presale.until) > new Date();
rows.push(`<div class="row rv"><div class="d"><b>Весна 2027</b><small>Москва · 3 дня</small></div>
  <div><h3>«Сдвиг. Семейная стратегия»</h3><p>Стратегия семьи на 144 года. Мартовский поток 2026 распродан полностью, в ноябре за три дня до старта оставалось два места.</p>
  ${presale ? `<p data-window>Цена предзаписи 100 000 ₽ держится ещё <time class="cd" id="cdPre"></time></p>` : ''}</div>
  <div><span class="state g"><i class="dot"></i>Предзапись</span><div class="meter">Москва · 3 дня · 100 000 ₽</div></div>
  <a class="btn btn-gold btn-sm" href="shift.html#book">Занять место</a></div>`);
rows.push(`<div class="row rv"><div class="d"><b>Дата скоро</b><small>Москва · 2 дня</small></div>
  <div><h3>«Инструменты трекинга»</h3><p>Небольшая группа и много практики. Новым участникам 50 000 ₽, выпускникам от 20 000 ₽.</p></div>
  <div><span class="state y">Лист ожидания</span><div class="meter">Выпускники узнают дату первыми</div></div>
  <button type="button" class="btn btn-ghost btn-sm" data-open="Лист ожидания: «Инструменты трекинга»" data-sub="Сообщим дату первыми.">Сообщить о дате</button></div>`);
if (ng[0]) rows.push(`<div class="row rv"><div class="d"><b>${fmt(ng[0])}</b><small>Онлайн · 19:00 МСК</small></div>
  <div><h3>Групповой трекинг</h3><p>Двигаемся к целям на год, квартал, месяц. ${ng.length > 1 ? 'Дальше: ' + ng.slice(1, 4).map(fmt).join(', ') + '.' : ''}</p>
  <p data-window>До встречи <time class="cd" id="cdGroup"></time></p></div>
  <div><span class="state g"><i class="dot"></i>Идёт набор</span><div class="meter">7 000 ₽ в месяц · две встречи</div></div>
  <a class="btn btn-ghost btn-sm" href="club.html">Присоединиться</a></div>`);
$('#schedList').insertAdjacentHTML('afterbegin', rows.join('')); RT.observe();
if (presale) RT.countdown($('#cdPre'), CFG.presale.until);
if (ng[0]) RT.countdown($('#cdGroup'), ng[0]);
})();

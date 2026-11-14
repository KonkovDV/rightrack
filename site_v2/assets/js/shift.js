/* «Сдвиг»: карта династии, сохранение картинкой, бронь мест */
(() => {
'use strict';
const { $, $$, toast } = RT;
const CAP = ['Материальный', 'Социальный', 'Интеллектуальный', 'Человеческий', 'Культурный'], GEN = ['Вы', 'Дети', 'Внуки', 'Правнуки', 'Праправнуки'];
const Y0 = new Date().getFullYear(), val = [8, 6, 5, 4, 2], svg = $('#rings'), tip = $('#tip');
const r0 = 74, rw = 38, gap = .045, yr = g => Y0 + Math.round(g * 28.8);
const reach = v => Math.max(1, Math.min(5, Math.round(v / 2)));
const seg = c => [-Math.PI / 2 + c * 2 * Math.PI / 5 + gap, -Math.PI / 2 + (c + 1) * 2 * Math.PI / 5 - gap];
const arc = (ri, ro, a0, a1) => { const p = (r, a) => [(Math.cos(a) * r).toFixed(2), (Math.sin(a) * r).toFixed(2)].join(' ');
  return `M${p(ri, a0)}A${ri} ${ri} 0 0 1 ${p(ri, a1)}L${p(ro, a1)}A${ro} ${ro} 0 0 0 ${p(ro, a0)}Z` };
let h = '';
for (let c = 0; c < 5; c++) { const [a0, a1] = seg(c);
  for (let g = 0; g < 5; g++) h += `<path class="cell" data-c="${c}" data-g="${g}" d="${arc(r0 + g * rw + 3, r0 + (g + 1) * rw - 3, a0, a1)}"/>`;
  const am = (a0 + a1) / 2, R = r0 + 5 * rw + 26, x = Math.cos(am) * R, y = Math.sin(am) * R;
  h += `<text class="cl" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${Math.abs(x) < 30 ? 'middle' : x > 0 ? 'start' : 'end'}" ${Math.abs(x) >= 30 ? `dx="${x > 0 ? -14 : 14}"` : ''}>${CAP[c]}</text>` }
for (let g = 0; g <= 5; g++) h += `<text class="rl" x="0" y="${-(r0 + g * rw) + (g === 0 ? -6 : 4)}" text-anchor="middle" style="paint-order:stroke;stroke:#0a0907;stroke-width:5px">${yr(g)}</text>`;
h += `<circle r="${r0 - 14}" fill="none" stroke="rgba(255,200,30,.4)" stroke-dasharray="2 6"/><text text-anchor="middle" y="14" style="font:700 46px Manrope,sans-serif;fill:#fff;letter-spacing:-.04em">144</text><text text-anchor="middle" y="34" style="font:600 10px Manrope,sans-serif;fill:#a8a294;letter-spacing:.2em">ГОДА</text>`;
svg.innerHTML = h;
$('#caps').innerHTML = CAP.map((n, i) => `<div class="cap"><label for="cp${i}">${n}</label><input type="range" id="cp${i}" min="1" max="10" value="${val[i]}" data-i="${i}"><output id="co${i}"></output></div>`).join('');
function weakest() { const rs = val.map(reach), m = Math.min(...rs); return { m, i: rs.indexOf(m), all: rs.every(r => r === 5) } }
let touched = false;
function verdictText() { const w = weakest(); return w.all ? 'По этой шкале все пять капиталов доходят до праправнуков.' :
  `По этой шкале самое короткое звено — ${CAP[w.i].toLowerCase()} капитал. Его хватает ${w.m === 1 ? 'только на ваше поколение' : 'на ' + w.m + ' ' + (w.m < 5 ? 'поколения' : 'поколений')}.` }
function upd() {
  $$('.cell', svg).forEach(c => { const ci = +c.dataset.c, g = +c.dataset.g, on = g < reach(val[ci]); c.classList.toggle('lit', on); c.style.fillOpacity = on ? (1 - .16 * g) : ''; c.style.transitionDelay = on ? g * 60 + 'ms' : '0ms' });
  CAP.forEach((n, i) => { $('#co' + i).innerHTML = `до <b>${['вас', 'детей', 'внуков', 'правнуков', 'праправнуков'][reach(val[i]) - 1]}</b>`; $('#cp' + i).style.setProperty('--p', (val[i] - 1) / 9 * 100 + '%') });
  const w = weakest();
  const line = touched ? verdictText() : 'Сдвиньте шкалы под свою семью. Карта назовёт самое короткое звено.';
  $('#verdict').innerHTML = (touched && !w.all ? line.replace(CAP[w.i].toLowerCase() + ' капитал', `<b class="gold">${CAP[w.i].toLowerCase()} капитал</b>`) : line) + `<small>Горизонт: ${Y0} → ${Y0 + 144}</small>`;
}
$('#caps').addEventListener('input', e => { touched = true; val[+e.target.dataset.i] = +e.target.value; upd() });
svg.addEventListener('pointermove', e => { const c = e.target.closest('.cell'); if (!c) { tip.style.opacity = 0; return }
  const g = +c.dataset.g, r = svg.parentElement.getBoundingClientRect(); tip.innerHTML = `${GEN[g]} · ${CAP[+c.dataset.c]} капитал<small>${yr(g)}–${yr(g + 1)}</small>`;
  tip.style.left = e.clientX - r.left + 'px'; tip.style.top = e.clientY - r.top + 'px'; tip.style.opacity = 1 });
svg.addEventListener('pointerleave', () => tip.style.opacity = 0);
let started = false; new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; upd() } }, { threshold: .3 }).observe(svg);

/* сохранение карты картинкой 1200×1500 */
$('#savemap').onclick = async () => {
  try { await document.fonts.load('700 40px Manrope'); await document.fonts.load('italic 500 40px Playfair') } catch (e) { }
  const W = 1200, H = 1500, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  c.fillStyle = '#0b0a08'; c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(W / 2, 700, 60, W / 2, 700, 720); g.addColorStop(0, 'rgba(255,200,30,.16)'); g.addColorStop(1, 'rgba(255,200,30,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const fam = $('#fam').value.trim();
  c.fillStyle = '#a19b8c'; c.font = '600 22px Manrope,sans-serif'; c.textAlign = 'left'; c.fillText('RIGHT TRACK  ·  «СДВИГ. СЕМЕЙНАЯ СТРАТЕГИЯ»', 80, 104);
  c.fillStyle = '#f5f1e7'; c.font = '700 74px Manrope,sans-serif'; c.fillText('Карта династии', 80, 204);
  c.fillStyle = '#ffc81e'; c.font = 'italic 500 60px Playfair,Georgia,serif'; c.fillText(fam ? 'семьи ' + fam : Y0 + ' → ' + (Y0 + 144), 80, 282);
  const cx = W / 2, cy = 770, k = 1.5;
  for (let ci = 0; ci < 5; ci++) { const [a0, a1] = seg(ci);
    for (let gi = 0; gi < 5; gi++) { const on = gi < reach(val[ci]), ri = (r0 + gi * rw + 3) * k, ro = (r0 + (gi + 1) * rw - 3) * k;
      c.beginPath(); c.arc(cx, cy, ro, a0, a1); c.arc(cx, cy, ri, a1, a0, true); c.closePath();
      c.fillStyle = on ? `rgba(255,200,30,${1 - .16 * gi})` : 'rgba(255,255,255,.06)'; c.fill() }
    const am = (a0 + a1) / 2, R = (r0 + 5 * rw + 24) * k, x = cx + Math.cos(am) * R, y = cy + Math.sin(am) * R;
    c.fillStyle = '#e9e3d3'; c.font = '700 24px Manrope,sans-serif'; c.textAlign = Math.abs(x - cx) < 50 ? 'center' : x > cx ? 'left' : 'right'; c.fillText(CAP[ci], x + (Math.abs(x - cx) < 50 ? 0 : x > cx ? -30 : 30), y + 8) }
  c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '700 84px Manrope,sans-serif'; c.fillText('144', cx, cy + 22); c.fillStyle = '#a19b8c'; c.font = '600 18px Manrope,sans-serif'; c.fillText('Г О Д А', cx, cy + 56);
  c.textAlign = 'left'; c.fillStyle = '#ffc81e'; c.fillRect(80, 1262, 4, 96);
  c.fillStyle = '#f5f1e7'; c.font = '600 30px Manrope,sans-serif';
  const words = verdictText().split(' '); let line = '', y = 1296; for (const w of words) { if (c.measureText(line + w).width > 980) { c.fillText(line, 108, y); line = ''; y += 42 } line += w + ' ' } c.fillText(line, 108, y);
  c.fillStyle = '#8a8475'; c.font = '500 20px Manrope,sans-serif'; c.fillText('Поколения: ' + GEN.map((n, i) => n + ' ' + yr(i)).join('  ·  '), 80, 1436);
  cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'karta-dinastii.png'; document.body.appendChild(a); a.click(); a.remove(); toast('Карта сохранена картинкой') }, 'image/png');
};

/* ---------- бронь мест ----------
   Цена по правилу школы: 100 000 ₽, родственникам и партнёрам выпускников скидка 20%.
   Пара: если один из двоих выпускник, второй идёт со скидкой. TAKEN — занятые места из системы продаж. */
const seats = $('#seats'), N = 30, R = 162, TAKEN = [], PRICE = RT.CFG.presale.price, FEE = 15000; let mine = [], need = 1, rel = false;
const rub = n => n.toLocaleString('ru-RU') + ' ₽';
function drawSeats(focusI) { let s = '';
  for (let i = 0; i < N; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / N, x = Math.cos(a) * R, y = Math.sin(a) * R, t = TAKEN.includes(i), m = mine.includes(i);
    s += `<circle class="seat${t ? ' taken' : ''}${m ? ' mine' : ''}" data-i="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" ${t ? 'aria-hidden="true"' : `tabindex="0" role="button" aria-pressed="${m}" aria-label="Место ${i + 1}${m ? ', выбрано' : ''}"`}/>` }
  const free = N - TAKEN.length - mine.length;
  s += `<text class="seatc" text-anchor="middle" y="8" aria-hidden="true">${free}</text><text class="seatl" text-anchor="middle" y="34" aria-hidden="true">${RT.pl(free, 'МЕСТО СВОБОДНО', 'МЕСТА СВОБОДНЫ', 'МЕСТ СВОБОДНО')}</text>`;
  seats.innerHTML = s; seats.setAttribute('aria-label', `Места в круге: свободно ${free} из ${N}`);
  if (focusI != null) seats.querySelector(`.seat[data-i="${focusI}"]`)?.focus() }
function autoPick() { mine = []; for (let i = 0; i < N && mine.length < need; i++) if (!TAKEN.includes(i) && (need === 1 || !TAKEN.includes((i + 1) % N))) { mine.push(i); if (need === 2) mine.push((i + 1) % N) } }
function sum() { const total = need === 1 ? (rel ? PRICE * .8 : PRICE) : (rel ? PRICE + PRICE * .8 : PRICE * 2), fee = FEE * need;
  $('#bsum').textContent = rub(total); $('#bdep').textContent = rub(fee); $('#brest').textContent = rub(total - fee); return { total, fee } }
const relLabel = () => { $('#brelt').textContent = need === 1 ? 'Я родственник или партнёр выпускника «Сдвига»: скидка 20%' : 'Один из нас — выпускник «Сдвига»: второму скидка 20%' };
seats.addEventListener('click', e => { const s = e.target.closest('.seat'); if (!s || s.classList.contains('taken')) return; const i = +s.dataset.i;
  if (need === 1) mine = [i]; else { const j = !TAKEN.includes((i + 1) % N) ? (i + 1) % N : (i + N - 1) % N; mine = TAKEN.includes(j) ? [i] : [i, j] } drawSeats(e.detail === 0 ? i : null) });
seats.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const s = e.target.closest('.seat'); if (!s || s.classList.contains('taken')) return; e.preventDefault(); s.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })) });
$('#bn').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#bn button').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on) }); need = +b.dataset.v; relLabel(); autoPick(); drawSeats(); sum() });
$('#brel').addEventListener('change', e => { rel = e.target.checked; sum() });
$('#bgo').onclick = () => { const s = sum(); RT.open('Предзапись на «Сдвиг», весна 2027', `${need === 1 ? 'Одно место' : 'Два места'}: ${rub(s.total)}, оргвзнос ${rub(s.fee)} закрепляет место и цену.`) };
autoPick(); drawSeats(); relLabel(); sum();
/* окно цены предзаписи: настоящая дата из настроек, блок исчезает после неё */
const w = $('#preWin'); if (w && new Date(RT.CFG.presale.until) > new Date()) { w.hidden = false; RT.countdown($('#cdShift'), RT.CFG.presale.until) }
})();

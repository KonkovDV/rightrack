/* Трекерам: уровни мастерства, проверка своего уровня, лауреаты премии */
(() => {
'use strict';
const { $, $$ } = RT;
/* Требования взяты с действующей страницы реестра Right Track */
const L = ['Трекер', 'Линейный трекер', 'Старший трекер', 'Мастер-трекер'];
const R = [
  ['Практика работы с проектами', [15, 300, 1000, 4000], 'ч'],
  ['Дополнительное профильное образование', [0, 70, 210, 800], 'ч'],
  ['Работа с супервизором', [5, 20, 75, 200], 'ч'],
  ['Работа с трекером в роли клиента', [5, 20, 75, 200], 'ч'],
  ['Личная психотерапия или консультации', [0, 0, 75, 200], 'ч'],
  ['Защита кейса кратного роста', [0, 1, 1, 1], 'b'],
  ['Ученики уровня «линейный трекер» и выше', [0, 0, 0, 10], 'u']
];
$('#lvl').innerHTML = L.map((n, i) => `<button type="button" data-i="${i}"><small>Уровень ${i + 1}</small><b>${n}</b></button>`).join('');
$('#reqs').innerHTML = R.map(r => `<div class="req"><span>${r[0]}</span><div class="track"><i></i></div><b></b></div>`).join('');
function setL(i) { $$('#lvl button').forEach((b, k) => b.classList.toggle('on', k === i));
  $$('#reqs .req').forEach((el, k) => { const [, v, t] = R[k], x = v[i], max = v[3];
    el.classList.toggle('off', !x); el.querySelector('i').style.width = x ? Math.max(4, t === 'b' ? 100 : Math.pow(x / max, .45) * 100) + '%' : '0';
    el.querySelector('b').textContent = !x ? 'не требуется' : t === 'b' ? 'обязательна' : t === 'u' ? x + '+ учеников' : x.toLocaleString('ru-RU') + '+ часов' }) }
$('#lvl').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setL(+b.dataset.i) });
setL(1);

/* где вы сейчас */
const my = [['Практика с проектами', 4000, 120, 0], ['Профильное обучение', 800, 40, 1], ['Супервизия', 200, 8, 2]];
$('#myCaps').innerHTML = my.map((m, i) => `<div class="cap"><label for="my${i}">${m[0]}</label><input type="range" id="my${i}" min="0" max="${m[1]}" step="${m[1] / 200}" value="${m[2]}" data-i="${i}"><output id="mo${i}"></output></div>`).join('');
function upd() { const v = my.map((m, i) => +$('#my' + i).value);
  my.forEach((m, i) => { $('#mo' + i).innerHTML = `<b>${Math.round(v[i]).toLocaleString('ru-RU')}</b> ч`; $('#my' + i).style.setProperty('--p', v[i] / m[1] * 100 + '%') });
  let lvl = -1; for (let i = 0; i < 4; i++) if (my.every((m, k) => v[k] >= R[m[3]][1][i])) lvl = i;
  $('#myLvl').innerHTML = lvl < 0 ? 'Вы в <span class="serif gold">начале пути</span>' : `Ваш уровень по часам: <span class="serif gold">${L[lvl].toLowerCase()}</span>`;
  if (lvl === 3) return $('#myNext').textContent = 'Часы соответствуют высшему уровню. Остаются защита кейса, личная терапия и десять учеников с успешными кейсами.';
  const n = lvl + 1, miss = my.map((m, k) => [m[0].toLowerCase(), R[m[3]][1][n] - v[k]]).filter(x => x[1] > 0).map(x => `${x[0]}: ещё ${Math.ceil(x[1]).toLocaleString('ru-RU')} ч`);
  $('#myNext').textContent = `До уровня «${L[n].toLowerCase()}»: ${miss.join(', ')}.` + (n ? ' Плюс защита кейса перед комиссией Right Track.' : ' Плюс обучение базовым инструментам трекинга.') }
$('#myCaps').addEventListener('input', upd); upd();

/* лауреаты 2025, по странице премии */
const W = [['Трекер года', 'Евгений Морозов'], ['Производственные проекты', 'Сергей Тюльпин'], ['Инновационные проекты', 'Иван Шашков'], ['Стартапы', 'Павел Михайлов'], ['Молодёжные проекты', 'Елена Степанова'], ['IT-проекты', 'Игорь Филатов'], ['Студенческие проекты', 'Наталия Мушкарёва'], ['Корпоративные акселераторы', 'Константин Осипов'], ['AI-проекты', 'Ольга Степанова'], ['BioTech-проекты', 'Алла Панченко'], ['MedTech-проекты', 'Михаил Бодунков'], ['Вклад в профессию', 'Андрей Майер']];
$('#laur').innerHTML = W.map((w, i) => `<div class="${i ? '' : 'w'}"><b>${w[1]}</b>${i === 11 ? 'Премия за вклад в профессию' : i ? 'Лучший трекер: ' + w[0].toLowerCase().replace('it-', 'IT-').replace('ai-', 'AI-').replace('biotech', 'BioTech').replace('medtech', 'MedTech') : w[0]}</div>`).join('');
})();

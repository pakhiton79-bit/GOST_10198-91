
// ============ Фильтр толщин пиломатериала "в наличии" ============
// Пользователь отмечает галочками, какие толщины (1-300 мм) есть на складе.
// Выбор хранится в localStorage отдельно для этой комплектации ящика
// (ГОСТ 10198-91, тип 1, комплектация 3) и переживает перезагрузку страницы.
// Если ничего не выбрано - округление до складских номиналов не применяется,
// расчёт идёт строго по значениям, которые даёт сам ГОСТ 10198-91.
const THICKNESS_STORAGE_KEY = 'silvan-gost10198-t1-k3-available-thickness';
// Стандартный ряд толщин пиломатериала (сортаментный ряд) - округление "в наличии"
// возможно только до одного из этих значений, не до произвольного мм.
const AVAILABLE_THICKNESS_OPTIONS = [16, 19, 22, 25, 32, 40, 50, 60, 75, 100, 125, 150, 175, 200];

function loadAvailableThicknesses(){
  try{
    const raw = localStorage.getItem(THICKNESS_STORAGE_KEY);
    if(!raw) return [];
    const arr = JSON.parse(raw).filter(v => AVAILABLE_THICKNESS_OPTIONS.includes(v));
    return arr.sort((a,b)=>a-b);
  }catch(e){ return []; }
}
function saveAvailableThicknesses(){
  try{ localStorage.setItem(THICKNESS_STORAGE_KEY, JSON.stringify(availableThicknesses)); }catch(e){}
}

let availableThicknesses = loadAvailableThicknesses();
let thicknessLimitExceeded = false; // взводится в roundUpToAvailable(), если расчётная толщина больше максимальной выбранной "в наличии"

// Округление вверх до ближайшей выбранной толщины "в наличии".
// Список пуст -> округление не выполняется, толщина возвращается как есть (строго по ГОСТ).
// Если расчётная толщина превышает даже максимальную из выбранных "в наличии" -
// значение НЕ занижается до складского максимума (заниженная толщина для детали,
// которая требует больше, недопустима вне зависимости от того, что есть на складе),
// а остаётся расчётным по ГОСТ; при этом взводится предупреждение.
function roundUpToAvailable(t){
  if(availableThicknesses.length === 0) return t;
  for(const a of availableThicknesses){ if(t<=a) return a; }
  thicknessLimitExceeded = true;
  return t;
}

function buildThicknessCheckboxList(){
  const list = document.getElementById('thicknessCheckboxList');
  let html = '';
  AVAILABLE_THICKNESS_OPTIONS.forEach(t=>{
    const checked = availableThicknesses.includes(t) ? ' checked' : '';
    html += `<label><input type="checkbox" value="${t}"${checked} onchange="onThicknessCheckboxChange(this)"> ${t} мм</label>`;
  });
  list.innerHTML = html;
}

// Скрывает индикатор «Расчёт выполнен» при любом изменении входных данных
// (размеры, масса, толщины «в наличии», тип крепления, доп. опции) - иначе
// после смены параметров на экране остаются устаревшие результаты расчёта.
function invalidateCalc(){
  document.getElementById('calcCheck').style.visibility = 'hidden';
}

function onThicknessCheckboxChange(el){
  const v = parseInt(el.value, 10);
  if(el.checked){
    if(!availableThicknesses.includes(v)) availableThicknesses.push(v);
  } else {
    availableThicknesses = availableThicknesses.filter(x=>x!==v);
  }
  availableThicknesses.sort((a,b)=>a-b);
  saveAvailableThicknesses();
  updateThicknessSummary();
  invalidateCalc();
}

function setAllThickness(state){
  availableThicknesses = state ? AVAILABLE_THICKNESS_OPTIONS.slice() : [];
  buildThicknessCheckboxList();
  saveAvailableThicknesses();
  updateThicknessSummary();
  invalidateCalc();
}

function updateThicknessSummary(){
  const label = document.getElementById('thicknessDropdownLabel');
  const note  = document.getElementById('thicknessNote');
  const total = AVAILABLE_THICKNESS_OPTIONS.length;
  if(availableThicknesses.length === 0){
    label.textContent = 'Толщины не выбраны - расчёт строго по ГОСТ';
    note.innerHTML = '⚠ Толщины «в наличии» не выбраны — расчёт по ГОСТ 10198-91 без округления.';
    note.style.display = 'block';
  } else if(availableThicknesses.length === total){
    label.textContent = `Выбраны все толщины (${AVAILABLE_THICKNESS_OPTIONS[0]}-${AVAILABLE_THICKNESS_OPTIONS[total-1]} мм)`;
    note.style.display = 'none';
  } else {
    const shown = availableThicknesses.slice(0,8).join(', ');
    const more = availableThicknesses.length > 8 ? `, ещё ${availableThicknesses.length-8} знач.` : '';
    label.textContent = `Выбрано (${availableThicknesses.length}): ${shown} мм${more}`;
    note.style.display = 'none';
  }
}

function toggleThicknessDropdown(){
  document.getElementById('thicknessDropdownPanel').classList.toggle('open');
}
// Общий обработчик для всех выпадающих списков (толщины, тип крепления и т.п.):
// закрывает панель, если клик произошёл вне её обёртки .dropdown-wrap.
document.addEventListener('click', e=>{
  document.querySelectorAll('.dropdown-wrap').forEach(wrap=>{
    if(!wrap.contains(e.target)){
      const p = wrap.querySelector('.thickness-dropdown-panel');
      if(p) p.classList.remove('open');
    }
  });
});

buildThicknessCheckboxList();
updateThicknessSummary();

// ============ Тип крепления груза (сечение полоза) ============
// Выбор хранится в localStorage отдельно для этой комплектации ящика, как и
// фильтр толщин. Реализовано пока только «за полозья» - остальные варианты
// показаны в списке, но отключены.
const FASTENING_STORAGE_KEY = 'silvan-gost10198-t1-k3-fastening-type';
const FASTENING_LABELS = {
  skid:           'Крепление за полозья',
  floor_boards:   'Крепление к доскам дна',
  mounting_beams: 'Крепление к крепёжным брусьям',
  frame:          'Крепление на металлической или деревянной раме'
};

function loadFasteningType(){
  // Тип крепления зафиксирован на конкретный файл (см. src/variants/) -
  // остальные типы, кроме своего и переключаемого на другой файл, отключены
  // в интерфейсе, поэтому даже если в localStorage с прошлых сессий сохранён
  // другой тип, он игнорируется.
  /*__FASTENING_DEFAULT__*/
}
function saveFasteningType(){
  try{ localStorage.setItem(FASTENING_STORAGE_KEY, fasteningType); }catch(e){}
}

let fasteningType = loadFasteningType();

function onFasteningTypeChange(el){
  fasteningType = el.value;
  saveFasteningType();
  updateFasteningSummary();
  invalidateCalc();
}

function updateFasteningSummary(){
  document.getElementById('fasteningDropdownLabel').textContent = FASTENING_LABELS[fasteningType];
  document.querySelectorAll('input[name="fasteningType"]').forEach(r=>{ r.checked = (r.value === fasteningType); });
}

function toggleFasteningDropdown(){
  document.getElementById('fasteningDropdownPanel').classList.toggle('open');
}

updateFasteningSummary();

// «Убрать подполозные доски» и «Погрузка авто/электропогрузчиком» взаимоисключающие:
// требование ≥300мм для погрузчика (п.1.6.11) проверяется именно по подполозным
// доскам, а если их совсем убрать - проверять и требовать становится нечего.
function onSkidForkliftExclusive(el){
  if(el.checked){
    const otherId = el.id === 'removeSkidBoards' ? 'forkliftLoading' : 'removeSkidBoards';
    const other = document.getElementById(otherId);
    if(other && other.checked) other.checked = false;
  }
  invalidateCalc();
}

function calculate(){
  const errEl = document.getElementById('err');
  errEl.textContent = '';
  invalidateCalc();
  thicknessLimitExceeded = false;
  const L = parseFloat(document.getElementById('L').value);
  const W = parseFloat(document.getElementById('W').value);
  const H = parseFloat(document.getElementById('H').value);
  const MASS = parseFloat(document.getElementById('M').value);
  const optimizeSizes = document.getElementById('optimizeSizes').checked;
  // Чекбокс есть только у варианта "за полозья" - при креплении к доскам дна
  // убирать их нельзя (они и есть точка крепления), опция скрыта в HTML.
  const removeFloorBoardsEl = document.getElementById('removeFloorBoards');
  const removeFloorBoards = removeFloorBoardsEl ? removeFloorBoardsEl.checked : false;
  const removeSkidBoards = document.getElementById('removeSkidBoards').checked;
  const roundBoardWidths = document.getElementById('roundBoardWidths').checked;
  const solidRigidBase = document.getElementById('solidRigidBase').checked;
  const forkliftLoading = document.getElementById('forkliftLoading').checked;

  if(!L || !W || !H || !MASS || L<=0 || W<=0 || H<=0 || MASS<=0){
    errEl.textContent = 'Заполните все поля положительными числами.';
    return;
  }
  if(L <= 1200 || W <= 800){
    errEl.textContent = `Габариты ${L}×${W} мм не превышают 1200×800 мм. Применяется ГОСТ 21140.`;
    return;
  }
  if(MASS > 3000){
    errEl.textContent = 'Масса груза превышает 3000 кг — вне области действия типа I-3 (ГОСТ 10198-91, Табл. 1).';
    return;
  }
  const wallRaw = wallThickness(MASS); // п.1.6.15 — толщина досок/планок/раскосов стенок и крышки
  const wall = {value: roundUpToAvailable(wallRaw.value), exceeded: wallRaw.exceeded};
  let warnings = [];
  if(wall.exceeded){
    warnings.push('Масса вне диапазона п.1.6.15 — толщина стенок принята по верхней границе (25 мм).');
  }

  // --- ДНО ---
  // Формулы согласованы с конструктором Сильвана (файл «ГОСТ_1019891_уточнённая
  // логика.docx») — длина полоза считается через толщину деталей щита торцевого
  // (см. ниже), а не через старую константу L+100.
  const dno = [];
  // Ширина для расчёта полозьев (шаг осей, Табл. 19) - ширина груза + толщина
  // досок бокового щита*2 (без боковых планок - см. уточнение пользователя).
  const skidCalcWidth = W + wall.value*2;
  const widthMinSkids162 = minSkidsByWidth162(skidCalcWidth); // п.1.6.2 — общий предел 1200 мм между осями полозьев, для любого типа крепления

  // Длина полоза (п.1.6.2 — равна наружной длине ящика): планка_торца + доска_торца +
  // планка_торца + доска_торца + длина_груза (формула из docx конструктора). Толщина
  // досок/планок торца общая для всех стенок и крышки (п.1.6.15) = wall.value.
  const t_doska_torca = wall.value, t_planka_torca = wall.value;
  const k9Base = L + (t_planka_torca + t_doska_torca) * 2;

  let l9, t9, w9;
  if(solidRigidBase){
    // Галочка «сплошное жёсткое основание груза» - полозья по-старому: п.1.6.5
    // (только по массе груза, без учёта рабочей длины полоза).
    const l9_default = (W>1100) ? 3 : 2; // логика исходной таблицы подтверждена как верная, менять не нужно
    l9 = l9_default;
    const poloz = polozSection165(MASS); // п.1.6.5 — крепление за полозья в пределах основания груза / за изделие
    if(poloz.exceeded){
      warnings.push('Масса вне диапазона п.1.6.5 (500–20000 кг) — сечение полоза принято по крайнему значению таблицы.');
    }
    if(l9_default < widthMinSkids162){
      l9 = widthMinSkids162;
    }
    t9 = roundUpToAvailable(poloz.h); w9 = poloz.w;
  } else {
    // По умолчанию - новый стандарт (Табл. 19): по массе, рабочей длине полоза
    // (= k9Base) и количеству полозьев (приоритет - совпадение высоты полоза с
    // одной из выбранных «в наличии» толщин, затем минимальное число полозьев).
    const sel = selectSkid19(MASS, k9Base, skidCalcWidth);
    l9 = sel.count; t9 = roundUpToAvailable(sel.h); w9 = sel.w;
    if(sel.massSnapped){
      warnings.push(`Масса ${MASS} кг отсутствует в Табл. 19 — принята ближайшая (${sel.massUsed} кг).`);
    }
    if(sel.lengthSnapped){
      warnings.push(`Длина полоза ${Math.round(k9Base)} мм отсутствует в Табл. 19 — принята ближайшая (${sel.lengthUsed} мм).`);
    }
    if(sel.spacingExceeded){
      warnings.push(`Шаг между осями полозьев >1200 мм (п.1.6.2) не устранён — принято максимальное количество по Табл. 19 (${sel.count} шт.).`);
    }
    if(sel.extrapolatedCount){
      warnings.push(`Табл. 19 не предусматривает ${sel.extrapolatedCount} полоза(ьев) для массы ${sel.massUsed} кг — ширина сечения уменьшена на 1 градацию от максимального варианта в таблице (примечание к Табл. 19; шаг между осями ≤1200 мм, п.1.6.2).`);
    }
  }
  dno.push({name:'Полоз', t:t9, w:w9, l:k9Base, qty:l9});

  // Подполозная доска: толщина по массе груза (п.1.6.11, Апдейт по подполозным доскам),
  // при включённой «Погрузка авто/электропогрузчиком» - не менее 50мм (если по массе не
  // требуется больше). Ширина равна ширине полоза, но не более 150мм. Отступ 200мм от
  // каждого конца полоза - длина = длина полоза - 400мм. Минимум по факту 300мм; если
  // формула даёт меньше - не блокируем, только предупреждаем (практика Сильвана, не
  // пункт ГОСТа). При включённой «Погрузка авто/электропогрузчиком» и невыполнении
  // требования по длине (300мм) - дополнительно текстовое предупреждение и вместо
  // размеров в таблице выводится ⚠ (по указанию пользователя - оба предупреждения
  // сосуществуют, не заменяют друг друга).
  const t10Raw = forkliftLoading ? Math.max(subfloorThicknessRaw(MASS), 50) : subfloorThicknessRaw(MASS);
  const t10=roundUpToAvailable(t10Raw), w10=Math.min(w9, 150), k10=k9Base-400, l10=l9;
  if(k10 < 300){
    warnings.push(`Длина подполозной доски ${Math.round(k10)} мм менее 300 мм.`);
  }
  const subfloorForkliftFail = forkliftLoading && k10 < 300;
  if(subfloorForkliftFail){
    warnings.push(`Требование ≥300 мм для подполозной доски при погрузке погрузчиком не выполнено (${Math.round(k10)} мм).`);
  }
  if(!removeSkidBoards){
    dno.push({
      name:'Подполозная доска',
      t: subfloorForkliftFail ? '⚠' : t10,
      w: subfloorForkliftFail ? '⚠' : w10,
      l: subfloorForkliftFail ? '⚠' : k10,
      qty: subfloorForkliftFail ? '⚠' : l10
    });
  }

  const endBeam = endBeamSection(MASS); // п.1.6.8
  const t11=roundUpToAvailable(endBeam.h), w11=endBeam.w, k11=W, l11=2;
  dno.push({name:'Торцовый брус дна', t:t11, w:w11, l:k11, qty:l11});

  /*__FLOOR_BOARD_CALC__*/
  // Доска дна: максимум досок 100мм + при необходимости 1-2 доски 75-99мм на остаток
  // (fillBoards), заполняем пространство (длина груза - 2×ширина торцового бруса дна).
  const fbDno = fillBoards(L - w11*2, roundBoardWidths);
  const w12 = 100, l12 = fbDno.mainQty;
  if(!removeFloorBoards){
    if(l12>0) dno.push({name:'Доска дна', t:t12, w:w12, l:k12, qty:l12});
    fbDno.extra.forEach((e,i)=>{
      dno.push({name:'Доска дна (дополнительная) '+(i+1), t:t12, w:e.width, l:k12, qty:e.qty});
    });
    if(fbDno.warn){
      warnings.push('Доска дна: остаток занят доской нестандартной ширины (вне 75–99 мм).');
    }
    if(fbDno.singleNarrow){
      warnings.push('Доска дна: применена одна доска шириной менее 100 мм.');
    }
  }

  const volDno = vol(t9,w9,k9Base,l9)+(removeSkidBoards ? 0 : vol(t10,w10,k10,l10))+vol(t11,w11,k11,l11)
    + (removeFloorBoards ? 0 : (vol(t12,w12,k12,l12)
      + fbDno.extra.reduce((s,e)=>s+vol(t12,e.width,k12,e.qty),0)));

  // --- Наружные размеры ---
  // Длина - через k9Base (длина груза + (доска торца + планка торца)*2 - уже
  // считает наружную длину, см. комментарий у k9Base выше).
  const outerL = k9Base;
  // Ширина груза + толщина досок бокового щита*2 + толщина боковых планок*2.
  const outerW = W + wall.value*4;
  // H + (подполозная доска, если не убрана) + полоз + доска дна (t12 уже 0,
  // если убрана - см. variants/floor_board_*.js) + доска крышки + планка крышки.
  const outerH = (removeSkidBoards ? 0 : t10) + t9 + t12 + wall.value + wall.value + H;

  // --- КРЫШКА ---
  const kryshka = [];

  // Планка крышки: толщина общая (п.1.6.15) = wall.value, длина = внутренняя ширина +
  // 2×толщина горизонтальной планки бокового щита (тоже wall.value — толщина у всех
  // планок общая). Количество — правило 1/6 длины, капается на 1000мм (docx конструктора).
  const t19=wall.value, w19=100, k19=W+wall.value*2;
  // Крайние 2 планки — на расстоянии min(1/6 длины ящика, 1000мм) от торцов; между
  // планками (и между крайней планкой и соседней) — не более 1000мм. Если по расчёту
  // расстояние между крайними планками отрицательное — не считаем, предупреждаем.
  const edgeDistKryshka = Math.min(k9Base/6, 1000);
  const middleKryshka = k9Base - edgeDistKryshka*2;
  let l19;
  if(middleKryshka < 0){
    warnings.push(`Планка крышки: длина ящика ${Math.round(k9Base)} мм недостаточна для отступа — принято минимальное количество (2 шт.).`);
    l19 = 2;
  } else {
    l19 = ceilInt(middleKryshka/1000) + 1;
  }
  kryshka.push({name:'Планка', t:t19, w:w19, l:k19, qty:l19});

  // Расстояние между соседними планками крышки - тот же шаг, что и у планок бокового
  // щита (стоят по тем же местам). Считается сразу здесь (не только в блоке «ЩИТ
  // БОКОВОЙ» ниже), т.к. нужен также для чертежа крышки, который рендерится раньше.
  const bokSectionW = l19 > 1 ? middleKryshka / (l19 - 1) : 0;

  // Доска крышки: заполняем (ширина груза + 2×толщина доски бок. щита) досками 100мм +
  // при необходимости 1-2 доски 75-99мм на остаток (fillBoards). Длина каждой доски —
  // та же наружная длина, что и у полоза (k9Base).
  const t20 = wall.value, k20 = k9Base;
  const fbKryshka = fillBoards(W + wall.value*2, roundBoardWidths);
  const w20 = 100, l20 = fbKryshka.mainQty;
  if(l20>0) kryshka.push({name:'Доска крышки', t:t20, w:w20, l:k20, qty:l20});
  fbKryshka.extra.forEach((e,i)=>{
    kryshka.push({name:'Доска крышки (дополнительная) '+(i+1), t:t20, w:e.width, l:k20, qty:e.qty});
  });
  if(fbKryshka.warn){
    warnings.push('Доска крышки: остаток занят доской нестандартной ширины (вне 75–99 мм).');
  }
  if(fbKryshka.singleNarrow){
    warnings.push('Доска крышки: применена одна доска шириной менее 100 мм.');
  }

  // Внутренний поперечный брус: толщина и ширина по Таблице 14 (масса + наружная ширина
  // ящика; ширина по таблице всегда 100мм). Количество — временная формула Сильвана
  // (длина груза : 800, округление вверх), позже уточнят.
  const crossBeam = crossBeamThickness(MASS, outerW); // Табл. 14
  if(crossBeam.exceeded){
    warnings.push('Масса или ширина ящика вне Табл. 14 — брус крышки принят по крайнему значению.');
  }
  const t21=roundUpToAvailable(crossBeam.value), w21=100, k21=W - (optimizeSizes ? 4 : 0), l21=ceilInt(L/800);
  kryshka.push({name:'Внутренний поперечный брус', t:t21, w:w21, l:k21, qty:l21});

  const volKryshka = vol(t19,w19,k19,l19)+vol(t20,w20,k20,l20)+vol(t21,w21,k21,l21)
    + fbKryshka.extra.reduce((s,e)=>s+vol(t20,e.width,k20,e.qty),0);

  // --- ЩИТ ТОРЦЕВОЙ (расчёт на 1 щит, далее удвоение) ---
  // Наружная высота ящика (толщина полоза + толщина доски дна + высота груза +
  // толщина доски крышки + толщина планки крышки, см. outerH выше) определяет
  // число "этажей" щита торцевого: до 2000мм включительно - 1 этаж (как раньше),
  // свыше 2000 и до 4000мм (не включительно) - 2 этажа: добавляется третья
  // горизонтальная планка ровно посередине, вертикальные планки и раскосины
  // удваиваются, каждый этаж считается по тем же правилам (угол 20-60°, макс. 4 секции
  // по ширине), что и обычный щит ≤2000мм, но на свою половину высоты (см. файл
  // «2000мм+.docx» - недосекции и «секция типа А» из более раннего docx конструктора
  // этим файлом отменены, по подтверждению пользователя). Свыше 4000мм (не включительно)
  // - методика не описана, расчёт для такой высоты не выполняется (по договорённости).
  const torecFloors = outerH > 2000 ? 2 : 1;
  if(outerH >= 4000){
    errEl.textContent = `Наружная высота ящика ${Math.round(outerH)} мм — не менее 4000 мм. Расчёт не выполняется.`;
    return;
  }

  // Горизонтальная планка: длина = ширина груза. Количество — 2 (верх/низ) при 1 этаже,
  // 3 (верх/середина/низ) при 2 этажах. Толщина общая (п.1.6.15).
  const t31 = wall.value, w31 = 100, k31_ = W, l31 = torecFloors === 2 ? 3 : 2;

  // Вертикальная планка (на 1 этаж): длина = (высота груза + толщина доски дна) минус
  // суммарную ширину горизонтальных планок (2 или 3, по числу этажей), поделенная на
  // число этажей (при 2 этажах — ровно пополам, см. «2000мм+.docx»).
  const t30 = wall.value, w30 = 100;
  const k30 = torecFloors === 2
    ? ((H + t12) - w31*3) / 2
    : (H + t12) - w31*2;

  // Число секций по ширине: растим от 1, пока угол раскосины к горизонтальной планке
  // (20-60°) не встанет в диапазон; если при 1 секции угол > 60° — раскосины нет вообще.
  // Ограничение — максимум 4 секции (шире пока не считаем).
  function torecSectionWidth(sections){
    return (W - w30*(sections+1)) / sections;
  }
  function torecAngleDeg(sections){
    return Math.atan2(k30, torecSectionWidth(sections)) * 180 / Math.PI;
  }
  // Порог отключения раскосины (≤600мм) считается по высоте ГРУЗА (H, поле «Высота»),
  // а не по наружной высоте ящика outerH - в отличие от остальных порогов (2000мм,
  // 4000мм и т.п.), которые остаются по outerH (по договорённости с пользователем).
  let torecSections = 1;
  if(H > 600 && W > 600){
    while(torecAngleDeg(torecSections) < 20 && torecSections < 4){
      torecSections++;
    }
    if(torecAngleDeg(torecSections) < 20){
      warnings.push('Щит торцевой: угол раскосины менее 20° даже при 4 секциях — расчёт свыше 4 секций не реализован.');
    }
  }
  // п.102 docx: при ширине груза 600мм или менее раскосины на торце тоже не нужны
  // (независимо от высоты).
  const torecHasRaskosina = H > 600 && W > 600 && !(torecSections === 1 && torecAngleDeg(1) > 60);

  const l30 = (torecSections + 1) * torecFloors; // вертикальная планка: (секций+1) на каждый этаж

  // Раскосина: гипотенуза прямоугольного треугольника, катеты — ширина секции (FK) и
  // длина вертикальной планки (KD, высота между гор. планками одного этажа). 1 раскосина
  // на секцию на каждый этаж.
  const t33 = wall.value, w33 = 100;
  const torecSectionW = torecSectionWidth(torecSections);
  const k33 = Math.sqrt(Math.pow(torecSectionW,2) + Math.pow(k30,2));
  const l33 = torecHasRaskosina ? torecSections * torecFloors : 0;

  // Доска торца: заполняем (высота груза + толщина доски дна) досками 100мм + при
  // необходимости 1-2 доски 75-99мм на остаток (fillBoards). Длина каждой доски = ширина груза.
  const t32 = wall.value, k32 = W;
  const fbTorec = fillBoards(H + t12, roundBoardWidths);
  const w32 = 100, l32 = fbTorec.mainQty;
  if(fbTorec.warn){
    warnings.push('Доска торца: остаток занят доской нестандартной ширины (вне 75–99 мм).');
  }
  if(fbTorec.singleNarrow){
    warnings.push('Доска торца: применена одна доска шириной менее 100 мм.');
  }

  const volTorPanel = vol(t30,w30,k30,l30) + vol(t31,w31,k31_,l31)
    + vol(t32,w32,k32,l32) + fbTorec.extra.reduce((s,e)=>s+vol(t32,e.width,k32,e.qty),0)
    + vol(t33,w33,k33,l33);

  const endPanel = [
    {name:'Вертикальная планка', t:t30, w:w30, l:k30, qty:l30},
    {name:'Горизонтальная планка', t:t31, w:w31, l:k31_, qty:l31},
  ];
  if(torecHasRaskosina) endPanel.push({name:'Раскосина', t:t33, w:w33, l:k33, qty:l33});
  if(l32>0) endPanel.push({name:'Доска торца', t:t32, w:w32, l:k32, qty:l32});
  fbTorec.extra.forEach((e,i)=>{
    endPanel.push({name:'Доска торца (дополнительная) '+(i+1), t:t32, w:e.width, l:k32, qty:e.qty});
  });

  // --- ЩИТ БОКОВОЙ (расчёт на 1 щит, далее удвоение) ---
  // Число этажей бокового щита определяется НЕЗАВИСИМО от торца (у них может быть
  // разная этажность на одном и том же ящике) - та же граница по наружной высоте
  // (>2000мм), ЛИБО, если угол укосины при 1 этаже вышел бы за 60° - боковой щит
  // переводится на 2 этажа именно из-за угла, даже если торец остаётся на 1-м.
  // Раскосина отключена по тем же общим условиям высоты, что и у торца (высота
  // ГРУЗА H, а не наружная высота ящика outerH - см. комментарий у torecHasRaskosina) —
  // ширина груза на боковой щит не влияет (в отличие от торца, п.102 docx касается
  // только торца). В отличие от торца, у бокового щита нет верхней/нижней
  // горизонтальной планки вообще — при 2 этажах добавляется только одна средняя
  // (см. «2000мм+.docx»: «нет верхней и нижней планок, только центральная, а укосины
  // упираются в края крышки»).
  const bokHasRaskosina = H > 600 && l19 > 1;
  const bokAngle1FloorDeg = bokSectionW > 0 ? Math.atan2(H + t12, bokSectionW) * 180 / Math.PI : null;
  const bokFloors = (outerH > 2000 || (bokHasRaskosina && bokAngle1FloorDeg !== null && bokAngle1FloorDeg > 60)) ? 2 : 1;

  // Горизонтальная планка бокового щита (только при 2 этажах, средняя, делит щит
  // пополам по высоте) — длина равна длине доски бока (наружная длина полоза).
  const t43 = wall.value, w43 = 100, k43 = k9Base, l43 = bokFloors === 2 ? 1 : 0;

  // Вертикальная планка: длина = (расстояние, на которое планка перекрывает полоз
  // [2/3 толщины полоза, не более 70мм] + толщина доски дна + высота груза) - при 1
  // этаже целиком; при 2 этажах - та же величина минус ширина средней горизонтальной
  // планки, пополам на каждый этаж (формула для любой этажности одна и та же, просто
  // при 1 этаже вычитать/делить не на что). Количество — равно количеству планок
  // крышки (l19) на этаж, ×2 при 2 этажах (планки бокового щита стоят по тем же
  // местам, что и планки крышки, на каждом этаже).
  // При «Оптимизировать размеры» толщина планки бокового щита увеличивается
  // ровно на 2мм от фактически используемой толщины (wall.value - уже округлённой
  // до доступной «в наличии»), а не от расчётной по ГОСТ (wallRaw.value) - иначе при
  // грубом шаге между доступными толщинами оба варианта (с галочкой и без)
  // могли округлиться до одного и того же значения, и +2мм визуально пропадали.
  // Результат НЕ округляется повторно вверх до следующей доступной толщины: это
  // намеренная оптимизационная надбавка (п. 1.6.15 - подгонка под груз), а не
  // отдельное требование по ГОСТ, поэтому итоговое значение (например 27мм при
  // доступных 25 и 32) может формально отсутствовать в списке «в наличии» - это
  // ожидаемо и не считается превышением/недостачей стандартных толщин.
  const t40 = optimizeSizes ? wall.value + 2 : wall.value, w40 = 100;
  const bokOverhang = Math.min(t9*2/3, 70);
  const bokPlankFull = H + t12 + bokOverhang;
  const k40 = bokFloors === 2 ? (bokPlankFull - w43) / 2 : bokPlankFull;
  const l40 = l19 * bokFloors;

  // Основная доска бока: заполняем (высота груза + толщина доски дна) досками 100мм +
  // при необходимости доп. доски 75-99мм (fillBoards). Длина каждой доски = длина груза +
  // 2×(толщина доски торца + толщина вертикальной планки торца) — та же величина, что и
  // наружная длина полоза (k9Base).
  const t41 = wall.value, k41 = k9Base;
  const fbBok = fillBoards(H + t12, roundBoardWidths);
  const w41 = 100, l41 = fbBok.mainQty;
  if(fbBok.warn){
    warnings.push('Доска бока: остаток занят доской нестандартной ширины (вне 75–99 мм).');
  }
  if(fbBok.singleNarrow){
    warnings.push('Доска бока: применена одна доска шириной менее 100 мм.');
  }

  // Раскосина: 1 на секцию на каждый этаж, где секция — промежуток между соседними
  // планками бокового щита (расстояние между ними ≤1000мм, "укосины упираются в края
  // крышки" — горизонтальная привязка секций не меняется от числа этажей). Катеты —
  // высота бокового щита на 1 этаж (при 1 этаже — целиком высота груза+толщина доски
  // дна, горизонтальных планок нет; при 2 этажах — та же величина минус ширина средней
  // планки, пополам) и ширина одной такой секции.
  const t42 = wall.value, w42 = 100;
  const bokVertSpan = bokFloors === 2 ? ((H + t12) - w43) / 2 : H + t12;
  const k42 = Math.sqrt(Math.pow(bokSectionW,2) + Math.pow(bokVertSpan,2));
  const l42 = bokHasRaskosina ? (l19 - 1) * bokFloors : 0;

  // У торца число секций (torecSections) растёт 1→4, чтобы угол раскосины уложился в
  // 20-60°; у бокового щита при выходе за 60° мы вместо этого переходим на 2 этажа
  // (см. bokFloors выше) - это должно чаще всего чинить угол само по себе. Но угол
  // считаем и проверяем заново уже с учётом (возможно принудительных) 2 этажей - если
  // он всё равно вне 20-60° (редкий случай, когда даже 2 этажа не помогли, либо угол
  // изначально был <20°, что переходом на 2 этажа не лечится), предупреждаем.
  if(bokHasRaskosina && bokSectionW > 0){
    const bokAngleDeg = Math.atan2(bokVertSpan, bokSectionW) * 180 / Math.PI;
    if(bokAngleDeg < 20 || bokAngleDeg > 60){
      warnings.push(`Угол раскосины бокового щита ${Math.round(bokAngleDeg)}° вне рекомендуемого диапазона 20-60° — требуется консультация с конструктором.`);
    }
  }

  const volBokPanel = vol(t40,w40,k40,l40) + vol(t41,w41,k41,l41)
    + fbBok.extra.reduce((s,e)=>s+vol(t41,e.width,k41,e.qty),0)
    + vol(t42,w42,k42,l42) + vol(t43,w43,k43,l43);

  const bokovoy = [
    {name:'Вертикальная планка', t:t40, w:w40, l:k40, qty:l40},
  ];
  if(l41>0) bokovoy.push({name:'Доска бока', t:t41, w:w41, l:k41, qty:l41});
  fbBok.extra.forEach((e,i)=>{
    bokovoy.push({name:'Доска бока (дополнительная) '+(i+1), t:t41, w:e.width, l:k41, qty:e.qty});
  });
  if(l43>0) bokovoy.push({name:'Горизонтальная планка', t:t43, w:w43, l:k43, qty:l43});
  if(bokHasRaskosina) bokovoy.push({name:'Раскосина', t:t42, w:w42, l:k42, qty:l42});

  // --- Итоговый расход пиломатериала ---
  const totalVolume = volDno + volKryshka + 2*volTorPanel + 2*volBokPanel;
  const normaVremeni = roundup(totalVolume*800/60*1.2, 1);

  // --- Рендер ---
  document.getElementById('outDims').innerHTML = `${outerL} × ${outerW} × ${outerH} <span>мм</span>`;
  document.getElementById('outVolume').innerHTML = `${totalVolume.toFixed(3)} <span>м³</span>`;
  document.getElementById('outTime').innerHTML = `${normaVremeni} <span>ч</span>`;

  function renderSection(title, rows){
    let html = title ? `<div class="part-title">${title}</div>` : '';
    html += `<div class="spec-table"><table>
      <thead><tr><th>Деталь</th><th class="num">Толщина</th><th class="num">Ширина</th><th class="num">Длина</th><th class="num">Кол-во</th></tr></thead><tbody>`;
    rows.forEach(r=>{
      html += `<tr>
        <td>${r.name}</td>
        <td class="num editable-cell" contenteditable="true" data-role="t">${r.t}</td>
        <td class="num editable-cell" contenteditable="true" data-role="w">${r.w}</td>
        <td class="num editable-cell" contenteditable="true" data-role="l">${typeof r.l === 'number' ? Math.round(r.l) : r.l}</td>
        <td class="num editable-cell" contenteditable="true" data-role="qty">${r.qty}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
  }

  // Порог здесь тоже по высоте ГРУЗА (H), а не наружной высоте outerH - должен
  // совпадать с базой, по которой считается torecHasRaskosina выше, иначе при
  // H<=600 но outerH>600 (обычный случай - outerH всегда больше H) это условие
  // не срабатывало бы и вместо чертежа «без раскосины» показывалась заглушка.
  const torecNoRaskosinaDiagram = !torecHasRaskosina && (H <= 600 || W > 600);
  let tablesHtml = '';
  tablesHtml += `<div class="part-title">Дно</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramDno(k9Base, t41, outerW, t40, t_doska_torca + t_planka_torca) + `</div>` + renderSection('', dno) + `</div>`;
  tablesHtml += `<div class="part-title">Крышка</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramKryshka(W, L, t30, t32, t41, t40, edgeDistKryshka, l21, w21, l19, bokSectionW) + `</div>` + renderSection('', kryshka) + `</div>`;
  if(torecFloors === 2 && !torecHasRaskosina){
    warnings.push('Щит торцевой (2 этажа, без раскосины): чертёж приблизительный — использован чертёж одного этажа.');
  }
  tablesHtml += `<div class="part-title">Щит торцевой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramEndPanel(k32, torecSections, torecHasRaskosina, W, H + t12, torecNoRaskosinaDiagram, torecFloors, k30 + w31) + `</div>` + renderSection('', endPanel) + `</div>`;
  if(bokFloors === 2){
    warnings.push('Щит боковой (2 этажа): чертёж для этого случая ещё не готов — на месте чертежа заглушка.');
  }
  tablesHtml += `<div class="part-title" style="margin-bottom:26px">Щит боковой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramBokovoy(H, t12, t41, k41, bokOverhang, edgeDistKryshka, l42, bokFloors, bokVertSpan, l19) + `</div>` + renderSection('', bokovoy) + `</div>`;
  const boardTablesEl = document.getElementById('boardTables');
  boardTablesEl.innerHTML = tablesHtml;
  // Подписи/стрелки чертежей могут выходить за пределы картинки (см.
  // reserveDiagramOverflowScreen) - без этого измерения браузер может ещё не
  // декодировать вставленные <img>, поэтому ждём decode() перед замером.
  const boardImages = Array.from(boardTablesEl.querySelectorAll('img'));
  Promise.all(boardImages.map(img => img.decode ? img.decode().catch(()=>{}) : Promise.resolve()))
    .then(()=> reserveDiagramOverflowScreen(boardTablesEl));

  if(thicknessLimitExceeded){
    warnings.push(`Расчётная толщина хотя бы одной детали превышает максимальную из «в наличии» (${availableThicknesses[availableThicknesses.length-1]} мм) — занижать толщину недопустимо, использовано расчётное значение по ГОСТ (потребуется пиломатериал большей толщины, чем отмечено «в наличии»).`);
  }

  let warningsHtml = '';
  if(warnings.length){
    warningsHtml += '<div style="color:#a13d2b;margin-bottom:10px;font-weight:700;">Внимание:</div>' +
      warnings.map(w=>`<div style="margin-bottom:8px;">⚠ ${w}</div>`).join('');
  }
  const warningsEl = document.getElementById('warningsTop');
  warningsEl.innerHTML = warningsHtml;
  warningsEl.style.display = warnings.length ? 'block' : 'none';

  document.getElementById('results').style.display = 'block';
  document.getElementById('calcCheck').style.visibility = 'visible';
}

// Поля размеров пустые при открытии (по требованию) - автоматический
// расчёт при загрузке не выполняется. Блок результатов скрыт через CSS
// (#results{display:none}) и появляется только после первого успешного
// расчёта - это ожидаемое поведение, а не ошибка.

// Галочка "расчёт выполнен" сбрасывается, если пользователь меняет входные
// данные после расчёта — чтобы не вводить в заблуждение устаревшим результатом.
['L','W','H','M'].forEach(id=>{
  document.getElementById(id).addEventListener('input', invalidateCalc);
});
// То же для доп. опций (галочек), кроме тех, что уже вызывают invalidateCalc()
// через собственный onchange-обработчик в разметке (например onSkidForkliftExclusive).
['optimizeSizes','solidRigidBase','roundBoardWidths','removeFloorBoards'].forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.addEventListener('change', invalidateCalc);
});

// Пересчёт "Расход пиломатериала" и "Норма времени" при ручном редактировании
// значений в таблицах спецификации. Наружные размеры не пересчитываются -
// они завязаны на исходные геометрические формулы, а не на список досок.
function recalcFromTable(){
  const rows = document.querySelectorAll('#boardTables table tbody tr');
  let totalVolume = 0;
  rows.forEach(tr=>{
    const t = parseFloat(tr.querySelector('[data-role="t"]').textContent.replace(',','.')) || 0;
    const w = parseFloat(tr.querySelector('[data-role="w"]').textContent.replace(',','.')) || 0;
    const l = parseFloat(tr.querySelector('[data-role="l"]').textContent.replace(',','.')) || 0;
    const qty = parseFloat(tr.querySelector('[data-role="qty"]').textContent.replace(',','.')) || 0;
    totalVolume += (t/1000)*(w/1000)*(l/1000)*qty;
  });
  const normaVremeni = roundup(totalVolume*800/60*1.2, 1);
  document.getElementById('outVolume').innerHTML = `${totalVolume.toFixed(3)} <span>м³</span>`;
  document.getElementById('outTime').innerHTML = `${normaVremeni} <span>ч</span>`;
}

document.getElementById('boardTables').addEventListener('input', e=>{
  if(e.target.classList.contains('editable-cell')) recalcFromTable();
});

// Общий вид ящика и водяной знак — используются только в печатной версии.
const BOX_IMG_B64  = "data:image/png;base64,__IMG:box.png__";

// Разметка печатной страницы: шапка, «Внутренние размеры груза» и «Итог»
// рядом на одном уровне, затем по каждому узлу — чертёж слева, таблица справа.
function buildPrintHtml(){
  const L = document.getElementById('L').value;
  const W = document.getElementById('W').value;
  const H = document.getElementById('H').value;
  const M = document.getElementById('M').value;

  const outDimsText = document.getElementById('outDims').textContent.trim();
  const volumeText  = document.getElementById('outVolume').textContent.trim();
  const timeText    = document.getElementById('outTime').textContent.trim();

  // Клонируем блок со схемами и таблицами (там уже нужный порядок:
  // чертёж слева, таблица справа) и снимаем редактируемость ячеек.
  const clone = document.getElementById('boardTables').cloneNode(true);
  clone.querySelectorAll('.editable-cell').forEach(cell=>{
    cell.removeAttribute('contenteditable');
    cell.classList.remove('editable-cell');
  });

  // Экранная разметка содержит точечные inline-отступы (например
  // margin-top/bottom у «Крышки» и «Щита бокового»). Inline-стиль перебивает
  // любые правила печати, поэтому эти отступы утекали в печать и добавляли
  // ~100px высоты — из-за чего страница не помещалась и сжималась.
  clone.querySelectorAll('.part-title, .spec-row-diagram').forEach(el=>{
    el.style.marginTop = '';
    el.style.marginBottom = '';
  });

  // Экранные отступы/ширины от reserveDiagramOverflowScreen() (см. выше) тоже
  // не нужны в печати — там свой независимый расчёт вылета через
  // reserveDiagramOverflow() и applyDiagramWidths() под печатный масштаб --pk.
  clone.querySelectorAll('.diagram-wrap').forEach(wrap=>{
    wrap.style.marginTop = '';
    wrap.style.marginBottom = '';
    wrap.style.marginLeft = '';
    wrap.style.width = '';
    wrap.style.removeProperty('--dk');
  });
  clone.querySelectorAll('.diagram-slot').forEach(slot=>{
    slot.style.width = '';
    slot.style.flexBasis = '';
  });

  // Каждую пару «заголовок узла + чертёж/таблица» кладём в общий блочный
  // контейнер: на обычном блоке (в отличие от flex) браузер надёжно
  // соблюдает запрет разрыва между листами.
  let sections = '';
  const children = Array.from(clone.children);
  for(let i=0; i<children.length; i+=2){
    const title = children[i];
    const row   = children[i+1];
    sections += `<div class="print-section">${title.outerHTML}${row ? row.outerHTML : ''}</div>`;
  }

  // Комментарий пользователя — необязателен, попадает в печать только если
  // заполнен. Экранируем текст и сохраняем переносы строк, которые ввёл
  // пользователь. Обёрнут в свой print-section, чтобы участвовать в общей
  // подгонке под лист (масштаб --pk, распределение остатка высоты).
  const commentRaw = (document.getElementById('userComment').value || '').trim();
  let commentHtml = '';
  if(commentRaw){
    const esc = commentRaw
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    commentHtml = `<div class="print-section">
      <div class="part-title">Комментарий</div>
      <div class="print-comment">${esc}</div>
    </div>`;
  }

  return `
    <img class="print-watermark" src="${LOGO_F_B64}" alt="">

    <h1>ГОСТ 10198-91 · тип 1, комплектация 3</h1>
    <div class="print-subtitle">Плотный дощатый ящик с полозьями</div>

    <div class="part-title">Общий вид ящика</div>
    <div class="spec-row-diagram">
      <div class="diagram-slot"><div class="diagram-wrap"><img src="${BOX_IMG_B64}" alt=""></div></div>
      <div class="print-summary-col">
        <div class="print-summary-block">
          <h2>Внутренние размеры груза, мм</h2>
          <table class="print-plain-table">
            <tr><td class="k">Длина</td><td>${L}</td></tr>
            <tr><td class="k">Ширина</td><td>${W}</td></tr>
            <tr><td class="k">Высота</td><td>${H}</td></tr>
            <tr><td class="k">Масса груза, кг</td><td>${M}</td></tr>
          </table>
        </div>
        <div class="print-summary-block">
          <h2>Итог</h2>
          <table class="print-plain-table">
            <tr><td class="k">Наружные размеры, мм</td><td>${outDimsText}</td></tr>
            <tr><td class="k">Расход пиломатериала</td><td>${volumeText}</td></tr>
            <tr><td class="k">Норма времени</td><td>${timeText}</td></tr>
          </table>
        </div>
      </div>
    </div>

    ${sections}
    ${commentHtml}
  `;
}

// Общий вид ящика показываем и на самом сайте, не только в печати.
document.getElementById('boxView').src = BOX_IMG_B64;


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
function roundUpToAvailable(t){
  if(availableThicknesses.length === 0) return t;
  for(const a of availableThicknesses){ if(t<=a) return a; }
  thicknessLimitExceeded = true;
  return availableThicknesses[availableThicknesses.length-1];
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
  document.getElementById('calcCheck').style.visibility = 'hidden'; // результаты устарели после смены фильтра
}

function setAllThickness(state){
  availableThicknesses = state ? AVAILABLE_THICKNESS_OPTIONS.slice() : [];
  buildThicknessCheckboxList();
  saveAvailableThicknesses();
  updateThicknessSummary();
  document.getElementById('calcCheck').style.visibility = 'hidden';
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
  document.getElementById('calcCheck').style.visibility = 'hidden'; // результаты устарели после смены типа крепления
}

function updateFasteningSummary(){
  document.getElementById('fasteningDropdownLabel').textContent = FASTENING_LABELS[fasteningType];
  document.querySelectorAll('input[name="fasteningType"]').forEach(r=>{ r.checked = (r.value === fasteningType); });
}

function toggleFasteningDropdown(){
  document.getElementById('fasteningDropdownPanel').classList.toggle('open');
}

updateFasteningSummary();

function calculate(){
  const errEl = document.getElementById('err');
  errEl.textContent = '';
  document.getElementById('calcCheck').style.visibility = 'hidden';
  thicknessLimitExceeded = false;
  const L = parseFloat(document.getElementById('L').value);
  const W = parseFloat(document.getElementById('W').value);
  const H = parseFloat(document.getElementById('H').value);
  const MASS = parseFloat(document.getElementById('M').value);
  const optimizeSizes = document.getElementById('optimizeSizes').checked;
  const removeFloorBoards = document.getElementById('removeFloorBoards').checked;
  const removeSkidBoards = document.getElementById('removeSkidBoards').checked;
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
  const widthMinSkids162 = minSkidsByWidth162(W); // п.1.6.2 — общий предел 1200 мм между осями полозьев, для любого типа крепления

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
    const sel = selectSkid19(MASS, k9Base, W);
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
  const fbDno = fillBoards(L - w11*2);
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
  const outerL = L+150;
  const outerW = W+100;
  const outerH = H + t9 + t12 + wall.value + wall.value; // H + полоз + доска дна + доска крышки + планка крышки

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
    l19 = ceilInt(middleKryshka/1000) + 2;
  }
  kryshka.push({name:'Планка', t:t19, w:w19, l:k19, qty:l19});

  // Доска крышки: заполняем (ширина груза + 2×толщина доски бок. щита) досками 100мм +
  // при необходимости 1-2 доски 75-99мм на остаток (fillBoards). Длина каждой доски —
  // та же наружная длина, что и у полоза (k9Base).
  const t20 = wall.value, k20 = k9Base;
  const fbKryshka = fillBoards(W + wall.value*2);
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
  const t21=roundUpToAvailable(crossBeam.value), w21=100, k21=W - (optimizeSizes ? 2 : 0), l21=ceilInt(L/800);
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
  const fbTorec = fillBoards(H + t12);
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
  // По высоте ограничения и логика абсолютно идентичны торцу (п.110 docx) — те же 2
  // этажа при наружной высоте >2000мм (см. torecFloors выше). Раскосина отключена по
  // тем же общим условиям высоты, что и у торца (H>600мм) — ширина груза на боковой щит
  // не влияет (в отличие от торца, п.102 docx касается только торца). В отличие от
  // торца, у бокового щита нет верхней/нижней горизонтальной планки вообще — при 2
  // этажах добавляется только одна средняя (см. «2000мм+.docx»: «нет верхней и нижней
  // планок, только центральная, а укосины упираются в края крышки»).
  const bokFloors = torecFloors;

  // Планка (вертикальная): длина = высота груза + 2/3 толщины полоза (не более 70мм).
  // Количество — равно количеству планок крышки (l19), планки бокового щита стоят по
  // тем же местам, что и планки крышки.
  const t40 = wall.value, w40 = 100;
  const k40 = H + Math.min(t9*2/3, 70);
  const l40 = l19;

  // Основная доска бока: заполняем (высота груза + толщина доски дна) досками 100мм +
  // при необходимости доп. доски 75-99мм (fillBoards). Длина каждой доски = длина груза +
  // 2×(толщина доски торца + толщина вертикальной планки торца) — та же величина, что и
  // наружная длина полоза (k9Base).
  const t41 = wall.value, k41 = k9Base;
  const fbBok = fillBoards(H + t12);
  const w41 = 100, l41 = fbBok.mainQty;
  if(fbBok.warn){
    warnings.push('Доска бока: остаток занят доской нестандартной ширины (вне 75–99 мм).');
  }
  if(fbBok.singleNarrow){
    warnings.push('Доска бока: применена одна доска шириной менее 100 мм.');
  }

  // Горизонтальная планка бокового щита (только при 2 этажах, средняя, делит щит
  // пополам по высоте) — длина равна длине доски бока (наружная длина полоза).
  const t43 = wall.value, w43 = 100, k43 = k41, l43 = bokFloors === 2 ? 1 : 0;

  // Раскосина: 1 на секцию на каждый этаж, где секция — промежуток между соседними
  // планками бокового щита (расстояние между ними ≤1000мм, "укосины упираются в края
  // крышки" — горизонтальная привязка секций не меняется от числа этажей). Катеты —
  // высота бокового щита на 1 этаж (при 1 этаже — целиком высота груза+толщина доски
  // дна, горизонтальных планок нет; при 2 этажах — та же величина минус ширина средней
  // планки, пополам) и ширина одной такой секции.
  const t42 = wall.value, w42 = 100;
  const bokSectionW = l19 > 1 ? middleKryshka / (l19 - 1) : 0;
  const bokVertSpan = bokFloors === 2 ? ((H + t12) - w43) / 2 : H + t12;
  const k42 = Math.sqrt(Math.pow(bokSectionW,2) + Math.pow(bokVertSpan,2));
  const bokHasRaskosina = H > 600 && l19 > 1;
  const l42 = bokHasRaskosina ? (l19 - 1) * bokFloors : 0;

  const volBokPanel = vol(t40,w40,k40,l40) + vol(t41,w41,k41,l41)
    + fbBok.extra.reduce((s,e)=>s+vol(t41,e.width,k41,e.qty),0)
    + vol(t42,w42,k42,l42) + vol(t43,w43,k43,l43);

  const bokovoy = [
    {name:'Планка', t:t40, w:w40, l:k40, qty:l40},
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

  const torecNoRaskosinaDiagram = !torecHasRaskosina && (H <= 600 || W > 600);
  let tablesHtml = '';
  tablesHtml += `<div class="part-title">Дно</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramDno(k9Base, t41, outerW, t40, t_doska_torca + t_planka_torca) + `</div>` + renderSection('', dno) + `</div>`;
  tablesHtml += `<div class="part-title">Крышка</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramKryshka(W, L, t30, t32, t41, t40, edgeDistKryshka, l21, w21) + `</div>` + renderSection('', kryshka) + `</div>`;
  if(torecFloors === 2 && !torecHasRaskosina){
    warnings.push('Щит торцевой (2 этажа, без раскосины): чертёж приблизительный — использован чертёж одного этажа.');
  }
  tablesHtml += `<div class="part-title">Щит торцевой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramEndPanel(k32, torecSections, torecHasRaskosina, W, H + t12, torecNoRaskosinaDiagram, torecFloors, k30 + w31) + `</div>` + renderSection('', endPanel) + `</div>`;
  if(bokFloors === 2){
    warnings.push('Щит боковой (2 этажа): чертёж приблизительный — использован чертёж одного этажа.');
  }
  tablesHtml += `<div class="part-title" style="margin-bottom:26px">Щит боковой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramBokovoy(H, t12, t41, k41, k40 - H, edgeDistKryshka, l42, bokFloors, bokVertSpan) + `</div>` + renderSection('', bokovoy) + `</div>`;
  const boardTablesEl = document.getElementById('boardTables');
  boardTablesEl.innerHTML = tablesHtml;
  // Подписи/стрелки чертежей могут выходить за пределы картинки (см.
  // reserveDiagramOverflowScreen) - без этого измерения браузер может ещё не
  // декодировать вставленные <img>, поэтому ждём decode() перед замером.
  const boardImages = Array.from(boardTablesEl.querySelectorAll('img'));
  Promise.all(boardImages.map(img => img.decode ? img.decode().catch(()=>{}) : Promise.resolve()))
    .then(()=> reserveDiagramOverflowScreen(boardTablesEl));

  if(thicknessLimitExceeded){
    warnings.push(`Расчётная толщина превышает максимальную из «в наличии» (${availableThicknesses[availableThicknesses.length-1]} мм) — использовано максимальное значение.`);
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

calculate();

// Галочка "расчёт выполнен" сбрасывается, если пользователь меняет входные
// данные после расчёта — чтобы не вводить в заблуждение устаревшим результатом.
['L','W','H','M'].forEach(id=>{
  document.getElementById(id).addEventListener('input', ()=>{
    document.getElementById('calcCheck').style.visibility = 'hidden';
  });
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

/* ===================== МЕХАНИКА ПЕЧАТИ =====================

   Печатаем в этом же окне (без всплывающих окон — они подвешивали вкладку).
   Содержимое собирается в #printArea, который всегда отрисован реальными
   размерами (просто сдвинут за экран), поэтому его высоту можно честно
   измерить ДО печати.

   Почему лист раньше заполнялся наполовину и почему просто «увеличить шрифт»
   не помогало:
     • ширина листа — жёсткий лимит (733 px), а чертёж и таблица стоят в ряд;
       если раздуть шрифт/чертёж, таблице перестаёт хватать ширины и её
       содержимое начинает переноситься и наезжать;
     • по высоте же оставалось ~половина листа пустой, и это никак не
       использовалось.
   Поэтому:
     1) размеры подобраны под бюджет ширины (см. CSS выше) — это максимум,
        который влезает без переносов;
     2) чертежи увеличиваются на PRINT_DIAGRAM_FACTOR (насколько позволяет
        та же ширина);
     3) остаток высоты листа измеряется и равномерно распределяется между
        секциями — за счёт этого лист заполняется целиком;
     4) если содержимое всё же переросло лист (крупный расчёт, длинные
        названия) — включается пропорциональное уменьшение, чтобы второй,
        пустой лист не появился никогда.
*/
// Общий вид ящика и водяной знак — используются только в печатной версии.
const BOX_IMG_B64  = "data:image/png;base64,__IMG:box.png__";
const LOGO_F_B64   = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQQAAAEdCAYAAADq0RlZAAADo0lEQVR42u3Z242DMBRF0XuRK0kdqSX9d0F+iISIMFFeGLxWB2NGe449ebteAho2OoK/yeKXCHgYHAFw5iBYByAIYgCCIAYgCIAgWAcgCGIAgiAGIAhiAIIgBiAIgCBYByAIYgCCIAYgCGIAggAIgnUAgiAGIAhiAIIgBiAIYgCCAAiCdQCCIAYgCGIAtBIEMQBBAATBOgBBEAMQBDEAQRADEARAEKwDEAQxAEEQAxAEMQBBAATBOgBBEAMQBDEAfhQEMQBBEAMQBEAQrAMQBDEAQRADEARAEKwDEAQxAEEQA+D9IIgBCIIYgCAAgmAdgCCIAQiCGADbQRADEAQxAEEABME6ANaCIAYgCGIAggAwDYLBOgAmOYgBMF8IYgBERGSJiDxr7Xzf+sd3BCx5VAQEARAEQBAAQQAEARAEQBAAQQAEARAEQBAAQQAEARAEQBAAQQAEARAEQBAAQQAEARAEQBAAQQAEARAEQBAAQQAQBEAQAEEABAEQBEAQAEEABAEQBEAQAEEABAEQBEAQAEEABAEQBEAQAEEABAE4qOIIujU6guakhQA0EQNBADEQBEAQAEEA1wVBADEQBEAQwDoQBEAQAEEA1wVBADEQBEAQwDoQBEAQAEEA1wVBADEQBEAQgAOtA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EALASgn3UgCIAggHUgCIAggHUgCIAggHUgCCAGggAIAiAI4LogCIAggHUgCCAGggAIAiAI4LogCCAGggAIAlgHggAcVXEE/iqChQAIAiAIgCAAggAIAiAIgCAAggAIAiAIgCAAggAIAiAIgCAAggAIAiAIgCAAggAIAiAIgCAAggAIAiAIgCAACAIgCIAgAIIACAIgCIAgAIIACAIgCIAgAIIACAIgCIAgAIIACAIgCIAgAIIACAIgCIAgAIIACAIgCIAgAIIACAKAIACCAAgCIAiAIACCAAgCIAiAIACCAAgCIAiAIACCAAgCIAiAIACCAAjC7tLnBUFYRkEY4EWlk59zHoXRZ4e+g1C7SggEdBwE6wFW+C/Dcxy8OWAhYDWAIIgDCMIX4iAQnI43hM8D4c0BCwHXCgQB1wpcGXCtwELAtQJBQBwQBPaPg0AgCFgPtMGjYvtx8CCJhYDVgCAgDggC4oAgIA4IAuKAILB/HASCqjtf4lAbEqmnKgAAAABJRU5ErkJggg==";

const PRINT_PAGE = { wMM:210, hMM:297, marginMM:8, pxPerMM:96/25.4 };
// Масштаб чертежей при печати относительно экранного. Меньше 1, потому что
// вокруг чертежа резервируется место под вылетающие подписи (см.
// reserveDiagramOverflow) — за счёт этого освобождается ширина под таблицы,
// и их шрифт удаётся поднять до 20px.
const PRINT_DIAGRAM_FACTOR = 0.885;

function printBox(){
  if(document.getElementById('results').style.display !== 'block'){
    alert('Сначала выполните расчёт — нажмите «Рассчитать».');
    return;
  }

  const printArea = document.getElementById('printArea');
  const scaleBox  = document.getElementById('printScale');
  scaleBox.innerHTML = buildPrintHtml();

  // Чертежи имеют разный собственный масштаб (у бокового щита он меньше,
  // чтобы подписи не залезали на таблицу). Запоминаем экранную ширину —
  // от неё считается печатная при подборе размера.
  scaleBox.querySelectorAll('.diagram-wrap').forEach(wrap=>{
    wrap.dataset.baseWidth = parseFloat(wrap.style.width) || 260;
  });

  // Важно: сразу после innerHTML браузер мог ещё не декодировать вставленные
  // <img> (чертежи, общий вид ящика, водяной знак) — их scrollHeight в этот
  // момент может быть занижен. Раньше это скрывалось запасом по высоте;
  // как только запас исчез (например, из-за добавленного комментария),
  // страница начала не помещаться на печати, хотя при замере «влезала».
  // Поэтому ждём decode() всех картинок и только потом меряем и подгоняем.
  const images = Array.from(scaleBox.querySelectorAll('img'));
  const ready = images.map(img => img.decode ? img.decode().catch(()=>{}) : Promise.resolve());

  Promise.all(ready).then(()=>{
    fitPrintAreaToOnePage(printArea);
    window.print();
  });
}

// Подписи размеров и стрелки нарисованы ЗА пределами прямоугольника картинки
// (по замерам — до ~70px ниже и ~28px выше). Вёрстка про этот вылет не знает,
// поэтому соседние секции наезжали друг на друга. Здесь измеряются настоящие
// границы каждого чертежа и вылет резервируется отступами.
function reserveDiagramOverflow(printArea){
  printArea.querySelectorAll('.diagram-slot').forEach(slot=>{
    const wrap = slot.querySelector('.diagram-wrap');
    if(!wrap) return;

    slot.style.paddingTop = '0px';
    slot.style.paddingBottom = '0px';

    const box = wrap.getBoundingClientRect();
    let top = box.top, bottom = box.bottom;

    // подписи в рамках
    wrap.querySelectorAll('.diagram-label').forEach(lbl=>{
      const r = lbl.getBoundingClientRect();
      if(r.height){ top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom); }
    });

    // стрелки/линии SVG (координаты могут быть отрицательными)
    const svg = wrap.querySelector('svg');
    if(svg && svg.viewBox && svg.viewBox.baseVal){
      try{
        const bb = svg.getBBox();
        const sr = svg.getBoundingClientRect();
        const vb = svg.viewBox.baseVal;
        if(vb.height && sr.height){
          const sy = sr.height / vb.height;
          top = Math.min(top, sr.top + bb.y * sy);
          bottom = Math.max(bottom, sr.top + (bb.y + bb.height) * sy);
        }
      }catch(e){ /* getBBox недоступен — останутся отступы по подписям */ }
    }

    slot.style.paddingTop = Math.max(0, Math.ceil(box.top - top)) + 'px';
    slot.style.paddingBottom = Math.max(0, Math.ceil(bottom - box.bottom)) + 'px';
  });
}

// Экранный аналог reserveDiagramOverflow() выше. На экране .spec-row-diagram
// выровнен по верху (align-items:flex-start), а не по центру, как в печати -
// там паддинг сверху/снизу у .diagram-slot реально сдвигает его границы,
// здесь же для этого нужно двигать сам .diagram-wrap отступами: margin-top/
// margin-bottom сдвигают вниз всё содержимое (картинку+подписи+стрелки) внутри
// слота, освобождая место над ним (для заголовка узла) и под ним (для
// следующего узла), не трогая позицию самого слота в строке. Слева -
// аналогично margin-left. Справа же сосед - таблица деталей: её двигать нельзя
// (раньше так и было сделано - расширялся слот, но это раздвигало таблицу),
// поэтому вместо этого сам чертёж (картинка + SVG-стрелки + подписи, через
// --dk) пропорционально уменьшается, пока не впишется в фиксированную ширину
// слота.
const DIAGRAM_SLOT_BUDGET = 300; // соответствует .diagram-slot{width:300px}
function reserveDiagramOverflowScreen(container){
  container.querySelectorAll('.diagram-slot').forEach(slot=>{
    const wrap = slot.querySelector('.diagram-wrap');
    if(!wrap) return;

    const baseWidth = parseFloat(wrap.dataset.baseWidth) || parseFloat(getComputedStyle(wrap).width) || 260;

    function measure(){
      const box = wrap.getBoundingClientRect();
      let top = box.top, bottom = box.bottom, left = box.left, right = box.right;

      slot.querySelectorAll('.diagram-label').forEach(lbl=>{
        const r = lbl.getBoundingClientRect();
        if(r.height){
          top = Math.min(top, r.top);
          bottom = Math.max(bottom, r.bottom);
          left = Math.min(left, r.left);
          right = Math.max(right, r.right);
        }
      });

      const svg = wrap.querySelector('svg');
      if(svg && svg.viewBox && svg.viewBox.baseVal){
        try{
          const bb = svg.getBBox();
          const sr = svg.getBoundingClientRect();
          const vb = svg.viewBox.baseVal;
          if(vb.width && vb.height && sr.width && sr.height){
            const sx = sr.width / vb.width, sy = sr.height / vb.height;
            top = Math.min(top, sr.top + bb.y * sy);
            bottom = Math.max(bottom, sr.top + (bb.y + bb.height) * sy);
            left = Math.min(left, sr.left + bb.x * sx);
            right = Math.max(right, sr.left + (bb.x + bb.width) * sx);
          }
        }catch(e){ /* getBBox недоступен — останутся отступы по подписям */ }
      }
      return {box, top, bottom, left, right};
    }

    // Сброс перед замером (иначе накапливаются отступы/масштаб предыдущего расчёта).
    wrap.style.marginTop = '0px';
    wrap.style.marginBottom = '0px';
    wrap.style.marginLeft = '0px';
    wrap.style.width = baseWidth + 'px';
    wrap.style.setProperty('--dk', '1');
    slot.style.width = '';
    slot.style.flexBasis = '';

    // Правый вылет не резервируем отступом (это сдвинуло бы таблицу деталей) -
    // вместо этого уменьшаем масштаб чертежа, пока правый край не впишется в
    // фиксированную ширину слота. Несколько итераций, т.к. подписи имеют
    // фиксированный (не масштабируемый до конца пропорционально) отступ.
    let scale = 1;
    for(let i = 0; i < 8; i++){
      const m = measure();
      const rightGap = Math.max(0, Math.ceil(m.right - m.box.right));
      if(m.box.width + rightGap <= DIAGRAM_SLOT_BUDGET || scale <= 0.3) break;
      scale = Math.max(0.3, scale * (DIAGRAM_SLOT_BUDGET - 4) / (m.box.width + rightGap));
      wrap.style.width = Math.round(baseWidth * scale) + 'px';
      wrap.style.setProperty('--dk', scale.toFixed(3));
    }

    const m = measure();
    const topGap = Math.max(0, Math.ceil(m.box.top - m.top));
    const bottomGap = Math.max(0, Math.ceil(m.bottom - m.box.bottom));
    const leftGap = Math.max(0, Math.ceil(m.box.left - m.left));

    wrap.style.marginTop = topGap + 'px';
    wrap.style.marginBottom = bottomGap + 'px';
    wrap.style.marginLeft = leftGap + 'px';
  });
}

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

    <div class="print-summary-row">
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
      <img class="print-box-view" src="${BOX_IMG_B64}" alt="">
    </div>

    ${sections}
    ${commentHtml}
  `;
}

// Подгонка под ровно один лист А4: сначала заполняем свободную высоту
// отступами, при переполнении — пропорционально уменьшаем.
function fitPrintAreaToOnePage(printArea){
  const contentW = (PRINT_PAGE.wMM - 2*PRINT_PAGE.marginMM) * PRINT_PAGE.pxPerMM; // ~733px
  const contentH = (PRINT_PAGE.hMM - 2*PRINT_PAGE.marginMM) * PRINT_PAGE.pxPerMM; // ~1062px

  const scaleBox = document.getElementById('printScale');

  // Ширина фиксируется ДО замеров: раньше вылеты подписей измерялись, пока
  // блок ещё не был ограничен по ширине, и отступы получались от балды.
  printArea.style.width  = contentW + 'px';
  printArea.style.height = '';
  scaleBox.style.transform = 'none';
  scaleBox.style.width = contentW + 'px';

  // Подбираем единый множитель размеров --pk: он меняет шрифты, отступы,
  // чертежи и подписи ОДНОВРЕМЕННО, поэтому вёрстка остаётся пропорциональной.
  // Это надёжнее, чем transform: при уменьшении контент по-прежнему занимает
  // всю ширину листа (таблица забирает освободившееся место), а не жмётся
  // в левый верхний угол, оставляя пустыми правый и нижний край.
  // Годится ли данный множитель: и по высоте листа, и по ширине —
  // ни одна ячейка таблицы не должна обрезаться (перенос запрещён,
  // поэтому переполнение видно по scrollWidth).
  const fits = pk => {
    scaleBox.style.setProperty('--pk', pk);
    applyDiagramWidths(scaleBox, pk);
    reserveDiagramOverflow(scaleBox);
    if(scaleBox.scrollHeight > contentH * 0.97) return false; // запас на расхождения между замером и реальной печатью
    if(scaleBox.scrollWidth  > contentW + 1) return false;
    const cells = scaleBox.querySelectorAll('.spec-table th, .spec-table td');
    for(const cell of cells){
      if(cell.scrollWidth > cell.clientWidth + 1) return false;
    }
    return true;
  };

  // Нижняя граница — намеренно очень маленькая: лист А4 не должен переполняться
  // никогда, даже при экстремально большом содержимом (длинный комментарий +
  // сложный расчёт), пусть даже ценой мелкого шрифта. Раньше нижняя граница 0.5
  // иногда не давала ужаться настолько, сколько нужно, и лишнее уезжало на
  // второй, почти пустой лист.
  let lo = 0.05, hi = 1.6, best = lo;
  if(fits(hi)){
    best = hi;                       // помещается даже по максимуму
  } else if(!fits(lo)){
    best = lo;                       // не помещается даже по минимуму - берём как есть
  } else {
    for(let i = 0; i < 16; i++){     // двоичный поиск наибольшего влезающего
      const mid = (lo + hi) / 2;
      if(fits(mid)){ best = mid; lo = mid; } else { hi = mid; }
    }
  }
  fits(best);

  // Остаток высоты раздаём как отступы между секциями, чтобы лист был
  // заполнен, а не обрывался на середине.
  const sections = Array.from(scaleBox.querySelectorAll('.print-section'));
  sections.forEach(s=>{ s.style.marginTop = '0px'; });
  const slack = contentH - scaleBox.scrollHeight;
  if(sections.length && slack > 0){
    const per = Math.floor((slack / sections.length) * 0.97);
    sections.forEach(s=>{ s.style.marginTop = per + 'px'; });
    if(scaleBox.scrollHeight > contentH){
      const fix = Math.max(0, per - Math.ceil((scaleBox.scrollHeight - contentH) / sections.length) - 1);
      sections.forEach(s=>{ s.style.marginTop = fix + 'px'; });
    }
  }
}

// Ширина каждого чертежа = его экранная ширина × базовый коэффициент × --pk.
function applyDiagramWidths(scaleBox, pk){
  scaleBox.querySelectorAll('.diagram-wrap').forEach(wrap=>{
    const base = parseFloat(wrap.dataset.baseWidth) || 260;
    wrap.style.width = (base * PRINT_DIAGRAM_FACTOR * pk) + 'px';
    wrap.style.flexBasis = 'auto';
  });
}

// Общий вид ящика показываем и на самом сайте, не только в печати.
document.getElementById('boxView').src = BOX_IMG_B64;

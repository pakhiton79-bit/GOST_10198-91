
// ============ Фильтр толщин пиломатериала "в наличии" ============
// Тот же механизм, что и в GOST10198_91POLOZIA.html/GOST10198_91DOSKI_DNA.html
// (тип I-3), но с отдельным ключом localStorage - фильтр этого типа ящика
// не пересекается с типом I-3.
const THICKNESS_STORAGE_KEY = 'silvan-gost10198-i1-available-thickness';
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
let thicknessLimitExceeded = false;

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
  document.getElementById('calcCheck').style.visibility = 'hidden';
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

// ============ Полоз (галочка "нужен ли") ============
function onSkidToggle(){
  const enabled = document.getElementById('skidEnabled').checked;
  document.getElementById('skidThicknessRow').style.display = enabled ? '' : 'none';
  document.getElementById('calcCheck').style.visibility = 'hidden';
}

function calculate(){
  const errEl = document.getElementById('err');
  errEl.textContent = '';
  document.getElementById('calcCheck').style.visibility = 'hidden';
  thicknessLimitExceeded = false;

  const L = parseFloat(document.getElementById('L').value);
  const W = parseFloat(document.getElementById('W').value);
  const H = parseFloat(document.getElementById('H').value);
  const MASS = parseFloat(document.getElementById('M').value);
  const skidEnabled = document.getElementById('skidEnabled').checked;
  const skidThicknessRaw = parseFloat(document.getElementById('skidThickness').value);

  if(!L || !W || !H || !MASS || L<=0 || W<=0 || H<=0 || MASS<=0){
    errEl.textContent = 'Заполните все поля положительными числами.';
    return;
  }

  let warnings = [];
  if(MASS < 200){
    warnings.push('Масса груза менее 200 кг.');
  }
  if(MASS > 1000){
    warnings.push('Масса груза более 1000 кг — вне документированного диапазона типа I-1 (200-1000 кг).');
  }

  // --- Толщина досок/планок/раскосов - по плотности упаковывания (масса/объём груза) ---
  const density = packingDensity(MASS, L, W, H);
  const wall = {value: roundUpToAvailable(wallThicknessI1(density))};

  // Раскосина (укосина) обязательна при высоте груза ≥1000мм, длине >5000мм
  // или плотности упаковывания >3кг/дм³ (на боковых, торцовых стенках, дне
  // и крышке) - формулы её толщины/ширины/длины/количества в исходном
  // техзадании появятся вместе с чертежами, пока не реализованы.
  const raskosinaNeeded = H>=1000 || L>5000 || density>3;
  if(raskosinaNeeded){
    warnings.push(`Требуется раскосина (высота груза ≥1000мм и/или длина >5000мм и/или плотность упаковывания ${density.toFixed(2)} кг/дм³ >3) — расчёт раскосины не реализован, результат ниже неполный.`);
  }

  // --- Общая длина досок вдоль длины груза (доска дна/крышки/бокового щита) ---
  // Равна длине груза + (толщина доски торца + толщина вертикальной планки
  // торца)*2 - обе толщины равны wall.value (п.1.6.15-аналог для типа I-1).
  const kLen = L + wall.value*4;

  // --- Количество планок (боковой щит и крышка, общая формула) ---
  // 2 крайние на расстоянии kLen/6 от каждого края + промежуточные так, чтобы
  // расстояние между соседними планками не превышало 700мм.
  const plank = plankCount(kLen);
  if(plank.count === null){
    errEl.textContent = `Длина доски ${Math.round(kLen)} мм недостаточна для отступа планок (по 1/6 с каждого края) — расчёт не выполняется.`;
    return;
  }
  const plankQty = plank.count; // общее для боковых планок и планок крышки

  function checkExtraBoardLimit(name, span, fb){
    const max = span<=400 ? 1 : 2;
    const extraQty = fb.extra.reduce((s,e)=>s+e.qty,0);
    if(extraQty > max){
      warnings.push(`${name}: досок нестандартной ширины (75-99мм) больше, чем допускает п.5 (не более ${max} при ширине щита ${span<=400?'≤400':'>400'}мм) — фактически ${extraQty}.`);
    }
  }

  // --- ДНО ---
  const dno = [];
  if(skidEnabled){
    const t9 = roundUpToAvailable(Math.max(skidThicknessRaw, 50));
    if(skidThicknessRaw < 50){
      warnings.push(`Выбранная толщина полоза ${skidThicknessRaw} мм менее 50 мм — принято 50 мм.`);
    }
    const w9 = 100;
    const k9 = W + wall.value*2; // ширина груза + толщина доски бокового щита*2
    dno.push({name:'Полоз', t:t9, w:w9, l:k9, qty:plankQty});
  } else {
    const kPlanka = W + wall.value*4; // ширина груза + (толщина доски бок.щита + толщина боковой планки)*2
    dno.push({name:'Планка', t:wall.value, w:100, l:kPlanka, qty:plankQty});
  }
  const spanDno = W + wall.value*2; // ширина груза + толщина доски дна*2
  const fbDno = fillBoards(spanDno);
  const w12 = 100, l12 = fbDno.mainQty;
  if(l12>0) dno.push({name:'Доска дна', t:wall.value, w:w12, l:kLen, qty:l12});
  fbDno.extra.forEach((e,i)=>{
    dno.push({name:'Доска дна (дополнительная) '+(i+1), t:wall.value, w:e.width, l:kLen, qty:e.qty});
  });
  checkExtraBoardLimit('Доска дна', spanDno, fbDno);

  // --- КРЫШКА ---
  const kryshka = [];
  const kPlankaKryshka = W + wall.value*2; // ширина груза + толщина доски бок.щита*2
  kryshka.push({name:'Планка', t:wall.value, w:100, l:kPlankaKryshka, qty:plankQty});
  const spanKryshka = W + wall.value*2; // ширина груза + толщина доски крышки*2
  const fbKryshka = fillBoards(spanKryshka);
  const w20 = 100, l20 = fbKryshka.mainQty;
  if(l20>0) kryshka.push({name:'Доска крышки', t:wall.value, w:w20, l:kLen, qty:l20});
  fbKryshka.extra.forEach((e,i)=>{
    kryshka.push({name:'Доска крышки (дополнительная) '+(i+1), t:wall.value, w:e.width, l:kLen, qty:e.qty});
  });
  checkExtraBoardLimit('Доска крышки', spanKryshka, fbKryshka);

  // --- БОКОВОЙ ЩИТ (расчёт на 1 щит, далее удвоение) ---
  const bokovoy = [];
  const kPlankaBok = H + wall.value*4; // высота груза + (толщина доски крышки + толщина доски дна)*2
  bokovoy.push({name:'Планка', t:wall.value, w:100, l:kPlankaBok, qty:plankQty});
  const fbBok = fillBoards(H); // расстояние, равное высоте груза
  const w41 = 100, l41 = fbBok.mainQty;
  if(l41>0) bokovoy.push({name:'Доска бокового щита', t:wall.value, w:w41, l:kLen, qty:l41});
  fbBok.extra.forEach((e,i)=>{
    bokovoy.push({name:'Доска бокового щита (дополнительная) '+(i+1), t:wall.value, w:e.width, l:kLen, qty:e.qty});
  });
  checkExtraBoardLimit('Доска бокового щита', H, fbBok);

  // --- ТОРЕЦ (расчёт на 1 щит, далее удвоение) ---
  const torec = [];
  const horizPlankaLen = W - 200; // ширина груза - ширина вертикальной планки*2 (100мм каждая)
  if(horizPlankaLen < 0){
    errEl.textContent = `Ширина груза ${W} мм недостаточна для двух вертикальных планок торца (по 100мм) — расчёт не выполняется.`;
    return;
  }
  torec.push({name:'Вертикальная планка', t:wall.value, w:100, l:H, qty:2});
  torec.push({name:'Горизонтальная планка', t:wall.value, w:100, l:horizPlankaLen, qty:2});
  const fbTorec = fillBoards(H); // расстояние, равное высоте груза
  const w31 = 100, l31 = fbTorec.mainQty;
  if(l31>0) torec.push({name:'Доска торцевого щита', t:wall.value, w:w31, l:W, qty:l31});
  fbTorec.extra.forEach((e,i)=>{
    torec.push({name:'Доска торцевого щита (дополнительная) '+(i+1), t:wall.value, w:e.width, l:W, qty:e.qty});
  });
  checkExtraBoardLimit('Доска торцевого щита', H, fbTorec);

  // --- Наружные размеры ---
  // Техзадание не даёт отдельной формулы наружных размеров - выведена по
  // аналогии с устройством щитов: высота груза + опора снизу (полоз либо
  // планка) + доска дна + доска крышки; ширина/длина груза + толщина
  // соответствующих боковых/торцовых досок с двух сторон. Требует проверки.
  const bottomSupport = skidEnabled ? roundUpToAvailable(Math.max(skidThicknessRaw, 50)) : wall.value;
  const outerH = H + bottomSupport + wall.value + wall.value;
  const outerW = W + wall.value*2;
  const outerL = L + wall.value*2;

  // --- Итоговый расход пиломатериала ---
  const volDno = dno.reduce((s,r)=>s+vol(r.t,r.w,r.l,r.qty),0);
  const volKryshka = kryshka.reduce((s,r)=>s+vol(r.t,r.w,r.l,r.qty),0);
  const volBok = bokovoy.reduce((s,r)=>s+vol(r.t,r.w,r.l,r.qty),0);
  const volTorec = torec.reduce((s,r)=>s+vol(r.t,r.w,r.l,r.qty),0);
  const totalVolume = volDno + volKryshka + 2*volBok + 2*volTorec;
  const normaVremeni = roundup(totalVolume*800/60*1.2, 1);

  // --- Рендер ---
  document.getElementById('outDims').innerHTML = `${Math.round(outerL)} × ${Math.round(outerW)} × ${Math.round(outerH)} <span>мм</span>`;
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

  let tablesHtml = '';
  tablesHtml += `<div class="part-title">Дно</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramDno() + `</div>` + renderSection('', dno) + `</div>`;
  tablesHtml += `<div class="part-title">Крышка</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramKryshka() + `</div>` + renderSection('', kryshka) + `</div>`;
  tablesHtml += `<div class="part-title">Щит торцевой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramTorec() + `</div>` + renderSection('', torec) + `</div>`;
  tablesHtml += `<div class="part-title">Щит боковой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramBokovoy() + `</div>` + renderSection('', bokovoy) + `</div>`;
  const boardTablesEl = document.getElementById('boardTables');
  boardTablesEl.innerHTML = tablesHtml;
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

['L','W','H','M'].forEach(id=>{
  document.getElementById(id).addEventListener('input', ()=>{
    document.getElementById('calcCheck').style.visibility = 'hidden';
  });
});

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
   Идентична типу I-3 (см. src/app.js) - логика общая, специфики типа
   ящика в ней нет, за исключением содержимого buildPrintHtml() ниже. */
const LOGO_F_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQQAAAEdCAYAAADq0RlZAAADo0lEQVR42u3Z242DMBRF0XuRK0kdqSX9d0F+iISIMFFeGLxWB2NGe449ebteAho2OoK/yeKXCHgYHAFw5iBYByAIYgCCIAYgCIAgWAcgCGIAgiAGIAhiAIIgBiAIgCBYByAIYgCCIAYgCGIAggAIgnUAgiAGIAhiAIIgBiAIYgCCAAiCdQCCIAYgCGIAtBIEMQBBAATBOgBBEAMQBDEAQRADEARAEKwDEAQxAEEQAxAEMQBBAATBOgBBEAMQBDEAfhQEMQBBEAMQBEAQrAMQBDEAQRADEARAEKwDEAQxAEEQA+D9IIgBCIIYgCAAgmAdgCCIAQiCGADbQRADEAQxAEEABME6ANaCIAYgCGIAggAwDYLBOgAmOYgBMF8IYgBERGSJiDxr7Xzf+sd3BCx5VAQEARAEQBAAQQAEARAEQBAAQQAEARAEQBAAQQAEARAEQBAAQQAEARAEQBAAQQAEARAEQBAAQQAEARAEQBAAQQAQBEAQAEEABAEQBEAQAEEABAEQBEAQAEEABAEQBEAQAEEABAEQBEAQAEEABAE4qOIIujU6guakhQA0EQNBADEQBEAQAEEA1wVBADEQBEAQwDoQBEAQAEEA1wVBADEQBEAQwDoQBEAQAEEA1wVBADEQBEAQgAOtA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EABAGsA0EALASgn3UgCIAggHUgCIAggHUgCIAggHUgCCAGggAIAiAI4LogCIAggHUgCCAGggAIAiAI4LogCCAGggAIAlgHggAcVXEE/iqChQAIAiAIgCAAggAIAiAIgCAAggAIAiAIgCAAggAIAiAIgCAAggAIAiAIgCAAggAIAiAIgCAAggAIAiAIgCAACAIgCIAgAIIACAIgCIAgAIIACAIgCIAgAIIACAIgCIAgAIIACAIgCIAgAIIACAIgCIAgAIIACAKAIACCAAgCIAiAIACCAAgCIAiAIACCAAgCIAiAIACCAAgCIAiAIACCAAjC7tLnBUFYRkEY4EWlk59zHoXRZ4e+g1C7SggEdBwE6wFW+C/Dcxy8OWAhYDWAIIgDCMIX4iAQnI43hM8D4c0BCwHXCgQB1wpcGXCtwELAtQJBQBwQBPaPg0AgCFgPtMGjYvtx8CCJhYDVgCAgDggC4oAgIA4IAuKAILB/HASCqjtf4lAbEqmnKgAAAABJRU5ErkJggg==";

const PRINT_PAGE = { wMM:210, hMM:297, marginMM:8, pxPerMM:96/25.4 };
const PRINT_DIAGRAM_FACTOR = 0.885;

function printBox(){
  if(document.getElementById('results').style.display !== 'block'){
    alert('Сначала выполните расчёт — нажмите «Рассчитать».');
    return;
  }

  const printArea = document.getElementById('printArea');
  const scaleBox  = document.getElementById('printScale');
  scaleBox.innerHTML = buildPrintHtml();

  scaleBox.querySelectorAll('.diagram-wrap').forEach(wrap=>{
    wrap.dataset.baseWidth = parseFloat(wrap.style.width) || 260;
  });

  const images = Array.from(scaleBox.querySelectorAll('img'));
  const ready = images.map(img => img.decode ? img.decode().catch(()=>{}) : Promise.resolve());

  Promise.all(ready).then(()=>{
    fitPrintAreaToOnePage(printArea);
    window.print();
  });
}

function reserveDiagramOverflow(printArea){
  printArea.querySelectorAll('.diagram-slot').forEach(slot=>{
    const wrap = slot.querySelector('.diagram-wrap');
    if(!wrap) return;

    slot.style.paddingTop = '0px';
    slot.style.paddingBottom = '0px';

    const box = wrap.getBoundingClientRect();
    let top = box.top, bottom = box.bottom;

    wrap.querySelectorAll('.diagram-label').forEach(lbl=>{
      const r = lbl.getBoundingClientRect();
      if(r.height){ top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom); }
    });

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
      }catch(e){ /* getBBox недоступен */ }
    }

    slot.style.paddingTop = Math.max(0, Math.ceil(box.top - top)) + 'px';
    slot.style.paddingBottom = Math.max(0, Math.ceil(bottom - box.bottom)) + 'px';
  });
}

const DIAGRAM_SLOT_BUDGET = 300;
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
        }catch(e){ /* getBBox недоступен */ }
      }
      return {box, top, bottom, left, right};
    }

    wrap.style.marginTop = '0px';
    wrap.style.marginBottom = '0px';
    wrap.style.marginLeft = '0px';
    wrap.style.width = baseWidth + 'px';
    wrap.style.setProperty('--dk', '1');
    slot.style.width = '';
    slot.style.flexBasis = '';

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

function buildPrintHtml(){
  const L = document.getElementById('L').value;
  const W = document.getElementById('W').value;
  const H = document.getElementById('H').value;
  const M = document.getElementById('M').value;

  const outDimsText = document.getElementById('outDims').textContent.trim();
  const volumeText  = document.getElementById('outVolume').textContent.trim();
  const timeText    = document.getElementById('outTime').textContent.trim();

  const clone = document.getElementById('boardTables').cloneNode(true);
  clone.querySelectorAll('.editable-cell').forEach(cell=>{
    cell.removeAttribute('contenteditable');
    cell.classList.remove('editable-cell');
  });

  clone.querySelectorAll('.part-title, .spec-row-diagram').forEach(el=>{
    el.style.marginTop = '';
    el.style.marginBottom = '';
  });

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

  let sections = '';
  const children = Array.from(clone.children);
  for(let i=0; i<children.length; i+=2){
    const title = children[i];
    const row   = children[i+1];
    sections += `<div class="print-section">${title.outerHTML}${row ? row.outerHTML : ''}</div>`;
  }

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

    <h1>ГОСТ 10198-91, тип I-1</h1>

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
    </div>

    ${sections}
    ${commentHtml}
  `;
}

function fitPrintAreaToOnePage(printArea){
  const contentW = (PRINT_PAGE.wMM - 2*PRINT_PAGE.marginMM) * PRINT_PAGE.pxPerMM;
  const contentH = (PRINT_PAGE.hMM - 2*PRINT_PAGE.marginMM) * PRINT_PAGE.pxPerMM;

  const scaleBox = document.getElementById('printScale');

  printArea.style.width  = contentW + 'px';
  printArea.style.height = '';
  scaleBox.style.transform = 'none';
  scaleBox.style.width = contentW + 'px';

  const fits = pk => {
    scaleBox.style.setProperty('--pk', pk);
    applyDiagramWidths(scaleBox, pk);
    reserveDiagramOverflow(scaleBox);
    if(scaleBox.scrollHeight > contentH * 0.97) return false;
    if(scaleBox.scrollWidth  > contentW + 1) return false;
    const cells = scaleBox.querySelectorAll('.spec-table th, .spec-table td');
    for(const cell of cells){
      if(cell.scrollWidth > cell.clientWidth + 1) return false;
    }
    return true;
  };

  let lo = 0.05, hi = 1.6, best = lo;
  if(fits(hi)){
    best = hi;
  } else if(!fits(lo)){
    best = lo;
  } else {
    for(let i = 0; i < 16; i++){
      const mid = (lo + hi) / 2;
      if(fits(mid)){ best = mid; lo = mid; } else { hi = mid; }
    }
  }
  fits(best);

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

function applyDiagramWidths(scaleBox, pk){
  scaleBox.querySelectorAll('.diagram-wrap').forEach(wrap=>{
    const base = parseFloat(wrap.dataset.baseWidth) || 260;
    wrap.style.width = (base * PRINT_DIAGRAM_FACTOR * pk) + 'px';
    wrap.style.flexBasis = 'auto';
  });
}

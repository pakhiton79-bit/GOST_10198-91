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
  const skidThicknessRaw = skidThicknessValue;

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
  let wallRaw = wallThicknessI1(density); // 22/25/32, до округления "в наличии"

  // Раскосина (укосина) обязательна при высоте груза ≥1000мм, длине >5000мм
  // или плотности упаковывания >3кг/дм³ (на боковых, торцовых стенках, дне
  // и крышке) - геометрия ниже (п. "Раскосина") задана без проверки по
  // чертежам (их пока нет), только по уточнению от пользователя.
  const raskosinaNeeded = H>=1000 || L>5000 || density>3;

  // Горизонтальная планка торца: ширина груза - ширина вертикальной планки*2.
  // Не зависит от толщины досок - вынесена из цикла ниже.
  const horizPlankaLen = W - 200;
  if(horizPlankaLen < 0){
    errEl.textContent = `Ширина груза ${W} мм недостаточна для двух вертикальных планок торца (по 100мм) — расчёт не выполняется.`;
    return;
  }

  // --- Общая длина досок вдоль длины груза (доска дна/крышки/бокового щита),
  // количество планок и расстояние между ними ---
  // kLen зависит от wallRaw (толщины досок), а снижение градации толщины
  // (правило 400-500мм ниже) само зависит от расстояния между планками -
  // то есть от kLen. Пересчитываем в цикле, пока толщина не перестанет
  // меняться (снижение градации ограничено - максимум 2 шага 32→25→22).
  let kLen, plank, plankQty, plankGap;
  for(let i=0; i<4; i++){
    // Равна длине груза + (толщина доски торца + толщина вертикальной планки
    // торца)*2 - обе толщины равны wall.value (п.1.6.15-аналог для типа I-1).
    kLen = L + wallRaw*4;

    // 2 крайние планки на расстоянии kLen/6 от каждого края + промежуточные
    // так, чтобы расстояние между соседними планками не превышало 700мм.
    plank = plankCount(kLen);
    if(plank.count === null){
      errEl.textContent = `Длина доски ${Math.round(kLen)} мм недостаточна для отступа планок (по 1/6 с каждого края) — расчёт не выполняется.`;
      return;
    }
    plankQty = plank.count; // общее для боковых планок, планок крышки, полозьев/планки дна
    plankGap = plank.middle / (plankQty-1); // фактическое расстояние между соседними планками

    // При расстоянии между поясами планок 400-500мм толщина досок/планок/
    // раскосов снижается на одну градацию (проверяем расстояние между
    // планками бока/крышки и оба зазора внутри рамки торца).
    const beltGaps = [plankGap, horizPlankaLen, H-200];
    const beltGapHit = beltGaps.find(g => g>=400 && g<=500);
    if(beltGapHit === undefined) break;
    const stepped = stepDownGrade(wallRaw);
    if(stepped === wallRaw) break; // дальше снижать некуда (уже 22мм)
    warnings.push(`Расстояние между планками ${Math.round(beltGapHit)} мм (400-500мм) — толщина досок/планок/раскосов снижена на одну градацию (${wallRaw}→${stepped} мм).`);
    wallRaw = stepped;
    // kLen/plank/plankGap считаны по старой толщине - пересчитываем со сниженной.
  }
  const wall = {value: roundUpToAvailable(wallRaw)};

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

  // --- ТОРЕЦ (расчёт на 1 щит, далее удвоение) ---
  const torec = [];
  torec.push({name:'Вертикальная планка', t:wall.value, w:100, l:H, qty:2});
  torec.push({name:'Горизонтальная планка', t:wall.value, w:100, l:horizPlankaLen, qty:2});
  const fbTorec = fillBoards(H); // расстояние, равное высоте груза
  const w31 = 100, l31 = fbTorec.mainQty;
  if(l31>0) torec.push({name:'Доска торцевого щита', t:wall.value, w:w31, l:W, qty:l31});
  fbTorec.extra.forEach((e,i)=>{
    torec.push({name:'Доска торцевого щита (дополнительная) '+(i+1), t:wall.value, w:e.width, l:W, qty:e.qty});
  });

  // --- Раскосина (укосина) ---
  // Требуется при высоте груза ≥1000мм, длине >5000мм или плотности >3кг/дм³
  // (см. raskosinaNeeded выше). Геометрия - по уточнению пользователя, без
  // проверки по чертежам (их пока нет): раскосина - прямоугольный треугольник.
  if(raskosinaNeeded){
    warnings.push(`Раскосина требуется (высота груза ≥1000мм и/или длина >5000мм и/или плотность упаковывания ${density.toFixed(2)} кг/дм³ >3) — геометрия предварительная, чертежей пока нет.`);

    // Торец: всегда 1 раскосина. Катеты - расстояния внутри рамки из 2
    // вертикальных + 2 горизонтальных планок (за вычетом их ширины).
    const torecLegH = H - 200;
    const torecLegW = horizPlankaLen - 200;
    if(torecLegH <= 0 || torecLegW <= 0){
      errEl.textContent = `Недостаточно места для раскосины торца (катеты должны быть >0, получено ${Math.round(torecLegH)}×${Math.round(torecLegW)} мм) — расчёт не выполняется.`;
      return;
    }
    const torecRaskosinaLen = Math.sqrt(torecLegH*torecLegH + torecLegW*torecLegW);
    torec.push({name:'Раскосина', t:wall.value, w:100, l:torecRaskosinaLen, qty:1});

    // Боковой щит, крышка, дно: раскосины между планками (планки по обе
    // стороны от каждой раскосины) - количество = кол-во планок минус 1.
    // Катеты - высота/ширина щита и фактическое расстояние между планками.
    const raskosinaQty = plankQty - 1;
    if(raskosinaQty > 0){
      const bokRaskosinaLen = Math.sqrt(H*H + plankGap*plankGap);
      bokovoy.push({name:'Раскосина', t:wall.value, w:100, l:bokRaskosinaLen, qty:raskosinaQty});

      const kryshkaRaskosinaLen = Math.sqrt(kPlankaKryshka*kPlankaKryshka + plankGap*plankGap);
      kryshka.push({name:'Раскосина', t:wall.value, w:100, l:kryshkaRaskosinaLen, qty:raskosinaQty});

      const dnoLegW = W + wall.value*2; // ширина груза + толщина доски бок.щита*2 (как у крышки)
      const dnoRaskosinaLen = Math.sqrt(dnoLegW*dnoLegW + plankGap*plankGap);
      dno.push({name:'Раскосина', t:wall.value, w:100, l:dnoRaskosinaLen, qty:raskosinaQty});
    }
  }

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
  tablesHtml += `<div class="part-title">Щит торцевой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramTorec(H, W, raskosinaNeeded) + `</div>` + renderSection('', torec) + `</div>`;
  if(plankQty > 4){
    warnings.push(`Число планок бокового щита (${plankQty}) больше максимального доступного на чертеже (4) — показан чертёж с 4 планками.`);
  }
  tablesHtml += `<div class="part-title">Щит боковой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramBokovoy(H, wall.value, plank.edgeDist, kLen, plankQty, raskosinaNeeded) + `</div>` + renderSection('', bokovoy) + `</div>`;
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

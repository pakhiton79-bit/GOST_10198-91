// ============ Чистый расчёт (без обращений к DOM) - тип I-1 ============
// Разделено на «посчитать» (эта функция) и «показать» (calculate() ниже) -
// само разделение сделано только ради структуры (проще выделить в отдельный
// бэкенд/API в будущем), логика и порядок вычислений не менялись ни на
// строчку по сравнению с тем, что было раньше в единой calculate().
// input: {L,W,H,MASS,skidEnabled,skidThicknessRaw,roundBoardWidths}.
// Возвращает либо {error: '...'} (валидация не прошла), либо объект со
// всеми данными для рендера: таблицы деталей (dno/kryshka/bokovoy/torec),
// предупреждения (warnings), итоговые размеры/объём/норма времени, и
// именованные параметры чертежей (ровно те значения, что раньше передавались
// в diagramDno/diagramKryshka/diagramTorec/diagramBokovoy позиционно).
function computeGost10198I1(input){
  const {L, W, H, MASS, skidEnabled, skidThicknessRaw, roundBoardWidths, manualOverrides} = input;
  const mo = manualOverrides || {};

  thicknessLimitExceeded = false;

  if(!L || !W || !H || !MASS || L<=0 || W<=0 || H<=0 || MASS<=0){
    return {error: 'Заполните все поля положительными числами.'};
  }

  let warnings = [];

  // Ручной ввод толщины в таблице (см. data-override в renderSection в
  // calculate() ниже) - подставляется вместо расчётного по ГОСТ значения
  // везде, где оно дальше используется (по тому же принципу, что и в типе
  // II-1, src/ii1/calc.js). У типа I-1 всего один общий параметр -
  // wall.value (толщина всех досок/планок/раскосов), поэтому здесь только
  // одна точка применения (см. ниже, сразу после wall.value).
  const belowGost = {};
  let overridesApplied = 0;
  function ov(key, gostValue, label){
    const v = mo[key];
    if(v === undefined || v === null || Number.isNaN(v) || v<=0) return gostValue;
    overridesApplied++;
    if(v < gostValue){
      belowGost[key] = {value:v, gostValue, label};
    } else {
      delete belowGost[key];
    }
    return v;
  }
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
    return {error: `Ширина груза ${W} мм недостаточна для двух вертикальных планок торца (по 100мм) — расчёт не выполняется.`};
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
      return {error: `Длина доски ${Math.round(kLen)} мм недостаточна для отступа планок (по 1/6 с каждого края) — расчёт не выполняется.`};
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
  const wall = {value: ov('wallValue', roundUpToAvailable(wallRaw), 'Толщина досок/планок/раскосов')};

  // kLen/plank/plankQty/plankGap выше посчитаны по wallRaw (толщине ДО
  // округления "в наличии") - пересчитываем под итоговую wall.value, чтобы
  // геометрия (длина досок дна/крышки/бока, число и шаг планок - используются
  // и в спецификации деталей, и в параметрах чертежей) точно соответствовала
  // финальной толщине материала, а не промежуточному расчётному значению по
  // ГОСТ (по уточнению пользователя - для чертежей всегда должны браться
  // финальные округлённые размеры). Сам подбор толщины (цикл выше, снижение
  // градации по правилу 400-500мм) не перезапускаем - решение о толщине уже
  // принято по расчётным (не округлённым) зазорам, здесь только синхронизируем
  // геометрию с итоговым материалом.
  kLen = L + wall.value*4;
  plank = plankCount(kLen);
  if(plank.count === null){
    return {error: `Длина доски ${Math.round(kLen)} мм недостаточна для отступа планок (по 1/6 с каждого края) — расчёт не выполняется.`};
  }
  plankQty = plank.count;
  plankGap = plank.middle / (plankQty-1);

  // --- ДНО ---
  const dno = [];
  let dnoWidth; // для чертежа - см. diagramDno() ниже
  if(skidEnabled){
    // Толщина полоза (t9) - исключение из правила "в наличии" (по уточнению
    // пользователя): берётся как есть (выбранное значение, не менее 50мм),
    // без округления вверх до ближайшего доступного номинала и без
    // предупреждения о превышении - в отличие от всех остальных деталей.
    const t9 = Math.max(skidThicknessRaw, 50);
    if(skidThicknessRaw < 50){
      warnings.push(`Выбранная толщина полоза ${skidThicknessRaw} мм менее 50 мм — принято 50 мм.`);
    }
    const w9 = 100;
    const k9 = W + wall.value*2; // ширина груза + толщина доски бокового щита*2
    dno.push({name:'Полоз', t:t9, w:w9, l:k9, qty:plankQty});
    dnoWidth = k9;
  } else {
    const kPlanka = W + wall.value*4; // ширина груза + (толщина доски бок.щита + толщина боковой планки)*2
    dno.push({name:'Планка', t:wall.value, w:100, l:kPlanka, qty:plankQty});
    dnoWidth = kPlanka;
  }
  const spanDno = W + wall.value*2; // ширина груза + толщина доски дна*2
  const fbDno = fillBoards(spanDno, roundBoardWidths);
  const w12 = 100, l12 = fbDno.mainQty;
  if(l12>0) dno.push({name:'Доска дна', t:wall.value, w:w12, l:kLen, qty:l12, overrideKey:'wallValue'});
  fbDno.extra.forEach((e,i)=>{
    dno.push({name:'Доска дна (дополнительная) '+(i+1), t:wall.value, w:e.width, l:kLen, qty:e.qty});
  });

  // --- КРЫШКА ---
  const kryshka = [];
  const kPlankaKryshka = W + wall.value*2; // ширина груза + толщина доски бок.щита*2
  kryshka.push({name:'Планка', t:wall.value, w:100, l:kPlankaKryshka, qty:plankQty});
  const spanKryshka = W + wall.value*2; // ширина груза + толщина доски крышки*2
  const fbKryshka = fillBoards(spanKryshka, roundBoardWidths);
  const w20 = 100, l20 = fbKryshka.mainQty;
  if(l20>0) kryshka.push({name:'Доска крышки', t:wall.value, w:w20, l:kLen, qty:l20});
  fbKryshka.extra.forEach((e,i)=>{
    kryshka.push({name:'Доска крышки (дополнительная) '+(i+1), t:wall.value, w:e.width, l:kLen, qty:e.qty});
  });

  // --- БОКОВОЙ ЩИТ (расчёт на 1 щит, далее удвоение) ---
  const bokovoy = [];
  const kPlankaBok = H + wall.value*4; // высота груза + (толщина доски крышки + толщина доски дна)*2
  bokovoy.push({name:'Планка', t:wall.value, w:100, l:kPlankaBok, qty:plankQty});
  const fbBok = fillBoards(H, roundBoardWidths); // расстояние, равное высоте груза
  const w41 = 100, l41 = fbBok.mainQty;
  if(l41>0) bokovoy.push({name:'Доска бокового щита', t:wall.value, w:w41, l:kLen, qty:l41});
  fbBok.extra.forEach((e,i)=>{
    bokovoy.push({name:'Доска бокового щита (дополнительная) '+(i+1), t:wall.value, w:e.width, l:kLen, qty:e.qty});
  });

  // --- ТОРЕЦ (расчёт на 1 щит, далее удвоение) ---
  const torec = [];
  torec.push({name:'Вертикальная планка', t:wall.value, w:100, l:H, qty:2});
  torec.push({name:'Горизонтальная планка', t:wall.value, w:100, l:horizPlankaLen, qty:2});
  const fbTorec = fillBoards(H, roundBoardWidths); // расстояние, равное высоте груза
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
    // Торец: всегда 1 раскосина. Катеты - расстояния внутри рамки из 2
    // вертикальных + 2 горизонтальных планок (за вычетом их ширины).
    const torecLegH = H - 200;
    const torecLegW = horizPlankaLen - 200;
    if(torecLegH <= 0 || torecLegW <= 0){
      return {error: `Недостаточно места для раскосины торца (катеты должны быть >0, получено ${Math.round(torecLegH)}×${Math.round(torecLegW)} мм) — расчёт не выполняется.`};
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
  // При полозе - та же (неокруглённая) толщина, что и t9 выше; при планке -
  // wall.value (планка правилу "в наличии" подчиняется как обычно).
  const bottomSupport = skidEnabled ? Math.max(skidThicknessRaw, 50) : wall.value;
  // Опора снизу + доска дна + высота груза + доска крышки + планка крышки.
  const outerH = bottomSupport + wall.value*3 + H;
  const outerW = W + wall.value*2;
  const outerL = L + wall.value*2;

  // --- Итоговый расход пиломатериала ---
  const volDno = dno.reduce((s,r)=>s+vol(r.t,r.w,r.l,r.qty),0);
  const volKryshka = kryshka.reduce((s,r)=>s+vol(r.t,r.w,r.l,r.qty),0);
  const volBok = bokovoy.reduce((s,r)=>s+vol(r.t,r.w,r.l,r.qty),0);
  const volTorec = torec.reduce((s,r)=>s+vol(r.t,r.w,r.l,r.qty),0);
  const totalVolume = volDno + volKryshka + 2*volBok + 2*volTorec;
  const normaVremeni = roundup(totalVolume*800/60*1.2, 1);

  if(plankQty > 4){
    warnings.push(`Число планок (${plankQty}) больше максимального доступного на чертежах дна/крышки/бока (4) — показаны чертежи с 4 планками.`);
  }

  if(thicknessLimitExceeded){
    warnings.push(`Расчётная толщина хотя бы одной детали превышает максимальную из «в наличии» (${availableThicknesses[availableThicknesses.length-1]} мм) — занижать толщину недопустимо, использовано расчётное значение по ГОСТ (потребуется пиломатериал большей толщины, чем отмечено «в наличии»).`);
  }

  // Ручной ввод толщины (см. ov() выше) меньше расчётного по ГОСТ - не
  // блокируем, но предупреждаем.
  Object.values(belowGost).forEach(b=>{
    warnings.push(`${b.label}: введено вручную ${b.value} мм — меньше расчётного по ГОСТ (${Math.round(b.gostValue*100)/100} мм). Использовано введённое значение.`);
  });

  // Только на экране - в печать warnings не попадают (buildPrintHtml() их не
  // использует), поэтому отдельно скрывать это уведомление для печати не
  // нужно. Чертежи - готовые иллюстративные фото/схемы, а не параметрический
  // рендер под конкретную введённую толщину, поэтому при override могут не
  // точно её отражать (по указанию пользователя).
  if(overridesApplied > 0){
    warnings.push('В расчёте использованы значения толщины, введённые вручную в таблице, а не расчётные по ГОСТ — чертежи ниже могут не точно отражать эти изменения.');
  }

  return {
    warnings, dno, kryshka, bokovoy, torec,
    outerL, outerW, outerH, totalVolume, normaVremeni,
    // Параметры чертежей - ровно те значения, что раньше шли позиционными
    // аргументами в diagramDno/diagramKryshka/diagramTorec/diagramBokovoy.
    dnoWidth, kLen, plank, plankQty, raskosinaNeeded, kPlankaKryshka, H, W, wall
  };
}

// Читает ручные правки толщины из уже отрисованной таблицы (см. data-role="t"
// data-override="..." в renderSection ниже) - ДО того, как calculate() эту
// таблицу перерисует. Учитываются ТОЛЬКО ячейки, реально отредактированные
// пользователем (data-user-edited, взводится обработчиком input ниже) -
// иначе каноническое поле "замораживалось" бы на прежнем расчётном значении
// при каждом нажатии "Рассчитать" (тот же приём, что и в типе II-1,
// src/ii1/calc.js).
function readManualOverrides(){
  const overrides = {};
  document.querySelectorAll('#boardTables td[data-override][data-user-edited="true"]').forEach(cell=>{
    const key = cell.getAttribute('data-override');
    const val = parseFloat(cell.textContent.replace(',','.'));
    if(!Number.isNaN(val) && val>0) overrides[key] = val;
  });
  return overrides;
}

function calculate(){
  const errEl = document.getElementById('err');
  errEl.textContent = '';
  const manualOverrides = readManualOverrides();
  document.getElementById('calcCheck').style.display = 'none';
  document.getElementById('calcOutdated').style.display = 'none';

  const input = {
    L: parseFloat(document.getElementById('L').value),
    W: parseFloat(document.getElementById('W').value),
    H: parseFloat(document.getElementById('H').value),
    MASS: parseFloat(document.getElementById('M').value),
    skidEnabled: document.getElementById('skidEnabled').checked,
    skidThicknessRaw: skidThicknessValue,
    roundBoardWidths: document.getElementById('roundBoardWidths').checked,
    manualOverrides,
  };

  const calc = computeGost10198I1(input);
  if(calc.error){ errEl.textContent = calc.error; return; }

  // --- Рендер ---
  document.getElementById('outDims').innerHTML = `${Math.round(calc.outerL)} × ${Math.round(calc.outerW)} × ${Math.round(calc.outerH)} <span>мм</span>`;
  document.getElementById('outVolume').innerHTML = `${calc.totalVolume.toFixed(3)} <span>м³</span>`;
  document.getElementById('outTime').innerHTML = `${calc.normaVremeni} <span>ч</span>`;

  function renderSection(title, rows){
    let html = title ? `<div class="part-title">${title}</div>` : '';
    html += `<div class="spec-table"><table>
      <thead><tr><th>Деталь</th><th class="num">Толщина</th><th class="num">Ширина</th><th class="num">Длина</th><th class="num">Кол-во</th></tr></thead><tbody>`;
    rows.forEach(r=>{
      const overrideAttr = r.overrideKey ? ` data-override="${r.overrideKey}"` : '';
      html += `<tr>
        <td>${r.name}</td>
        <td class="num editable-cell" contenteditable="true" data-role="t"${overrideAttr}>${r.t}</td>
        <td class="num editable-cell" contenteditable="true" data-role="w">${r.w}</td>
        <td class="num editable-cell" contenteditable="true" data-role="l">${typeof r.l === 'number' ? Math.round(r.l) : r.l}</td>
        <td class="num editable-cell" contenteditable="true" data-role="qty">${r.qty}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
  }

  let tablesHtml = '';
  tablesHtml += `<div class="part-title">Дно</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramDno(calc.dnoWidth, calc.kLen, calc.plank.edgeDist, calc.plankQty, calc.raskosinaNeeded) + `</div>` + renderSection('', calc.dno) + `</div>`;
  tablesHtml += `<div class="part-title">Крышка</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramKryshka(calc.kPlankaKryshka, calc.kLen, calc.plank.edgeDist, calc.plankQty, calc.raskosinaNeeded) + `</div>` + renderSection('', calc.kryshka) + `</div>`;
  tablesHtml += `<div class="part-title">Щит торцевой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramTorec(calc.H, calc.W, calc.raskosinaNeeded) + `</div>` + renderSection('', calc.torec) + `</div>`;
  tablesHtml += `<div class="part-title">Щит боковой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramBokovoy(calc.H, calc.wall.value, calc.plank.edgeDist, calc.kLen, calc.plankQty, calc.raskosinaNeeded) + `</div>` + renderSection('', calc.bokovoy) + `</div>`;
  const boardTablesEl = document.getElementById('boardTables');
  boardTablesEl.innerHTML = tablesHtml;
  const boardImages = Array.from(boardTablesEl.querySelectorAll('img'));
  Promise.all(boardImages.map(img => img.decode ? img.decode().catch(()=>{}) : Promise.resolve()))
    .then(()=> reserveDiagramOverflowScreen(boardTablesEl));

  let warningsHtml = '';
  if(calc.warnings.length){
    // Цвет — var(--warn) из общей палитры (design.md), а не произвольный hex
    // (см. тот же фикс в src/app.js).
    warningsHtml += '<div style="color:var(--warn);margin-bottom:10px;font-weight:700;">Внимание:</div>' +
      calc.warnings.map(w=>`<div style="margin-bottom:8px;">⚠ ${w}</div>`).join('');
  }
  const warningsEl = document.getElementById('warningsTop');
  warningsEl.innerHTML = warningsHtml;
  warningsEl.style.display = calc.warnings.length ? 'block' : 'none';

  document.getElementById('results').style.display = 'block';
  document.getElementById('calcCheck').style.display = 'inline-flex';
}


// Поля размеров пустые при открытии (по требованию) - автоматический
// расчёт при загрузке не выполняется. Блок результатов скрыт через CSS
// (#results{display:none}) и появляется только после первого успешного
// расчёта - это ожидаемое поведение, а не ошибка.

['L','W','H','M'].forEach(id=>{
  document.getElementById(id).addEventListener('input', ()=>{
    invalidateCalc();
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
  if(e.target.classList.contains('editable-cell')){
    if(e.target.hasAttribute('data-override')){
      e.target.setAttribute('data-user-edited', 'true');
    }
    recalcFromTable();
    invalidateCalc();
  }
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
    <img class="print-watermark" src="${LOGO_B64}" alt="">

    <h1>ГОСТ 10198-91, тип I-1</h1>

    <div class="part-title">Общий вид ящика</div>
    <div class="spec-row-diagram">
      <div class="diagram-slot"><div class="diagram-wrap"><img src="${BOX_I1_IMG_B64}" alt=""></div></div>
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
document.getElementById('boxView').src = BOX_I1_IMG_B64;

// ============ Чистый расчёт (без обращений к DOM) - тип I-1 ============
// Разделено на «посчитать» (эта функция) и «показать» (calculate() ниже) -
// само разделение сделано только ради структуры (проще выделить в отдельный
// бэкенд/API в будущем), логика и порядок вычислений не менялись ни на
// строчку по сравнению с тем, что было раньше в единой calculate().
// input: {L,W,H,MASS,skidEnabled,skidThicknessRaw,roundBoardWidths,removeLidBottomRaskosina,addRaskosina,xRaskosina,plankLayoutMode,plankLayoutValue}.
// Возвращает либо {error: '...'} (валидация не прошла), либо объект со
// всеми данными для рендера: таблицы деталей (dno/kryshka/bokovoy/torec),
// предупреждения (warnings), итоговые размеры/объём/норма времени, и
// именованные параметры чертежей (ровно те значения, что раньше передавались
// в diagramDno/diagramKryshka/diagramTorec/diagramBokovoy позиционно).
// Ищет первое отрицательное число где угодно в результате расчёта -
// и в таблице деталей (dno/kryshka/bokovoy/torec), и в параметрах для
// чертежей (они в том же объекте) - по указанию пользователя: отрицательный
// размер всегда означает ошибку формулы или невозможную геометрию, такой
// результат нельзя показывать пользователю ни в каком виде. '⚠' (символ, не
// число) - осознанный признак нерасчитанного узла, пропускается, это не
// ошибка. Возвращает путь до первого найденного отрицательного значения
// (для сообщения об ошибке) либо null, если всё в порядке.
function findNegativeField(value, path){
  if(typeof value === 'number'){
    return (Number.isFinite(value) && value < 0) ? path : null;
  }
  if(Array.isArray(value)){
    for(let i=0; i<value.length; i++){
      const found = findNegativeField(value[i], `${path}[${i}]`);
      if(found) return found;
    }
    return null;
  }
  if(value && typeof value === 'object'){
    for(const key of Object.keys(value)){
      const found = findNegativeField(value[key], path ? `${path}.${key}` : key);
      if(found) return found;
    }
    return null;
  }
  return null;
}

// Плотность древесины для перевода объёма пиломатериала (м³) в массу
// ящика (кг) - по уточнению пользователя, типовое значение для сухой
// сосны/ели.
const WOOD_DENSITY_KG_M3 = 500;

function computeGost10198I1(input){
  const {L, W, H, MASS, skidEnabled, skidThicknessRaw, roundBoardWidths, removeLidBottomRaskosina, addRaskosina, xRaskosina, addEndTape, plankLayoutMode, plankLayoutValue, manualOverrides} = input;
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
    warnings.push('Масса груза вне диапазона типа I-1 (200–1000 кг): менее 200 кг.');
  }
  if(MASS > 1000){
    warnings.push('Масса груза вне диапазона типа I-1 (200–1000 кг): более 1000 кг.');
  }

  // --- Толщина досок/планок/раскосов - по плотности упаковывания (масса/объём груза) ---
  const density = packingDensity(MASS, L, W, H);
  // wallThicknessI1(density) - 22/25/32, до округления "в наличии" - берётся
  // заново в stabilizePlankLayout() ниже (там же и используется).

  // Раскосина (укосина) обязательна при высоте груза ≥1000мм, длине >5000мм
  // или плотности упаковывания >3кг/дм³ (на боковых, торцовых стенках, дне
  // и крышке) - геометрия ниже (п. "Раскосина") задана без проверки по
  // чертежам (их пока нет), только по уточнению от пользователя. Галочка
  // "Добавить раскосины" (addRaskosina, по запросу пользователя) добавляет
  // раскосины на все детали независимо от условий ГОСТ выше - реализовано
  // как ещё один источник true в том же общем условии, поэтому ничего
  // дальше по коду менять не нужно. Галочка "Убрать раскосины крышки и
  // дна" (removeLidBottomRaskosina) не конфликтует: она снимает раскосины
  // только с крышки/дна и применяется уже ПОСЛЕ raskosinaNeeded, независимо
  // от того, что именно его включило (ГОСТ или эта галочка) - см.
  // kryshkaDnoHasRaskosina ниже.
  const raskosinaNeeded = addRaskosina || H>=1000 || L>5000 || density>3;

  // Горизонтальная планка торца: ширина груза - ширина вертикальной планки*2.
  // Не зависит от толщины досок - вынесена из цикла ниже.
  const horizPlankaLen = W - 200;
  if(horizPlankaLen < 0){
    return {error: `Ширина груза ${W} мм недостаточна для двух вертикальных планок торца (по 100мм) — расчёт не выполняется.`};
  }

  // Текст ошибки "планки не помещаются": при ручном зазоре (он ставится
  // ровно, см. plankCount в logic.js) причина - сам зазор, пишем об этом
  // прямо, а не только про длину доски.
  function plankLayoutError(kLen, override){
    if(override && override.mode === 'gap'){
      return `Расстояние между планками ${override.value} мм не помещается на доске ${Math.round(kLen)} мм (2 планки и отступы от края) — расчёт не выполняется.`;
    }
    return `Длина доски ${Math.round(kLen)} мм недостаточна для отступа планок — расчёт не выполняется.`;
  }

  // --- Общая длина досок вдоль длины груза (доска дна/крышки/бокового щита),
  // количество планок и расстояние между ними ---
  // kLen зависит от wallRaw (толщины досок), а снижение градации толщины
  // (правило 400-500мм ниже) само зависит от расстояния между планками -
  // то есть от kLen. Пересчитываем в цикле, пока толщина не перестанет
  // меняться (снижение градации ограничено - максимум 2 шага 32→25→22).
  //
  // Раскладка поясов планок (plankCount) по умолчанию штатная - см. logic.js.
  // По галочкам "Настроить число поясов"/"Настроить расстояние между краями
  // поясов" (plankLayoutMode: 'count'|'gap', по запросу пользователя)
  // пользователь может задать своё значение - тогда отступ от края тоже
  // меняется (см. комментарий у plankCount в logic.js). Правило 400-500мм
  // работает как обычно в обоих случаях - переопределяется только САМА
  // раскладка (число/шаг), а не то, следим ли мы за попаданием зазора в
  // 400-500мм.
  function stabilizePlankLayout(override, wallStart){
    let w = wallStart, kLen, plank, plankQty, plankGap;
    for(let i=0; i<4; i++){
      kLen = L + w*4;
      plank = plankCount(kLen, w, override);
      if(plank.count === null){
        return {error: plankLayoutError(kLen, override)};
      }
      plankQty = plank.count; // общее для боковых планок, планок крышки, полозьев/планки дна
      plankGap = plank.middle / (plankQty-1); // фактическое расстояние между соседними планками
      const beltGaps = [plankGap, horizPlankaLen, H-200];
      const beltGapHit = beltGaps.find(g => g>=400 && g<=500);
      if(beltGapHit === undefined) break;
      const stepped = stepDownGrade(w);
      if(stepped === w) break; // дальше снижать некуда (уже 22мм)
      // Снижение градации по правилу 400-500мм - штатное поведение,
      // предусмотренное самим ГОСТом (не отклонение/проблема) - предупреждение
      // не выводим (по указанию пользователя).
      w = stepped;
    }
    return {wallRaw: w, kLen, plank, plankQty, plankGap};
  }

  const plankOverride = (plankLayoutMode === 'count' || plankLayoutMode === 'gap')
    ? {mode: plankLayoutMode, value: plankLayoutValue}
    : null;

  // Стандартная (штатная, без ручных настроек) раскладка - считается всегда,
  // независимо от галочек, только чтобы показать "текущее стандартное
  // значение" в ползунках обеих новых галочек (см. calculate() ниже).
  const standardPass = stabilizePlankLayout(null, wallThicknessI1(density));
  if(standardPass.error) return {error: standardPass.error};
  const standardWallValue = roundUpToAvailable(standardPass.wallRaw);
  const standardFinalPlank = plankCount(L + standardWallValue*4, standardWallValue, null);
  const standardPlankCount = standardFinalPlank.count;
  const standardPlankGap = standardFinalPlank.count > 1 ? standardFinalPlank.middle/(standardFinalPlank.count-1) : 0;

  const mainPass = plankOverride ? stabilizePlankLayout(plankOverride, wallThicknessI1(density)) : standardPass;
  if(mainPass.error) return {error: mainPass.error};
  let {wallRaw, kLen, plank, plankQty, plankGap} = mainPass;

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
  plank = plankCount(kLen, wall.value, plankOverride);
  if(plank.count === null){
    return {error: plankLayoutError(kLen, plankOverride)};
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
      warnings.push(`Толщина полоза ${skidThicknessRaw} мм менее 50 — принято 50 мм.`);
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
    const suffix = fbDno.extra.length>1 ? ' '+(i+1) : '';
    dno.push({name:'Доска дна (дополнительная)'+suffix, t:wall.value, w:e.width, l:kLen, qty:e.qty});
  });

  // --- КРЫШКА ---
  const kryshka = [];
  const kPlankaKryshka = W + wall.value*4; // ширина груза + (толщина доски бок.щита + толщина планки бок.щита)*2
  kryshka.push({name:'Планка', t:wall.value, w:100, l:kPlankaKryshka, qty:plankQty});
  const spanKryshka = W + wall.value*2; // ширина груза + толщина доски крышки*2
  const fbKryshka = fillBoards(spanKryshka, roundBoardWidths);
  const w20 = 100, l20 = fbKryshka.mainQty;
  if(l20>0) kryshka.push({name:'Доска крышки', t:wall.value, w:w20, l:kLen, qty:l20});
  fbKryshka.extra.forEach((e,i)=>{
    const suffix = fbKryshka.extra.length>1 ? ' '+(i+1) : '';
    kryshka.push({name:'Доска крышки (дополнительная)'+suffix, t:wall.value, w:e.width, l:kLen, qty:e.qty});
  });

  // --- БОКОВОЙ ЩИТ (расчёт на 1 щит, далее удвоение) ---
  const bokovoy = [];
  const kPlankaBok = H + wall.value*4; // высота груза + (толщина доски крышки + толщина доски дна)*2
  bokovoy.push({name:'Планка', t:wall.value, w:100, l:kPlankaBok, qty:plankQty});
  const fbBok = fillBoards(H, roundBoardWidths); // расстояние, равное высоте груза
  const w41 = 100, l41 = fbBok.mainQty;
  if(l41>0) bokovoy.push({name:'Доска бокового щита', t:wall.value, w:w41, l:kLen, qty:l41});
  fbBok.extra.forEach((e,i)=>{
    const suffix = fbBok.extra.length>1 ? ' '+(i+1) : '';
    bokovoy.push({name:'Доска бокового щита (дополнительная)'+suffix, t:wall.value, w:e.width, l:kLen, qty:e.qty});
  });

  // --- ТОРЕЦ (расчёт на 1 щит, далее удвоение) ---
  const torec = [];
  torec.push({name:'Вертикальная планка', t:wall.value, w:100, l:H, qty:2});
  torec.push({name:'Горизонтальная планка', t:wall.value, w:100, l:horizPlankaLen, qty:2});
  const fbTorec = fillBoards(H, roundBoardWidths); // расстояние, равное высоте груза
  const w31 = 100, l31 = fbTorec.mainQty;
  if(l31>0) torec.push({name:'Доска торцевого щита', t:wall.value, w:w31, l:W, qty:l31});
  fbTorec.extra.forEach((e,i)=>{
    const suffix = fbTorec.extra.length>1 ? ' '+(i+1) : '';
    torec.push({name:'Доска торцевого щита (дополнительная)'+suffix, t:wall.value, w:e.width, l:W, qty:e.qty});
  });

  // --- Раскосина (укосина) ---
  // Требуется при высоте груза ≥1000мм, длине >5000мм или плотности >3кг/дм³
  // (см. raskosinaNeeded выше). Геометрия - по уточнению пользователя, без
  // проверки по чертежам (их пока нет): раскосина - прямоугольный треугольник.
  // X-образные раскосины (галочка xRaskosina, по запросу пользователя): к
  // каждой обычной раскосине добавляется встречная, которая упирается в неё
  // с двух сторон - т.е. 2 куска на каждую обычную раскосину, длина каждого
  // куска = (длина обычной раскосины - её ширина)/2.
  const RASKOSINA_W = 100;
  function pushXRaskosina(arr, len, qty){
    if(!xRaskosina) return;
    arr.push({name:'Раскосина (дополнительная)', t:wall.value, w:RASKOSINA_W, l:(len-RASKOSINA_W)/2, qty:qty*2});
  }
  if(raskosinaNeeded){
    // Торец: всегда 1 раскосина. Катеты - расстояния внутри рамки из 2
    // вертикальных + 2 горизонтальных планок (за вычетом их ширины).
    const torecLegH = H - 200;
    const torecLegW = horizPlankaLen - 200;
    if(torecLegH <= 0 || torecLegW <= 0){
      return {error: `Недостаточно места для раскосины торца (катеты должны быть >0, получено ${Math.round(torecLegH)}×${Math.round(torecLegW)} мм) — расчёт не выполняется.`};
    }
    const torecRaskosinaLen = Math.sqrt(torecLegH*torecLegH + torecLegW*torecLegW);
    torec.push({name:'Раскосина', t:wall.value, w:RASKOSINA_W, l:torecRaskosinaLen, qty:1});
    pushXRaskosina(torec, torecRaskosinaLen, 1);

    // Боковой щит, крышка, дно: раскосины между планками (планки по обе
    // стороны от каждой раскосины) - количество = кол-во планок минус 1.
    // Катеты - высота/ширина щита и фактическое расстояние между планками.
    // Раскосины крышки и дна можно убрать отдельной галочкой
    // (removeLidBottomRaskosina, по запросу пользователя) - раскосины торца
    // и бокового щита эта галочка не затрагивает, они остаются как обычно.
    const raskosinaQty = plankQty - 1;
    if(raskosinaQty > 0){
      const bokRaskosinaLen = Math.sqrt(H*H + plankGap*plankGap);
      bokovoy.push({name:'Раскосина', t:wall.value, w:RASKOSINA_W, l:bokRaskosinaLen, qty:raskosinaQty});
      pushXRaskosina(bokovoy, bokRaskosinaLen, raskosinaQty);

      if(!removeLidBottomRaskosina){
        const kryshkaRaskosinaLen = Math.sqrt(kPlankaKryshka*kPlankaKryshka + plankGap*plankGap);
        kryshka.push({name:'Раскосина', t:wall.value, w:RASKOSINA_W, l:kryshkaRaskosinaLen, qty:raskosinaQty});
        pushXRaskosina(kryshka, kryshkaRaskosinaLen, raskosinaQty);

        const dnoLegW = W + wall.value*2; // ширина груза + толщина доски бок.щита*2 (как у крышки)
        const dnoRaskosinaLen = Math.sqrt(dnoLegW*dnoLegW + plankGap*plankGap);
        dno.push({name:'Раскосина', t:wall.value, w:RASKOSINA_W, l:dnoRaskosinaLen, qty:raskosinaQty});
        pushXRaskosina(dno, dnoRaskosinaLen, raskosinaQty);
      }
    }
  }
  // Флаг для чертежей крышки/дна (диаграмма показывает раскосину только если
  // она реально есть в этой конкретной таблице деталей) - в отличие от
  // raskosinaNeeded (общее условие ГОСТа), учитывает ещё и галочку
  // "Убрать раскосины крышки и дна". Чертежи торца/бокового щита по-прежнему
  // используют raskosinaNeeded напрямую (см. calculate() ниже).
  const kryshkaDnoHasRaskosina = raskosinaNeeded && !removeLidBottomRaskosina;

  // --- Наружные размеры ---
  // Формула по уточнению пользователя, проверена на контрольном примере
  // (груз 1000×1000×1000, толщина 25мм в наличии → наружные 1100×1100×1100):
  // высота = опора снизу (полоз либо планка) + доска дна + высота груза +
  // доска крышки + планка крышки; длина = (толщина вертикальной планки торца
  // + толщина доски торца)×2 + длина груза; ширина = (толщина планки бока +
  // толщина доски бока)×2 + ширина груза. При полозе в опоре снизу - та же
  // (неокруглённая) толщина, что и t9 выше; при планке - wall.value (планка
  // правилу "в наличии" подчиняется как обычно). Остальные толщины в этих
  // формулах у типа I-1 все общие (wall.value).
  const bottomSupport = skidEnabled ? Math.max(skidThicknessRaw, 50) : wall.value;
  const outerH = bottomSupport + wall.value*3 + H;
  const outerW = W + wall.value*4;
  const outerL = L + wall.value*4;

  // --- Итоговый расход пиломатериала ---
  const volDno = dno.reduce((s,r)=>s+vol(r.t,r.w,r.l,r.qty),0);
  const volKryshka = kryshka.reduce((s,r)=>s+vol(r.t,r.w,r.l,r.qty),0);
  const volBok = bokovoy.reduce((s,r)=>s+vol(r.t,r.w,r.l,r.qty),0);
  const volTorec = torec.reduce((s,r)=>s+vol(r.t,r.w,r.l,r.qty),0);
  const totalVolume = volDno + volKryshka + 2*volBok + 2*volTorec;
  const normaVremeni = computeNormaVremeni(totalVolume, TIME_SETTINGS_STORAGE_KEY);
  // Масса ящика (тары, без груза) - объём пиломатериала × плотность
  // древесины (по уточнению пользователя: 500 кг/м³, типовое значение для
  // сухой сосны/ели).
  const crateMass = totalVolume * WOOD_DENSITY_KG_M3;


  if(thicknessLimitExceeded){
    warnings.push(`Расчётная толщина детали больше максимальной «в наличии» (${availableThicknesses[availableThicknesses.length-1]} мм) — использовано значение по ГОСТ (нужен пиломатериал большей толщины).`);
  }

  // Ручной ввод толщины (см. ov() выше) меньше расчётного по ГОСТ - не
  // блокируем, но предупреждаем.
  Object.values(belowGost).forEach(b=>{
    warnings.push(`${b.label}: вручную указано ${b.value} мм (< расчётных ${Math.round(b.gostValue*100)/100} мм по ГОСТ) — использовано введённое значение.`);
  });

  // Только на экране - в печать warnings не попадают (buildPrintHtml() их не
  // использует), поэтому отдельно скрывать это уведомление для печати не
  // нужно. Чертежи - готовые иллюстративные фото/схемы, а не параметрический
  // рендер под конкретную введённую толщину, поэтому при override могут не
  // точно её отражать (по указанию пользователя).
  if(overridesApplied > 0){
    warnings.push('Использованы вручную введённые толщины, а не расчётные по ГОСТ — чертежи ниже могут их не точно отражать.');
  }

  // Лента обшивки торцов (галочка «Добавить ленту обшивки торцов», по
  // указанию пользователя): длина одной ленты = (ширина груза + толщина
  // доски бока*2) + (высота груза + толщина доски крышки*2); лент 2
  // (выводится "… мм × 2" под всеми элементами, см. calculate()). В объём
  // пиломатериала, массу ящика и норму времени не входит - это не
  // пиломатериал. У типа I-1 доски бока и крышки - одной толщины wall.value.
  // Строка отдельного раздела endTape (а не одно число) - чтобы на неё
  // распространялся общий механизм ручных правок таблицы (tableEdits,
  // applyTableEdits с множителем раздела 0 - в объём не входит).
  const endTape = addEndTape ? [{name:'Обшивочная лента', l: Math.ceil((W + wall.value*2) + (H + wall.value*2) - 1e-9), qty: 2}] : [];

  const result = {
    warnings, dno, kryshka, bokovoy, torec,
    outerL, outerW, outerH, totalVolume, normaVremeni, crateMass,
    // Параметры чертежей - ровно те значения, что раньше шли позиционными
    // аргументами в diagramDno/diagramKryshka/diagramTorec/diagramBokovoy.
    dnoWidth, kLen, plank, plankQty, plankGap, raskosinaNeeded, kryshkaDnoHasRaskosina, xRaskosina: !!xRaskosina, kPlankaKryshka, H, W, wall,
    standardPlankCount, standardPlankGap, endTape
  };
  const negField = findNegativeField(result, '');
  if(negField){
    // negField - внутренний путь до поля, только для отладки в консоли -
    // пользователю техническое имя переменной не показываем.
    console.warn('Расчёт дал отрицательное значение:', negField);
    return {error: 'При таких размерах и массе груза получаются недопустимые (отрицательные) размеры деталей — рассчитать ящик нельзя. Проверьте введённые размеры и массу груза.'};
  }
  return result;
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

// Сам расчёт и рендер; кнопка «Рассчитать» вызывает общую обёртку
// calculate() из common-print.js (индикатор «Идёт расчёт…», защита от
// повторного запуска, блокировка печати на время расчёта).
function calculateNow(){
  const errEl = document.getElementById('err');
  errEl.textContent = '';
  const manualOverrides = readManualOverrides();
  const tableEdits = readTableEdits(); // см. applyTableEdits в common-print.js

  const input = {
    L: parseFloat(document.getElementById('L').value),
    W: parseFloat(document.getElementById('W').value),
    H: parseFloat(document.getElementById('H').value),
    MASS: parseFloat(document.getElementById('M').value),
    skidEnabled: document.getElementById('skidEnabled').checked,
    skidThicknessRaw: skidThicknessValue,
    roundBoardWidths: document.getElementById('roundBoardWidths').checked,
    removeLidBottomRaskosina: document.getElementById('removeLidBottomRaskosina').checked,
    addRaskosina: document.getElementById('addRaskosina').checked,
    xRaskosina: document.getElementById('xRaskosina').checked,
    addEndTape: document.getElementById('addEndTape').checked,
    plankLayoutMode,
    plankLayoutValue,
    manualOverrides,
  };

  const calc = computeGost10198I1(input);
  if(calc.error){
    errEl.textContent = calc.error;
    setCalcStatus('error');
    // Прячем «Итог» и спецификацию целиком - иначе на экране остаются
    // цифры прошлого успешного расчёта рядом с текстом ошибки (по указанию
    // пользователя).
    document.getElementById('results').style.display = 'none';
    return;
  }
  // Ручные правки таблицы (ширина/длина/кол-во и т.д.) - учитываются только
  // здесь, по кнопке "Рассчитать" (см. applyTableEdits в common-print.js).
  if(applyTableEdits(calc, tableEdits, {dno:1, kryshka:1, torec:2, bokovoy:2, endTape:0})){ // endTape - лента, в объём не входит
    calc.normaVremeni = computeNormaVremeni(calc.totalVolume, TIME_SETTINGS_STORAGE_KEY);
    calc.crateMass = calc.totalVolume * WOOD_DENSITY_KG_M3;
  }
  // "Стандартные" (штатные) число/шаг поясов планок - центр ползунков у
  // галочек "Настроить число поясов"/"Настроить расстояние между поясами"
  // (см. src/i1/ui.js) - обновляются при каждом успешном расчёте.
  lastStandardPlankCount = calc.standardPlankCount;
  lastStandardPlankGap = calc.standardPlankGap;
  // Длина доски - верхний предел поля "расстояние между краями поясов
  // планок" (plankGapMax() в ui.js, по указанию пользователя: больше длины
  // доски отступ быть не может). Если уже введённое значение теперь выше
  // нового предела (доска стала короче после пересчёта) - подрезаем и поле,
  // и слайдер, чтобы не остаться с "зависшим" недостижимым значением.
  lastKLen = calc.kLen;
  if(plankLayoutMode === 'gap' && plankLayoutValue > lastKLen){
    plankLayoutValue = lastKLen;
    const gapInput = document.getElementById('plankGapInput');
    gapInput.max = lastKLen;
    gapInput.value = lastKLen;
    rebuildPlankSlider('gap', lastKLen, lastKLen);
    savePlankLayout();
  }

  // --- Рендер ---
  document.getElementById('outDims').innerHTML = `${Math.round(calc.outerL)} × ${Math.round(calc.outerW)} × ${Math.round(calc.outerH)} <span>мм</span>`;
  document.getElementById('outVolume').innerHTML = `${calc.totalVolume.toFixed(3)} <span>м³</span>`;
  document.getElementById('outMass').innerHTML = `${calc.crateMass.toFixed(1)} <span>кг</span>`;
  document.getElementById('outTime').innerHTML = `${calc.normaVremeni} <span>ч</span>`;

  function renderSection(title, rows, sectionKey){
    let html = title ? `<div class="part-title">${title}</div>` : '';
    html += `<div class="spec-table"><table data-section="${sectionKey}">
      <thead><tr><th>Деталь</th><th class="num">Толщина</th><th class="num">Ширина</th><th class="num">Длина</th><th class="num">Кол-во</th></tr></thead><tbody>`;
    const rowKeys = tableRowKeys(rows);
    rows.forEach((r, i)=>{
      const overrideAttr = r.overrideKey ? ` data-override="${r.overrideKey}"` : '';
      html += `<tr data-row-key="${escapeAttr(rowKeys[i])}">
        <td>${r.name}</td>
        <td class="num editable-cell" contenteditable="true" data-role="t"${overrideAttr}${editedAttr(r, 't', manualOverrides)}>${r.t}</td>
        <td class="num editable-cell" contenteditable="true" data-role="w"${editedAttr(r, 'w')}>${r.w}</td>
        <td class="num editable-cell" contenteditable="true" data-role="l"${editedAttr(r, 'l')}>${typeof r.l === 'number' ? Math.round(r.l) : r.l}</td>
        <td class="num editable-cell" contenteditable="true" data-role="qty"${editedAttr(r, 'qty')}>${r.qty}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
  }

  let tablesHtml = '';
  // Общая (максимально возможная) высота рамки щита для всех 4 чертежей -
  // см. i1PageFramePx в диаграммах I-1.
  const i1FramePx = i1PageFramePx(calc.plankQty, calc.raskosinaNeeded, calc.kryshkaDnoHasRaskosina);
  tablesHtml += `<div class="part-title">Дно</div><div class="spec-row-diagram"><div class="diagram-slot" data-size-group="i1-panels">` + diagramDno(calc.dnoWidth, calc.wall.value, calc.plank.edgeDist, calc.plankGap, calc.kLen, calc.plankQty, calc.kryshkaDnoHasRaskosina, calc.xRaskosina, i1FramePx) + `</div>` + renderSection('', calc.dno, 'dno') + `</div>`;
  tablesHtml += `<div class="part-title">Крышка</div><div class="spec-row-diagram"><div class="diagram-slot" data-size-group="i1-panels">` + diagramKryshka(calc.kPlankaKryshka, calc.wall.value, calc.plank.edgeDist, calc.plankGap, calc.kLen, calc.plankQty, calc.kryshkaDnoHasRaskosina, calc.xRaskosina, i1FramePx) + `</div>` + renderSection('', calc.kryshka, 'kryshka') + `</div>`;
  tablesHtml += `<div class="part-title">Щит торцевой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot" data-size-group="i1-panels">` + diagramTorec(calc.H, calc.W, calc.raskosinaNeeded, calc.xRaskosina, i1FramePx) + `</div>` + renderSection('', calc.torec, 'torec') + `</div>`;
  tablesHtml += `<div class="part-title">Щит боковой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot" data-size-group="i1-panels">` + diagramBokovoy(calc.H, calc.wall.value, calc.plank.edgeDist, calc.plankGap, calc.kLen, calc.plankQty, calc.raskosinaNeeded, calc.xRaskosina, i1FramePx) + `</div>` + renderSection('', calc.bokovoy, 'bokovoy') + `</div>`;
  // Лента обшивки торцов - под всеми элементами и чертежами, отдельной
  // табличкой 1×1 на всю ширину (под чертежами и под таблицами деталей), в
  // стиле таблиц деталей, без заголовка (по указанию пользователя). Попадает
  // и в печать/PDF (buildPrintHtml берёт содержимое #boardTables целиком).
  // Весь текст ячейки редактируется как свободный текст (по указанию
  // пользователя - не только число, но и «мм» и т.п.): role 'text',
  // учитывается по «Рассчитать» через readTableEdits/applyTableEdits и
  // сохраняется, как остальные правки; пустая ячейка - расчётный текст.
  if(calc.endTape && calc.endTape.length){
    const tr = calc.endTape[0], tapeKeys = tableRowKeys(calc.endTape);
    const tapeText = (typeof tr.text === 'string') ? tr.text : `Обшивочная лента ${Math.ceil(tr.l - 1e-9)} мм × 2`;
    tablesHtml += `<div class="spec-table tape-table"><table data-section="endTape"><tbody><tr data-row-key="${escapeAttr(tapeKeys[0])}"><td class="editable-cell" contenteditable="true" data-role="text"${editedAttr(tr, 'text')}>${escapeAttr(tapeText)}</td></tr></tbody></table></div>`;
  }
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
  setCalcStatus('check');
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


document.getElementById('boardTables').addEventListener('input', e=>{
  if(e.target.classList.contains('editable-cell')){
    // Правка ячейки НЕ пересчитывает итоги сразу (по указанию пользователя) -
    // только помечает ячейку как исправленную и расчёт как устаревший
    // (подсказка «Нажмите «Рассчитать»»); учтётся при нажатии "Рассчитать" (толщина с
    // data-override - через readManualOverrides(), остальное - через
    // readTableEdits(), см. common-print.js).
    e.target.setAttribute('data-user-edited', 'true');
    updateResetButton();
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
  const massText    = document.getElementById('outMass').textContent.trim();
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

    <h1>ГОСТ 10198-91, тип I-1${boxNameHtml()}</h1>

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
            <tr><td class="k">Расход пило&shy;материала</td><td>${volumeText}</td></tr>
            <tr><td class="k">Масса ящика</td><td>${massText}</td></tr>
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
initTimeSettings(TIME_SETTINGS_STORAGE_KEY);

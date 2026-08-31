// ============ Чистый расчёт (без обращений к DOM) - тип II-1 ============
// Каркасно-щитовая конструкция: стойки + горизонтальные брусья + раскосины,
// обшитые досками (в отличие от типа I-3/I-1, где щиты - сплошной набор
// планок/досок). Источник - файл заказчика «ГОСТ 10198-91 тип 2-1.docx».
//
// Толщина стоек (Табл. 12 источника) зависит от НАРУЖНОЙ высоты ящика, которая
// сама зависит от толщины продольного бруса крышки (только режим «поперечное
// расположение досок»), а тот, в свою очередь, - от толщины стойки (нужна для
// расчёта пространства под продольные брусья). Длина полоза (рабочая длина для
// Табл. 19) также зависит от толщины стойки торца. Обе зависимости замкнуты по
// кругу - решаются небольшим числом итераций (4, по аналогии с циклом
// пересчёта толщины стенок в src/i1/calc.js), пока значения не стабилизируются.
// input: {L,W,H,MASS,fasteningType,solidRigidBase,removeFloorBoards,
//         removeSkidBoards,forkliftLoading,roundBoardWidths,lidLayout}.
function computeGost10198II1(input){
  const {L, W, H, MASS, fasteningType, solidRigidBase, removeFloorBoards,
         removeSkidBoards, forkliftLoading, roundBoardWidths, lidLayout} = input;

  thicknessLimitExceeded = false;

  if(!L || !W || !H || !MASS || L<=0 || W<=0 || H<=0 || MASS<=0){
    return {error: 'Заполните все поля положительными числами.'};
  }

  let warnings = [];
  if(MASS > 20000){
    warnings.push('Масса груза превышает 20000 кг — вне области действия типа II-1, расчёт продолжен по верхней границе диапазона.');
  }

  // Толщина досок обшивки (масса груза) - черновая таблица, см. комментарий у
  // skinThickness() в src/ii1/logic.js.
  const skin = {value: roundUpToAvailable(skinThickness(MASS))};

  // Наружная ширина ящика: ширина груза + (ширина стойки[100] + толщина доски
  // обшивки)×2 - по аналогии с формулой длины полоза (см. k9Base ниже), где
  // толщина торцевого щита складывается из стойки и доски обшивки.
  const outerW = W + (100 + skin.value)*2;
  const crossBeamRaw = crossBeamThickness(MASS, outerW); // Табл. 14
  if(crossBeamRaw.exceeded){
    warnings.push('Масса или наружная ширина ящика вне Табл. 14 — поперечный брус крышки принят по крайнему значению.');
  }
  const t21 = roundUpToAvailable(crossBeamRaw.value), w21 = 100;
  // Поперечные брусья крышки - на расстоянии осей не более 800мм. Брус - тело
  // шириной 100мм (w21), а не точка - тот же принцип, что и у стоек каркаса
  // (см. minCountBySpan в src/ii1/logic.js): крайний брус не должен выступать
  // за пределы крышки по длине, значит пролёт между осями крайних брусьев -
  // L минус ширина одного бруса, а не L целиком. Раньше здесь стояла
  // временная формула без этой поправки (унаследована от типа I-3, где она
  // и сама была помечена как временная - см. src/app.js).
  const crossBeamCount = minCountBySpan(L, w21, 800);

  const skidCalcWidth = W + skin.value*2; // без стойки, как в типе I-3 ("без боковых планок")

  // --- Итеративная стабилизация: толщина стойки <-> наружная высота <->
  //     длина полоза (Табл.19) <-> продольный брус крышки (режим "поперечное") ---
  let t_stojka = skin.value, stojkaExceeded = false;
  let k9Base = L, t9=0, w9=0, l9=0, lastSkidInfo=null;
  let t_longbeam=0, w_longbeam=100, longbeamCount=0, longbeamExceeded=false;
  let floorBoardT=0, floorBoardExceeded=false, floorBoardUdel=null;
  let t10=0, w10=0, k10=0, l10=0;
  let outerH=0;
  let polozSimpleExceeded=false;

  for(let iter=0; iter<4; iter++){
    k9Base = L + (t_stojka + skin.value)*2;

    if(solidRigidBase){
      const l9_default = (W>1100) ? 3 : 2;
      const poloz = polozSection165(MASS);
      polozSimpleExceeded = poloz.exceeded;
      const minNeeded = minSkidsByWidth162(skidCalcWidth, poloz.w);
      l9 = l9_default < minNeeded ? minNeeded : l9_default;
      t9 = poloz.h; w9 = poloz.w;
      lastSkidInfo = null;
    } else {
      const sel = selectSkid19(MASS, k9Base, skidCalcWidth);
      l9 = sel.count; t9 = sel.h; w9 = sel.w;
      lastSkidInfo = sel;
    }

    const t10Raw = forkliftLoading ? Math.max(subfloorThicknessRaw(MASS), 50) : subfloorThicknessRaw(MASS);
    t10 = roundUpToAvailable(t10Raw); w10 = Math.min(w9, 150); k10 = k9Base-400; l10 = l9;

    if(fasteningType === 'floor_boards'){
      const distanceMm = l9>1 ? skidCalcWidth/(l9-1) : skidCalcWidth;
      const fb = floorBoardThickness(MASS, L, W, distanceMm);
      floorBoardT = roundUpToAvailable(fb.value); floorBoardExceeded = fb.exceeded; floorBoardUdel = fb.udel;
    } else {
      floorBoardT = roundUpToAvailable(floorBoardThicknessNew(MASS));
    }

    outerH = (removeSkidBoards ? 0 : t10) + t9 + floorBoardT + H + t21 + t_longbeam + skin.value;

    const stj = stojkaSection(MASS, outerH);
    t_stojka = roundUpToAvailable(stj.t);
    stojkaExceeded = stj.exceeded;

    if(lidLayout === 'transverse'){
      // Тот же принцип, что и у поперечных брусьев/стоек выше (см.
      // minCountBySpan): продольный брус тоже тело фиксированной ширины
      // (~100мм), а не точка - используем ширину 100мм для этого подбора
      // (реальная ширина бруса из longBeamSection() зависит от результата,
      // но отличие 75-100мм здесь не меняет число брусьев на практике).
      const fillspaceLong = W + t_stojka*2;
      longbeamCount = minCountBySpan(fillspaceLong, 100, 1000);
      const longbeamAxis = clearGapBySpan(fillspaceLong, 100, longbeamCount) + 100; // ось-в-ось (просвет + ширина 1 бруса)
      const crossBeamAxis = clearGapBySpan(L, w21, crossBeamCount) + w21;
      const lb = longBeamSection(crossBeamAxis, roundBoardWidths, longbeamAxis);
      t_longbeam = roundUpToAvailable(lb.t); w_longbeam = lb.w; longbeamExceeded = lb.exceeded;
    } else {
      t_longbeam = 0; w_longbeam = 100; longbeamCount = 0;
    }
  }

  if(polozSimpleExceeded){
    warnings.push('Масса вне диапазона таблицы полозьев со сплошным жёстким основанием (500–20000 кг) — сечение принято по крайнему значению.');
  }
  if(lastSkidInfo){
    if(lastSkidInfo.massSnapped){
      warnings.push(`Масса ${MASS} кг отсутствует в Табл. 19 — принята ближайшая (${lastSkidInfo.massUsed} кг).`);
    }
    if(lastSkidInfo.lengthSnapped){
      warnings.push(`Длина полоза ${Math.round(k9Base)} мм отсутствует в Табл. 19 — принята ближайшая (${lastSkidInfo.lengthUsed} мм).`);
    }
    if(lastSkidInfo.spacingExceeded){
      warnings.push(`Шаг между осями полозьев >1200 мм (п.1.6.2) не устранён — полозьев слишком много (${lastSkidInfo.count} шт.).`);
    }
  }
  if(stojkaExceeded){
    warnings.push('Масса или наружная высота ящика вне табл. толщины стоек — сечение принято по крайнему значению.');
  }
  if(longbeamExceeded){
    warnings.push('Расстояние между осями поперечных брусьев крышки вне табл. продольных брусьев — сечение принято по крайнему значению.');
  }
  if(floorBoardExceeded){
    warnings.push('Удельная нагрузка или шаг полозьев вне Табл. 4 — толщина доски дна принята по крайнему значению.');
  }
  if(k10 < 300){
    warnings.push(`Длина подполозной доски ${Math.round(k10)} мм менее 300 мм.`);
  }
  const subfloorForkliftFail = forkliftLoading && k10 < 300;
  if(subfloorForkliftFail){
    warnings.push(`Требование ≥300 мм для подполозной доски при погрузке погрузчиком не выполнено (${Math.round(k10)} мм).`);
  }

  // --- ДНО ---
  const dno = [];
  dno.push({name:'Полоз', t:t9, w:w9, l:k9Base, qty:l9});
  if(!removeSkidBoards){
    dno.push({
      name:'Подполозная доска',
      t: subfloorForkliftFail ? '⚠' : t10,
      w: subfloorForkliftFail ? '⚠' : w10,
      l: subfloorForkliftFail ? '⚠' : k10,
      qty: subfloorForkliftFail ? '⚠' : l10
    });
  }
  const endBeam = endBeamSection(MASS);
  const t11 = roundUpToAvailable(endBeam.h), w11 = endBeam.w, k11 = W, l11 = 2;
  dno.push({name:'Торцовый брус дна', t:t11, w:w11, l:k11, qty:l11});

  const fbDno = fillBoards(L - w11*2, roundBoardWidths);
  const t12 = floorBoardT, w12 = 100, l12 = fbDno.mainQty, k12 = W;
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

  const volDno = vol(t9,w9,k9Base,l9) + (removeSkidBoards?0:vol(t10,w10,k10,l10)) + vol(t11,w11,k11,l11)
    + (removeFloorBoards ? 0 : (vol(t12,w12,k12,l12) + fbDno.extra.reduce((s,e)=>s+vol(t12,e.width,k12,e.qty),0)));

  // --- КРЫШКА ---
  const kryshka = [];
  kryshka.push({name:'Внутренний поперечный брус', t:t21, w:w21, l:W, qty:crossBeamCount});
  let volKryshka = vol(t21,w21,W,crossBeamCount);

  let lidBoardLen, lidFillspace;
  if(lidLayout === 'transverse'){
    const k_longbeam = L + t_stojka*2;
    kryshka.push({name:'Внутренний продольный брус', t:t_longbeam, w:w_longbeam, l:k_longbeam, qty:longbeamCount});
    volKryshka += vol(t_longbeam, w_longbeam, k_longbeam, longbeamCount);
    lidBoardLen = outerW;      // ширина груза + (стойка+доска)*2
    lidFillspace = k9Base;     // внутренняя длина груза + (стойка+доска торца)*2
  } else {
    lidBoardLen = k9Base;
    lidFillspace = outerW;
  }
  const fbKryshka = fillBoards(lidFillspace, roundBoardWidths);
  const t20 = skin.value, w20 = 100, l20 = fbKryshka.mainQty, k20 = lidBoardLen;
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
  volKryshka += vol(t20,w20,k20,l20) + fbKryshka.extra.reduce((s,e)=>s+vol(t20,e.width,k20,e.qty),0);

  // --- Наружная высота (см. комментарий у outerH в цикле выше) ---
  // (outerH уже посчитан в последней итерации цикла стабилизации)

  // --- Общая высота панели (щита) на 1 этаж, без опоры снизу (полоза/доски дна) ---
  // Высота груза + толщина доски дна + толщина продольного бруса крышки (0 при
  // режиме "продольное расположение") - см. комментарий у длины стойки в
  // src/ii1/logic.js / docx-источнике: полоз/подполозная доска не входят -
  // они относятся к узлу «Дно», а не к каркасу щита.
  const panelHeightFull = H + floorBoardT + t_longbeam;

  // Вспомогательная функция: считает число стоек по каркасу щита. Стойки -
  // не точки (оси), а реальные бруски шириной 100мм, поэтому, как и с
  // полозьями в I-3 (см. minSkidsByWidth162 в src/ii1/logic.js), крайние
  // стойки своим НАРУЖНЫМ краем не должны выходить за пределы отведённого
  // пространства - значит пролёт между ОСЯМИ крайних стоек равен
  // fillspace-100 (по одной половине ширины стойки убирается с каждого
  // края), а не fillspace целиком (docx: "расстояние между осями не более
  // 800мм, но при этом не должны заходить за пределы этого пространства").
  // Ширина секции для раскосины - ЧИСТЫЙ просвет между соседними стойками
  // (fillspace минус суммарная ширина всех стоек, поровну на все просветы),
  // а не расстояние между осями - тот же приём, что и torecSectionWidth в
  // типе I-3 (src/app.js): там ширина секции = (W - w30*(sections+1))/sections,
  // то есть общая ширина минус ширина всех планок, а не оси.
  function buildFrame(fillspace, panelH){
    const memberW = 100; // ширина стойки
    const maxAxis = 800;
    let count = minCountBySpan(fillspace, memberW, maxAxis);
    function sectionW(n){ return clearGapBySpan(fillspace, memberW, n); }
    function angleDeg(n, h){ return Math.atan2(h, sectionW(n)) * 180/Math.PI; }
    let floors = H > 2000 ? 2 : 1;
    function stojkaLen(fl){
      return fl===2 ? (panelH - 100*3)/2 : panelH - 100*2;
    }
    if(sectionW(count) <= 0){
      return {count, floors, len:0, sectionW:0, hasRaskosina:false, warn:null, tooNarrow:true};
    }
    if(floors===1 && angleDeg(count, stojkaLen(1)) > 60){
      floors = 2;
    }
    let len = stojkaLen(floors);
    let warn = null;
    if(len > 0){
      while(sectionW(count+1) > 0 && angleDeg(count, len) < 20){
        count++;
      }
      if(sectionW(count) <= 0){
        return {count:count-1, floors, len, sectionW:sectionW(count-1), hasRaskosina:true, warn:null, tooNarrow:false};
      }
      if(angleDeg(count, len) < 20){
        warn = `угол раскосины менее 20° даже при максимально возможном числе секций (${count})`;
      }
    }
    const hasRaskosina = len > 0;
    return {count, floors, len, sectionW: sectionW(count), hasRaskosina, warn, tooNarrow:false};
  }

  const fillspaceTorec = W + t_stojka*2;
  const torecFrame = buildFrame(fillspaceTorec, panelHeightFull);
  const fillspaceBok = L; // буквально "длине груза" по тексту источника
  const bokFrame = buildFrame(fillspaceBok, panelHeightFull);

  if(torecFrame.tooNarrow){
    return {error: `Ширина груза ${W} мм слишком мала для минимум двух стоек торцевого щита (по 100мм) — расчёт не выполняется.`};
  }
  if(bokFrame.tooNarrow){
    return {error: `Длина груза ${L} мм слишком мала для минимум двух стоек бокового щита (по 100мм) — расчёт не выполняется.`};
  }
  if(torecFrame.warn) warnings.push('Щит торцевой: ' + torecFrame.warn + '.');
  if(bokFrame.warn) warnings.push('Щит боковой: ' + bokFrame.warn + '.');
  if(torecFrame.len <= 0){
    return {error: `Внутренняя высота груза ${H} мм слишком мала для каркаса торцевого щита — расчёт не выполняется.`};
  }
  if(bokFrame.len <= 0){
    return {error: `Внутренняя высота груза ${H} мм слишком мала для каркаса бокового щита — расчёт не выполняется.`};
  }

  // --- ЩИТ ТОРЦЕВОЙ (расчёт на 1 щит, далее удвоение) ---
  const t_raskosina = roundUpToAvailable(t_stojka*2/3), w_raskosina = 100;

  const t30 = t_stojka, w30 = 100, k30 = torecFrame.len, l30 = torecFrame.count * torecFrame.floors;
  const t31 = t_stojka, w31 = 100, k31 = W + t_stojka*2, l31 = torecFrame.floors + 1;
  const k33 = Math.sqrt(Math.pow(torecFrame.sectionW,2) + Math.pow(torecFrame.len,2));
  const l33 = torecFrame.hasRaskosina ? (torecFrame.count-1) * torecFrame.floors : 0;

  const t32 = skin.value, k32 = panelHeightFull;
  const fbTorec = fillBoards(outerW, roundBoardWidths);
  const w32 = 100, l32 = fbTorec.mainQty;
  if(fbTorec.warn){
    warnings.push('Доска торца: остаток занят доской нестандартной ширины (вне 75–99 мм).');
  }
  if(fbTorec.singleNarrow){
    warnings.push('Доска торца: применена одна доска шириной менее 100 мм.');
  }

  const endPanel = [
    {name:'Стойка', t:t30, w:w30, l:k30, qty:l30},
    {name:'Горизонтальный брус', t:t31, w:w31, l:k31, qty:l31},
  ];
  if(torecFrame.hasRaskosina) endPanel.push({name:'Раскосина', t:t_raskosina, w:w_raskosina, l:k33, qty:l33});
  if(l32>0) endPanel.push({name:'Доска', t:t32, w:w32, l:k32, qty:l32});
  fbTorec.extra.forEach((e,i)=>{
    endPanel.push({name:'Доска (дополнительная) '+(i+1), t:t32, w:e.width, l:k32, qty:e.qty});
  });

  const volTorPanel = vol(t30,w30,k30,l30) + vol(t31,w31,k31,l31)
    + vol(t_raskosina,w_raskosina,k33,l33)
    + vol(t32,w32,k32,l32) + fbTorec.extra.reduce((s,e)=>s+vol(t32,e.width,k32,e.qty),0);

  // --- ЩИТ БОКОВОЙ (расчёт на 1 щит, далее удвоение) ---
  const t40 = t_stojka, w40 = 100, k40 = bokFrame.len, l40 = bokFrame.count * bokFrame.floors;
  const t43 = t_stojka, w43 = 100, k43 = L, l43 = bokFrame.floors === 2 ? 1 : 0;
  const k42 = Math.sqrt(Math.pow(bokFrame.sectionW,2) + Math.pow(bokFrame.len,2));
  const l42 = bokFrame.hasRaskosina ? (bokFrame.count-1) * bokFrame.floors : 0;

  // Опорная планка (несёт поперечные брусья крышки, физически на боковом щите):
  // толщина - толщина доски обшивки, ширина - ширина стойки[100] минус толщина
  // поперечного бруса крышки, округлено вниз, в пределах 50-75мм; длина - равна
  // длине горизонтального бруса бокового щита.
  const w_opora_raw = Math.floor(100 - t21);
  const w_opora = Math.min(75, Math.max(50, w_opora_raw));
  const t_opora = skin.value, k_opora = k43, l_opora = 2;

  const t41 = skin.value, k41 = panelHeightFull;
  const fbBok = fillBoards(L, roundBoardWidths);
  const w41 = 100, l41 = fbBok.mainQty;
  if(fbBok.warn){
    warnings.push('Доска бока: остаток занят доской нестандартной ширины (вне 75–99 мм).');
  }
  if(fbBok.singleNarrow){
    warnings.push('Доска бока: применена одна доска шириной менее 100 мм.');
  }

  const bokovoy = [
    {name:'Стойка', t:t40, w:w40, l:k40, qty:l40},
  ];
  if(l43>0) bokovoy.push({name:'Горизонтальный брус', t:t43, w:w43, l:k43, qty:l43});
  if(bokFrame.hasRaskosina) bokovoy.push({name:'Раскосина', t:t_raskosina, w:w_raskosina, l:k42, qty:l42});
  bokovoy.push({name:'Опорная планка', t:t_opora, w:w_opora, l:k_opora, qty:l_opora});
  if(l41>0) bokovoy.push({name:'Доска', t:t41, w:w41, l:k41, qty:l41});
  fbBok.extra.forEach((e,i)=>{
    bokovoy.push({name:'Доска (дополнительная) '+(i+1), t:t41, w:e.width, l:k41, qty:e.qty});
  });

  const volBokPanel = vol(t40,w40,k40,l40) + vol(t43,w43,k43,l43)
    + vol(t_raskosina,w_raskosina,k42,l42) + vol(t_opora,w_opora,k_opora,l_opora)
    + vol(t41,w41,k41,l41) + fbBok.extra.reduce((s,e)=>s+vol(t41,e.width,k41,e.qty),0);

  // --- Итоговый расход пиломатериала ---
  const totalVolume = volDno + volKryshka + 2*volTorPanel + 2*volBokPanel;
  const normaVremeni = roundup(totalVolume*800/60*1.2, 1);

  const outerL = k9Base;

  if(thicknessLimitExceeded){
    warnings.push(`Расчётная толщина хотя бы одной детали превышает максимальную из «в наличии» (${availableThicknesses[availableThicknesses.length-1]} мм) — занижать толщину недопустимо, использовано расчётное значение по ГОСТ (потребуется пиломатериал большей толщины, чем отмечено «в наличии»).`);
  }

  return {
    warnings, dno, kryshka, endPanel, bokovoy,
    outerL, outerW, outerH, totalVolume, normaVremeni,
    // Параметры для чертежей (пока заглушки - см. src/ii1/diagrams.js).
    k9Base, W, L, H, t_stojka, skin, t21, t_longbeam, lidLayout,
    torecFrame, bokFrame, panelHeightFull
  };
}

function calculate(){
  const errEl = document.getElementById('err');
  errEl.textContent = '';
  document.getElementById('calcCheck').style.visibility = 'hidden';

  const removeFloorBoardsEl = document.getElementById('removeFloorBoards');
  const input = {
    L: parseFloat(document.getElementById('L').value),
    W: parseFloat(document.getElementById('W').value),
    H: parseFloat(document.getElementById('H').value),
    MASS: parseFloat(document.getElementById('M').value),
    fasteningType: fasteningType,
    solidRigidBase: document.getElementById('solidRigidBase').checked,
    removeFloorBoards: removeFloorBoardsEl ? removeFloorBoardsEl.checked : false,
    removeSkidBoards: document.getElementById('removeSkidBoards').checked,
    forkliftLoading: document.getElementById('forkliftLoading').checked,
    roundBoardWidths: document.getElementById('roundBoardWidths').checked,
    lidLayout: document.querySelector('input[name="lidLayout"]:checked').value,
  };

  const calc = computeGost10198II1(input);
  if(calc.error){ errEl.textContent = calc.error; return; }

  document.getElementById('outDims').innerHTML = `${Math.round(calc.outerL)} × ${Math.round(calc.outerW)} × ${Math.round(calc.outerH)} <span>мм</span>`;
  document.getElementById('outVolume').innerHTML = `${calc.totalVolume.toFixed(3)} <span>м³</span>`;
  document.getElementById('outTime').innerHTML = `${calc.normaVremeni} <span>ч</span>`;

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
  tablesHtml += `<div class="part-title">Дно</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramPlaceholder('Дно') + `</div>` + renderSection('', calc.dno) + `</div>`;
  tablesHtml += `<div class="part-title">Крышка</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramPlaceholder('Крышка') + `</div>` + renderSection('', calc.kryshka) + `</div>`;
  tablesHtml += `<div class="part-title">Щит торцевой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramPlaceholder('Щит торцевой') + `</div>` + renderSection('', calc.endPanel) + `</div>`;
  tablesHtml += `<div class="part-title" style="margin-bottom:26px">Щит боковой (2 шт.)</div><div class="spec-row-diagram"><div class="diagram-slot">` + diagramPlaceholder('Щит боковой') + `</div>` + renderSection('', calc.bokovoy) + `</div>`;
  const boardTablesEl = document.getElementById('boardTables');
  boardTablesEl.innerHTML = tablesHtml;
  const boardImages = Array.from(boardTablesEl.querySelectorAll('img'));
  Promise.all(boardImages.map(img => img.decode ? img.decode().catch(()=>{}) : Promise.resolve()))
    .then(()=> reserveDiagramOverflowScreen(boardTablesEl));

  let warningsHtml = '';
  if(calc.warnings.length){
    warningsHtml += '<div style="color:var(--warn);margin-bottom:10px;font-weight:700;">Внимание:</div>' +
      calc.warnings.map(w=>`<div style="margin-bottom:8px;">⚠ ${w}</div>`).join('');
  }
  const warningsEl = document.getElementById('warningsTop');
  warningsEl.innerHTML = warningsHtml;
  warningsEl.style.display = calc.warnings.length ? 'block' : 'none';

  document.getElementById('results').style.display = 'block';
  document.getElementById('calcCheck').style.visibility = 'visible';
}

['L','W','H','M'].forEach(id=>{
  document.getElementById(id).addEventListener('input', ()=>{
    document.getElementById('calcCheck').style.visibility = 'hidden';
  });
});
['solidRigidBase','roundBoardWidths','removeFloorBoards'].forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.addEventListener('change', ()=>{ document.getElementById('calcCheck').style.visibility = 'hidden'; });
});
document.querySelectorAll('input[name="lidLayout"]').forEach(el=>{
  el.addEventListener('change', ()=>{ document.getElementById('calcCheck').style.visibility = 'hidden'; });
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
    <img class="print-watermark" src="${LOGO_B64}" alt="">

    <h1>ГОСТ 10198-91 · тип II-1</h1>
    <div class="print-subtitle">Каркасно-щитовой неразборный плотный ящик</div>

    <div class="part-title">Общий вид ящика</div>
    <div class="spec-row-diagram">
      <div class="diagram-slot"></div>
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

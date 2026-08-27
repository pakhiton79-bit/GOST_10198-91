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

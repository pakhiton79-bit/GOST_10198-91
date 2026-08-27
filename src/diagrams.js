const DNO_IMG_B64 = "data:image/png;base64,__IMG:dno.png__"; // натуральный размер 385x197

// Схема "Дно": картинка на заднем плане, стрелки - SVG-слой в пиксельных
// координатах картинки (не масштабируется вместе с текстом), подписи - обычные
const TOREC_1_IMG_B64 = "data:image/png;base64,__IMG:torec_1.png__"; // натуральный размер 1352x1158 (вариант с 1 раскосиной)
const TOREC_2_IMG_B64 = "data:image/png;base64,__IMG:torec_2.png__"; // натуральный размер 1811x842 (вариант с 2 раскосинами)
const TOREC_3_IMG_B64 = "data:image/jpeg;base64,__IMG:torec_3.jpg__"; // натуральный размер 2476x802 (вариант с 3 раскосинами)
const TOREC_2FLOORS_1_IMG_B64 = "data:image/jpeg;base64,__IMG:torec_2floors_1raskosina.jpg__"; // натуральный размер 695x1051 (2 этажа, по 1 раскосине на этаж)
const TOREC_2FLOORS_2_IMG_B64 = "data:image/jpeg;base64,__IMG:torec_2floors_2raskosina.jpg__"; // натуральный размер 1222x1044 (2 этажа, по 2 раскосины на этаж)
const TOREC_2FLOORS_3_IMG_B64 = "data:image/jpeg;base64,__IMG:torec_2floors_3raskosina.jpg__"; // натуральный размер 1757x1030 (2 этажа, по 3 раскосины на этаж)
const TOREC_0_IMG_B64 = "data:image/jpeg;base64,__IMG:torec_0.jpg__"; // натуральный размер 1354x1134 (вариант без раскосины, H<=600мм либо W<=600мм)

const KRYSHKA_IMG_B64 = "data:image/png;base64,__IMG:kryshka.png__"; // натуральный размер 1718x1274
const KRYSHKA_2BEAMS_IMG_B64 = "data:image/jpeg;base64,__IMG:kryshka_2beams.jpg__"; // натуральный размер 1157x839 (вариант с 2 поперечными брусьями)

// наконечник считается вручную по углу линии, чтобы кончик точно совпадал с указанной точкой
const BOKOVOY_1_IMG_B64 = "data:image/png;base64,__IMG:bokovoy_1.png__"; // натуральный размер 1752x1093 (вариант с 1 раскосиной)
const BOKOVOY_2_IMG_B64 = "data:image/png;base64,__IMG:bokovoy_2.png__"; // натуральный размер 1811x1077 (вариант с 2 раскосинами)
const BOKOVOY_3_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_3.jpg__"; // натуральный размер 2290x1069 (вариант с 3 раскосинами)
const BOKOVOY_0_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_0.jpg__"; // натуральный размер 1146x693 (вариант без раскосины)

function headTriangle(fromX,fromY,toX,toY,scale){
  const angle = Math.atan2(toY-fromY, toX-fromX);
  const headLen = 9*scale, headW = 6.5*scale;
  const bx = toX - headLen*Math.cos(angle), by = toY - headLen*Math.sin(angle);
  const px1 = bx + (headW/2)*Math.sin(angle), py1 = by - (headW/2)*Math.cos(angle);
  const px2 = bx - (headW/2)*Math.sin(angle), py2 = by + (headW/2)*Math.cos(angle);
  return {bx,by,poly:`${toX},${toY} ${px1.toFixed(1)},${py1.toFixed(1)} ${px2.toFixed(1)},${py2.toFixed(1)}`};
}

// общий рендер схемы: картинка на заднем плане + стрелки/линии (SVG, в натуральных
// пиксельных координатах картинки) + подписи (HTML-блоки, фиксированный шрифт).
// strokeScale — множитель толщины линий/стрелок и размера наконечников относительно
// базовых значений (1.5px линия, наконечник 9×6.5px); нужен, потому что разные чертежи
// сидят на картинках очень разного натурального размера (напр. Дно — 2008×1212, у
// остальных пока ~300px) и один и тот же абсолютный пиксельный размер линии на них
// выглядит по-разному. По умолчанию 1 (старые маленькие чертежи), для Дна передаём 10.
// Единая нормировка толщины линий/стрелок для чертежей-фотографий: толщина линии в
// SVG задаётся в пикселях самого фото, а разные фото имеют разное натуральное
// разрешение, поэтому одинаковый strokeScale даёт разную видимую на экране толщину.
// Эталон — чертёж Дна (натуральная ширина 2008px, scale=10, подобран визуально).
// Для любого другого фото пересчитываем scale пропорционально его ширине, чтобы
// видимая толщина линий совпадала с эталоном независимо от разрешения снимка.
const PHOTO_STROKE_REF_WIDTH = 2008, PHOTO_STROKE_REF_SCALE = 10;
function photoStrokeScale(imgNaturalWidth){
  return PHOTO_STROKE_REF_SCALE * imgNaturalWidth / PHOTO_STROKE_REF_WIDTH;
}

// Ширина чертежа по умолчанию (см. .diagram-wrap в CSS) и максимальная высота,
// до которой он может «вырасти» при портретной ориентации фото (высота больше
// ширины, напр. 2-этажный торец на 1 раскосину). Без этого ограничения такие
// чертежи получались значительно выше обычных и налезали на соседнюю таблицу.
const DIAGRAM_DEFAULT_WIDTH = 260;
const DIAGRAM_MAX_HEIGHT = 240;

function renderDiagram(imgB64, altText, IW, IH, records, widthPx, strokeScale){
  const scale = strokeScale || 1;
  const lineWidth = (1.5*scale).toFixed(2);
  let shapes = '';
  let labels = '';
  records.forEach(r=>{
    const hasLine = ('x1' in r);
    const hasLabel = ('lx' in r);
    if(hasLine){
      if(r.type==='line'){
        shapes += `<line x1="${r.x1}" y1="${r.y1}" x2="${r.x2}" y2="${r.y2}" stroke="#4E342E" stroke-width="${lineWidth}"/>`;
      } else if(r.type==='double'){
        const headStart = headTriangle(r.x2,r.y2,r.x1,r.y1,scale);
        const headEnd   = headTriangle(r.x1,r.y1,r.x2,r.y2,scale);
        shapes += `<line x1="${headStart.bx.toFixed(1)}" y1="${headStart.by.toFixed(1)}" x2="${headEnd.bx.toFixed(1)}" y2="${headEnd.by.toFixed(1)}" stroke="#4E342E" stroke-width="${lineWidth}"/>`;
        shapes += `<polygon points="${headStart.poly}" fill="#4E342E"/>`;
        shapes += `<polygon points="${headEnd.poly}" fill="#4E342E"/>`;
      } else if(r.type==='single'){
        const head = headTriangle(r.x1,r.y1,r.x2,r.y2,scale);
        shapes += `<line x1="${r.x1}" y1="${r.y1}" x2="${head.bx.toFixed(1)}" y2="${head.by.toFixed(1)}" stroke="#4E342E" stroke-width="${lineWidth}"/>`;
        shapes += `<polygon points="${head.poly}" fill="#4E342E"/>`;
      }
    }
    if(hasLabel){
      const lx = (r.lx/IW*100).toFixed(2), ly = (r.ly/IH*100).toFixed(2);
      const labelClass = r.vertical ? 'diagram-label diagram-label-vertical' : 'diagram-label';
      labels += `<div class="${labelClass}" style="left:${lx}%;top:${ly}%">${r.text}</div>`;
    }
  });
  let w = widthPx;
  if(!w){
    w = DIAGRAM_DEFAULT_WIDTH;
    if(w * IH / IW > DIAGRAM_MAX_HEIGHT){
      w = Math.round(DIAGRAM_MAX_HEIGHT * IW / IH);
    }
  }
  const sizeStyle = ` style="width:${w}px;flex-basis:${w}px"`;
  return `<div class="diagram-wrap"${sizeStyle}>
    <img src="${imgB64}" alt="${altText}">
    <svg class="diagram-arrows" viewBox="0 0 ${IW} ${IH}" preserveAspectRatio="none">
      ${shapes}
    </svg>
    <div class="diagram-labels">${labels}</div>
  </div>`;
}

function diagramDno(skidLenMm, tBokDoska, outerWidthMm, tBokPlanka, tTorcaPlusPlanka){
  const skidLen   = Math.round(skidLenMm);
  const valBok    = Math.round(tBokDoska);
  const valWidth  = Math.round(outerWidthMm - tBokPlanka*2);
  const valTorca  = Math.round(tTorcaPlusPlanka);

  const records = [
    {type:'line', x1:1903, y1:434, x2:2067, y2:523},
    {type:'line', x1:664, y1:1079, x2:850, y2:1176},
    {type:'double', x1:2064, y1:531, x2:854, y2:1174, lx:1596, ly:956, text: skidLen+' мм'},
    {type:'line', x1:1843, y1:491, x2:2022, y2:397},
    {type:'line', x1:1881, y1:517, x2:2057, y2:423},
    {type:'single', x1:1794, y1:-78, x2:1947, y2:456, lx:1738, ly:-97, text: valBok+' мм'},
    {type:'line', x1:853, y1:1073, x2:593, y2:1208},
    {type:'line', x1:103, y1:676, x2:-125, y2:808},
    {type:'double', x1:-119, y1:814, x2:583, y2:1203, lx:104, ly:1056, text: valWidth+' мм'},
    {type:'line', x1:156, y1:750, x2:-12, y2:656},
    {type:'line', x1:119, y1:769, x2:-46, y2:679},
    {type:'single', x1:222, y1:48, x2:37, y2:699, lx:181, ly:22, text: valTorca+' мм'}
  ];

  return renderDiagram(DNO_IMG_B64, 'Дно - схема расположения деталей', 2008, 1212, records, null, photoStrokeScale(2008));
}

function diagramPlaceholder(label){
  // Временная заглушка вместо чертежа, для которого фото ещё не прислано.
  return `<div class="diagram-wrap diagram-placeholder" style="display:flex;align-items:center;justify-content:center;min-height:160px;border:1px dashed var(--border-input);border-radius:12px;color:var(--ink-soft);font-size:13px;text-align:center;padding:12px;">Чертёж «${label}» ещё не готов</div>`;
}

function diagramEndPanel1Raskosina(heightPlusT12Val, innerWidthVal){
  // Фото-чертёж для варианта с 1 раскосиной (натуральный размер 1352×1158).
  // Подпись высоты — полная высота рамы щита = высота груза + толщина доски дна.
  const val = Math.round(heightPlusT12Val);
  const innerWidth = Math.round(innerWidthVal);

  const records = [
    {type:'line', x1:1111, y1:36, x2:1541, y2:32},
    {type:'line', x1:1117, y1:1136, x2:1549, y2:1138},
    {type:'double', x1:1501, y1:33, x2:1499, y2:1140, lx:1483, ly:597, text: val+' мм', vertical:true},
    {type:'line', x1:1330, y1:922, x2:1328, y2:1318},
    {type:'line', x1:27, y1:922, x2:29, y2:1327},
    {type:'double', x1:30, y1:1275, x2:1330, y2:1277, lx:650, ly:1275, text: innerWidth+' мм'}
  ];

  return renderDiagram(TOREC_1_IMG_B64, 'Щит торцевой (1 раскосина) - схема расположения деталей', 1352, 1158, records, null, photoStrokeScale(1352));
}

function diagramEndPanel2Raskosina(heightPlusT12Val, planLenVal){
  // Фото-чертёж для варианта с 2 раскосинами (натуральный размер 1811×842).
  const val = Math.round(heightPlusT12Val);           // полная высота рамы щита = высота груза + толщина доски дна
  const planLen = Math.round(planLenVal);             // длина горизонтальной планки = ширина груза

  const records = [
    {type:'line', x1:24, y1:177, x2:23, y2:-122},
    {type:'line', x1:1787, y1:176, x2:1786, y2:-111},
    {type:'double', x1:23, y1:-97, x2:1786, y2:-97, lx:910, ly:-139, text: planLen+' мм'},
    {type:'line', x1:1625, y1:20, x2:1970, y2:19},
    {type:'line', x1:1635, y1:829, x2:1971, y2:830},
    {type:'double', x1:1931, y1:21, x2:1934, y2:832, lx:1923, ly:427, text: val+' мм', vertical:true}
  ];

  return renderDiagram(TOREC_2_IMG_B64, 'Щит торцевой (2 раскосины) - схема расположения деталей', 1811, 842, records, null, photoStrokeScale(1811));
}

function diagramEndPanel3Raskosina(heightPlusT12Val, planLenVal){
  // Фото-чертёж для варианта с 3 раскосинами (натуральный размер 2476×802).
  const val = Math.round(heightPlusT12Val);           // полная высота рамы щита = высота груза + толщина доски дна
  const planLen = Math.round(planLenVal);             // длина горизонтальной планки = ширина груза

  const records = [
    {type:'line', x1:13, y1:636, x2:4, y2:964},
    {type:'line', x1:2453, y1:637, x2:2453, y2:973},
    {type:'double', x1:9, y1:908, x2:2451, y2:910, lx:1231, ly:913, text: planLen+' мм'},
    {type:'line', x1:2302, y1:15, x2:2651, y2:13},
    {type:'line', x1:2316, y1:790, x2:2653, y2:790},
    {type:'double', x1:2593, y1:13, x2:2598, y2:793, lx:2598, ly:424, text: val+' мм', vertical:true}
  ];

  return renderDiagram(TOREC_3_IMG_B64, 'Щит торцевой (3 раскосины) - схема расположения деталей', 2476, 802, records, null, photoStrokeScale(2476));
}

function diagramEndPanel2Floors1Raskosina(heightPlusT12Val, floorSpanVal, planLenVal){
  // Фото-чертёж для варианта на 2 этажа, по 1 раскосине на этаж (натуральный размер
  // 695×1051). floorSpanVal — длина вертикальной планки одного этажа + ширина одной
  // горизонтальной планки (нижняя/средняя планка + вертикальная планка нижнего этажа).
  const val = Math.round(heightPlusT12Val);       // полная высота рамы щита = высота груза + толщина доски дна
  const floorSpan = Math.round(floorSpanVal);
  const planLen = Math.round(planLenVal);          // длина горизонтальной планки = ширина груза

  const records = [
    {type:'line', x1:568, y1:34, x2:899, y2:34},
    {type:'line', x1:573, y1:1026, x2:903, y2:1028},
    {type:'double', x1:838, y1:35, x2:839, y2:1031, lx:839, ly:537, text: val+' мм', vertical:true},
    {type:'line', x1:134, y1:582, x2:-160, y2:586},
    {type:'line', x1:135, y1:1025, x2:-159, y2:1024},
    {type:'double', x1:-101, y1:588, x2:-99, y2:1025, lx:-116, ly:796, text: floorSpan+' мм', vertical:true},
    {type:'line', x1:676, y1:140, x2:677, y2:-96},
    {type:'line', x1:29, y1:140, x2:27, y2:-102},
    {type:'double', x1:27, y1:-80, x2:676, y2:-78, lx:352, ly:-86, text: planLen+' мм'}
  ];

  return renderDiagram(TOREC_2FLOORS_1_IMG_B64, 'Щит торцевой (2 этажа, 1 раскосина на этаж) - схема расположения деталей', 695, 1051, records, null, photoStrokeScale(695));
}

function diagramEndPanel2Floors2Raskosina(heightPlusT12Val, floorSpanVal, planLenVal){
  // Фото-чертёж для варианта на 2 этажа, по 2 раскосины на этаж (натуральный размер
  // 1222×1044). floorSpanVal — длина вертикальной планки одного этажа + ширина одной
  // горизонтальной планки (та же величина, что и на чертеже с 1 раскосиной на этаж).
  const val = Math.round(heightPlusT12Val);       // полная высота рамы щита = высота груза + толщина доски дна
  const floorSpan = Math.round(floorSpanVal);
  const planLen = Math.round(planLenVal);          // длина горизонтальной планки = ширина груза

  const records = [
    {type:'line', x1:1101, y1:26, x2:1425, y2:26},
    {type:'line', x1:1104, y1:1018, x2:1424, y2:1020},
    {type:'double', x1:1339, y1:26, x2:1339, y2:1020, lx:1340, ly:528, text: val+' мм', vertical:true},
    {type:'line', x1:126, y1:575, x2:-177, y2:576},
    {type:'line', x1:131, y1:1016, x2:-179, y2:1020},
    {type:'double', x1:-115, y1:576, x2:-114, y2:1020, lx:-115, ly:795, text: floorSpan+' мм', vertical:true},
    {type:'line', x1:20, y1:132, x2:18, y2:-131},
    {type:'line', x1:1205, y1:133, x2:1207, y2:-128},
    {type:'double', x1:19, y1:-109, x2:1207, y2:-112, lx:604, ly:-124, text: planLen+' мм'}
  ];

  return renderDiagram(TOREC_2FLOORS_2_IMG_B64, 'Щит торцевой (2 этажа, 2 раскосины на этаж) - схема расположения деталей', 1222, 1044, records, null, photoStrokeScale(1222));
}

function diagramEndPanel2Floors3Raskosina(heightPlusT12Val, floorSpanVal, planLenVal){
  // Фото-чертёж для варианта на 2 этажа, по 3 раскосины на этаж (натуральный размер
  // 1757×1030). floorSpanVal — длина вертикальной планки одного этажа + ширина одной
  // горизонтальной планки (та же величина, что и на остальных чертежах 2 этажей).
  const val = Math.round(heightPlusT12Val);       // полная высота рамы щита = высота груза + толщина доски дна
  const floorSpan = Math.round(floorSpanVal);
  const planLen = Math.round(planLenVal);          // длина горизонтальной планки = ширина груза

  const records = [
    {type:'line', x1:120, y1:568, x2:-163, y2:566},
    {type:'line', x1:127, y1:1010, x2:-167, y2:1011},
    {type:'double', x1:-106, y1:567, x2:-106, y2:1010, lx:-110, ly:784, text: floorSpan+' мм', vertical:true},
    {type:'line', x1:1645, y1:1010, x2:1938, y2:1010},
    {type:'line', x1:1928, y1:19, x2:1635, y2:16},
    {type:'double', x1:1877, y1:19, x2:1879, y2:1012, lx:1880, ly:518, text: val+' мм', vertical:true},
    {type:'line', x1:1742, y1:127, x2:1743, y2:-128},
    {type:'line', x1:15, y1:-128, x2:15, y2:126},
    {type:'double', x1:13, y1:-100, x2:1741, y2:-101, lx:1154, ly:-102, text: planLen+' мм'}
  ];

  return renderDiagram(TOREC_2FLOORS_3_IMG_B64, 'Щит торцевой (2 этажа, 3 раскосины на этаж) - схема расположения деталей', 1757, 1030, records, null, photoStrokeScale(1757));
}

function diagramEndPanelNoRaskosina(heightPlusT12Val, widthVal){
  // Фото-чертёж для варианта без раскосины (H≤600мм либо W≤600мм — п.1.6.5/п.102 docx,
  // независимо друг от друга отключают раскосину на торце). Просто рамка из планок и
  // досок торца без диагоналей. Натуральный размер фото 1354×1134.
  // Высота = высота груза + толщина доски дна (то же значение, которым заполняется
  // доска торца, см. fbTorec); ширина = ширина груза (совпадает с k32).
  const val = Math.round(heightPlusT12Val);
  const width = Math.round(widthVal);

  const records = [
    {type:'line', x1:1122, y1:21, x2:1562, y2:19},
    {type:'line', x1:1122, y1:1118, x2:1565, y2:1118},
    {type:'double', x1:1514, y1:20, x2:1515, y2:1123, lx:1499, ly:562, text: val+' мм', vertical:true},
    {type:'line', x1:1337, y1:905, x2:1340, y2:1308},
    {type:'line', x1:35, y1:906, x2:35, y2:1308},
    {type:'double', x1:36, y1:1265, x2:1341, y2:1265, lx:696, ly:1271, text: width+' мм'}
  ];

  return renderDiagram(TOREC_0_IMG_B64, 'Щит торцевой (без раскосины) - схема расположения деталей', 1354, 1134, records, null, photoStrokeScale(1354));
}

function diagramEndPanel(k32val, sectionsVal, hasRaskosinaVal, innerWidthVal, heightPlusT12Val, useNoRaskosinaDiagram, floorsVal, floorSpanVal){
  // Новый фото-чертёж (рамка) показываем только при H≤600 либо когда раскосина не
  // требуется по углу (1 секция, угол >60°) — не при W≤600 (по указанию пользователя,
  // при W≤600 и H>600 возвращена прежняя заглушка). Для 1, 2 и 3 раскосин — свои фото.
  // Для секций больше 3 (пока максимум 4) фото ещё нет — показываем чертёж с
  // максимальным доступным числом раскосин (3) вместо заглушки: расположение планок
  // то же самое, просто не хватает одной секции на фото.
  // Для щита на 2 этажа (наружная высота >2000мм) фото есть для 1, 2 и 3 раскосин на
  // этаж (1, 2 или 3 секции по ширине). Для 4 секций - тот же приём, что и на 1 этаже:
  // показываем фото с максимальным доступным числом раскосин (3) вместо заглушки.
  if(floorsVal === 2){
    if(hasRaskosinaVal && sectionsVal <= 1){
      return diagramEndPanel2Floors1Raskosina(heightPlusT12Val, floorSpanVal, innerWidthVal);
    }
    if(hasRaskosinaVal && sectionsVal === 2){
      return diagramEndPanel2Floors2Raskosina(heightPlusT12Val, floorSpanVal, innerWidthVal);
    }
    if(hasRaskosinaVal && sectionsVal >= 3){
      return diagramEndPanel2Floors3Raskosina(heightPlusT12Val, floorSpanVal, innerWidthVal);
    }
    // Раскосина не нужна (угол >60° даже при 1 секции - узкий и высокий этаж) - для
    // такого случая на 2 этажа фото нет, переиспользуем одноэтажный чертёж без
    // раскосины на высоту одного этажа (предупреждение - на вызывающей стороне).
    return diagramEndPanelNoRaskosina(floorSpanVal, innerWidthVal);
  }
  if(useNoRaskosinaDiagram){
    return diagramEndPanelNoRaskosina(heightPlusT12Val, k32val);
  }
  if(hasRaskosinaVal && sectionsVal <= 1){
    return diagramEndPanel1Raskosina(heightPlusT12Val, innerWidthVal);
  }
  if(hasRaskosinaVal && sectionsVal === 2){
    return diagramEndPanel2Raskosina(heightPlusT12Val, innerWidthVal);
  }
  if(hasRaskosinaVal && sectionsVal >= 3){
    return diagramEndPanel3Raskosina(heightPlusT12Val, innerWidthVal);
  }

  return diagramPlaceholder('Щит торцевой');
}

function diagramKryshkaDefault(widthMm, lengthMm, t30, t32, t41, t40, edgeDistKryshkaMm, crossBeamQty, crossBeamWidthMm){
  // Длина крышки = длина груза + (толщина доски торца + толщина планки торца)*2 (см. k9Base).
  const valLen        = Math.round(lengthMm + t30*2 + t32*2);
  // Ширина груза + толщина основной доски боковой стенки*2.
  const valWidth       = Math.round(widthMm + t41*2);
  // Толщина основной доски бокового щита (t41) — постоянная величина, от «Оптимизировать размеры»
  // не зависит (эта галочка меняет только длину внутреннего поперечного бруса, k21).
  const valBokThick     = Math.round(t41);
  // Толщина вертикальной боковой планки (t40, планка бокового щита).
  const valPlankaThick  = Math.round(t40);
  // Расстояние от крайней планки крышки до края крышки (edgeDistKryshka = min(L/6, 1000)).
  const valEdgePlanka   = Math.round(edgeDistKryshkaMm);
  // Расстояние от крайнего поперечного бруса до края крышки: из длины крышки вычитаем
  // суммарную ширину, занятую самими брусьями (количество × ширина бруса), остаток делим
  // поровну на «количество брусьев + 1» промежутков.
  const valEdgeBeam     = crossBeamQty > 0
    ? Math.round((valLen - crossBeamQty*crossBeamWidthMm) / (crossBeamQty + 1))
    : Math.round(valLen);

  const records = [
    {type:'double', x1:1179, y1:173, x2:1379, y2:108},
    {type:'line', x1:1523, y1:858, x2:1621, y2:1033},
    {type:'line', x1:1697, y1:800, x2:1849, y2:1064},
    {type:'double', x1:1607, y1:1011, x2:1778, y2:944},
    {type:'single', x1:1722, y1:1388, x2:1701, y2:975, lx:1725, ly:1415, text: valEdgePlanka+' мм'},
    {type:'single', x1:1733, y1:226, x2:1283, y2:140, lx:1810, ly:222, text: valEdgeBeam+' мм'},
    {type:'line', x1:354, y1:1110, x2:515, y2:1430},
    {type:'double', x1:1839, y1:1060, x2:517, y2:1437, lx:1212, ly:1295, text: valLen+' мм'},
    {type:'line', x1:1100, y1:147, x2:1083, y2:116},
    {type:'single', x1:1242, y1:6, x2:1091, y2:130, lx:1258, ly:-42, text: valBokThick+' мм'},
    {type:'line', x1:322, y1:351, x2:-139, y2:496},
    {type:'line', x1:273, y1:265, x2:-175, y2:404},
    {type:'double', x1:-147, y1:396, x2:-107, y2:486},
    {type:'single', x1:200, y1:75, x2:-126, y2:439, lx:311, ly:-10, text: valPlankaThick+' мм'},
    {type:'line', x1:1228, y1:66, x2:1492, y2:-21},
    {type:'line', x1:1597, y1:811, x2:1838, y2:729},
    {type:'double', x1:1477, y1:-15, x2:1831, y2:735},
    {type:'label', lx:1806, ly:382, text: valWidth+' мм'}
  ];

  return renderDiagram(KRYSHKA_IMG_B64, 'Крышка - схема расположения деталей', 1718, 1274, records, null, photoStrokeScale(1718));
}

function diagramKryshka2Beams(widthMm, lengthMm, t30, t32, t41, t40, edgeDistKryshkaMm, crossBeamQty, crossBeamWidthMm){
  // Фото-чертёж для варианта с 2 поперечными брусьями (натуральный размер 1157×839).
  const valLen      = Math.round(lengthMm + t30*2 + t32*2);
  const valWidth    = Math.round(widthMm + t41*2);
  const valPlankaThick = Math.round(t40);
  const valEdgePlanka  = Math.round(edgeDistKryshkaMm);
  const valEdgeBeam    = crossBeamQty > 0
    ? Math.round((valLen - crossBeamQty*crossBeamWidthMm) / (crossBeamQty + 1))
    : Math.round(valLen);

  const records = [
    {type:'line', x1:373, y1:758, x2:433, y2:865},
    {type:'line', x1:244, y1:734, x2:353, y2:939},
    {type:'line', x1:320, y1:877, x2:420, y2:843},
    {type:'single', x1:81, y1:828, x2:372, y2:857, lx:53, ly:799, text: valEdgePlanka+' мм'},
    {type:'line', x1:184, y1:175, x2:-107, y2:268},
    {type:'line', x1:222, y1:236, x2:-82, y2:331},
    {type:'line', x1:-76, y1:256, x2:-50, y2:320},
    {type:'single', x1:250, y1:-31, x2:-63, y2:289, lx:301, ly:-65, text: valPlankaThick+' мм'},
    {type:'line', x1:1098, y1:453, x2:1199, y2:642},
    {type:'double', x1:347, y1:929, x2:1200, y2:641, lx:805, ly:779, text: valLen+' мм'},
    {type:'line', x1:764, y1:62, x2:995, y2:-13},
    {type:'line', x1:1007, y1:552, x2:1234, y2:480},
    {type:'double', x1:996, y1:-13, x2:1236, y2:479, lx:1155, ly:205, text: valWidth+' мм'},
    {type:'line', x1:173, y1:351, x2:75, y2:384},
    {type:'single', x1:28, y1:607, x2:117, y2:371, lx:5, ly:639, text: valEdgeBeam+' мм'}
  ];

  return renderDiagram(KRYSHKA_2BEAMS_IMG_B64, 'Крышка (2 поперечных бруса) - схема расположения деталей', 1157, 839, records, null, photoStrokeScale(1157));
}

function diagramKryshka(widthMm, lengthMm, t30, t32, t41, t40, edgeDistKryshkaMm, crossBeamQty, crossBeamWidthMm){
  // Для 2 поперечных брусьев — отдельное фото. Для остального количества (1, 3, 4...)
  // используется прежнее фото (сделано под 3 бруса, но размеры на нём общие для
  // любого количества, кроме конкретно 2, под которое сделано отдельное фото).
  if(crossBeamQty === 2){
    return diagramKryshka2Beams(widthMm, lengthMm, t30, t32, t41, t40, edgeDistKryshkaMm, crossBeamQty, crossBeamWidthMm);
  }
  return diagramKryshkaDefault(widthMm, lengthMm, t30, t32, t41, t40, edgeDistKryshkaMm, crossBeamQty, crossBeamWidthMm);
}

function diagramBokovoy1Raskosina(heightPlusFloorVal, overhangVal, boardLenVal){
  // Фото-чертёж для варианта с 1 раскосиной (натуральный размер 1752×1093).
  const valHeight = Math.round(heightPlusFloorVal);   // высота груза + толщина доски дна
  const valOverhang = Math.round(overhangVal);        // на сколько вертикальная планка перекрывает полоз (2/3 толщины полоза, не более 70мм)
  const valBoardLen = Math.round(boardLenVal);        // длина доски бока

  const records = [
    {type:'line', x1:1641, y1:36, x2:1835, y2:36},
    {type:'line', x1:1656, y1:870, x2:1910, y2:873},
    {type:'double', x1:1819, y1:39, x2:1820, y2:873, lx:1847, ly:488, text: valHeight+' мм', vertical:true},
    {type:'line', x1:1238, y1:1054, x2:1909, y2:1064},
    {type:'double', x1:1912, y1:873, x2:1910, y2:1068},
    {type:'single', x1:1613, y1:1216, x2:1910, y2:953, lx:1583, ly:1231, text: valOverhang+' мм'},
    {type:'line', x1:1710, y1:125, x2:1710, y2:-114},
    {type:'line', x1:33, y1:126, x2:32, y2:-115},
    {type:'double', x1:32, y1:-114, x2:1706, y2:-114, lx:878, ly:-108, text: valBoardLen+' мм'}
  ];

  return renderDiagram(BOKOVOY_1_IMG_B64, 'Щит боковой (1 раскосина) - схема расположения деталей', 1752, 1093, records, null, photoStrokeScale(1752));
}

function diagramBokovoy2Raskosina(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal){
  // Фото-чертёж для варианта с 2 раскосинами (натуральный размер 1811×1077).
  const valBoardLen = Math.round(boardLenVal);         // длина боковой доски
  const valOverhang = Math.round(overhangVal);         // на сколько планка перекрывает полоз
  const valEdgeDist = Math.round(edgeDistVal);         // расстояние от крайней планки до края бокового щита
  const valHeight = Math.round(heightPlusFloorVal);    // высота груза + толщина досок дна

  const records = [
    {type:'line', x1:1739, y1:104, x2:1736, y2:-153},
    {type:'line', x1:61, y1:124, x2:60, y2:-155},
    {type:'double', x1:63, y1:-125, x2:1737, y2:-123, lx:904, ly:-120, text: valBoardLen+' мм'},
    {type:'line', x1:1452, y1:1035, x2:1943, y2:1038},
    {type:'line', x1:1605, y1:898, x2:1942, y2:901},
    {type:'double', x1:1905, y1:901, x2:1905, y2:1040},
    {type:'single', x1:1519, y1:1207, x2:1902, y2:970, lx:1510, ly:1224, text: valOverhang+' мм'},
    {type:'line', x1:61, y1:777, x2:62, y2:1167},
    {type:'line', x1:203, y1:783, x2:203, y2:1161},
    {type:'double', x1:62, y1:1076, x2:204, y2:1077},
    {type:'single', x1:392, y1:1161, x2:131, y2:1078, lx:489, ly:1162, text: valEdgeDist+' мм'},
    {type:'line', x1:1607, y1:41, x2:1917, y2:39},
    {type:'double', x1:1889, y1:39, x2:1886, y2:902, lx:1934, ly:498, text: valHeight+' мм', vertical:true}
  ];

  return renderDiagram(BOKOVOY_2_IMG_B64, 'Щит боковой (2 раскосины) - схема расположения деталей', 1811, 1077, records, null, photoStrokeScale(1811));
}

function diagramBokovoy3Raskosina(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal){
  // Фото-чертёж для варианта с 3 раскосинами (натуральный размер 2290×1069).
  const valBoardLen = Math.round(boardLenVal);         // длина боковой доски
  const valOverhang = Math.round(overhangVal);         // на сколько планка перекрывает полоз
  const valEdgeDist = Math.round(edgeDistVal);         // расстояние от крайней планки до края бокового щита
  const valHeight = Math.round(heightPlusFloorVal);    // высота груза + толщина досок дна

  const records = [
    {type:'line', x1:2119, y1:855, x2:2466, y2:856},
    {type:'line', x1:1973, y1:1006, x2:2467, y2:1008},
    {type:'line', x1:2423, y1:856, x2:2425, y2:1009},
    {type:'single', x1:1802, y1:1152, x2:2421, y2:931, lx:1774, ly:1168, text: valOverhang+' мм'},
    {type:'line', x1:58, y1:854, x2:57, y2:1155},
    {type:'line', x1:191, y1:856, x2:191, y2:1154},
    {type:'line', x1:57, y1:1059, x2:191, y2:1059},
    {type:'single', x1:371, y1:1170, x2:119, y2:1060, lx:430, ly:1181, text: valEdgeDist+' мм'},
    {type:'line', x1:56, y1:138, x2:54, y2:-101},
    {type:'line', x1:2245, y1:152, x2:2245, y2:-97},
    {type:'double', x1:54, y1:-72, x2:2247, y2:-70, lx:1115, ly:-89, text: valBoardLen+' мм'},
    {type:'line', x1:192, y1:66, x2:-95, y2:66},
    {type:'line', x1:178, y1:856, x2:-98, y2:862},
    {type:'double', x1:-69, y1:66, x2:-67, y2:864, lx:-106, ly:485, text: valHeight+' мм', vertical:true}
  ];

  return renderDiagram(BOKOVOY_3_IMG_B64, 'Щит боковой (3 раскосины) - схема расположения деталей', 2290, 1069, records, null, photoStrokeScale(2290));
}

function diagramBokovoyNoRaskosina(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal){
  // Фото-чертёж для варианта без раскосины (натуральный размер 1146×693).
  const valBoardLen = Math.round(boardLenVal);         // длина доски бока (основной или дополнительной — совпадает)
  const valOverhang = Math.round(overhangVal);         // на сколько планка перекрывает полоз
  const valEdgeDist = Math.round(edgeDistVal);         // расстояние от края бокового щита до первой планки
  const valHeight = Math.round(heightPlusFloorVal);    // высота груза + толщина досок дна

  const records = [
    {type:'line', x1:275, y1:547, x2:275, y2:780},
    {type:'line', x1:79, y1:474, x2:77, y2:783},
    {type:'line', x1:79, y1:682, x2:275, y2:681},
    {type:'single', x1:443, y1:834, x2:182, y2:681, lx:497, ly:874, text: valEdgeDist+' мм'},
    {type:'line', x1:886, y1:48, x2:1329, y2:46},
    {type:'line', x1:889, y1:550, x2:1322, y2:549},
    {type:'double', x1:1293, y1:46, x2:1295, y2:549, lx:1304, ly:276, text: valHeight+' мм', vertical:true},
    {type:'line', x1:792, y1:647, x2:1326, y2:648},
    {type:'line', x1:1233, y1:551, x2:1234, y2:649},
    {type:'single', x1:935, y1:727, x2:1233, y2:600, lx:904, ly:743, text: valOverhang+' мм'},
    {type:'line', x1:1085, y1:123, x2:1082, y2:-95},
    {type:'line', x1:80, y1:129, x2:80, y2:-93},
    {type:'double', x1:80, y1:-71, x2:1082, y2:-73, lx:567, ly:-81, text: valBoardLen+' мм'}
  ];

  return renderDiagram(BOKOVOY_0_IMG_B64, 'Щит боковой (без раскосины) - схема расположения деталей', 1146, 693, records, null, photoStrokeScale(1146));
}

function diagramBokovoy(Hmm, t12val, t41val, k41val, overhangVal, edgeDistVal, raskosinCountVal, floorsVal, floorSpanVal){
  // Для варианта без раскосины (H≤600) и для 1, 2, 3 раскосин уже есть фото-чертежи.
  // Для 4+ раскосин фото ещё нет — показываем чертёж с максимальным доступным числом
  // раскосин (3) вместо заглушки: расположение планок то же самое, просто на фото
  // меньше секций, чем в реальном ящике.
  // Для щита на 2 этажа (наружная высота >2000мм) отдельного фото ещё нет — вместо
  // заглушки показываем чертёж ОДНОГО этажа (по числу раскосин на этот этаж, т.е.
  // raskosinCountVal/floorsVal) с его собственной высотой (floorSpanVal). Реальный
  // щит состоит из двух таких этажей со средней планкой между ними, поэтому картинка
  // приблизительная — соответствующее предупреждение выводится в calculate().
  if(floorsVal === 2){
    const perFloor = Math.round(raskosinCountVal / floorsVal);
    if(perFloor === 0){
      return diagramBokovoyNoRaskosina(k41val, overhangVal, edgeDistVal, floorSpanVal);
    }
    if(perFloor === 1){
      return diagramBokovoy1Raskosina(floorSpanVal, overhangVal, k41val);
    }
    if(perFloor === 2){
      return diagramBokovoy2Raskosina(k41val, overhangVal, edgeDistVal, floorSpanVal);
    }
    return diagramBokovoy3Raskosina(k41val, overhangVal, edgeDistVal, floorSpanVal);
  }
  if(raskosinCountVal === 0){
    return diagramBokovoyNoRaskosina(k41val, overhangVal, edgeDistVal, Hmm + t12val);
  }
  if(raskosinCountVal === 1){
    return diagramBokovoy1Raskosina(Hmm + t12val, overhangVal, k41val);
  }
  if(raskosinCountVal === 2){
    return diagramBokovoy2Raskosina(k41val, overhangVal, edgeDistVal, Hmm + t12val);
  }
  if(raskosinCountVal >= 3){
    return diagramBokovoy3Raskosina(k41val, overhangVal, edgeDistVal, Hmm + t12val);
  }

  return diagramPlaceholder('Щит боковой');
}

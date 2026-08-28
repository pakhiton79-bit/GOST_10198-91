const DNO_IMG_B64 = "data:image/png;base64,__IMG:dno.png__"; // натуральный размер 385x197

// Схема "Дно": картинка на заднем плане, стрелки - SVG-слой в пиксельных
// координатах картинки (не масштабируется вместе с текстом), подписи - обычные
// TOREC_1_IMG_B64 и TOREC_0_IMG_B64 - см. src/common-diagrams.js (общие с типом I-1).
const TOREC_2_IMG_B64 = "data:image/png;base64,__IMG:torec_2.png__"; // натуральный размер 1811x842 (вариант с 2 раскосинами)
const TOREC_3_IMG_B64 = "data:image/jpeg;base64,__IMG:torec_3.jpg__"; // натуральный размер 2476x802 (вариант с 3 раскосинами)
const TOREC_2FLOORS_1_IMG_B64 = "data:image/jpeg;base64,__IMG:torec_2floors_1raskosina.jpg__"; // натуральный размер 695x1051 (2 этажа, по 1 раскосине на этаж)
const TOREC_2FLOORS_2_IMG_B64 = "data:image/jpeg;base64,__IMG:torec_2floors_2raskosina.jpg__"; // натуральный размер 1222x1044 (2 этажа, по 2 раскосины на этаж)
const TOREC_2FLOORS_3_IMG_B64 = "data:image/jpeg;base64,__IMG:torec_2floors_3raskosina.jpg__"; // натуральный размер 1757x1030 (2 этажа, по 3 раскосины на этаж)

const KRYSHKA_IMG_B64 = "data:image/png;base64,__IMG:kryshka.png__"; // натуральный размер 1718x1274
const KRYSHKA_2BEAMS_IMG_B64 = "data:image/jpeg;base64,__IMG:kryshka_2beams.jpg__"; // натуральный размер 1157x839 (вариант с 2 поперечными брусьями)

// наконечник считается вручную по углу линии, чтобы кончик точно совпадал с указанной точкой
const BOKOVOY_1_IMG_B64 = "data:image/png;base64,__IMG:bokovoy_1.png__"; // натуральный размер 1752x1093 (вариант с 1 раскосиной)
const BOKOVOY_2_IMG_B64 = "data:image/png;base64,__IMG:bokovoy_2.png__"; // натуральный размер 1811x1077 (вариант с 2 раскосинами)
const BOKOVOY_3_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_3.jpg__"; // натуральный размер 1731x773 (вариант с 3 раскосинами, исправленное фото)
const BOKOVOY_0_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_0.jpg__"; // натуральный размер 1146x693 (вариант без раскосины)

// headTriangle, photoStrokeScale, DIAGRAM_DEFAULT_WIDTH/DIAGRAM_MAX_HEIGHT,
// renderDiagram - см. src/common-diagrams.js (общие с типом I-1).

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

// diagramPlaceholder, diagramEndPanel1Raskosina - см. src/common-diagrams.js (общие с типом I-1).

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

// diagramEndPanelNoRaskosina - см. src/common-diagrams.js (общие с типом I-1).

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

function diagramKryshkaDefault(widthMm, lengthMm, t30, t32, t41, t40, edgeDistKryshkaMm, crossBeamQty, crossBeamWidthMm, plankGapMm){
  // Фото под 3 планки крышки (l19=3) - выбор чертежа крышки идёт по l19, см. diagramKryshka().
  // Длина крышки = длина груза + (толщина доски торца + толщина планки торца)*2 (см. k9Base).
  const valLen        = Math.round(lengthMm + t30*2 + t32*2);
  // Ширина груза + толщина основной доски боковой стенки*2.
  const valWidth       = Math.round(widthMm + t41*2);
  // Толщина вертикальной боковой планки (t40, планка бокового щита) - при
  // «Оптимизировать размеры» увеличена на 2мм (см. вызов в app.js).
  const valPlankaThick  = Math.round(t40);
  // Расстояние от крайней планки крышки до края крышки (edgeDistKryshka = min(L/6, 1000)).
  const valEdgePlanka   = Math.round(edgeDistKryshkaMm);
  // Расстояние от крайнего поперечного бруса до края крышки: из длины крышки вычитаем
  // суммарную ширину, занятую самими брусьями (количество × ширина бруса), остаток делим
  // поровну на «количество брусьев + 1» промежутков.
  const valEdgeBeam     = crossBeamQty > 0
    ? Math.round((valLen - crossBeamQty*crossBeamWidthMm) / (crossBeamQty + 1))
    : Math.round(valLen);
  // Расстояние между соседними планками крышки - та же величина, что и шаг планок
  // бокового щита (bokSectionW в app.js), т.к. планки бока стоят по тем же местам.
  const valPlankGap    = Math.round(plankGapMm);

  const records = [
    {type:'line', x1:371, y1:1138, x2:506, y2:1432},
    {type:'line', x1:1661, y1:702, x2:1799, y2:1003},
    {type:'double', x1:1791, y1:991, x2:497, y2:1411, lx:1203, ly:1218, text: valLen+' мм'},
    {type:'line', x1:1140, y1:95, x2:1599, y2:-52},
    {type:'line', x1:1494, y1:845, x2:1909, y2:710},
    {type:'double', x1:1526, y1:-28, x2:1899, y2:714, lx:1748, ly:350, text: valWidth+' мм'},
    {type:'line', x1:1401, y1:160, x2:1245, y2:-168},
    {type:'line', x1:1093, y1:110, x2:993, y2:-101},
    {type:'double', x1:1006, y1:-73, x2:1255, y2:-150, lx:1115, ly:-141, text: valEdgePlanka+' мм'},
    {type:'double', x1:299, y1:989, x2:441, y2:936},
    {type:'single', x1:194, y1:1236, x2:377, y2:959, lx:205, ly:1296, text: valEdgeBeam+' мм'},
    {type:'line', x1:273, y1:422, x2:251, y2:378},
    {type:'single', x1:-51, y1:266, x2:263, y2:400, lx:-85, ly:225, text: valPlankaThick+' мм'},
    {type:'line', x1:963, y1:152, x2:859, y2:-50},
    {type:'line', x1:747, y1:219, x2:638, y2:13},
    {type:'double', x1:653, y1:42, x2:873, y2:-24, lx:751, ly:-8, text: valPlankGap+' мм'}
  ];

  return renderDiagram(KRYSHKA_IMG_B64, 'Крышка - схема расположения деталей', 1718, 1274, records, null, photoStrokeScale(1718));
}

function diagramKryshka2Beams(widthMm, lengthMm, t30, t32, t41, t40, edgeDistKryshkaMm, crossBeamQty, crossBeamWidthMm, plankGapMm){
  // Фото под 2 планки крышки (l19=2, натуральный размер 1157×839) - выбор чертежа
  // крышки идёт по l19, см. diagramKryshka().
  const valLen      = Math.round(lengthMm + t30*2 + t32*2);
  const valWidth    = Math.round(widthMm + t41*2);
  const valPlankaThick = Math.round(t40);
  const valEdgePlanka  = Math.round(edgeDistKryshkaMm);
  const valEdgeBeam    = crossBeamQty > 0
    ? Math.round((valLen - crossBeamQty*crossBeamWidthMm) / (crossBeamQty + 1))
    : Math.round(valLen);
  // Расстояние между соседними планками крышки (при l19=2 - единственный промежуток,
  // между двумя планками на фото) - та же величина, что и шаг планок бокового щита.
  const valPlankGap    = Math.round(plankGapMm);

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
    {type:'single', x1:28, y1:607, x2:117, y2:371, lx:5, ly:639, text: valEdgeBeam+' мм'},
    {type:'line', x1:390, y1:330, x2:430, y2:310},
    {type:'single', x1:480, y1:230, x2:410, y2:320, lx:490, ly:205, text: valPlankGap+' мм'}
  ];

  return renderDiagram(KRYSHKA_2BEAMS_IMG_B64, 'Крышка (2 поперечных бруса) - схема расположения деталей', 1157, 839, records, null, photoStrokeScale(1157));
}

function diagramKryshka(widthMm, lengthMm, t30, t32, t41, t40, edgeDistKryshkaMm, crossBeamQty, crossBeamWidthMm, plankCount, plankGapMm){
  // Выбор чертежа крышки идёт по количеству планок крышки (l19), а не по числу
  // поперечных брусьев: доступны 2 фото - под 2 планки и под 3. Для l19>3 показываем
  // фото под 3 планки (расположение планок то же самое, просто на фото меньше
  // планок, чем в реальном ящике) - как раньше делалось по числу брусьев.
  if(plankCount <= 2){
    return diagramKryshka2Beams(widthMm, lengthMm, t30, t32, t41, t40, edgeDistKryshkaMm, crossBeamQty, crossBeamWidthMm, plankGapMm);
  }
  return diagramKryshkaDefault(widthMm, lengthMm, t30, t32, t41, t40, edgeDistKryshkaMm, crossBeamQty, crossBeamWidthMm, plankGapMm);
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
  // Фото-чертёж для варианта с 3 раскосинами (натуральный размер 1731×773 - фото
  // заменено на исправленную версию, у исходного не хватало одной разделительной
  // линии на щите; координаты пересчитаны через привязку по границам самого рисунка
  // на старом/новом фото, т.к. новое фото - не чистый увеличенный кроп старого, а
  // отдельный снимок с другими полями).
  const valBoardLen = Math.round(boardLenVal);         // длина боковой доски
  const valOverhang = Math.round(overhangVal);         // на сколько планка перекрывает полоз
  const valEdgeDist = Math.round(edgeDistVal);         // расстояние от крайней планки до края бокового щита
  const valHeight = Math.round(heightPlusFloorVal);    // высота груза + толщина досок дна

  const records = [
    {type:'line', x1:1560.4, y1:618.9, x2:1807.7, y2:619.6},
    {type:'line', x1:1456.3, y1:726.7, x2:1808.4, y2:728.2},
    {type:'line', x1:1777.0, y1:619.6, x2:1778.4, y2:728.9},
    {type:'single', x1:1334.5, y1:831.0, x2:1775.6, y2:673.2, lx:1314.5, ly:842.4, text: valOverhang+' мм'},
    {type:'line', x1:91.7, y1:618.2, x2:91.0, y2:833.1},
    {type:'line', x1:186.5, y1:619.6, x2:186.5, y2:832.4},
    {type:'line', x1:91.0, y1:764.6, x2:186.5, y2:764.6},
    {type:'single', x1:314.7, y1:843.8, x2:135.2, y2:765.3, lx:356.8, ly:851.7, text: valEdgeDist+' мм'},
    {type:'line', x1:90.3, y1:107.0, x2:88.9, y2:-63.7},
    {type:'line', x1:1650.2, y1:117.0, x2:1650.2, y2:-60.8},
    {type:'double', x1:88.9, y1:-43.0, x2:1651.6, y2:-41.5, lx:844.9, ly:-55.1, text: valBoardLen+' мм'},
    {type:'line', x1:187.2, y1:55.6, x2:-17.3, y2:55.6},
    {type:'line', x1:177.2, y1:619.6, x2:-19.5, y2:623.9},
    {type:'double', x1:1.2, y1:55.6, x2:2.6, y2:625.3, lx:-25.2, ly:354.7, text: valHeight+' мм', vertical:true}
  ];

  return renderDiagram(BOKOVOY_3_IMG_B64, 'Щит боковой (3 раскосины) - схема расположения деталей', 1731, 773, records, null, photoStrokeScale(1731));
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
  // Для щита на 2 этажа фото ещё нет вообще (ни на 1 этаж, ни тем более на оба сразу
  // с центральной планкой) - показываем заглушку.
  if(floorsVal === 2){
    return diagramPlaceholder('Щит боковой (2 этажа)');
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

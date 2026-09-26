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
// Фото подобраны по числу планок бокового щита (l19) и наличию раскосины -
// раскосин всегда (число планок - 1), т.к. одна раскосина на каждую секцию
// между соседними планками (см. bokHasRaskosina/l42 в app.js).
const BOKOVOY_2P_0R_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_2p_0r.jpg__"; // натуральный размер 855x713 (2 планки, без раскосины)
const BOKOVOY_2P_1R_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_2p_1r.jpg__"; // натуральный размер 874x733 (2 планки, 1 раскосина)
const BOKOVOY_3P_0R_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_3p_0r.jpg__"; // натуральный размер 1390x752 (3 планки, без раскосины)
const BOKOVOY_3P_2R_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_3p_2r.jpg__"; // натуральный размер 1418x781 (3 планки, 2 раскосины)
const BOKOVOY_4P_0R_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_4p_0r.jpg__"; // натуральный размер 1900x778 (4 планки, без раскосины)
const BOKOVOY_4P_3R_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_4p_3r.jpg__"; // натуральный размер 1877x746 (4 планки, 3 раскосины)

// 2 этажа: та же логика подбора по числу планок (число раскосин = (планок-1)*2,
// т.к. раскосина ставится на каждую секцию на каждом из двух этажей).
const BOKOVOY_2FL_2P_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_2fl_2r.jpg__"; // натуральный размер 966x1361 (2 этажа, 2 планки, 2 раскосины)
const BOKOVOY_2FL_3P_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_2fl_4r.jpg__"; // натуральный размер 1381x1326 (2 этажа, 3 планки, 4 раскосины)
const BOKOVOY_2FL_4P_IMG_B64 = "data:image/jpeg;base64,__IMG:bokovoy_2fl_6r.jpg__"; // натуральный размер 1886x1338 (2 этажа, 4 планки, 6 раскосин)

// headTriangle, photoStrokeScale, DIAGRAM_DEFAULT_WIDTH/DIAGRAM_MAX_HEIGHT,
// renderDiagram - см. src/common-diagrams.js (общие с типом I-1).

function diagramDno(skidLenMm, tBokDoska, outerWidthMm, tBokPlanka, tTorcaPlusPlanka){
  const skidLen   = dimLabel(skidLenMm);
  const valBok    = dimLabel(tBokDoska);
  const valWidth  = dimLabel(outerWidthMm - tBokPlanka*2);
  const valTorca  = dimLabel(tTorcaPlusPlanka);

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
  const val = dimLabel(heightPlusT12Val);           // полная высота рамы щита = высота груза + толщина доски дна
  const planLen = dimLabel(planLenVal);             // длина горизонтальной планки = ширина груза

  const records = [
    {type:'line', x1:24, y1:177, x2:23, y2:-122},
    {type:'line', x1:1787, y1:176, x2:1786, y2:-111},
    {type:'double', x1:23, y1:-97, x2:1786, y2:-97, lx:910, ly:-139, text: planLen+' мм'},
    {type:'line', x1:1625, y1:20, x2:1970, y2:19},
    {type:'line', x1:1635, y1:829, x2:1971, y2:830},
    {type:'double', x1:1931, y1:21, x2:1934, y2:832, lx:1923, ly:427, text: val+' мм', vertical:true}
  ];

  return renderDiagram(TOREC_2_IMG_B64, 'Щит торцевой (2 раскосины) - схема расположения деталей', 1811, 842, records, 210, photoStrokeScale(1811));
}

function diagramEndPanel3Raskosina(heightPlusT12Val, planLenVal){
  // Фото-чертёж для варианта с 3 раскосинами (натуральный размер 2476×802).
  const val = dimLabel(heightPlusT12Val);           // полная высота рамы щита = высота груза + толщина доски дна
  const planLen = dimLabel(planLenVal);             // длина горизонтальной планки = ширина груза

  const records = [
    {type:'line', x1:13, y1:636, x2:4, y2:964},
    {type:'line', x1:2453, y1:637, x2:2453, y2:973},
    {type:'double', x1:9, y1:908, x2:2451, y2:910, lx:1231, ly:913, text: planLen+' мм'},
    {type:'line', x1:2302, y1:15, x2:2651, y2:13},
    {type:'line', x1:2316, y1:790, x2:2653, y2:790},
    {type:'double', x1:2593, y1:13, x2:2598, y2:793, lx:2598, ly:424, text: val+' мм', vertical:true}
  ];

  return renderDiagram(TOREC_3_IMG_B64, 'Щит торцевой (3 раскосины) - схема расположения деталей', 2476, 802, records, 210, photoStrokeScale(2476));
}

function diagramEndPanel2Floors1Raskosina(heightPlusT12Val, floorSpanVal, planLenVal){
  // Фото-чертёж для варианта на 2 этажа, по 1 раскосине на этаж (натуральный размер
  // 695×1051). floorSpanVal — длина вертикальной планки одного этажа + ширина одной
  // горизонтальной планки (нижняя/средняя планка + вертикальная планка нижнего этажа).
  const val = dimLabel(heightPlusT12Val);       // полная высота рамы щита = высота груза + толщина доски дна
  const floorSpan = dimLabel(floorSpanVal);
  const planLen = dimLabel(planLenVal);          // длина горизонтальной планки = ширина груза

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
  const val = dimLabel(heightPlusT12Val);       // полная высота рамы щита = высота груза + толщина доски дна
  const floorSpan = dimLabel(floorSpanVal);
  const planLen = dimLabel(planLenVal);          // длина горизонтальной планки = ширина груза

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

  return renderDiagram(TOREC_2FLOORS_2_IMG_B64, 'Щит торцевой (2 этажа, 2 раскосины на этаж) - схема расположения деталей', 1222, 1044, records, 210, photoStrokeScale(1222));
}

function diagramEndPanel2Floors3Raskosina(heightPlusT12Val, floorSpanVal, planLenVal){
  // Фото-чертёж для варианта на 2 этажа, по 3 раскосины на этаж (натуральный размер
  // 1757×1030). floorSpanVal — длина вертикальной планки одного этажа + ширина одной
  // горизонтальной планки (та же величина, что и на остальных чертежах 2 этажей).
  const val = dimLabel(heightPlusT12Val);       // полная высота рамы щита = высота груза + толщина доски дна
  const floorSpan = dimLabel(floorSpanVal);
  const planLen = dimLabel(planLenVal);          // длина горизонтальной планки = ширина груза

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

  return renderDiagram(TOREC_2FLOORS_3_IMG_B64, 'Щит торцевой (2 этажа, 3 раскосины на этаж) - схема расположения деталей', 1757, 1030, records, 210, photoStrokeScale(1757));
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
  const valLen        = dimLabel(lengthMm + t30*2 + t32*2);
  // Ширина груза + толщина основной доски боковой стенки*2.
  const valWidth       = dimLabel(widthMm + t41*2);
  // Толщина вертикальной боковой планки (t40, планка бокового щита) - при
  // «Оптимизировать размеры» увеличена на 2мм (см. вызов в app.js).
  const valPlankaThick  = dimLabel(t40);
  // Расстояние от крайней планки крышки до края крышки (edgeDistKryshka = min(L/6, 1000)).
  const valEdgePlanka   = dimLabel(edgeDistKryshkaMm);
  // Расстояние от крайнего поперечного бруса до края крышки: из длины крышки вычитаем
  // суммарную ширину, занятую самими брусьями (количество × ширина бруса), остаток делим
  // поровну на «количество брусьев + 1» промежутков.
  const valEdgeBeam     = crossBeamQty > 0
    ? dimLabel((valLen - crossBeamQty*crossBeamWidthMm) / (crossBeamQty + 1))
    : dimLabel(valLen);
  // Расстояние между соседними планками крышки (plankGapMm) на чертеже не
  // показываем - по замечанию пользователя, лишняя метка (не нужна помимо
  // остальных размеров крышки).

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
    {type:'single', x1:-51, y1:266, x2:263, y2:400, lx:-85, ly:225, text: valPlankaThick+' мм'}
  ];

  return renderDiagram(KRYSHKA_IMG_B64, 'Крышка - схема расположения деталей', 1718, 1274, records, null, photoStrokeScale(1718));
}

function diagramKryshka2Beams(widthMm, lengthMm, t30, t32, t41, t40, edgeDistKryshkaMm, crossBeamQty, crossBeamWidthMm, plankGapMm){
  // Фото под 2 планки крышки (l19=2, натуральный размер 1157×839) - выбор чертежа
  // крышки идёт по l19, см. diagramKryshka().
  const valLen      = dimLabel(lengthMm + t30*2 + t32*2);
  const valWidth    = dimLabel(widthMm + t41*2);
  const valPlankaThick = dimLabel(t40);
  const valEdgePlanka  = dimLabel(edgeDistKryshkaMm);
  const valEdgeBeam    = crossBeamQty > 0
    ? dimLabel((valLen - crossBeamQty*crossBeamWidthMm) / (crossBeamQty + 1))
    : dimLabel(valLen);
  // Расстояние между соседними планками крышки (plankGapMm) на чертеже не
  // показываем - по замечанию пользователя, лишняя метка (не нужна помимо
  // остальных размеров крышки, см. тот же фикс в diagramKryshkaDefault выше).

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

// Шесть чертежей ниже подобраны по фактическому числу планок бокового щита (l19)
// и наличию раскосины - число раскосин всегда (число планок - 1), т.к. одна
// раскосина ставится на каждую секцию между соседними планками (см. bokHasRaskosina
// в app.js). Подписи размещены по единой схеме на всех шести фото: длина доски бока
// (сверху, горизонтальная), высота груза+доски дна (справа, вертикальная), напуск
// на полоз (снизу справа, у последней планки), отступ до первой планки (снизу
// слева, у первой планки) - координаты у каждого фото свои (см. комментарий к
// каждой функции), т.к. сами фото разного размера.

function diagramBokovoy2Planks0Raskosina(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal){
  // Фото-чертёж: 2 планки, без раскосины (натуральный размер 855×713).
  const valBoardLen = dimLabel(boardLenVal);
  const valOverhang = dimLabel(overhangVal);
  const valEdgeDist = dimLabel(edgeDistVal);
  const valHeight = dimLabel(heightPlusFloorVal);

  const records = [
    {type:'line', x1:732, y1:22, x2:947, y2:22},
    {type:'line', x1:734, y1:624, x2:951, y2:624},
    {type:'double', x1:929, y1:22, x2:929, y2:624, lx:941, ly:323, text: valHeight+' мм', vertical:true},
    {type:'line', x1:834, y1:100, x2:835, y2:-109},
    {type:'line', x1:9, y1:92, x2:12, y2:-106},
    {type:'double', x1:12, y1:-89, x2:835, y2:-89, lx:423, ly:-95, text: valBoardLen+' мм'},
    {type:'line', x1:621, y1:707, x2:953, y2:707},
    {type:'line', x1:880, y1:625, x2:881, y2:708},
    {type:'single', x1:683, y1:836, x2:881, y2:666, lx:681, ly:861, text: valOverhang+' мм'},
    {type:'line', x1:125, y1:565, x2:125, y2:793},
    {type:'line', x1:11, y1:566, x2:12, y2:791},
    {type:'line', x1:10, y1:736, x2:126, y2:736},
    {type:'single', x1:-92, y1:534, x2:69, y2:736, lx:-101, ly:516, text: valEdgeDist+' мм'}
  ];

  return renderDiagram(BOKOVOY_2P_0R_IMG_B64, 'Щит боковой (2 планки, без раскосины) - схема расположения деталей', 855, 713, records, null, photoStrokeScale(855));
}

function diagramBokovoy2Planks1Raskosina(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal){
  // Фото-чертёж: 2 планки, 1 раскосина (натуральный размер 874×733).
  const valBoardLen = dimLabel(boardLenVal);
  const valOverhang = dimLabel(overhangVal);
  const valEdgeDist = dimLabel(edgeDistVal);
  const valHeight = dimLabel(heightPlusFloorVal);

  const records = [
    {type:'line', x1:746, y1:29, x2:961, y2:28},
    {type:'line', x1:748, y1:630, x2:965, y2:630},
    {type:'double', x1:943, y1:28, x2:943, y2:630, lx:955, ly:314, text: valHeight+' мм', vertical:true},
    {type:'line', x1:848, y1:106, x2:849, y2:-103},
    {type:'line', x1:23, y1:98, x2:26, y2:-100},
    {type:'double', x1:26, y1:-83, x2:849, y2:-83, lx:457, ly:-89, text: valBoardLen+' мм'},
    {type:'line', x1:635, y1:713, x2:967, y2:714},
    {type:'line', x1:894, y1:631, x2:895, y2:714},
    {type:'single', x1:697, y1:842, x2:895, y2:672, lx:695, ly:867, text: valOverhang+' мм'},
    {type:'line', x1:139, y1:571, x2:139, y2:799},
    {type:'line', x1:25, y1:572, x2:26, y2:797},
    {type:'line', x1:24, y1:742, x2:140, y2:742},
    {type:'single', x1:-78, y1:540, x2:83, y2:742, lx:-87, ly:522, text: valEdgeDist+' мм'}
  ];

  return renderDiagram(BOKOVOY_2P_1R_IMG_B64, 'Щит боковой (2 планки, 1 раскосина) - схема расположения деталей', 874, 733, records, null, photoStrokeScale(874));
}

function diagramBokovoy3Planks0Raskosina(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal){
  // Фото-чертёж: 3 планки, без раскосины (натуральный размер 1390×752).
  const valBoardLen = dimLabel(boardLenVal);
  const valOverhang = dimLabel(overhangVal);
  const valEdgeDist = dimLabel(edgeDistVal);
  const valHeight = dimLabel(heightPlusFloorVal);

  const records = [
    {type:'line', x1:1239, y1:36, x2:1454, y2:36},
    {type:'line', x1:1241, y1:638, x2:1458, y2:638},
    {type:'double', x1:1436, y1:36, x2:1436, y2:638, lx:1448, ly:337, text: valHeight+' мм', vertical:true},
    {type:'line', x1:1341, y1:114, x2:1342, y2:-95},
    {type:'line', x1:34, y1:106, x2:37, y2:-92},
    {type:'double', x1:37, y1:-75, x2:1342, y2:-75, lx:689, ly:-81, text: valBoardLen+' мм'},
    {type:'line', x1:1128, y1:721, x2:1460, y2:721},
    {type:'line', x1:1387, y1:639, x2:1388, y2:722},
    {type:'single', x1:1190, y1:850, x2:1388, y2:680, lx:1188, ly:875, text: valOverhang+' мм'},
    {type:'line', x1:139, y1:579, x2:139, y2:807},
    {type:'line', x1:36, y1:580, x2:37, y2:805},
    {type:'line', x1:35, y1:750, x2:140, y2:750},
    {type:'single', x1:-67, y1:548, x2:94, y2:750, lx:-76, ly:530, text: valEdgeDist+' мм'}
  ];

  return renderDiagram(BOKOVOY_3P_0R_IMG_B64, 'Щит боковой (3 планки, без раскосины) - схема расположения деталей', 1390, 752, records, null, photoStrokeScale(1390));
}

function diagramBokovoy3Planks2Raskosina(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal){
  // Фото-чертёж: 3 планки, 2 раскосины (натуральный размер 1418×781).
  const valBoardLen = dimLabel(boardLenVal);
  const valOverhang = dimLabel(overhangVal);
  const valEdgeDist = dimLabel(edgeDistVal);
  const valHeight = dimLabel(heightPlusFloorVal);

  const records = [
    {type:'line', x1:1272, y1:71, x2:1487, y2:71},
    {type:'line', x1:1274, y1:673, x2:1491, y2:673},
    {type:'double', x1:1469, y1:71, x2:1469, y2:673, lx:1481, ly:372, text: valHeight+' мм', vertical:true},
    {type:'line', x1:1374, y1:149, x2:1375, y2:-60},
    {type:'line', x1:67, y1:141, x2:70, y2:-57},
    {type:'double', x1:70, y1:-40, x2:1375, y2:-40, lx:722, ly:-46, text: valBoardLen+' мм'},
    {type:'line', x1:1161, y1:756, x2:1493, y2:756},
    {type:'line', x1:1420, y1:674, x2:1421, y2:757},
    {type:'single', x1:1223, y1:885, x2:1421, y2:715, lx:1221, ly:910, text: valOverhang+' мм'},
    {type:'line', x1:172, y1:614, x2:172, y2:842},
    {type:'line', x1:69, y1:615, x2:70, y2:840},
    {type:'line', x1:68, y1:785, x2:173, y2:785},
    {type:'single', x1:-34, y1:583, x2:127, y2:785, lx:-43, ly:565, text: valEdgeDist+' мм'}
  ];

  return renderDiagram(BOKOVOY_3P_2R_IMG_B64, 'Щит боковой (3 планки, 2 раскосины) - схема расположения деталей', 1418, 781, records, null, photoStrokeScale(1418));
}

function diagramBokovoy4Planks0Raskosina(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal){
  // Фото-чертёж: 4 планки, без раскосины (натуральный размер 1900×778).
  const valBoardLen = dimLabel(boardLenVal);
  const valOverhang = dimLabel(overhangVal);
  const valEdgeDist = dimLabel(edgeDistVal);
  const valHeight = dimLabel(heightPlusFloorVal);

  const records = [
    {type:'line', x1:1751, y1:49, x2:1977, y2:49},
    {type:'line', x1:1753, y1:651, x2:1981, y2:651},
    {type:'double', x1:1959, y1:49, x2:1959, y2:651, lx:1971, ly:350, text: valHeight+' мм', vertical:true},
    {type:'line', x1:1864, y1:127, x2:1865, y2:-82},
    {type:'line', x1:40, y1:119, x2:43, y2:-79},
    {type:'double', x1:43, y1:-62, x2:1865, y2:-62, lx:954, ly:-68, text: valBoardLen+' мм'},
    {type:'line', x1:1639, y1:734, x2:1983, y2:734},
    {type:'line', x1:1910, y1:652, x2:1911, y2:735},
    {type:'single', x1:1701, y1:863, x2:1911, y2:693, lx:1699, ly:888, text: valOverhang+' мм'},
    {type:'line', x1:156, y1:592, x2:156, y2:820},
    {type:'line', x1:42, y1:593, x2:43, y2:818},
    {type:'line', x1:41, y1:763, x2:157, y2:763},
    {type:'single', x1:-61, y1:561, x2:100, y2:763, lx:-70, ly:543, text: valEdgeDist+' мм'}
  ];

  return renderDiagram(BOKOVOY_4P_0R_IMG_B64, 'Щит боковой (4 планки, без раскосины) - схема расположения деталей', 1900, 778, records, null, photoStrokeScale(1900));
}

function diagramBokovoy4Planks3Raskosina(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal){
  // Фото-чертёж: 4 планки, 3 раскосины (натуральный размер 1877×746).
  const valBoardLen = dimLabel(boardLenVal);
  const valOverhang = dimLabel(overhangVal);
  const valEdgeDist = dimLabel(edgeDistVal);
  const valHeight = dimLabel(heightPlusFloorVal);

  const records = [
    {type:'line', x1:1737, y1:25, x2:1963, y2:25},
    {type:'line', x1:1739, y1:627, x2:1967, y2:627},
    {type:'double', x1:1945, y1:25, x2:1945, y2:627, lx:1957, ly:326, text: valHeight+' мм', vertical:true},
    {type:'line', x1:1850, y1:103, x2:1851, y2:-106},
    {type:'line', x1:26, y1:95, x2:29, y2:-103},
    {type:'double', x1:29, y1:-86, x2:1851, y2:-86, lx:940, ly:-92, text: valBoardLen+' мм'},
    {type:'line', x1:1625, y1:710, x2:1969, y2:710},
    {type:'line', x1:1896, y1:628, x2:1897, y2:711},
    {type:'single', x1:1687, y1:839, x2:1897, y2:669, lx:1685, ly:864, text: valOverhang+' мм'},
    {type:'line', x1:142, y1:568, x2:142, y2:796},
    {type:'line', x1:28, y1:569, x2:29, y2:794},
    {type:'line', x1:27, y1:739, x2:143, y2:739},
    {type:'single', x1:-75, y1:537, x2:86, y2:739, lx:-84, ly:519, text: valEdgeDist+' мм'}
  ];

  return renderDiagram(BOKOVOY_4P_3R_IMG_B64, 'Щит боковой (4 планки, 3 раскосины) - схема расположения деталей', 1877, 746, records, null, photoStrokeScale(1877));
}

// Три чертежа ниже - варианты на 2 этажа (средняя горизонтальная планка делит щит
// пополам). Подписи (6 шт.): длина доски бока (сверху), полная высота груза+доски
// дна (справа, целиком на весь щит), напуск на полоз (снизу справа - 2/3 толщины
// полоза, не более 70мм, как и у 1-этажных чертежей), отступ до крайней планки
// (снизу, отдельная подпись ещё правее/ниже overhang), и две подписи слева - длина
// верхней вертикальной планки (k40, чисто планка, от верха щита до верха средней
// горизонтальной планки) и длина нижней планки + ШИРИНА средней горизонтальной
// планки МИНУС напуск (w43+k40-overhang, от ВЕРХА средней планки до линии, где
// планка начинает заходить на полоз - т.е. без учёта самого напуска, он показан
// отдельной подписью).

function diagramBokovoy2Floors2Raskosina(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal, upperSpanVal, midPlankWidthVal){
  // Фото-чертёж: 2 этажа, 2 планки, 2 раскосины (натуральный размер 966×1361).
  const valBoardLen = dimLabel(boardLenVal);
  const valOverhang = dimLabel(overhangVal);
  const valEdgeDist = dimLabel(edgeDistVal);
  const valHeight = dimLabel(heightPlusFloorVal);
  const valUpperSpan = dimLabel(upperSpanVal);
  const valLowerSpan = dimLabel(upperSpanVal + midPlankWidthVal - overhangVal);

  const records = [
    {type:'line', x1:805, y1:47, x2:1073, y2:47},
    {type:'line', x1:807, y1:1250, x2:1083, y2:1249},
    {type:'double', x1:1052, y1:47, x2:1052, y2:1248, lx:1070, ly:647, text: valHeight+' мм', vertical:true},
    {type:'line', x1:907, y1:123, x2:907, y2:-56},
    {type:'line', x1:85, y1:109, x2:85, y2:-66},
    {type:'double', x1:85, y1:-46, x2:908, y2:-46, lx:496, ly:-64, text: valBoardLen+' мм'},
    {type:'line', x1:695, y1:1336, x2:1088, y2:1333},
    {type:'line', x1:966, y1:1250, x2:966, y2:1334},
    {type:'single', x1:731, y1:1471, x2:966, y2:1298, lx:728, ly:1482, text: valOverhang+' мм'},
    {type:'line', x1:197, y1:588, x2:-109, y2:588},
    {type:'line', x1:201, y1:1251, x2:-111, y2:1250},
    {type:'double', x1:-89, y1:588, x2:-89, y2:1250, lx:-103, ly:919, text: valLowerSpan+' мм', vertical:true},
    {type:'line', x1:197, y1:48, x2:-95, y2:46},
    {type:'double', x1:-22, y1:47, x2:-22, y2:588, lx:-75, ly:317, text: valUpperSpan+' мм', vertical:true},
    {type:'line', x1:85, y1:1191, x2:89, y2:1409},
    {type:'line', x1:199, y1:1192, x2:201, y2:1409},
    {type:'line', x1:89, y1:1362, x2:201, y2:1362},
    {type:'single', x1:393, y1:1512, x2:128, y2:1364, lx:399, ly:1532, text: valEdgeDist+' мм'}
  ];

  return renderDiagram(BOKOVOY_2FL_2P_IMG_B64, 'Щит боковой (2 этажа, 2 планки, 2 раскосины) - схема расположения деталей', 966, 1361, records, null, photoStrokeScale(966));
}

function diagramBokovoy2Floors3Planks(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal, upperSpanVal, midPlankWidthVal){
  // Фото-чертёж: 2 этажа, 3 планки, 4 раскосины (натуральный размер 1381×1326).
  const valBoardLen = dimLabel(boardLenVal);
  const valOverhang = dimLabel(overhangVal);
  const valEdgeDist = dimLabel(edgeDistVal);
  const valHeight = dimLabel(heightPlusFloorVal);
  const valUpperSpan = dimLabel(upperSpanVal);
  const valLowerSpan = dimLabel(upperSpanVal + midPlankWidthVal - overhangVal);

  const records = [
    {type:'line', x1:1236, y1:21, x2:1504, y2:21},
    {type:'line', x1:1238, y1:1224, x2:1514, y2:1223},
    {type:'double', x1:1483, y1:21, x2:1483, y2:1222, lx:1501, ly:621, text: valHeight+' мм', vertical:true},
    {type:'line', x1:1338, y1:97, x2:1338, y2:-82},
    {type:'line', x1:34, y1:83, x2:34, y2:-92},
    {type:'double', x1:34, y1:-72, x2:1339, y2:-72, lx:686, ly:-90, text: valBoardLen+' мм'},
    {type:'line', x1:1126, y1:1309, x2:1519, y2:1306},
    {type:'line', x1:1397, y1:1224, x2:1397, y2:1307},
    {type:'single', x1:1162, y1:1444, x2:1397, y2:1272, lx:1159, ly:1455, text: valOverhang+' мм'},
    {type:'line', x1:135, y1:564, x2:-160, y2:564},
    {type:'line', x1:139, y1:1225, x2:-162, y2:1224},
    {type:'double', x1:-140, y1:564, x2:-140, y2:1224, lx:-154, ly:894, text: valLowerSpan+' мм', vertical:true},
    {type:'line', x1:135, y1:22, x2:-146, y2:20},
    {type:'double', x1:-73, y1:21, x2:-73, y2:564, lx:-126, ly:292, text: valUpperSpan+' мм', vertical:true},
    {type:'line', x1:34, y1:1165, x2:38, y2:1382},
    {type:'line', x1:137, y1:1166, x2:139, y2:1382},
    {type:'line', x1:38, y1:1335, x2:139, y2:1335},
    {type:'single', x1:331, y1:1485, x2:66, y2:1337, lx:337, ly:1505, text: valEdgeDist+' мм'}
  ];

  return renderDiagram(BOKOVOY_2FL_3P_IMG_B64, 'Щит боковой (2 этажа, 3 планки, 4 раскосины) - схема расположения деталей', 1381, 1326, records, null, photoStrokeScale(1381));
}

function diagramBokovoy2Floors4Planks(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal, upperSpanVal, midPlankWidthVal){
  // Фото-чертёж: 2 этажа, 4 планки, 6 раскосин (натуральный размер 1886×1338).
  const valBoardLen = dimLabel(boardLenVal);
  const valOverhang = dimLabel(overhangVal);
  const valEdgeDist = dimLabel(edgeDistVal);
  const valHeight = dimLabel(heightPlusFloorVal);
  const valUpperSpan = dimLabel(upperSpanVal);
  const valLowerSpan = dimLabel(upperSpanVal + midPlankWidthVal - overhangVal);

  const records = [
    {type:'line', x1:1737, y1:33, x2:2016, y2:33},
    {type:'line', x1:1739, y1:1237, x2:2026, y2:1236},
    {type:'double', x1:1995, y1:33, x2:1995, y2:1235, lx:2013, ly:634, text: valHeight+' мм', vertical:true},
    {type:'line', x1:1850, y1:109, x2:1850, y2:-70},
    {type:'line', x1:29, y1:95, x2:29, y2:-80},
    {type:'double', x1:29, y1:-60, x2:1851, y2:-60, lx:940, ly:-78, text: valBoardLen+' мм'},
    {type:'line', x1:1627, y1:1322, x2:2031, y2:1319},
    {type:'line', x1:1909, y1:1237, x2:1909, y2:1320},
    {type:'single', x1:1663, y1:1457, x2:1909, y2:1285, lx:1660, ly:1468, text: valOverhang+' мм'},
    {type:'line', x1:142, y1:580, x2:-165, y2:580},
    {type:'line', x1:146, y1:1238, x2:-167, y2:1237},
    {type:'double', x1:-145, y1:580, x2:-145, y2:1237, lx:-159, ly:908, text: valLowerSpan+' мм', vertical:true},
    {type:'line', x1:142, y1:34, x2:-151, y2:32},
    {type:'double', x1:-78, y1:33, x2:-78, y2:580, lx:-131, ly:306, text: valUpperSpan+' мм', vertical:true},
    {type:'line', x1:29, y1:1178, x2:33, y2:1395},
    {type:'line', x1:144, y1:1179, x2:146, y2:1395},
    {type:'line', x1:33, y1:1348, x2:146, y2:1348},
    {type:'single', x1:338, y1:1498, x2:73, y2:1350, lx:344, ly:1518, text: valEdgeDist+' мм'}
  ];

  return renderDiagram(BOKOVOY_2FL_4P_IMG_B64, 'Щит боковой (2 этажа, 4 планки, 6 раскосин) - схема расположения деталей', 1886, 1338, records, null, photoStrokeScale(1886));
}

function diagramBokovoy(Hmm, t12val, t41val, k41val, overhangVal, edgeDistVal, raskosinCountVal, floorsVal, floorSpanVal, plankCountVal, plankLenVal, midPlankWidthVal){
  const hasRaskosina = raskosinCountVal > 0;
  const plankCount = Math.min(plankCountVal, 4);
  const heightPlusFloor = Hmm + t12val;

  if(floorsVal === 2){
    // Выбор идёт по числу планок, как и на 1 этаже - раскосина у 2-этажного щита
    // есть почти всегда (см. bokHasRaskosina в app.js), отдельных фото «без
    // раскосины» на 2 этажа не присылали.
    if(plankCount <= 2){
      return diagramBokovoy2Floors2Raskosina(k41val, overhangVal, edgeDistVal, heightPlusFloor, plankLenVal, midPlankWidthVal);
    }
    if(plankCount === 3){
      return diagramBokovoy2Floors3Planks(k41val, overhangVal, edgeDistVal, heightPlusFloor, plankLenVal, midPlankWidthVal);
    }
    return diagramBokovoy2Floors4Planks(k41val, overhangVal, edgeDistVal, heightPlusFloor, plankLenVal, midPlankWidthVal);
  }
  // Выбор фото идёт по числу планок (plankCountVal = l19) и наличию раскосины
  // (raskosinCountVal > 0 <=> bokHasRaskosina). Для 5+ планок фото ещё нет —
  // показываем чертёж с максимальным доступным числом планок (4): расположение
  // то же самое, просто на фото меньше планок, чем в реальном ящике.
  if(plankCount <= 2){
    return hasRaskosina
      ? diagramBokovoy2Planks1Raskosina(k41val, overhangVal, edgeDistVal, heightPlusFloor)
      : diagramBokovoy2Planks0Raskosina(k41val, overhangVal, edgeDistVal, heightPlusFloor);
  }
  if(plankCount === 3){
    return hasRaskosina
      ? diagramBokovoy3Planks2Raskosina(k41val, overhangVal, edgeDistVal, heightPlusFloor)
      : diagramBokovoy3Planks0Raskosina(k41val, overhangVal, edgeDistVal, heightPlusFloor);
  }
  return hasRaskosina
    ? diagramBokovoy4Planks3Raskosina(k41val, overhangVal, edgeDistVal, heightPlusFloor)
    : diagramBokovoy4Planks0Raskosina(k41val, overhangVal, edgeDistVal, heightPlusFloor);
}

// ===== Генерируемые чертежи I-3 (X-образные раскосины, любое число секций) =====
// Стиль - как у одобренных X-фото типа I-1: белые детали с чёрным контуром,
// у креста основная раскосина сверху, встречная - под ней.
// X-вариант торца на 1 этаж с 1 секцией - готовое фото (то же, что у типа I-1):
// где фото есть, используем фото, генерируем только остальное.
const I3_TOREC_1_X_IMG_B64 = "data:image/png;base64,__IMG:torec_1_x.png__";
// Толщина контура - из расчёта ~2px на экране: чертёж вписывается в слот
// (до ~290px по ширине и 240px по высоте), поэтому толщина в единицах
// картинки зависит от того, во что он упирается.
function i3stroke(IW, IH){
  return (2 * Math.max(IW/290, IH/240)).toFixed(1);
}
// Картинка + подписи. Вокруг чертежа - поле на толщину линии: иначе крайние
// линии рамы, лежащие ровно по краю картинки, обрезались бы наполовину и
// выглядели тоньше остальных (по замечанию пользователя). Подписи сдвигаются
// на то же поле.
function i3render(title, IW, IH, shapes, records, join){
  const stroke = i3stroke(IW, IH), m = Math.ceil(stroke);
  const W2 = IW + 2*m, H2 = IH + 2*m;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W2}" height="${H2}" viewBox="0 0 ${W2} ${H2}">`
    + `<rect width="100%" height="100%" fill="#fff"/>`
    + `<g transform="translate(${m},${m})" fill="#fff" stroke="#000" stroke-width="${stroke}" stroke-linejoin="${join || 'miter'}">${shapes}</g></svg>`;
  records.forEach(r=>{ ['x1','x2','lx'].forEach(k=>{ if(typeof r[k]==='number') r[k] += m; }); ['y1','y2','ly'].forEach(k=>{ if(typeof r[k]==='number') r[k] += m; }); });
  return renderDiagram('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), title, W2, H2, records, null, photoStrokeScale(W2));
}
const i3f = v => v.toFixed(1);
function i3rect(x, y, w, h){ return `<rect x="${i3f(x)}" y="${i3f(y)}" width="${i3f(w)}" height="${i3f(h)}"/>`; }
// Раскосина-полоса в прямоугольнике (l..r, top..bot): rising - «/».
function i3band(l, r, top, bot, rising, T){
  return rising
    ? `<polygon points="${i3f(l)},${i3f(bot-T)} ${i3f(r)},${i3f(top)} ${i3f(r)},${i3f(top+T)} ${i3f(l)},${i3f(bot)}"/>`
    : `<polygon points="${i3f(l)},${i3f(top)} ${i3f(r)},${i3f(bot-T)} ${i3f(r)},${i3f(bot)} ${i3f(l)},${i3f(top+T)}"/>`;
}
// Раскосина той же ширины (поперёк), что и планки (PW): все детали щита по
// 100 мм, поэтому и на чертеже они одной ширины (по указанию пользователя).
// Полоса шириной PW вдоль диагонали секции (из угла в угол), обрезанная по
// прямоугольнику секции - поэтому конец раскосины заходит в угол и
// примыкает сразу к обеим планкам: и к вертикальной, и к горизонтальной
// (по указанию пользователя, как на фото-чертежах).
function i3strip(l, r, top, bot, rising, PW){
  const x0 = l, y0 = rising ? bot : top, x1 = r, y1 = rising ? top : bot;
  const len = Math.hypot(x1-x0, y1-y0), nx = -(y1-y0)/len, ny = (x1-x0)/len;
  let poly = [[l,top],[r,top],[r,bot],[l,bot]];
  const clip = (sgn) => {                           // оставляем sgn*(n·(p-p0)) <= PW/2
    const d = p => sgn*(nx*(p[0]-x0) + ny*(p[1]-y0)) - PW/2;
    const out = [];
    for(let i=0; i<poly.length; i++){
      const a = poly[i], b = poly[(i+1)%poly.length], da = d(a), db = d(b);
      if(da <= 0) out.push(a);
      if((da <= 0) !== (db <= 0)){ const t = da/(da-db); out.push([a[0]+t*(b[0]-a[0]), a[1]+t*(b[1]-a[1])]); }
    }
    poly = out;
  };
  clip(1); clip(-1);
  return `<polygon points="${poly.map(p=>i3f(p[0])+','+i3f(p[1])).join(' ')}"/>`;
}
function i3cross(l, r, top, bot, rising, xMode, PW){
  return (xMode ? i3strip(l, r, top, bot, !rising, PW) : '') + i3strip(l, r, top, bot, rising, PW);
}
// Пропорция секции (ширина/высота) по реальным размерам, в разумных пределах.
function i3aspect(realW, realH){
  if(!(realW > 0) || !(realH > 0)) return 1;
  return Math.min(2.4, Math.max(0.45, realW/realH));
}

// --- Щит торцевой: N секций, 1 или 2 этажа ---
// Wmm - длина горизонтальной планки (ширина груза), Htot - высота рамы (H+t12),
// floorSpan - (2 этажа) вертикальная планка этажа + ширина гор. планки.
function diagramEndPanelGen(Wmm, Htot, sections, floors, xMode, floorSpanVal){
  const N = Math.max(1, Math.round(sections)), F = floors === 2 ? 2 : 1;
  const IH = F === 2 ? 1200 : 800, hp = 90, vw = 90; // гор. и верт. планки - одной ширины
  const innerH = (IH - hp*(F+1)) / F;
  const realSecW = (Wmm - 100*(N+1)) / N, realInH = F === 2 ? (Htot - 300)/2 : Htot - 200;
  const sw = innerH * i3aspect(realSecW, realInH);
  const IW = Math.round((N+1)*vw + N*sw);
  const vx = i => i*(vw + sw);                      // левый край i-й вертикальной планки
  let shapes = '';
  for(let fl=0; fl<F; fl++){
    const top = hp + fl*(innerH + hp), bot = top + innerH;
    const upper = F === 2 && fl === 0;              // верхний этаж - зеркально нижнему
    for(let i=0; i<N; i++){
      const leftHalf = i < Math.ceil(N/2);
      shapes += i3cross(vx(i)+vw, vx(i+1), top, bot, upper ? !leftHalf : leftHalf, xMode, vw);
    }
  }
  for(let fl=0; fl<F; fl++){
    const top = hp + fl*(innerH + hp);
    for(let i=0; i<=N; i++) shapes += i3rect(vx(i), top, vw, innerH);
  }
  for(let k=0; k<=F; k++) shapes += i3rect(0, k*(innerH + hp), IW, hp);

  const val = dimLabel(Htot), planLen = dimLabel(Wmm);
  const records = [
    {type:'line', x1:0, y1:150, x2:0, y2:-120},
    {type:'line', x1:IW, y1:150, x2:IW, y2:-120},
    {type:'double', x1:0, y1:-97, x2:IW, y2:-97, lx:IW/2, ly:-139, text: planLen+' мм'},
    {type:'line', x1:IW-160, y1:0, x2:IW+180, y2:0},
    {type:'line', x1:IW-160, y1:IH, x2:IW+180, y2:IH},
    {type:'double', x1:IW+140, y1:0, x2:IW+140, y2:IH, lx:IW+135, ly:IH/2, text: val+' мм', vertical:true}
  ];
  if(F === 2){
    const midBot = hp + innerH + hp;
    records.push(
      {type:'line', x1:130, y1:midBot, x2:-170, y2:midBot},
      {type:'line', x1:130, y1:IH, x2:-170, y2:IH},
      {type:'double', x1:-110, y1:midBot, x2:-110, y2:IH, lx:-115, ly:(midBot+IH)/2, text: dimLabel(floorSpanVal)+' мм', vertical:true}
    );
  }
  const title = `Щит торцевой (${F} эт., ${N} секц.${xMode ? ', X-раскосины' : ''}) - схема расположения деталей`;
  return i3render(title, IW, IH, shapes, records);
}

// --- Щит боковой: P планок (P-1 секций), 1 или 2 этажа ---
function diagramBokovoyGen(boardLenVal, overhangVal, edgeDistVal, heightPlusFloorVal, plankCount, floors, xMode, upperSpanVal, midPlankWidthVal, sectionWmm, lidBoardTVal, hasBraces){
  const P = Math.max(2, Math.round(plankCount)), F = floors === 2 ? 2 : 1;
  const PH = floors === 2 ? 1300 : 800, pw = 100, stub = 100, hp = 100; // средняя планка - той же ширины
  const ovh = 80;                                   // напуск планок ниже щита (на полоз)
  const innerH = F === 2 ? (PH - hp)/2 : PH;
  const realInH = F === 2 ? (heightPlusFloorVal - (midPlankWidthVal||100))/2 : heightPlusFloorVal;
  // Ширина секции - по реальной пропорции, но весь чертёж не длиннее ~4
  // (2 этажа - ~2.4) своих высот: иначе у очень длинного щита (10+ м) чертёж
  // превращается в тонкую полосу, а подписи наезжают друг на друга.
  const maxIW = (F === 2 ? 2.4 : 4) * (45 + PH + 80);
  const sw = Math.max(1.2*pw, Math.min(innerH * i3aspect(sectionWmm - 100, realInH), (maxIW - 2*stub - P*pw) / (P-1)));
  const panelW = 2*stub + P*pw + (P-1)*sw;
  const up = 45;                                    // планки чуть выступают над щитом (как в I-1)
  const IW = Math.round(panelW), IH = up + PH + ovh;
  const px = i => stub + i*(pw + sw);
  let shapes = `<g transform="translate(0,${up})">` + i3rect(0, 0, IW, PH); // доски бока - сплошной щит
  for(let fl=0; fl<F && hasBraces !== false; fl++){  // hasBraces=false - щит без раскосин
    const top = fl*(innerH + hp), bot = top + innerH;
    const upper = F === 2 && fl === 0;
    for(let i=0; i<P-1; i++){
      const leftHalf = i < Math.ceil((P-1)/2);
      shapes += i3cross(px(i)+pw, px(i+1), top, bot, upper ? !leftHalf : leftHalf, xMode, pw);
    }
  }
  shapes += '</g>';
  for(let i=0; i<P; i++) shapes += i3rect(px(i), 0, pw, IH);
  if(F === 2) shapes += i3rect(0, up + innerH, IW, hp);

  const lastR = px(P-1) + pw;
  const IHp = PH + ovh; // (записи ниже - в координатах щита, затем сдвиг на up)
  const k = IW / 260;   // единиц картинки на 1px при базовой ширине чертежа
  const records = [
    {type:'line', x1:IW, y1:0, x2:IW+215, y2:0},
    {type:'line', x1:IW, y1:PH, x2:IW+215, y2:PH},
    {type:'double', x1:IW+195, y1:0, x2:IW+195, y2:PH, lx:IW+207, ly:PH/2, text: dimLabel(heightPlusFloorVal)+' мм', vertical:true},
    {type:'line', x1:IW, y1:80, x2:IW, y2:-120},
    {type:'line', x1:0, y1:80, x2:0, y2:-120},
    {type:'double', x1:0, y1:-95, x2:IW, y2:-95, lx:Math.max(IW/2, px(0) + 150*k), ly:-101, text: dimLabel(boardLenVal)+' мм'},
    // Стрелка к выступающему верхнему левому углу первой планки - толщина
    // доски крышки (по указанию пользователя, как у чертежей типа I-1). У 2 этажей
    // подпись на ряд выше - слева под ней вертикальная подпись верхнего этажа.
    {type:'single', x1:px(0) - 12*k, y1:F === 2 ? -95 - 34*k : -95, x2:px(0), y2:-up*0.33, lx:px(0) - 12*k, ly:F === 2 ? -101 - 34*k : -101, text: dimLabel(lidBoardTVal)+' мм'},
    {type:'line', x1:lastR-260, y1:IHp, x2:IW+120, y2:IHp},
    {type:'line', x1:lastR, y1:PH, x2:lastR, y2:IHp},
    {type:'single', x1:lastR-200, y1:IHp+130, x2:lastR, y2:IHp-40, lx:lastR-202, ly:IHp+155, text: dimLabel(overhangVal)+' мм'},
    {type:'line', x1:px(0), y1:PH-60, x2:px(0), y2:IHp+90},
    {type:'line', x1:0, y1:PH-60, x2:0, y2:IHp+90},
    {type:'line', x1:0, y1:IHp+60, x2:px(0), y2:IHp+60},
    F === 2
      ? (P >= 4 // у широкого щита - правее первой планки, чтобы не слипаться с подписями этажей слева
        ? {type:'single', x1:px(0)+60*k, y1:IHp+190, x2:px(0)/2, y2:IHp+60, lx:px(0)+62*k, ly:IHp+215, text: dimLabel(edgeDistVal)+' мм'}
        : {type:'single', x1:-60, y1:IHp+190, x2:px(0)/2, y2:IHp+60, lx:-70, ly:IHp+215, text: dimLabel(edgeDistVal)+' мм'})
      : {type:'single', x1:-100, y1:PH-100, x2:px(0)/2, y2:IHp+60, lx:-110, ly:PH-118, text: dimLabel(edgeDistVal)+' мм'}
  ];
  if(F === 2){
    records.push(
      // подписи этажей - в два столбика (разнос - в пикселях экрана, через k),
      // иначе на широком (сильно уменьшенном) щите они наезжают друг на друга
      {type:'line', x1:px(0), y1:innerH, x2:-Math.max(160, 30*k), y2:innerH},
      {type:'line', x1:px(0), y1:PH, x2:-Math.max(160, 12*k), y2:PH},
      {type:'double', x1:-Math.max(120, 8*k), y1:innerH, x2:-Math.max(120, 8*k), y2:PH, lx:-Math.max(135, 9*k), ly:(innerH+PH)/2, text: dimLabel(upperSpanVal + midPlankWidthVal - overhangVal)+' мм', vertical:true},
      {type:'line', x1:px(0), y1:0, x2:-Math.max(150, 30*k), y2:0},
      {type:'double', x1:-Math.max(40, 27*k), y1:0, x2:-Math.max(40, 27*k), y2:innerH, lx:-Math.max(100, 28*k), ly:innerH/2, text: dimLabel(upperSpanVal)+' мм', vertical:true}
    );
  }
  records.forEach(r=>{ ['y1','y2','ly'].forEach(k=>{ if(typeof r[k]==='number') r[k] += up; }); });
  const title = `Щит боковой (${F} эт., ${P} планок${hasBraces === false ? ', без раскосин' : xMode ? ', X-раскосины' : ''}) - схема расположения деталей`;
  return i3render(title, IW, IH, shapes, records);
}

// --- Крышка: реальное число планок (l19) и поперечных брусьев (l21) ---
// Вид - как на фото крышки (косоугольная проекция): длина крышки идёт вправо-
// вверх (eu), ширина - влево-вверх (ev); планки лежат сверху поперёк крышки,
// поперечные брусья - снизу и видны торцами за передней и задней кромками.
// Положение планок/брусьев вдоль длины - в реальных пропорциях; сама длина
// крышки на чертеже - в пределах 1.4..4 её ширины (иначе очень длинная
// крышка превратилась бы в тонкую полосу).
function diagramKryshkaGen(widthMm, lengthMm, t30, t32, t41, t40, edgeDistKryshkaMm, crossBeamQty, crossBeamWidthMm, plankCount, plankGapMm){
  const lidLen = lengthMm + t30*2 + t32*2, lidW = widthMm + t41*2;
  const P = Math.max(1, Math.round(plankCount)), B = Math.max(0, Math.round(crossBeamQty));
  const eu = [0.9507, -0.3101], ev = [-0.4406, -0.8977];
  const Wv = 850, Lu = Wv * Math.min(4, Math.max(1.4, lidLen / lidW));
  const k = Lu / lidLen;                            // единиц чертежа на 1 мм вдоль длины
  // ширина планки/бруса на чертеже - не меньше, чем на фото крышки (схема, не
  // в масштабе: при реальных 100 мм на длинной крышке они были бы нитками),
  // но не шире, чем позволяет промежуток между соседними.
  const minGapU = P > 1 ? plankGapMm*k : Lu;
  const pw = Math.min(Math.max(100*k, 120), 0.55*minGapU);
  const bw = Math.min(pw, B > 0 ? 0.55*(Lu/(B+1)) : pw); // брусья - той же ширины, что и планки
  const up = [-8, -26], thick = [7, 20];            // подъём планок над крышкой, толщина крышки
  const pt = (u, v, d) => [u*eu[0] + v*ev[0] + (d?d[0]:0), u*eu[1] + v*ev[1] + (d?d[1]:0)];
  const polys = [];                                 // [точки] в порядке отрисовки
  const quad = (u0, u1, v0, v1, d) => [pt(u0,v0,d), pt(u1,v0,d), pt(u1,v1,d), pt(u0,v1,d)];
  const box = (u0, u1, v0, v1, lift) => {           // брусок: боковые грани + верх
    const base = lift ? up.map(x=>0) : thick, top = lift ? up : [0,0];
    polys.push([pt(u0,v0,base), pt(u1,v0,base), pt(u1,v0,top), pt(u0,v0,top)]);  // передняя грань
    polys.push([pt(u0,v0,base), pt(u0,v1,base), pt(u0,v1,top), pt(u0,v0,top)]);  // левая грань
    polys.push(quad(u0, u1, v0, v1, top));
  };
  // поперечные брусья - под крышкой, торцы видны за кромками
  const beamStep = B > 0 ? (lidLen - B*(crossBeamWidthMm||100)) / (B + 1) : 0;
  const beamU = i => (beamStep*(i+1) + i*(crossBeamWidthMm||100)) * k;
  for(let i=0; i<B; i++){
    const u0 = beamU(i);
    polys.push(quad(u0, u0+bw, -0.13*Wv, 1.13*Wv, [thick[0]*2, thick[1]*2]));
    polys.push([pt(u0,-0.13*Wv,[thick[0]*2,thick[1]*2]), pt(u0+bw,-0.13*Wv,[thick[0]*2,thick[1]*2]), pt(u0+bw,-0.13*Wv,[thick[0]*3.5,thick[1]*3.5]), pt(u0,-0.13*Wv,[thick[0]*3.5,thick[1]*3.5])]);
  }
  // крышка: передняя и левая грани толщины + верх
  polys.push([pt(0,0), pt(Lu,0), pt(Lu,0,thick), pt(0,0,thick)]);
  polys.push([pt(0,0), pt(0,Wv), pt(0,Wv,thick), pt(0,0,thick)]);
  polys.push(quad(0, Lu, 0, Wv));
  // планки сверху
  const plankU = i => P > 1 ? (edgeDistKryshkaMm + i*plankGapMm) * k : (Lu - pw)/2;
  for(let i=0; i<P; i++){
    const u0 = Math.min(Math.max(plankU(i), 0), Lu - pw);
    box(u0, u0 + pw, 0.05*Wv, 0.95*Wv, true);
  }
  // сдвиг всего в положительные координаты
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  polys.forEach(p=>p.forEach(([x,y])=>{ minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y); }));
  const m = 10, ox = m - minX, oy = m - minY;
  const IW = Math.round(maxX - minX + 2*m), IH = Math.round(maxY - minY + 2*m);
  const shapes = polys.map(p=>`<polygon points="${p.map(([x,y])=>i3f(x+ox)+','+i3f(y+oy)).join(' ')}"/>`).join('');
  const P2 = (u, v, d) => { const q = pt(u, v, d); return [q[0]+ox, q[1]+oy]; };

  // подписи (те же, что на фото крышки)
  const valLen = dimLabel(lidLen), valWidth = dimLabel(lidW), valPlankaThick = dimLabel(t40);
  const valEdgePlanka = dimLabel(edgeDistKryshkaMm);
  const valEdgeBeam = B > 0 ? dimLabel((dimLabel(lidLen) - B*crossBeamWidthMm) / (B + 1)) : dimLabel(lidLen);
  const off = (q, v, s) => [q[0] + v[0]*s, q[1] + v[1]*s];
  const nfront = [-ev[0], -ev[1]], nright = eu, nback = ev;
  const D = P2(0,0,thick), C = P2(Lu,0,thick), Bk = P2(Lu,Wv);
  const records = [];
  // длина - вдоль передней кромки, снаружи
  const d1 = off(D, nfront, 260), d2 = off(C, nfront, 260);
  records.push({type:'line', x1:D[0], y1:D[1], x2:off(D,nfront,300)[0], y2:off(D,nfront,300)[1]});
  records.push({type:'line', x1:C[0], y1:C[1], x2:off(C,nfront,300)[0], y2:off(C,nfront,300)[1]});
  records.push({type:'double', x1:d1[0], y1:d1[1], x2:d2[0], y2:d2[1], lx:(d1[0]+d2[0])/2, ly:(d1[1]+d2[1])/2, text: valLen+' мм'});
  // ширина - вдоль правой кромки, снаружи
  const Cr = P2(Lu,0), w1 = off(Cr, nright, 200), w2 = off(Bk, nright, 200);
  records.push({type:'line', x1:Cr[0], y1:Cr[1], x2:off(Cr,nright,240)[0], y2:off(Cr,nright,240)[1]});
  records.push({type:'line', x1:Bk[0], y1:Bk[1], x2:off(Bk,nright,240)[0], y2:off(Bk,nright,240)[1]});
  records.push({type:'double', x1:w1[0], y1:w1[1], x2:w2[0], y2:w2[1], lx:(w1[0]+w2[0])/2, ly:(w1[1]+w2[1])/2, text: valWidth+' мм'});
  // отступ крайней планки от края крышки - за задней кромкой, у правого конца
  const uLast = Math.min(Math.max(plankU(P-1), 0), Lu - pw) + pw;
  const e1 = P2(uLast, Wv, up), e2 = P2(Lu, Wv);
  const ea = off(e1, nback, 170), eb = off(e2, nback, 170);
  records.push({type:'line', x1:e1[0], y1:e1[1], x2:off(e1,nback,210)[0], y2:off(e1,nback,210)[1]});
  records.push({type:'line', x1:e2[0], y1:e2[1], x2:off(e2,nback,210)[0], y2:off(e2,nback,210)[1]});
  records.push({type:'double', x1:ea[0], y1:ea[1], x2:eb[0], y2:eb[1], lx:(ea[0]+eb[0])/2, ly:(ea[1]+eb[1])/2 - 40, text: valEdgePlanka+' мм'});
  // отступ крайнего поперечного бруса - у левого конца, за передней кромкой
  if(B > 0){
    const b1 = off(P2(0,0,thick), nfront, 120), b2 = off(P2(beamU(0),0,thick), nfront, 120);
    records.push({type:'double', x1:b1[0], y1:b1[1], x2:b2[0], y2:b2[1]});
    const mid = [(b1[0]+b2[0])/2, (b1[1]+b2[1])/2];
    records.push({type:'single', x1:mid[0]-150, y1:mid[1]+230, x2:mid[0], y2:mid[1], lx:mid[0]-160, ly:mid[1]+270, text: valEdgeBeam+' мм'});
  }
  // толщина планки бокового щита - сноска к левому заднему углу первой планки
  const u1 = Math.min(Math.max(plankU(0), 0), Lu - pw);
  const tc = P2(u1, 0.95*Wv, up);
  records.push({type:'single', x1:tc[0]-260, y1:tc[1]-120, x2:tc[0], y2:tc[1], lx:tc[0]-290, ly:tc[1]-160, text: valPlankaThick+' мм'});

  return i3render(`Крышка (${P} планок) - схема расположения деталей`, IW, IH, shapes, records, 'round');
}

// ГОСТ 10198-91, тип I-1: чертежи расположения деталей. Дно и крышка - фото
// ещё не присланы, показывают заглушку. Щит торцевой полностью совпадает по
// конструкции с торцом типа I-3 (вариант без раскосины и с 1 раскосиной - у
// типа I-1 их бывает не больше одной), поэтому переиспользует готовые
// чертежи типа I-3 (diagramPlaceholder/diagramEndPanel1Raskosina/
// diagramEndPanelNoRaskosina - см. src/common-diagrams.js).
function diagramDno(){ return diagramPlaceholder('Дно'); }
function diagramKryshka(){ return diagramPlaceholder('Крышка'); }
function diagramTorec(heightVal, widthVal, hasRaskosinaVal){
  return hasRaskosinaVal
    ? diagramEndPanel1Raskosina(heightVal, widthVal)
    : diagramEndPanelNoRaskosina(heightVal, widthVal);
}

const BOK_I1_2_IMG_B64  = "data:image/jpeg;base64,__IMG:bok_i1_2planks.jpg__"; // натуральный размер 1178x876 (2 планки, без раскосины)
const BOK_I1_3_IMG_B64  = "data:image/jpeg;base64,__IMG:bok_i1_3planks.jpg__"; // натуральный размер 1807x884 (3 планки, без раскосины)
const BOK_I1_4_IMG_B64  = "data:image/jpeg;base64,__IMG:bok_i1_4planks.jpg__"; // натуральный размер 2208x834 (4 планки, без раскосины)
const BOK_I1_2R_IMG_B64 = "data:image/jpeg;base64,__IMG:bok_i1_2planks_1raskosina.jpg__"; // натуральный размер 1141x891 (2 планки, 1 раскосина)
const BOK_I1_3R_IMG_B64 = "data:image/jpeg;base64,__IMG:bok_i1_3planks_2raskosina.jpg__"; // натуральный размер 1812x909 (3 планки, 2 раскосины)
const BOK_I1_4R_IMG_B64 = "data:image/jpeg;base64,__IMG:bok_i1_4planks_3raskosina.jpg__"; // натуральный размер 2212x790 (4 планки, 3 раскосины)

// Калибровка по разметке, присланной пользователем для bok_i1_2planks.jpg
// (records с линиями/стрелками для варианта "2 планки, без раскосины") -
// перенесена на остальные 5 фото по аналогии (те же 4 группы стрелок:
// высота груза, толщина планки, отступ от края до крайней планки, длина
// доски), координаты которых у каждого фото свои: IW/IH - натуральный размер
// фото; stubL/stubR - центр крайней (не выступающей) вертикальной линии по
// краям щита; p1L - центр левого края первой планки; pNR - центр правого
// края последней планки; topY/botY - y верхней/нижней линии рамки щита.
const BOK_I1_GEOM = {
  '0_2': {img: BOK_I1_2_IMG_B64,  IW:1178, IH:876, stubL:71.5, p1L:207.5, pNR:987.5,  stubR:1123.5, topY:68.5, botY:786.5},
  '0_3': {img: BOK_I1_3_IMG_B64,  IW:1807, IH:884, stubL:55.5, p1L:190.5, pNR:1616.5, stubR:1752.5, topY:73.5, botY:792.5},
  '0_4': {img: BOK_I1_4_IMG_B64,  IW:2208, IH:834, stubL:73.5, p1L:193.5, pNR:2033.5, stubR:2153.5, topY:90.5, botY:728.5},
  '1_2': {img: BOK_I1_2R_IMG_B64, IW:1141, IH:891, stubL:32.5, p1L:168.5, pNR:948.5,  stubR:1084.5, topY:89.5, botY:807.5},
  '1_3': {img: BOK_I1_3R_IMG_B64, IW:1812, IH:909, stubL:66.5, p1L:201.5, pNR:1627.5, stubR:1763.5, topY:95.5, botY:814.5},
  '1_4': {img: BOK_I1_4R_IMG_B64, IW:2212, IH:790, stubL:68.5, p1L:188.5, pNR:2028.5, stubR:2148.5, topY:69.5, botY:707.5},
};

function diagramBokovoyPhoto(g, heightVal, plankTVal, edgeVal, boardLenVal){
  const IW = g.IW, IH = g.IH, topY = g.topY, botY = g.botY;
  const stubL = g.stubL, p1L = g.p1L, pNR = g.pNR, stubR = g.stubR;

  // Стрелка высоты груза - справа от последней планки, с отступом в поле
  // за пределами фото (аналогично Дно/торцу - линии-выноски продолжаются
  // за край снимка).
  const extOffset = 0.335*IW;
  const heightFarX = pNR + extOffset;
  const dblArrowX = pNR + extOffset*0.82;

  // Стрелка толщины планки - указывает на выступающий верхний левый угол
  // первой планки.
  const thickTargetY = topY*0.67;
  const thickTailX = -0.0484*IW, thickTailY = 0.3767*IH;

  // Скобка "отступ от края до крайней планки" - в поле под фото (снимки
  // содержат запас по высоте под рамкой щита специально под эту скобку).
  const bracketYStart = botY - 0.085*IH, bracketYEnd = IH;
  const bracketY = botY + 0.44*(IH-botY);
  const bracketMidX = (stubL+p1L)/2;
  const edgeTailX = 0.420*IW, edgeTailY = 1.17*IH;
  const edgeLabelX = 0.497*IW, edgeLabelY = 1.194*IH;

  // Стрелка длины доски - над фото, от края до края щита.
  const topLineY = -0.10*IH;

  const height = Math.round(heightVal);
  const plankT = Math.round(plankTVal);
  const edge = Math.round(edgeVal);
  const boardLen = Math.round(boardLenVal);

  const records = [
    {type:'line', x1:pNR, y1:topY, x2:heightFarX, y2:topY},
    {type:'line', x1:pNR, y1:botY, x2:heightFarX, y2:botY},
    {type:'double', x1:dblArrowX, y1:topY, x2:dblArrowX, y2:botY, lx:dblArrowX+7, ly:(topY+botY)/2, text: height+' мм', vertical:true},

    {type:'single', x1:thickTailX, y1:thickTailY, x2:p1L, y2:thickTargetY, lx:thickTailX+25, ly:thickTailY+45, text: plankT+' мм'},

    {type:'line', x1:stubL, y1:bracketYStart, x2:stubL, y2:bracketYEnd},
    {type:'line', x1:p1L, y1:bracketYStart, x2:p1L, y2:bracketYEnd},
    {type:'line', x1:stubL, y1:bracketY, x2:p1L, y2:bracketY},
    {type:'single', x1:edgeTailX, y1:edgeTailY, x2:bracketMidX, y2:bracketY, lx:edgeLabelX, ly:edgeLabelY, text: edge+' мм'},

    {type:'line', x1:stubL, y1:topY, x2:stubL, y2:topLineY},
    {type:'line', x1:stubR, y1:topY, x2:stubR, y2:topLineY},
    {type:'double', x1:stubL, y1:topLineY, x2:stubR, y2:topLineY, lx:(stubL+stubR)/2, ly:topLineY-10, text: boardLen+' мм'}
  ];

  return renderDiagram(g.img, 'Щит боковой - схема расположения деталей', IW, IH, records, null, photoStrokeScale(IW));
}

function diagramBokovoy(heightVal, plankTVal, edgeVal, boardLenVal, plankQty, hasRaskosinaVal){
  // Фото есть только для 2-4 планок; для большего числа планок показываем
  // чертёж с максимальным доступным (4) - предупреждение выводится отдельно
  // на вызывающей стороне (см. src/i1/calc.js).
  let n = plankQty;
  if(n < 2) n = 2;
  if(n > 4) n = 4;
  const key = (hasRaskosinaVal ? '1' : '0') + '_' + n;
  return diagramBokovoyPhoto(BOK_I1_GEOM[key], heightVal, plankTVal, edgeVal, boardLenVal);
}

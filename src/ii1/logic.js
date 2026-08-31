// ГОСТ 10198-91, тип II-1: каркасно-щитовые неразборные плотные ящики.
// Чистые расчётные формулы, без обращений к DOM. Источник — файл заказчика
// «ГОСТ 10198-91 тип 2-1.docx». Максимальная масса груза по этому типу — 20000 кг.
// Конструкция принципиально отличается от типа I-3/I-1 (щиты из досок): здесь
// боковые и торцевые щиты — каркас (стойки + горизонтальные брусья + раскосины),
// обшитый досками, а не сплошной набор планок/досок.

function roundup(x, decimals){
  const f = Math.pow(10, decimals);
  return Math.ceil(x*f - 1e-9)/f;
}
function ceilInt(x){
  return Math.ceil(x - 1e-9);
}
function vol(t,w,l,qty){ // m3, dims in mm
  return (t*w*l)/1e9*qty;
}

// fillBoards: заполняет пространство `space` (мм) досками шириной 100мм по максимуму,
// а остаток — 1-2(+) дополнительными досками шириной 75-99мм. См. подробные комментарии
// в src/logic.js (тип I-3) — здесь та же функция без изменений (независимые методики).
function fillBoards(space, roundWidths){
  space = Math.round(space);
  if(roundWidths){
    return {mainQty: ceilInt(space/100), extra: [], warn: false, singleNarrow: false};
  }
  let mainQty = Math.floor(space/100);
  const remainder = space - mainQty*100;
  const extra = [];
  let warn = false;
  if(remainder > 0){
    let placed = false;
    for(let borrow=0; borrow<=mainQty && !placed; borrow++){
      const total = remainder + 100*borrow;
      for(let n=1; n<=50 && !placed; n++){
        if(total < 75*n || total > 99*n) continue;
        mainQty -= borrow;
        const base = Math.floor(total/n);
        const rem2 = total - base*n;
        const groups = {};
        for(let i=0;i<n;i++){
          const w = base + (i<rem2?1:0);
          groups[w] = (groups[w]||0) + 1;
        }
        Object.keys(groups).map(Number).sort((a,b)=>a-b).forEach(w=>{
          extra.push({width:w, qty:groups[w]});
        });
        placed = true;
      }
    }
    if(!placed && mainQty === 0){
      extra.push({width:remainder, qty:1});
    } else if(!placed){
      const borrow = Math.min(mainQty, 1);
      mainQty -= borrow;
      const total = remainder + 100*borrow;
      const w1 = Math.min(99, Math.max(1, total-75));
      const w2 = total - w1;
      extra.push({width:w1, qty:1});
      if(w2>0) extra.push({width:w2, qty:1});
      warn = true;
    }
  }
  const totalExtraQty = extra.reduce((s,e)=>s+e.qty,0);
  const totalBoards = mainQty + totalExtraQty;
  const singleNarrow = totalBoards===1 && mainQty===0;
  return {mainQty, extra, warn, singleNarrow};
}

// Толщина досок обшивки (боковых/торцевых щитов и крышки) по массе груза.
// ЧЕРНОВАЯ таблица — по прямому указанию пользователя официальную таблицу
// в тексте ГОСТ не нашли («Нормальную таблицу я не нашел, попытайся её найти,
// а пока используй эту»). Верхняя граница диапазона (>600кг) в источнике не
// указана — применяется 25мм вплоть до 20000кг. Пользователь подтвердил
// использование этой таблицы как временной.
function skinThickness(mass){
  if(mass<=400) return 19;
  if(mass<=600) return 22;
  return 25;
}

// Толщина и ширина стоек по массе груза и наружной высоте ящика (по тексту
// источника — «табл. 12»). Ширина всегда 100мм (во всех ячейках источника).
const T_STOJKI_HEIGHTS = [1000,1500,2000,2500,3000];
const TABLE_STOJKI = [
  {maxMass:4000,  t:[25,25,32,32,40]},
  {maxMass:6000,  t:[25,25,32,40,40]},
  {maxMass:8000,  t:[25,32,40,40,50]},
  {maxMass:10000, t:[25,32,40,50,50]},
  {maxMass:16000, t:[25,40,50,50,50]},
  {maxMass:20000, t:[32,40,50,50,50]},
];
function stojkaSection(mass, outerHmm){
  let exceeded=false;
  let row = TABLE_STOJKI.find(r=>mass<=r.maxMass);
  if(!row){ row=TABLE_STOJKI[TABLE_STOJKI.length-1]; exceeded=true; }
  let colIdx = T_STOJKI_HEIGHTS.findIndex(h=>outerHmm<=h);
  if(colIdx===-1){ colIdx=T_STOJKI_HEIGHTS.length-1; exceeded=true; }
  return {t: row.t[colIdx], w: 100, exceeded};
}

// ГОСТ 10198-91, п.1.6.5-аналог: высота и ширина полозьев для грузов со сплошным
// жёстким основанием — только по массе груза (галочка «сплошное жёсткое основание
// груза»). Таблица идентична типу I-3 (см. src/logic.js, polozSection165) — те же
// значения приведены и в источнике этого типа.
function polozSection165(mass){
  const table = [
    {max:800,  h:44,  w:100},
    {max:1000, h:50,  w:100},
    {max:3000, h:75,  w:125},
    {max:5000, h:100, w:100},
    {max:10000,h:125, w:150},
    {max:20000,h:150, w:175},
  ];
  let row = table.find(r=>mass<=r.max);
  let exceeded = false;
  if(!row){ row = table[table.length-1]; exceeded = true; }
  return {h:row.h, w:row.w, exceeded};
}

// Табл. 19 — высота и ширина полозьев при креплении груза к полозьям/доскам дна,
// по массе, рабочей длине полоза и количеству полозьев. Таблица общая для типов
// I-3 и II-1 (тот же источник, см. подробные комментарии в src/logic.js) —
// значения перенесены без изменений из уже проверенной реализации типа I-3.
const T19_LENGTHS = [1000,1500,2000,2500,3000,3500,4000,4500,5000];
const TABLE19 = [
  {mass:500,  rows:[
    {count:2, dims:['50x100','60x100','60x100','75x100','75x100','100x100','100x100',null,null]},
    {count:3, dims:['40x100','50x100','50x100','60x100','100x60','100x75','100x75',null,null]},
  ]},
  {mass:800, rows:[
    {count:2, dims:['60x100','75x100','75x100','100x100','100x100','100x125','125x100',null,null]},
    {count:3, dims:['50x100','60x100','60x100','75x100','100x75','100x100','100x100',null,null]},
  ]},
  {mass:1000, rows:[
    {count:2, dims:['75x100','100x100','100x100','100x125','100x125','125x100','125x125',null,null]},
    {count:3, dims:['60x100','75x100','75x100','75x125','100x100','100x100','100x125',null,null]},
  ]},
  {mass:1500, rows:[
    {count:2, dims:['100x75','100x100','100x125','125x125','125x150','150x125','150x150',null,null]},
    {count:3, dims:['60x100','75x100','100x100','100x125','100x125','125x100','125x125',null,null]},
  ]},
  {mass:2000, rows:[
    {count:2, dims:['100x100','100x125','125x125','125x150','150x125','150x125','150x150',null,null]},
    {count:3, dims:['75x100','100x100','100x125','125x100','125x125','125x125','150x125',null,null]},
  ]},
  {mass:2500, rows:[
    {count:2, dims:['100x125','125x100','125x150','150x150','150x150','175x150','175x150','175x200',null]},
    {count:3, dims:['75x100','100x125','125x100','125x125','125x150','150x125','150x150','175x175',null]},
  ]},
  {mass:3000, rows:[
    {count:2, dims:['125x100','125x125','150x150','150x175','175x150','175x175','175x175','200x175','200x200']},
    {count:3, dims:['100x100','125x100','125x125','125x150','150x125','150x150','175x150','175x175','175x175']},
  ]},
  {mass:4000, rows:[
    {count:2, dims:['125x125','150x100','150x175','175x175','175x200','200x175','200x200','225x200','225x225']},
    {count:3, dims:['100x125','125x125','150x125','150x150','150x175','175x150','175x175','175x200','175x200']},
  ]},
  {mass:5000, rows:[
    {count:3, dims:['125x100','125x150','150x150','150x175','175x150','175x200','175x200','200x200','200x200']},
    {count:4, dims:['100x100','125x100','125x150','150x125','150x175','150x175','175x150','175x150','175x175']},
  ]},
  {mass:6000, rows:[
    {count:3, dims:['125x125','150x125','150x175','175x150','175x175','200x175','200x200','200x225','225x225']},
    {count:4, dims:['125x100','125x125','150x125','150x150','150x175','175x150','175x150','175x175','175x200']},
  ]},
  {mass:7000, rows:[
    {count:3, dims:['125x150','150x150','175x150','175x175','175x200','200x200','200x200','225x200','225x225']},
    {count:4, dims:['125x100','125x125','150x125','150x150','175x150','175x175','175x175','175x200','200x200']},
  ]},
  {mass:8000, rows:[
    {count:3, dims:['150x125','150x175','175x175','175x200','200x200','200x225','225x225','225x225','225x250']},
    {count:4, dims:['125x125','150x125','150x175','150x175','175x175','175x200','175x200','200x200','200x200']},
  ]},
  {mass:10000, rows:[
    {count:3, dims:[null,'175x175','175x200','200x200','225x225','225x250','250x225','250x225','250x250']},
    {count:4, dims:[null,'150x150','175x150','175x200','200x175','200x200','200x200','200x225','225x225']},
  ]},
  {mass:12000, rows:[
    {count:4, dims:[null,'150x175','175x150','175x200','200x200','200x225','225x225','225x250','250x225']},
    {count:5, dims:[null,'150x150','150x150','175x175','175x175','175x200','175x225','200x200','225x200']},
  ]},
  {mass:14000, rows:[
    {count:4, dims:[null,'175x175','175x175','200x200','200x225','225x225','225x225','225x250','250x225']},
    {count:5, dims:[null,'150x175','175x150','175x175','175x200','200x200','200x200','200x225','225x225']},
  ]},
  {mass:16000, rows:[
    {count:4, dims:[null,'175x200','175x200','200x200','225x225','225x250','250x225','250x225','250x250']},
    {count:5, dims:[null,'175x175','175x175','175x200','175x200','200x200','200x200','225x200','225x225']},
  ]},
  {mass:18000, rows:[
    {count:4, dims:[null,null,'175x200','200x200','225x225','225x250','250x225','250x225','250x250']},
    {count:5, dims:[null,null,'175x175','175x200','200x200','225x225','225x225','225x225','225x250']},
  ]},
  {mass:20000, rows:[
    {count:4, dims:[null,null,'200x200','225x225','225x250','250x225','250x225','250x225','250x250']},
    {count:5, dims:[null,null,'175x200','200x200','200x200','200x225','225x225','225x250','225x250']},
  ]},
];
const SKID_GRADATIONS = [40,50,60,75,100,125,150,175,200,225,250];
function skidGradeDown(mm){
  const i = SKID_GRADATIONS.indexOf(mm);
  return i > 0 ? SKID_GRADATIONS[i-1] : mm;
}
function nearestIndexBy(arr, keyFn, target){
  let best = 0, bestDiff = Infinity;
  arr.forEach((item,i)=>{
    const diff = Math.abs(keyFn(item) - target);
    if(diff < bestDiff || (diff === bestDiff && keyFn(item) > keyFn(arr[best]))){
      bestDiff = diff; best = i;
    }
  });
  return best;
}
function minSkidsByWidth162(widthMm, skidW){
  const span = Math.max(0, widthMm - (skidW||0));
  return Math.max(2, Math.ceil(span / 1200) + 1);
}
function selectSkid19(mass, workingLengthMm, widthMm){
  const massIdx = nearestIndexBy(TABLE19, r=>r.mass, mass);
  const massRow = TABLE19[massIdx];
  const massSnapped = mass > TABLE19[TABLE19.length-1].mass;
  const lengthExceeded = workingLengthMm > T19_LENGTHS[T19_LENGTHS.length-1];

  const options = massRow.rows.map(row=>{
    const availIdx = row.dims.map((d,i)=>d!==null ? i : null).filter(i=>i!==null);
    if(availIdx.length===0) return null;
    let bestI = availIdx[0], bestDiff = Infinity;
    availIdx.forEach(i=>{
      const diff = Math.abs(T19_LENGTHS[i]-workingLengthMm);
      if(diff<bestDiff || (diff===bestDiff && T19_LENGTHS[i]>T19_LENGTHS[bestI])){ bestDiff=diff; bestI=i; }
    });
    const nums = row.dims[bestI].split('x').map(Number);
    const h = Math.min(nums[0], nums[1]);
    const w = Math.max(nums[0], nums[1]);
    return {count:row.count, h, w, lengthUsed:T19_LENGTHS[bestI], lengthSnapped: lengthExceeded};
  }).filter(o=>o!==null);

  let valid = options.filter(o=>o.count>=minSkidsByWidth162(widthMm, o.w));
  let spacingExceeded = false;
  if(valid.length===0){
    let base = options.reduce((a,b)=> b.count>a.count ? b : a);
    let cur = base;
    while(cur.count < minSkidsByWidth162(widthMm, cur.w)){
      const w = skidGradeDown(cur.w);
      if(w===cur.w) break;
      cur = {count:cur.count+1, h:cur.h, w, lengthUsed:cur.lengthUsed, lengthSnapped:cur.lengthSnapped};
    }
    if(cur.count >= minSkidsByWidth162(widthMm, cur.w)){
      valid = [cur];
    } else {
      valid = [cur];
      spacingExceeded = true;
    }
  }

  let chosen = availableThicknesses.length ? valid.find(o=>availableThicknesses.includes(o.h)) : null;
  if(!chosen){
    chosen = valid.reduce((a,b)=> b.count<a.count ? b : a);
  }
  const finalH = Math.min(chosen.h, chosen.w);
  const finalW = Math.max(chosen.h, chosen.w);
  return {
    h: finalH, w: finalW, count: chosen.count,
    massUsed: massRow.mass, massSnapped,
    lengthUsed: chosen.lengthUsed, lengthSnapped: chosen.lengthSnapped,
    spacingExceeded
  };
}

// ГОСТ 10198-91, п.1.6.11-аналог: толщина подполозной доски по массе груза.
// Значения идентичны типу I-3.
function subfloorThicknessRaw(mass){
  if(mass<=1000) return 25;
  if(mass<=5000) return 32;
  if(mass<=10000) return 40;
  return 50;
}

// Торцовый брус дна — толщина/ширина по массе груза. Диапазон в источнике этого
// типа явно продлён до 20000кг (в отличие от типа I-3, где верхняя граница явно
// не описана дальше 5000кг) — сечение по верхнему диапазону НЕ считается выходом
// за пределы применимости.
function endBeamSection(mass){
  if(mass<=1000) return {h:44,w:100,exceeded:false};
  if(mass<=2000) return {h:60,w:100,exceeded:false};
  if(mass<=3500) return {h:75,w:100,exceeded:false};
  if(mass<=5000) return {h:100,w:100,exceeded:false};
  if(mass<=20000) return {h:125,w:125,exceeded:false};
  return {h:125,w:125,exceeded:true};
}

// Толщина доски дна при креплении груза за полозья (доски дна не несущие) —
// минимум по массе груза. Значения идентичны типу I-3.
function floorBoardThicknessNew(mass){
  return mass<=1000 ? 16 : 19;
}

// Табл. 4 — толщина досок дна при креплении груза к доскам дна, по удельной
// нагрузке и расстоянию между осями смежных полозьев. Общая для типов I-3 и
// II-1 (тот же источник) — значения перенесены без изменений.
const T4_LOADS = [0.10,0.20,0.25,0.30,0.35,0.40,0.45,0.50];
const T4_DISTANCES = [500,600,800,1000,1200];
const TABLE4 = [
  [19,19,19,22,25],
  [19,19,22,32,32],
  [19,22,25,32,40],
  [19,22,32,40,40],
  [19,22,32,40,50],
  [22,25,32,40,50],
  [22,25,40,50,50],
  [22,32,40,50,50],
];
function floorBoardThickness(mass, Lmm, Wmm, distanceMm){
  const S_cm2 = (Lmm/10)*(Wmm/10);
  const udel = mass/S_cm2;
  let exceeded = false;
  if(udel<0.10) return {value:19, udel, exceeded:false};
  let rowIdx = T4_LOADS.findIndex(v=>udel<=v);
  if(rowIdx===-1){ rowIdx = T4_LOADS.length-1; exceeded = true; }
  let colIdx = T4_DISTANCES.findIndex(v=>distanceMm<=v);
  if(colIdx===-1){ colIdx = T4_DISTANCES.length-1; exceeded = true; }
  return {value:TABLE4[rowIdx][colIdx], udel, exceeded};
}

// Табл. 14 — толщина поперечных брусьев крышки по массе груза и наружной ширине
// ящика. Значения в источнике этого типа (картинка в docx) численно совпадают с
// уже проверенной таблицей типа I-3 — перенесены без изменений.
const T14_WIDTHS = [1000,1500,2000,2500,3200];
const TABLE14 = [
  {maxMass:1000,  t:[32,32,32,40,40]},
  {maxMass:3000,  t:[32,32,40,50,50]},
  {maxMass:5000,  t:[32,40,50,60,75]},
  {maxMass:8000,  t:[40,50,60,75,75]},
  {maxMass:12000, t:[40,60,75,75,100]},
  {maxMass:20000, t:[50,75,75,100,100]},
];
function crossBeamThickness(mass, outerWmm){
  let exceeded=false;
  let row = TABLE14.find(r=>mass<=r.maxMass);
  if(!row){ row=TABLE14[TABLE14.length-1]; exceeded=true; }
  let colIdx = T14_WIDTHS.findIndex(w=>outerWmm<=w);
  if(colIdx===-1){ colIdx=T14_WIDTHS.length-1; exceeded=true; }
  return {value:row.t[colIdx], exceeded};
}

// Продольные брусья крышки (только режим «поперечное расположение досок») — по
// массе груза и расстоянию между осями поперечных брусьев крышки; строка выбирается
// по фактическому расстоянию между осями САМИХ продольных брусьев (≤750 / >750).
// «25×75, либо 25×100 при включённой «Округлить ширину досок»» — трактовка по
// уточнению пользователя.
const T_LONGBEAM_CROSS = [500,600,700,800,900,1000];
const TABLE_LONGBEAM = [
  { maxAxis:750, t:[25,25,32,32,32,40], wRoundOverride:100, wRoundBase:75 },
  { maxAxis:Infinity, t:[25,32,32,32,40,40] },
];
function longBeamSection(crossBeamAxisMm, roundBoardWidths, axisSpacingMm){
  let colIdx = T_LONGBEAM_CROSS.findIndex(v=>crossBeamAxisMm<=v);
  let exceeded=false;
  if(colIdx===-1){ colIdx=T_LONGBEAM_CROSS.length-1; exceeded=true; }
  const row = axisSpacingMm<=750 ? TABLE_LONGBEAM[0] : TABLE_LONGBEAM[1];
  let w = 100;
  if(row.wRoundOverride && colIdx===0){
    w = roundBoardWidths ? row.wRoundOverride : row.wRoundBase;
  }
  return {t: row.t[colIdx], w, exceeded};
}

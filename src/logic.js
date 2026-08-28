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

// ГОСТ 10198-91, п.1.6.11: толщина подполозной доски в зависимости от массы груза.
function subfloorThicknessRaw(mass){
  if(mass<=1000) return 25;
  if(mass<=5000) return 32;
  if(mass<=10000) return 40;
  return 50;
}

// ГОСТ 10198-91, п.1.6.15: толщина досок, планок и раскосов боковых, торцовых
// стенок и крышки ящиков типов I-3, I-4 в зависимости от массы груза.
// Пункт задаёт только два диапазона — стандарт для этого типа рассчитан на грузы до 3000 кг.
function wallThickness(mass){
  if(mass<=1000) return {value:19, exceeded:false};
  if(mass<=3000) return {value:22, exceeded:false};
  return {value:22, exceeded:true}; // за пределами явно описанного диапазона типа I-3/I-4
}

// ГОСТ 10198-91, п.1.6.5: высота и ширина полозьев для грузов со сплошным жёстким
// основанием при строплении за полозья в пределах основания груза — зависит
// только от массы груза, без привязки к длине.
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

// Новый стандарт полозьев («Таблица 19», источник — файл заказчика
// «Новые стандарты полозьев.docx»): высота и ширина полозьев при креплении
// груза к полозьям или доскам дна, по массе груза, рабочей длине полоза
// (= наружная длина ящика, k9Base) и количеству полозьев. На каждую массу —
// 2 варианта количества полозьев (напр. 2 или 3, у тяжёлых грузов 3/4, 4/5);
// null = сочетание масса×длина для этого количества полозьев не предусмотрено.
// Примечание к таблице: масса/длина, не совпадающие с таблицей, округляются
// до ближайшего (не обязательно вверх) значения.
// Значения взяты как есть из исходного файла заказчика, без исправлений.
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
    {count:3, dims:['125x100','125x150','150x150','50x175','175x150','175x200','175x200','200x200','200x200']},
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

// Полная градационная последовательность сечений полоза, встречающаяся в
// Табл. 19 (используется, когда таблица не предусматривает нужное
// количество полозьев для данной массы - см. selectSkid19 ниже).
const SKID_GRADATIONS = [40,50,60,75,100,125,150,175,200,225,250];
function skidGradeDown(mm){
  const i = SKID_GRADATIONS.indexOf(mm);
  return i > 0 ? SKID_GRADATIONS[i-1] : mm; // ниже некуда - минимум таблицы
}

function nearestIndexBy(arr, keyFn, target){
  let best = 0, bestDiff = Infinity;
  arr.forEach((item,i)=>{
    const diff = Math.abs(keyFn(item) - target);
    // при равном расстоянии выбираем больший вариант (запас прочности)
    if(diff < bestDiff || (diff === bestDiff && keyFn(item) > keyFn(arr[best]))){
      bestDiff = diff; best = i;
    }
  });
  return best;
}

// Подбор сечения и количества полозьев по новому стандарту (Табл. 19).
// mass - масса груза, workingLengthMm - рабочая длина полоза (= k9Base,
// наружная длина ящика), widthMm - внутренняя ширина груза (для проверки
// шага между осями полозьев не более 1200мм, п.1.6.2).
function selectSkid19(mass, workingLengthMm, widthMm){
  const massIdx = nearestIndexBy(TABLE19, r=>r.mass, mass);
  const massRow = TABLE19[massIdx];
  const massSnapped = massRow.mass !== mass;

  const lenIdx = nearestIndexBy(T19_LENGTHS.map(l=>({l})), r=>r.l, workingLengthMm);

  // Для каждого варианта количества полозьев ищем ближайшую непустую колонку
  // длины (своя для каждой строки - у тяжёлых грузов крайние левые колонки пустые).
  const options = massRow.rows.map(row=>{
    const availIdx = row.dims.map((d,i)=>d!==null ? i : null).filter(i=>i!==null);
    if(availIdx.length===0) return null;
    let bestI = availIdx[0], bestDiff = Infinity;
    availIdx.forEach(i=>{
      const diff = Math.abs(T19_LENGTHS[i]-workingLengthMm);
      if(diff<bestDiff || (diff===bestDiff && T19_LENGTHS[i]>T19_LENGTHS[bestI])){ bestDiff=diff; bestI=i; }
    });
    const [h,w] = row.dims[bestI].split('x').map(Number);
    return {count:row.count, h, w, lengthUsed:T19_LENGTHS[bestI], lengthSnapped: bestI!==lenIdx};
  }).filter(o=>o!==null);

  const minNeeded = minSkidsByWidth162(widthMm); // п.1.6.2 - минимум полозьев по шагу 1200мм
  let valid = options.filter(o=>o.count>=minNeeded);
  let spacingExceeded = false;
  let extrapolatedCount = null;
  if(valid.length===0){
    // Ни один вариант из таблицы не даёт нужное количество полозьев (например,
    // у масс 500-4000кг в Табл.19 предусмотрено только 2/3 полоза). Достраиваем
    // недостающие варианты сами: каждый следующий полоз - предыдущее сечение
    // (максимальное из тех, что есть в таблице для этой массы), уменьшенное на
    // 1 градацию по толщине И ширине - тот же принцип, которым отличаются
    // соседние столбцы "количество полозьев" внутри самой таблицы.
    let base = options.reduce((a,b)=> b.count>a.count ? b : a);
    let cur = base;
    while(cur.count < minNeeded){
      const h = skidGradeDown(cur.h), w = skidGradeDown(cur.w);
      if(h===cur.h && w===cur.w) break; // упёрлись в минимум градации - дальше не уменьшить
      cur = {count:cur.count+1, h, w, lengthUsed:cur.lengthUsed, lengthSnapped:cur.lengthSnapped};
    }
    if(cur.count >= minNeeded){
      valid = [cur];
      extrapolatedCount = cur.count;
    } else {
      valid = [base];
      spacingExceeded = true;
    }
  }

  let chosen = availableThicknesses.length ? valid.find(o=>availableThicknesses.includes(o.h)) : null;
  if(!chosen){
    chosen = valid.reduce((a,b)=> b.count<a.count ? b : a);
  }

  return {
    h: chosen.h, w: chosen.w, count: chosen.count,
    massUsed: massRow.mass, massSnapped,
    lengthUsed: chosen.lengthUsed, lengthSnapped: chosen.lengthSnapped,
    spacingExceeded,
    extrapolatedCount
  };
}

// ГОСТ 10198-91, п.1.6.2: "Расстояние между осями смежных полозьев не должно
// превышать 1200 мм". Это общее требование для любого типа крепления, не привязанное
// к конкретной таблице сечений - отсюда минимально необходимое количество полозьев
// по ширине груза. Грубая оценка (внутренняя ширина груза как приближение пролёта
// между крайними полозьями), но направление верное: чем шире груз, тем больше
// полозьев нужно, чтобы уложиться в шаг 1200 мм.
function minSkidsByWidth162(widthMm){
  return Math.max(2, Math.ceil(widthMm / 1200) + 1);
}

// ГОСТ 10198-91, п.1.6.8: толщина и ширина торцовых брусьев дна по массе груза.
function endBeamSection(mass){
  if(mass<=1000) return {h:44,w:100};
  if(mass<=2000) return {h:60,w:100};
  if(mass<=3500) return {h:75,w:100};
  if(mass<=5000) return {h:100,w:100};
  return {h:125,w:125};
}

// Толщина доски дна по массе груза (GOST10198_91POLOZIA.html - крепление за
// полозья): масса ≤1000кг - не менее 16мм, масса ≤20000кг - не менее 19мм.
function floorBoardThicknessNew(mass){
  return mass<=1000 ? 16 : 19;
}

// ГОСТ 10198-91, Таблица 4 (п.1.6.9): толщина досок дна при креплении груза
// к доскам дна, по удельной нагрузке и расстоянию между осями смежных
// полозьев (GOST10198_91DOSKI_DNA.html - крепление к доскам дна).
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
  if(udel<0.10) return {value:19, udel, exceeded:false}; // примечание 2 к табл.4
  let rowIdx = T4_LOADS.findIndex(v=>udel<=v);
  if(rowIdx===-1){ rowIdx = T4_LOADS.length-1; exceeded = true; }
  let colIdx = T4_DISTANCES.findIndex(v=>distanceMm<=v);
  if(colIdx===-1){ colIdx = T4_DISTANCES.length-1; exceeded = true; }
  return {value:TABLE4[rowIdx][colIdx], udel, exceeded};
}

// ГОСТ 10198-91, Таблица 14: толщина поперечных брусьев крышки для нештабелируемых
// ящиков (тип I-3 — именно такой, по табл. 1 стандарта), по массе груза и наружной ширине.
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


// fillBoards: заполняет пространство `space` (мм) досками шириной 100мм по максимуму,
// а остаток (если есть) — 1-2 дополнительными досками шириной 75-99мм (могут быть разной
// ширины — выбираются сами, для полного заполнения пространства). Если остаток < 75мм,
// "занимаем" одну доску 100мм и делим (остаток+100) на 2 доски; если из-за этого ширина
// всё равно выходит за 75-99мм — используем как есть и сообщаем через .warn (практика
// Сильвана, согласовано с конструктором, вне текста ГОСТа).
// fillBoards: максимум досок шириной 100мм, остаток — дополнительными досками
// 75-99мм (при необходимости — 2, 3 доски), максимально равными по ширине (отличаются
// не больше чем на 1мм). Если остаток меньше 75мм — "занимаем" сколько нужно досок
// 100мм и делим весь набранный кусок на 1-4 доски 75-99мм; занимаем минимально
// необходимое количество (в первую очередь стараемся сохранить максимум досок 100мм).
// Если разложить строго в 75-99мм не получается (совсем небольшое пространство) —
// используем как есть и сообщаем через .warn.
function fillBoards(space, roundWidths){
  space = Math.round(space);
  if(roundWidths){
    // «Округлить ширину досок» - используем только доски 100мм, без узких
    // дополнительных досок 75-99мм, даже если по факту это занимает больше
    // места, чем есть.
    return {mainQty: ceilInt(space/100), extra: [], warn: false, singleNarrow: false};
  }
  let mainQty = Math.floor(space/100);
  const remainder = space - mainQty*100;
  const extra = [];
  let warn = false;
  if(remainder > 0){
    // Число дополнительных досок не ограничиваем — сколько нужно, столько и
    // добавляем в таблицу (сгруппированных по ширине, обычно 1-2 разные ширины).
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
      // занимать нечего (нет ни одной доски 100мм в пространстве) — единственная
      // доска как есть, даже если она уже 75мм (см. singleNarrow ниже).
      extra.push({width:remainder, qty:1});
    } else if(!placed){
      // пространство слишком маленькое, чтобы разложить строго в 75-99мм — берём
      // как есть, предупреждаем.
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

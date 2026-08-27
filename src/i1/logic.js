// ГОСТ 10198-91, тип I-1: чистые расчётные формулы, без обращений к DOM.
// Диапазон применения по массе груза - 200-1000кг (см. calculate() в app.js).

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

// Толщина досок, планок и раскосов - по плотности упаковывания груза
// (масса, кг / объём груза, дм³): до 1 кг/дм³ - 22мм, свыше 1 до 3 - 25мм,
// свыше 3 - 32мм (свыше 3 - также порог, при котором требуется раскосина,
// см. calculate()).
function packingDensity(massKg, Lmm, Wmm, Hmm){
  const volumeDm3 = (Lmm*Wmm*Hmm) / 1e6; // мм³ -> дм³
  return massKg / volumeDm3;
}
function wallThicknessI1(density){
  if(density<=1) return 22;
  if(density<=3) return 25;
  return 32;
}
// При расстоянии между поясами планок 400-500мм толщина снижается на одну
// градацию (32->25->22 - тот же ряд, что и в wallThicknessI1). 22 - уже
// минимум, дальше снижать некуда.
function stepDownGrade(v){
  if(v===32) return 25;
  if(v===25) return 22;
  return v;
}

// fillBoards: заполняет пространство `space` (мм) досками шириной 100мм по максимуму,
// а остаток (если есть) — 1-2 дополнительными досками шириной 75-99мм (могут быть разной
// ширины — выбираются сами, для полного заполнения пространства). Если остаток < 75мм,
// "занимаем" одну доску 100мм и делим (остаток+100) на 2 доски; если из-за этого ширина
// всё равно выходит за 75-99мм — используем как есть и сообщаем через .warn.
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

// Количество планок (боковой щит / крышка / дно): 2 крайние на расстоянии
// boardLen/6 от каждого края (без верхнего предела на отступ, в отличие от
// типа I-3). Пока расстояние между самими крайними планками (middle) не
// превышает 700мм - хватает 2 планок; иначе добавляются промежуточные так,
// чтобы ни один зазор между соседними планками не превышал 700мм: при q
// планках зазоров (q-1), нужно q-1 >= middle/700, т.е. q = ceil(middle/700)+1.
// Если отступ с двух сторон не умещается в длину доски - расчёт для этого
// узла невозможен (см. calculate() - жёсткий блок).
function plankCount(boardLen){
  const edgeDist = boardLen/6;
  const middle = boardLen - edgeDist*2;
  if(middle < 0) return {count:null, edgeDist, middle};
  return {count: ceilInt(middle/700)+1, edgeDist, middle};
}

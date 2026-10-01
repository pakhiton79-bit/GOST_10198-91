// ГОСТ 10198-91, тип II-1: общие расчётные утилиты.

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
// а остаток - 1-2(+) дополнительными досками шириной 75-99мм. См. подробные комментарии
// в src/logic.js (тип I-3) - здесь та же функция без изменений (независимые методики).
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

// Путь до первого отрицательного числа в результате расчёта (таблицы и
// параметры чертежей) либо null. Отрицательный размер - невозможная геометрия.
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

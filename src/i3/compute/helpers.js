// ГОСТ 10198-91, тип I-3: общие расчётные утилиты.

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

// Ширина бруса/доски по ГОСТ - на имеющуюся (по указанию пользователя):
// уже 100 мм - 100, от 100 до 150 мм - 150, шире 150 мм - как по ГОСТ.
// Расчёт (объём, масса, раскладка) - по полученной ширине. Доски добора
// (остаток щита) сюда не относятся.
function stockWidth(w){
  if(w<100) return 100;
  if(w>100 && w<150) return 150;
  return w;
}

// fillBoards: заполняет пространство `space` (мм) досками шириной 100мм по максимуму,
// а остаток (если есть) - 1-2 дополнительными досками шириной 75-99мм (могут быть разной
// ширины - выбираются сами, для полного заполнения пространства). Если остаток < 75мм,
// "занимаем" одну доску 100мм и делим (остаток+100) на 2 доски; если из-за этого ширина
// всё равно выходит за 75-99мм - используем как есть и сообщаем через .warn (практика
// Сильвана, согласовано с конструктором, вне текста ГОСТа).
// fillBoards: максимум досок шириной 100мм, остаток - дополнительными досками
// 75-99мм (при необходимости - 2, 3 доски), максимально равными по ширине (отличаются
// не больше чем на 1мм). Если остаток меньше 75мм - "занимаем" сколько нужно досок
// 100мм и делим весь набранный кусок на 1-4 доски 75-99мм; занимаем минимально
// необходимое количество (в первую очередь стараемся сохранить максимум досок 100мм).
// Если разложить строго в 75-99мм не получается (совсем небольшое пространство) -
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
    // Число дополнительных досок не ограничиваем - сколько нужно, столько и
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
      // занимать нечего (нет ни одной доски 100мм в пространстве) - единственная
      // доска как есть, даже если она уже 75мм (см. singleNarrow ниже).
      extra.push({width:remainder, qty:1});
    } else if(!placed){
      // пространство слишком маленькое, чтобы разложить строго в 75-99мм - берём
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

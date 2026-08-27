  // Толщина доски дна - Таблица 4 (п.1.6.9): по удельной нагрузке на дно и
  // расстоянию между осями смежных полозьев.
  const floorSkidDistance = Math.min(W, 1200); // п.1.6.2: расстояние между осями смежных полозьев не должно превышать 1200 мм
  const floor = floorBoardThickness(MASS, L, W, floorSkidDistance); // Таблица 4
  if(floor.exceeded){
    const loadExceeded = floor.udel > T4_LOADS[T4_LOADS.length-1];
    const distExceeded = floorSkidDistance > T4_DISTANCES[T4_DISTANCES.length-1];
    if(loadExceeded){
      warnings.push(`Удельная нагрузка на дно ${floor.udel.toFixed(2)} кг/см² вне Табл. 4 — толщина доски дна принята по крайнему значению.`);
    }
    if(distExceeded){
      warnings.push(`Расстояние между полозьями ${floorSkidDistance} мм вне Табл. 4 — толщина доски дна принята по крайнему значению.`);
    }
  }
  const t12 = removeFloorBoards ? 0 : roundUpToAvailable(floor.value), k12=W;

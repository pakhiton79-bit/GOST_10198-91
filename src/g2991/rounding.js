// ГОСТ 2991-85: округление вверх до толщин «в наличии» и предупреждения -
// копия makeRoundUpToAvailable / thicknessPartWarnings из helpers.js сайта
// (backend/src/helpers.js): толщина по ГОСТ больше максимальной в наличии -
// берётся толщина по ГОСТ с предупреждением.

function makeRoundUpToAvailable(availableThicknesses) {
  const state = { exceeded: false, parts: [] };
  // Для детали с label учитывается последний вызов (размеры II-1/III-1
  // уточняются в цикле - промежуточные значения не должны давать предупреждение).
  const fn = function (t, label) {
    if (label) state.parts = state.parts.filter(p => p.label !== label);
    if (!availableThicknesses || availableThicknesses.length === 0) return t;
    for (const a of availableThicknesses) { if (t <= a) return a; }
    if (!label) state.exceeded = true;
    else state.parts.push({ label, t });
    return t;
  };
  fn.state = state;
  return fn;
}

function thicknessPartWarnings(round, availableThicknesses) {
  const max = availableThicknesses[availableThicknesses.length - 1];
  return round.state.parts.map(p =>
    `${p.label}: по ГОСТ ${p.t} мм, в наличии максимум ${max} мм - использовано ${p.t} мм по ГОСТ, такой толщины нет в наличии.`);
}

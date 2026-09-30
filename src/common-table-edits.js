// Ручные правки таблицы деталей (общие для всех типов): ключи строк,
// пометка исправленных ячеек, сбор правок для расчёта (readTableEdits) и
// их подстановка в результат (applyTableEdits).

// ============ Ручные правки таблицы деталей ============
// По указанию пользователя: правка любой ячейки таблицы деталей (толщина,
// ширина, длина, кол-во) НЕ пересчитывает итоги сразу - только помечает
// расчёт как устаревший (подсказка «Нажмите «Рассчитать»»); пересчёт - по кнопке
// "Рассчитать" (в бэкенд-версии - на сервере, как и весь остальной расчёт).
// Правки толщины у строк с data-override по-прежнему идут в расчёт
// каскадом (manualOverrides); остальные правки (ширина/длина/кол-во и
// толщина строк без data-override) передаются как tableEdits и
// подставляются в строки результата - итоговый объём (а с ним масса и
// норма времени) пересчитываются с учётом правок (см. applyTableEdits).
// Строка таблицы опознаётся по разделу (data-section) и ключу
// "название#порядковый номер среди строк с тем же названием" - а не по
// номеру строки: при смене параметров строки могут появляться/исчезать.
// Отредактированные ячейки остаются помеченными (data-user-edited) и после
// пересчёта - правка сохраняется, пока пользователь её не изменит (пустая
// ячейка = вернуть расчётное значение).
const TABLE_EDIT_ROLES = ['t', 'w', 'l', 'qty'];
function tableRowKeys(rows){
  const occ = {};
  return rows.map(r=>{
    const n = String(r.name);
    const i = occ[n] || 0;
    occ[n] = i + 1;
    return n + '#' + i;
  });
}
function escapeAttr(s){
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}
// Атрибут data-user-edited для ячейки при рендере: у толщины строк с
// data-override - если эта толщина была задана вручную (manualOverrides),
// у остальных - если ячейка была исправлена через tableEdits (row.edited).
function editedAttr(row, role, manualOverrides){
  if(role === 't' && row.overrideKey){
    return (manualOverrides && manualOverrides[row.overrideKey] !== undefined) ? ' data-user-edited="true"' : '';
  }
  return (row.edited && row.edited[role]) ? ' data-user-edited="true"' : '';
}
// Толщина в таблице деталей: правка ЛЮБОЙ строки меняет параметр ГОСТ, из
// которого эта толщина берётся (data-override), поэтому все строки с тем же
// параметром сразу получают то же значение (последняя правка побеждает).
function syncOverrideCells(cell){
  const key = cell && cell.getAttribute && cell.getAttribute('data-override');
  if(!key) return;
  const v = cell.textContent;
  document.querySelectorAll(`#boardTables td[data-override="${key}"]`).forEach(td=>{
    if(td !== cell){ td.textContent = v; markCellEdited(td); }
  });
}
// Пометка правки ячейки (по указанию пользователя): если значение вернули
// к тому, что было показано после последнего расчёта, - пометка
// возвращается к прежней (цвет правки снимается, если ячейка не была
// исправлена и до этого). Исходные тексты запоминает rememberCellOriginals()
// после каждого успешного расчёта (см. calculate()).
function markCellEdited(cell){
  if('origText' in cell.dataset && cell.textContent.trim() === cell.dataset.origText.trim()){
    if(cell.dataset.origEdited) cell.setAttribute('data-user-edited', 'true');
    else cell.removeAttribute('data-user-edited');
    return;
  }
  cell.setAttribute('data-user-edited', 'true');
}
function rememberCellOriginals(){
  document.querySelectorAll('#boardTables .editable-cell').forEach(td=>{
    td.dataset.origText = td.textContent;
    td.dataset.origEdited = td.getAttribute('data-user-edited') === 'true' ? '1' : '';
  });
}
function readTableEdits(){
  const edits = {};
  document.querySelectorAll('#boardTables table[data-section] tr[data-row-key]').forEach(tr=>{
    const sec = tr.closest('table').dataset.section;
    const key = tr.dataset.rowKey;
    tr.querySelectorAll('td[data-user-edited="true"]:not([data-override])').forEach(td=>{
      const role = td.dataset.role;
      // role 'text' - ячейка со свободным текстом (лента обшивки торцов:
      // править можно весь текст, не только число); пустая - расчётное.
      let v;
      if(role === 'text'){
        v = td.textContent.trim();
        if(!v) return;
      } else {
        v = parseFloat(td.textContent.replace(',', '.'));
        if(!TABLE_EDIT_ROLES.includes(role) || !Number.isFinite(v) || v < 0 || (v === 0 && role !== 'qty')) return;
      }
      edits[sec] = edits[sec] || {};
      edits[sec][key] = edits[sec][key] || {};
      edits[sec][key][role] = v;
    });
  });
  return edits;
}

// Подставляет правки таблицы (см. readTableEdits) в строки результата и
// корректирует итоговый объём на разницу объёмов изменённых строк (с
// множителем раздела: щиты торцевой/боковой - по 2 шт.). Возвращает число
// изменённых строк - вызывающая сторона при >0 пересчитывает производные
// итоги (норма времени, масса ящика). Та же функция - на сервере
// (applyTableEdits в backend/src/helpers.js бэкенд-репозитория).
function applyTableEdits(calc, edits, sections){
  if(!edits || typeof edits !== 'object') return 0;
  const num = v => { const x = parseFloat(v); return Number.isFinite(x) ? x : 0; };
  const rowVol = r => num(r.t) * num(r.w) * num(r.l) / 1e9 * num(r.qty);
  let applied = 0, delta = 0;
  Object.keys(sections).forEach(sec=>{
    const rows = calc[sec], secEdits = edits[sec];
    if(!Array.isArray(rows) || !secEdits) return;
    const keys = tableRowKeys(rows);
    rows.forEach((r, i)=>{
      const e = secEdits[keys[i]];
      if(!e) return;
      const before = rowVol(r);
      let changed = false;
      TABLE_EDIT_ROLES.forEach(role=>{
        if(!(role in e)) return;
        if(role === 't' && r.overrideKey) return; // толщина - через manualOverrides
        r[role] = e[role];
        r.edited = r.edited || {};
        r.edited[role] = true;
        changed = true;
      });
      if((sec === 'endTape' || sec === 'parchment') && typeof e.text === 'string'){ r.text = e.text; r.edited = r.edited || {}; r.edited.text = true; changed = true; }
      if(!changed) return;
      delta += (rowVol(r) - before) * sections[sec];
      applied++;
    });
  });
  if(applied) calc.totalVolume += delta;
  return applied;
}

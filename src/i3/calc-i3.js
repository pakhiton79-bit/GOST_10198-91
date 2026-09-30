// ГОСТ 10198-91, тип I-3: сбор входных данных, расчёт (computeGost10198I3,
// compute/compute.js) и вывод результата. Кнопка «Рассчитать» вызывает общую
// обёртку calculate() из common-print.js, та - calculateNow().

// Разделы таблицы деталей и их множители в объёме (щиты торцевой и боковой -
// по 2 шт.; пергамин в объём не входит).
const I3_TABLE_SECTIONS = {dno:1, kryshka:1, endPanel:2, bokovoy:2, parchment:0};

// Ручные толщины из таблицы: только ячейки толщины, которые пользователь
// действительно правил (data-user-edited) - иначе нетронутая ячейка
// «замораживала» бы прошлое расчётное значение.
function readManualOverrides(){
  const overrides = {};
  document.querySelectorAll('#boardTables td[data-override][data-user-edited="true"]').forEach(cell=>{
    const key = cell.getAttribute('data-override');
    const val = parseFloat(cell.textContent.replace(',','.'));
    if(!Number.isNaN(val) && val>0) overrides[key] = val;
  });
  return overrides;
}

// Входные данные расчёта. По ним же common-print.js сравнивает текущую форму
// с последним расчётом (calcStateSignature).
function buildCalcInput(){
  const manualOverrides = readManualOverrides();
  return {
    L: parseFloat(document.getElementById('L').value),
    W: parseFloat(document.getElementById('W').value),
    H: parseFloat(document.getElementById('H').value),
    MASS: parseFloat(document.getElementById('M').value),
    fasteningType: fasteningType,
    optimizeSizes: document.getElementById('optimizeSizes').checked,
    removeFloorBoards: document.getElementById('removeFloorBoards').checked, // при креплении к доскам дна всегда снята
    removeSkidBoards: document.getElementById('removeSkidBoards').checked,
    roundBoardWidths: document.getElementById('roundBoardWidths').checked,
    solidRigidBase: document.getElementById('solidRigidBase').checked,
    forkliftLoading: document.getElementById('forkliftLoading').checked,
    xRaskosina: document.getElementById('xRaskosina').checked,
    addParchment: document.getElementById('addParchment').checked,
    plankLayoutMode,
    plankLayoutValue,
    beamGapValue,
    beamCountValue,
    manualOverrides,
    woodDensity: loadWoodDensity(WOOD_DENSITY_STORAGE_KEY),
  };
}

// Расчёт не проведён: текст ошибки, красный статус, результаты прошлого
// расчёта скрываются.
function showCalcError(text){
  document.getElementById('err').textContent = text;
  setCalcStatus('error');
  document.getElementById('results').style.display = 'none';
}

function calculateNow(){
  document.getElementById('err').textContent = '';
  const input = buildCalcInput();
  const tableEdits = readTableEdits();

  const calc = computeGost10198I3(input);
  if(calc.error){
    showCalcError(calc.error);
    return;
  }
  // Ручные правки таблицы (ширина, длина, кол-во) - поверх расчёта; объём,
  // норма времени и масса пересчитываются с их учётом.
  if(applyTableEdits(calc, tableEdits, I3_TABLE_SECTIONS)){
    calc.normaVremeni = computeNormaVremeni(calc.totalVolume, TIME_SETTINGS_STORAGE_KEY);
    calc.crateMass = calc.totalVolume * calc.woodDensity;
  }

  updatePlankLayoutFromCalc(calc);
  lastStandardBeamCount = calc.standardBeamCount;
  renderSummary(calc);
  renderBoardTables(calc, input.manualOverrides);
  renderWarnings(calc.warnings);

  document.getElementById('results').style.display = 'block';
  setCalcStatus('check');
}

['L','W','H','M'].forEach(id=>{
  document.getElementById(id).addEventListener('input', invalidateCalc);
});
['optimizeSizes','solidRigidBase','roundBoardWidths','removeFloorBoards'].forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.addEventListener('change', invalidateCalc);
});

// Правка ячейки таблицы не пересчитывает сразу: ячейка помечается
// исправленной, расчёт - устаревшим; учтётся по «Рассчитать».
document.getElementById('boardTables').addEventListener('input', e=>{
  if(e.target.classList.contains('editable-cell')){
    markCellEdited(e.target); syncOverrideCells(e.target);
    updateResetButton();
    invalidateCalc();
  }
});

document.getElementById('boxView').src = BOX_IMG_B64;

initTimeSettings(TIME_SETTINGS_STORAGE_KEY);
initDensitySettings(WOOD_DENSITY_STORAGE_KEY);

// Спецификация и комментарий (#resultsMore) показываются и скрываются вместе
// с #results.
(function syncResultsMore(){
  const r = document.getElementById('results'), m = document.getElementById('resultsMore');
  if(!r || !m) return;
  const sync = () => { m.style.display = r.style.display === 'block' ? 'block' : 'none'; };
  new MutationObserver(sync).observe(r, {attributes:true, attributeFilter:['style']});
  sync();
})();

// Поля, из-за которых расчёт заблокирован (по тексту ошибки), - подсвечиваются
// красной рамкой (highlightErrorFields в common-print.js).
function errorFieldsFor(text){
  if(/Заполните все поля/.test(text)) return ['L','W','H','M'].filter(id => !(parseFloat(document.getElementById(id).value) > 0));
  if(/поперечными брусьями/.test(text)) return ['beamGapInput'];
  if(/поперечных брусьев с отступом/.test(text)) return ['beamCountInput'];
  if(/Расстояние между планками/.test(text)) return ['plankGapInput'];
  if(/пояс\S* планок не помеща/.test(text)) return ['plankCountInput'];
  if(/недостаточна для отступа планок/.test(text)) return plankLayoutMode === 'count' ? ['plankCountInput'] : [];
  return [];
}

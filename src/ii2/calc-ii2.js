// ГОСТ 10198-91, тип II-2: сбор входных данных, расчёт (computeGost10198II2,
// compute/compute.js) и вывод результата. Кнопка «Рассчитать» вызывает общую
// обёртку calculate() из common-calc-state.js, та - calculateNow().

// Разделы таблицы деталей и их множители в объёме (щиты торцевой и боковой -
// по 2 шт.).
const II2_TABLE_SECTIONS = {dno:1, kryshka:1, endPanel:2, bokovoy:2};

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

// Входные данные расчёта. По ним же common-calc-state.js сравнивает текущую форму
// с последним расчётом (calcStateSignature).
function buildCalcInput(){
  const manualOverrides = readManualOverrides();

  const removeFloorBoardsEl = document.getElementById('removeFloorBoards');
  return {
    L: parseFloat(document.getElementById('L').value),
    W: parseFloat(document.getElementById('W').value),
    H: parseFloat(document.getElementById('H').value),
    MASS: parseFloat(document.getElementById('M').value),
    fasteningType: fasteningType,
    solidRigidBase: document.getElementById('solidRigidBase').checked,
    removeFloorBoards: removeFloorBoardsEl ? removeFloorBoardsEl.checked : false,
    removeSkidBoards: document.getElementById('removeSkidBoards').checked,
    forkliftLoading: document.getElementById('forkliftLoading').checked,
    roundBoardWidths: !document.getElementById('noRoundBoardWidths').checked, // по умолчанию ширины округляются
    lidLayout: document.querySelector('input[name="lidLayout"]:checked').value,
    optimizeSizes: document.getElementById('optimizeSizes').checked,
    xRaskosina: document.getElementById('xRaskosina').checked,
    addRaskosina: document.getElementById('addRaskosina').checked,
    boardGapMax: readBoardGapMax(), // наибольший промежуток между досками обшивки, мм (board-gaps.js)
    torecPostCount: manualCount.torec,
    bokPostCount: manualCount.bok,
    lidCrossBeamCount: manualCount.cross,
    manualOverrides,
    fineThickness: readFineThickness(),
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

  const calc = computeGost10198II2(input);
  if(calc.error){
    showCalcError(calc.error);
    return;
  }
  // Ручные правки таблицы (ширина, длина, кол-во) - поверх расчёта; объём,
  // норма времени и масса пересчитываются с их учётом.
  if(applyTableEdits(calc, tableEdits, II2_TABLE_SECTIONS)){
    calc.normaVremeni = computeNormaVremeni(calc.totalVolume, TIME_SETTINGS_STORAGE_KEY);
    calc.crateMass = calc.totalVolume * calc.woodDensity;
  }

  updateManualCountsFromCalc(calc);
  renderSummary(calc);
  renderBoardTables(calc, input.manualOverrides);
  renderWarnings(calc.warnings);

  document.getElementById('results').style.display = 'block';
  setCalcStatus('check');
}

['L','W','H','M'].forEach(id=>{
  document.getElementById(id).addEventListener('input', invalidateCalc);
});
['solidRigidBase','noRoundBoardWidths','removeFloorBoards','optimizeSizes','addRaskosina'].forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.addEventListener('change', invalidateCalc);
});
document.querySelectorAll('input[name="lidLayout"]').forEach(el=>{
  el.addEventListener('change', invalidateCalc);
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

document.getElementById('boxView').src = BOX_II2_IMG_B64;
initTimeSettings(TIME_SETTINGS_STORAGE_KEY);
initDensitySettings(WOOD_DENSITY_STORAGE_KEY);

// Поля, из-за которых расчёт заблокирован (по тексту ошибки), - подсвечиваются
// красной рамкой (highlightErrorFields в common-calc-state.js).
function errorFieldsFor(text){
  // Границы входных данных (inputLimitsError в расчёте).
  if(/Размеры груза - не больше/.test(text)) return ['L','W','H'].filter(id => parseFloat(document.getElementById(id).value) > 15000);
  if(/Масса груза - не больше/.test(text)) return ['M'];
  if(/наибольший промежуток между досками/.test(text)) return ['boardGapInput'];
  if(/Заполните все поля/.test(text)) return ['L','W','H','M'].filter(id => !(parseFloat(document.getElementById(id).value) > 0));
  if(/не помеща\S* на торцевом щите/.test(text)) return ['torecPostsInput'];
  if(/не помеща\S* на боковом щите/.test(text)) return ['bokPostsInput'];
  if(/не помеща\S* в крышке/.test(text)) return ['crossBeamsInput'];
  if(/Ширина груза/.test(text)) return ['W'];
  if(/Длина груза/.test(text)) return ['L'];
  if(/высота груза/.test(text)) return ['H'];
  return [];
}

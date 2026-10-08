// ГОСТ 10198-91, тип I-1: сбор входных данных, расчёт (computeGost10198I1,
// compute/compute.js) и вывод результата. Кнопка «Рассчитать» вызывает общую
// обёртку calculate() из common-calc-state.js, та - calculateNow().

// Разделы таблицы деталей и их множители в объёме (щиты торцевой и боковой -
// по 2 шт.; лента обшивки и пергамин в объём не входят).
const I1_TABLE_SECTIONS = {dno:1, kryshka:1, torec:2, bokovoy:2, endTape:0, parchment:0};

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
  return {
    L: parseFloat(document.getElementById('L').value),
    W: parseFloat(document.getElementById('W').value),
    H: parseFloat(document.getElementById('H').value),
    MASS: parseFloat(document.getElementById('M').value),
    skidEnabled: document.getElementById('skidEnabled').checked,
    skidThicknessRaw: skidThicknessValue,
    roundBoardWidths: !document.getElementById('noRoundBoardWidths').checked, // по умолчанию ширины округляются
    removeLidBottomRaskosina: document.getElementById('removeLidBottomRaskosina').checked,
    addRaskosina: document.getElementById('addRaskosina').checked,
    xRaskosina: document.getElementById('xRaskosina').checked,
    addEndTape: document.getElementById('addEndTape').checked,
    addParchment: document.getElementById('addParchment').checked,
    plankLayoutMode,
    plankLayoutValue,
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

  const calc = computeGost10198I1(input);
  if(calc.error){
    showCalcError(calc.error);
    return;
  }
  // Ручные правки таблицы (ширина, длина, кол-во, текст) - поверх расчёта;
  // объём, норма времени и масса пересчитываются с их учётом.
  if(applyTableEdits(calc, tableEdits, I1_TABLE_SECTIONS)){
    calc.normaVremeni = computeNormaVremeni(calc.totalVolume, TIME_SETTINGS_STORAGE_KEY);
    calc.crateMass = calc.totalVolume * calc.woodDensity;
  }

  updatePlankLayoutFromCalc(calc);
  renderSummary(calc);
  renderBoardTables(calc, input.manualOverrides);
  renderWarnings(calc.warnings);

  document.getElementById('results').style.display = 'block';
  setCalcStatus('check');
}

['L','W','H','M'].forEach(id=>{
  document.getElementById(id).addEventListener('input', ()=>{
    invalidateCalc();
  });
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

// Поля, из-за которых расчёт заблокирован (по тексту ошибки), - подсвечиваются
// красной рамкой (highlightErrorFields в common-calc-state.js).
function errorFieldsFor(text){
  // Границы входных данных (inputLimitsError в расчёте).
  if(/Размеры груза - не больше/.test(text)) return ['L','W','H'].filter(id => parseFloat(document.getElementById(id).value) > 15000);
  if(/Масса груза - не больше/.test(text)) return ['M'];
  if(/Заполните все поля/.test(text)) return ['L','W','H','M'].filter(id => !(parseFloat(document.getElementById(id).value) > 0));
  if(/Расстояние между планками/.test(text)) return ['plankGapInput'];
  if(/пояс\S* планок не помеща/.test(text)) return ['plankCountInput'];
  if(/недостаточна для отступа планок/.test(text)) return plankLayoutMode === 'count' ? ['plankCountInput'] : ['L'];
  if(/Ширина груза/.test(text)) return ['W'];
  if(/раскосины торца/.test(text)) return ['W', 'H'];
  return [];
}

document.getElementById('boxView').src = BOX_I1_IMG_B64;
initTimeSettings(TIME_SETTINGS_STORAGE_KEY);
initDensitySettings(WOOD_DENSITY_STORAGE_KEY);

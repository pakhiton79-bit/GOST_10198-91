// ГОСТ 2991-85, тип II-1: сбор входных данных, расчёт в браузере
// (computeGost2991II1, src/g2991/ii1/compute/compute.js) и вывод результата. Кнопка «Рассчитать»
// вызывает общую обёртку calculate() из common-calc-state.js, та -
// calculateNow().

// Тело запроса на расчёт. По нему же common-calc-state.js сравнивает текущую
// форму с последним расчётом (calcStateSignature).
function buildCalcInput(){
  return {
    L: parseFloat(document.getElementById('L').value),
    W: parseFloat(document.getElementById('W').value),
    H: parseFloat(document.getElementById('H').value),
    MASS: parseFloat(document.getElementById('M').value),
    species: (document.querySelector('input[name="species"]:checked') || {}).value || 'conifer',
    concentrated: document.getElementById('concentrated').checked,
    packet: document.getElementById('packet').checked,
    roundBoardWidths: !document.getElementById('noRoundBoardWidths').checked, // по умолчанию ширины округляются
    verticalEnd: document.getElementById('verticalEnd').checked,
    noLid: document.getElementById('noLid').checked,
    availableThicknesses: thicknessPicker.get(),
    availableWidths: widthPicker.get(),
    mainWidth: siteMainWidth2991(),
    tableEdits: readTableEdits(),
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

// Разделы таблицы деталей и их множители в объёме (щиты - по 2 шт.).
const G2991_II1_TABLE_SECTIONS = {dno:1, kryshka:1, torec:2, bokovoy:2};

function calculateNow(){
  document.getElementById('err').textContent = '';
  const input = buildCalcInput();
  const calc = computeGost2991II1(input);
  if(calc.error){
    showCalcError(calc.error);
    return;
  }
  // Ручные правки таблицы - поверх расчёта; объём, норма времени и масса
  // пересчитываются с их учётом.
  if(applyTableEdits(calc, input.tableEdits, G2991_II1_TABLE_SECTIONS)){
    calc.normaVremeni = computeNormaVremeni(calc.totalVolume, TIME_SETTINGS_STORAGE_KEY);
    calc.crateMass = calc.totalVolume * calc.woodDensity;
  }

  renderSummary(calc);
  renderBoardTables(calc);
  renderWarnings(calc.warnings);

  document.getElementById('results').style.display = 'block';
  setCalcStatus('check');
}

// Правка ячейки таблицы не пересчитывает сразу: ячейка помечается
// исправленной, расчёт - устаревшим; учтётся по «Рассчитать».
document.getElementById('boardTables').addEventListener('input', e=>{
  if(e.target.classList.contains('editable-cell')){
    markCellEdited(e.target);
    updateResetButton();
    invalidateCalc();
  }
});

// Поля, из-за которых расчёт заблокирован (по тексту ошибки), - подсвечиваются
// красной рамкой (highlightErrorFields в common-calc-state.js).
function errorFieldsFor(text){
  if(/Размеры груза - не больше/.test(text)) return ['L','W','H'].filter(id => parseFloat(document.getElementById(id).value) > 15000);
  if(/Масса груза - не больше/.test(text)) return ['M'];
  if(/Заполните все поля/.test(text)) return ['L','W','H','M'].filter(id => !(parseFloat(document.getElementById(id).value) > 0));
  return [];
}

initTimeSettings(TIME_SETTINGS_STORAGE_KEY);
initDensitySettings(WOOD_DENSITY_STORAGE_KEY);

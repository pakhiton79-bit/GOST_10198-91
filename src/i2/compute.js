// ГОСТ 10198-91, тип I-2: тот же ящик, что I-1 (расчёт - ../i1/compute), но
// доски обшивки всех щитов (дно, крышка, бока, торцы) - с промежутками:
// крайние по краям щита, остальные равномерно между ними, промежутки - не
// больше заданной доли поверхности щита (boardGapPercent, 10-50%, обязательна).
const I2_COMPUTE_VARIANT = { name: 'I-2', boardGaps: true };

function computeGost10198I2(input) {
  return computeGost10198I1(input, I2_COMPUTE_VARIANT);
}

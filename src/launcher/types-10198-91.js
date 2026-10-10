// Каталог типов тары для ГОСТ 10198-91 (уровень 2 - страница gost-10198-91.html).
//
// file - калькулятор для этого типа. У типа I-3 способ крепления груза (за
// полозья / к доскам дна) переключается ВНУТРИ калькулятора выпадающим
// списком (см. onFasteningTypeChange в src/app.js) без перезагрузки страницы,
// поэтому здесь только один файл - как и у остальных типов.
// image - чертёж общего вида ящика (тот же файл, что используется в самом
// калькуляторе, см. BOX_IMG_B64/BOX_I1_IMG_B64 в src/app.js и src/i1/calc.js).
// badge - виден поверх карточки, но сама карточка (ссылка) остаётся рабочей.
// badgeDanger - красный вариант плашки (.type-badge-danger в
// src/launcher/types.src.html) вместо обычного жёлтого - для типа, у
// которого ещё не было ни одной сверки с реальными чертежами.
// versions - у типа две версии (по ГОСТ / оптимальная, переключатель на
// странице расчёта): карточка ведёт на последнюю выбранную, по умолчанию -
// на оптимальную; key - ключ localStorage (общий с common-version-switch.js).
// badgeOk - зелёный вариант плашки (.type-badge-ok) - у типа, где найденные
// расхождения (по уточнению пользователя) уже исправлены и подтверждены
// контрольным примером.
const TYPES = [
  {
    name: 'Тип I-1',
    file: 'GOST10198_91_I1.html',
    image: 'data:image/jpeg;base64,__IMG:box_i1.jpg__'
  },
  {
    name: 'Тип I-2',
    file: 'GOST10198_91_I2.html',
    image: 'data:image/png;base64,__IMG:box_i2.png__',
    badge: 'Требуется проверка'
  },
  {
    name: 'Тип I-3',
    file: 'GOST10198_91POLOZIA.html',
    image: 'data:image/png;base64,__IMG:box.png__',
    badge: 'Требуется проверка'
  },
  {
    name: 'Тип I-4',
    file: 'GOST10198_91_I4.html',
    image: 'data:image/png;base64,__IMG:box_i4.png__',
    badge: 'Требуется проверка'
  },
  {
    name: 'Тип II-1',
    versions: { key: 'silvan-gost10198-ii1-version', gost: 'GOST10198_91_II1.html', opt: 'GOST10198_91_II1N.html' },
    image: 'data:image/png;base64,__IMG:box_ii1.png__'
  },
  {
    name: 'Тип II-2',
    versions: { key: 'silvan-gost10198-ii2-version', gost: 'GOST10198_91_II2.html', opt: 'GOST10198_91_II2N.html' },
    image: 'data:image/png;base64,__IMG:box_ii2.png__'
  },
  {
    name: 'Тип III-1',
    versions: { key: 'silvan-gost10198-iii1-version', gost: 'GOST10198_91_III1.html', opt: 'GOST10198_91_III1_OPT.html' },
    image: 'data:image/png;base64,__IMG:box_iii1.png__'
  }
  // Следующий тип добавляется сюда новым объектом { name, file, image }.
];

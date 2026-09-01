// Каталог типов тары для ГОСТ 10198-91 (уровень 2 - страница gost-10198-91.html).
//
// file - калькулятор по умолчанию (используется, если fasteningFiles нет или
// в localStorage ещё ничего не сохранено).
// fasteningFiles - только у типов, где способ крепления груза переключается
// ВНУТРИ калькулятора выпадающим списком (см. onFasteningTypeChange/
// switchFastening в src/app.js): какой файл открыть для какого сохранённого
// в localStorage значения FASTENING_STORAGE_KEY (см. types.src.html) - чтобы
// при повторном заходе через список типов открывался тот же способ
// крепления, что был выбран в прошлый раз.
// image - чертёж общего вида ящика (тот же файл, что используется в самом
// калькуляторе, см. BOX_IMG_B64/BOX_I1_IMG_B64 в src/app.js и src/i1/calc.js).
// badge - виден поверх карточки, но сама карточка (ссылка) остаётся рабочей -
// калькулятор уже считает, просто расчёт стоит перепроверить перед
// использованием в производстве (по указанию пользователя - на всех типах).
// badgeDanger - красный вариант плашки (.type-badge-danger в
// src/launcher/types.src.html) вместо обычного жёлтого - у II-1 (в отличие
// от I-1/I-3) ещё не было ни одной сверки с реальными чертежами, поэтому
// плашка ярче и с другим текстом.
// badgeOk - зелёный вариант плашки (.type-badge-ok) - у типа, где найденные
// расхождения (по уточнению пользователя) уже исправлены и подтверждены
// контрольным примером.
const REVIEW_BADGE = 'Требует проверки';
const NOT_READY_BADGE = 'Ещё не готово';
const FIXED_BADGE = 'Исправлено';
const TYPES = [
  {
    name: 'Тип I-1',
    file: 'GOST10198_91_I1.html',
    image: 'data:image/jpeg;base64,__IMG:box_i1.jpg__',
    badge: FIXED_BADGE,
    badgeOk: true
  },
  {
    name: 'Тип I-3',
    file: 'GOST10198_91POLOZIA.html',
    fasteningFiles: {
      skid: 'GOST10198_91POLOZIA.html',
      floor_boards: 'GOST10198_91DOSKI_DNA.html'
    },
    image: 'data:image/png;base64,__IMG:box.png__',
    badge: REVIEW_BADGE
  },
  {
    // Фото общего вида ящика для этого типа ещё не пришло (см. src/ii1/diagrams.js) -
    // нейтральная SVG-заглушка вместо чертежа, без отдельного файла картинки.
    name: 'Тип II-1',
    file: 'GOST10198_91_II1.html',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="%23FAF8F5"/><text x="80" y="64" font-family="sans-serif" font-size="13" fill="%236B625D" text-anchor="middle">Чертёж скоро</text></svg>',
    badge: NOT_READY_BADGE,
    badgeDanger: true
  }
  // Следующий тип добавляется сюда новым объектом { name, file, image }.
];

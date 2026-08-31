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
const TYPES = [
  {
    name: 'Тип I-1',
    file: 'GOST10198_91_I1.html',
    image: 'data:image/jpeg;base64,__IMG:box_i1.jpg__'
  },
  {
    name: 'Тип I-3',
    file: 'GOST10198_91POLOZIA.html',
    fasteningFiles: {
      skid: 'GOST10198_91POLOZIA.html',
      floor_boards: 'GOST10198_91DOSKI_DNA.html'
    },
    image: 'data:image/png;base64,__IMG:box.png__'
  },
  {
    // Фото общего вида ящика для этого типа ещё не пришло (см. src/ii1/diagrams.js) -
    // нейтральная SVG-заглушка вместо чертежа, без отдельного файла картинки.
    name: 'Тип II-1',
    file: 'GOST10198_91_II1.html',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="%23FAF8F5"/><text x="80" y="64" font-family="sans-serif" font-size="13" fill="%236B625D" text-anchor="middle">Чертёж скоро</text></svg>'
  }
  // Следующий тип добавляется сюда новым объектом { name, file, image }.
];

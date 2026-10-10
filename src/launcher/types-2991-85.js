// Каталог типов тары для ГОСТ 2991-85 (уровень 2 - страница gost-2991-85.html).
// Поля - как в types-10198-91.js; image не обязателен (без него - карточка
// без картинки); без file - типа ещё нет (badgeSoon - серая плашка «Появится позже»).
const TYPES = [
  {
    name: 'Тип I',
    file: 'GOST2991_85_I.html',
    image: 'data:image/png;base64,__IMG:box_g2991_i.png__',
    badge: 'Возможны неточности'
  },
  {
    name: 'Тип II-1',
    file: 'GOST2991_85_II1.html',
    image: 'data:image/png;base64,__IMG:box_g2991_ii1.png__',
    badge: 'Возможны неточности'
  },
  { name: 'Тип II-2', badge: 'Появится позже', badgeSoon: true },
  { name: 'Тип III-1', badge: 'Появится позже', badgeSoon: true },
  { name: 'Тип III-2', badge: 'Появится позже', badgeSoon: true },
  { name: 'Тип V-1', badge: 'Появится позже', badgeSoon: true },
  { name: 'Тип V-2', badge: 'Появится позже', badgeSoon: true },
  { name: 'Тип VI-1', badge: 'Появится позже', badgeSoon: true },
  { name: 'Тип VI-2', badge: 'Появится позже', badgeSoon: true }
  // Тип IV (лотки) не делается (по указанию пользователя).
];

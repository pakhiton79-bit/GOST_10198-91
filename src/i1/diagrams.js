// ГОСТ 10198-91, тип I-1: чертежи расположения деталей. Дно, крышка и боковой
// щит - фото ещё не присланы, показывают заглушку. Щит торцевой полностью
// совпадает по конструкции с торцом типа I-3 (вариант без раскосины и с 1
// раскосиной - у типа I-1 их бывает не больше одной), поэтому переиспользует
// готовые чертежи типа I-3 (diagramPlaceholder/diagramEndPanel1Raskosina/
// diagramEndPanelNoRaskosina - см. src/common-diagrams.js).
function diagramDno(){ return diagramPlaceholder('Дно'); }
function diagramKryshka(){ return diagramPlaceholder('Крышка'); }
function diagramBokovoy(){ return diagramPlaceholder('Щит боковой'); }
function diagramTorec(heightVal, widthVal, hasRaskosinaVal){
  return hasRaskosinaVal
    ? diagramEndPanel1Raskosina(heightVal, widthVal)
    : diagramEndPanelNoRaskosina(heightVal, widthVal);
}

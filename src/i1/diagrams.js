// ГОСТ 10198-91, тип I-1: чертежи расположения деталей. Фото ещё не
// присланы - все узлы показывают заглушку. Как только появятся фото,
// добавить сюда константы *_IMG_B64 и функции diagram*() с массивом records
// (координаты стрелок/подписей), по образцу src/diagrams.js (тип I-3).
function diagramPlaceholder(label){
  return `<div class="diagram-wrap diagram-placeholder" style="display:flex;align-items:center;justify-content:center;min-height:160px;border:1px dashed var(--border-input);border-radius:12px;color:var(--ink-soft);font-size:13px;text-align:center;padding:12px;">Чертёж «${label}» ещё не готов</div>`;
}
function diagramDno(){ return diagramPlaceholder('Дно'); }
function diagramKryshka(){ return diagramPlaceholder('Крышка'); }
function diagramBokovoy(){ return diagramPlaceholder('Щит боковой'); }
function diagramTorec(){ return diagramPlaceholder('Щит торцевой'); }

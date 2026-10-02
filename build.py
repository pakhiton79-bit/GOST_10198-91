#!/usr/bin/env python3
"""Собирает src/*.{html,css,js} + src/images/* в готовые файлы docs/*.html.

Два независимых калькулятора (разная методика ГОСТ 10198-91), у каждого
свой набор исходников, но общий src/style.css (единый визуальный стиль),
общие src/common-calc-state.js (статусы расчёта, кнопка «Рассчитать»),
src/common-table-edits.js (ручные правки таблицы деталей),
src/common-diagram-fit.js (подгонка чертежей под слот на экране и в печати)
и src/common-print.js (печать и PDF - подгонка под 1 лист А4; содержимое
листа buildPrintHtml() у каждого типа своё)
и общий src/common-diagrams.js (рендер чертежей-фото renderDiagram() и
общие для обоих типов чертёж торца без раскосины/с 1 раскосиной - у
типа I-1 раскосин на торце не бывает больше одной), а также общий
src/common-timesettings.js (шестерёнка настроек нормы времени у плитки
"Норма времени" - базовая производительность и коэффициент времени,
сохраняются в localStorage отдельно для каждого типа ящика):

== Тип I-3 (крепление за полозья / к доскам дна) ==
src/i3/shell.html - свой HTML-каркас с плейсхолдером на каждый файл I-3
(список - I3_PARTS ниже): src/i3/compute/ - расчёт, src/i3/diagrams/ -
чертежи, src/i3/*.js - интерфейс; CSS, печать и настройки нормы времени -
общие с другими типами. Способ крепления груза (за полозья / к доскам дна) -
переключатель на самой странице (fasteningType), а не отдельные сборки.
  - GOST10198_91POLOZIA.html

== Тип II-1 ==
src/ii1/shell.html - свой HTML-каркас с плейсхолдером на каждый файл II-1
(список - II1_PARTS ниже): src/ii1/compute/ - расчёт, src/ii1/diagrams/ -
чертежи, src/ii1/*.js - интерфейс.
  - GOST10198_91_II1.html

== Тип III-1 ==
src/iii1/shell.html - отдельная копия II-1 со своими таблицами (список -
III1_PARTS ниже): src/iii1/compute/ - расчёт, src/iii1/*.js - интерфейс.
Чертежей узлов пока нет.
  - GOST10198_91_III1.html

== Тип I-1 ==
src/i1/shell.html - свой HTML-каркас с плейсхолдером на каждый файл I-1
(список - I1_PARTS ниже): src/i1/compute/ - расчёт, src/i1/diagrams/ -
чертежи, src/i1/*.js - интерфейс; CSS, печать и настройки нормы времени -
общие с типом I-3.
  - GOST10198_91_I1.html

== Тип I-2 ==
src/i2/shell.html - отдельная копия I-1 с обшивкой из досок с промежутками;
раскладка та же (список - I2_PARTS ниже): src/i2/compute/ - расчёт,
src/i2/diagrams/ - чертежи, src/i2/*.js - интерфейс.
  - GOST10198_91_I2.html

== Стартовые страницы (2 уровня) ==
Уровень 1 - список ГОСТов (src/launcher/launcher.src.html + src/launcher/
gosts.js) -> уровень 2 - список типов тары внутри выбранного ГОСТа
(src/launcher/types.src.html + свой src/launcher/types-<гост>.js на каждый
ГОСТ, с чертежом общего вида ящика у каждого типа справа) -> сам калькулятор.
Способ крепления груза внутри типа I-3 (за полозья / к доскам дна) - НЕ
отдельный пункт на странице типов, а выпадающий список уже внутри калькулятора
(см. onFasteningTypeChange в src/app.js), пересчитывается на лету без
перезагрузки страницы. Стиль - общий src/style.css (design.md) на всех страницах.
Чтобы добавить новый ГОСТ - дописать запись в gosts.js и завести его типы в
новом types-<гост>.js + TYPES_VARIANTS ниже, разметку менять не надо.
  - index.html, gost-10198-91.html (лежат в docs/ рядом с калькуляторами -
    ссылки по имени файла, без пути)

Плейсхолдеры вида __IMG:filename.ext__ (внутри diagrams.js/app.js) заменяются
на base64-содержимое соответствующего файла из src/images/. Запуск:

    python3 build.py
"""
import base64
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC_DIR = ROOT / "src"
IMAGES_DIR = SRC_DIR / "images"
OUT_DIR = ROOT / "docs"  # "docs" (не "dist") - так папку можно напрямую указать источником в GitHub Pages

IMG_PLACEHOLDER = re.compile(r"__IMG:([A-Za-z0-9_.-]+)__")

COMMON_CALC_STATE_JS = SRC_DIR / "common-calc-state.js"
COMMON_TABLE_EDITS_JS = SRC_DIR / "common-table-edits.js"
COMMON_DIAGRAM_FIT_JS = SRC_DIR / "common-diagram-fit.js"
COMMON_PRINT_JS = SRC_DIR / "common-print.js"
COMMON_DIAGRAMS_JS = SRC_DIR / "common-diagrams.js"
COMMON_TIMESETTINGS_JS = SRC_DIR / "common-timesettings.js"
# Общие настройки сайта (шестерёнка вверху каждой страницы: тема оформления) -
# встраивается в <head> всех страниц, чтобы тема ставилась до отрисовки.
COMMON_SETTINGS_JS = SRC_DIR / "common-settings.js"
# Сторонние библиотеки для «Скачать PDF» (downloadPdf() в common-print.js) -
# html2canvas рендерит #printArea в канвас, jsPDF упаковывает его в
# настоящий PDF-файл и сохраняет через doc.save() (реальная отдача файла
# браузером, без диалога печати) - по просьбе пользователя вместо printBox()/
# window.print() для этой кнопки. Вендорятся как обычные файлы (не CDN) -
# тем же принципом, что и остальной проект (самодостаточные страницы без
# внешних зависимостей на этапе показа пользователю).
VENDOR_JSPDF_JS = SRC_DIR / "vendor" / "jspdf.umd.min.js"
VENDOR_HTML2CANVAS_JS = SRC_DIR / "vendor" / "html2canvas.min.js"

# Файлы I-3 разложены так же, как в gost_backend: compute/ - расчёт
# (backend/src/i3), остальное - интерфейс и чертежи (frontend/public/js/i3).
I3_DIR = SRC_DIR / "i3"
I3_SHELL = I3_DIR / "shell.html"
I3_PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__COMMON_SETTINGS_JS__*/": COMMON_SETTINGS_JS,
    "/*__VENDOR_HTML2CANVAS_JS__*/": VENDOR_HTML2CANVAS_JS,
    "/*__VENDOR_JSPDF_JS__*/": VENDOR_JSPDF_JS,
    "/*__I3_HELPERS_JS__*/": I3_DIR / "compute" / "helpers.js",
    "/*__I3_SECTIONS_JS__*/": I3_DIR / "compute" / "sections.js",
    "/*__I3_TABLE19_JS__*/": I3_DIR / "compute" / "data" / "table19.js",
    "/*__I3_TABLE4_JS__*/": I3_DIR / "compute" / "data" / "table4.js",
    "/*__I3_TABLE14_JS__*/": I3_DIR / "compute" / "data" / "table14.js",
    "/*__I3_PLANK_LAYOUT_CALC_JS__*/": I3_DIR / "compute" / "plank-layout.js",
    "/*__I3_DNO_JS__*/": I3_DIR / "compute" / "dno.js",
    "/*__I3_KRYSHKA_JS__*/": I3_DIR / "compute" / "kryshka.js",
    "/*__I3_END_PANEL_JS__*/": I3_DIR / "compute" / "end-panel.js",
    "/*__I3_BOKOVOY_JS__*/": I3_DIR / "compute" / "bokovoy.js",
    "/*__I3_COMPUTE_JS__*/": I3_DIR / "compute" / "compute.js",
    "/*__COMMON_DIAGRAMS_JS__*/": COMMON_DIAGRAMS_JS,
    "/*__I3_DIAGRAM_GENERATED_JS__*/": I3_DIR / "diagrams" / "generated.js",
    "/*__I3_DIAGRAM_DNO_JS__*/": I3_DIR / "diagrams" / "dno.js",
    "/*__I3_DIAGRAM_KRYSHKA_JS__*/": I3_DIR / "diagrams" / "kryshka.js",
    "/*__I3_DIAGRAM_END_PANEL_JS__*/": I3_DIR / "diagrams" / "end-panel.js",
    "/*__I3_DIAGRAM_BOKOVOY_JS__*/": I3_DIR / "diagrams" / "bokovoy.js",
    "/*__COMMON_CALC_STATE_JS__*/": COMMON_CALC_STATE_JS,
    "/*__COMMON_TABLE_EDITS_JS__*/": COMMON_TABLE_EDITS_JS,
    "/*__COMMON_DIAGRAM_FIT_JS__*/": COMMON_DIAGRAM_FIT_JS,
    "/*__COMMON_PRINT_JS__*/": COMMON_PRINT_JS,
    "/*__COMMON_TIMESETTINGS_JS__*/": COMMON_TIMESETTINGS_JS,
    "/*__I3_OPTIONS_JS__*/": I3_DIR / "options.js",
    "/*__I3_PLANK_LAYOUT_UI_JS__*/": I3_DIR / "plank-layout.js",
    "/*__I3_BEAMS_JS__*/": I3_DIR / "beams.js",
    "/*__I3_RENDER_JS__*/": I3_DIR / "render-i3.js",
    "/*__I3_PRINT_JS__*/": I3_DIR / "print-i3.js",
    "/*__I3_CALC_JS__*/": I3_DIR / "calc-i3.js",
}
I3_VARIANTS = [
    {"out_name": "GOST10198_91POLOZIA.html"},
]

I1_DIR = SRC_DIR / "i1"
I1_SHELL = I1_DIR / "shell.html"
# Файлы I-1 разложены так же, как в gost_backend: compute/ - расчёт
# (backend/src/i1), остальное - интерфейс и чертежи (frontend/public/js/i1).
I1_PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__COMMON_SETTINGS_JS__*/": COMMON_SETTINGS_JS,
    "/*__VENDOR_HTML2CANVAS_JS__*/": VENDOR_HTML2CANVAS_JS,
    "/*__VENDOR_JSPDF_JS__*/": VENDOR_JSPDF_JS,
    "/*__I1_HELPERS_JS__*/": I1_DIR / "compute" / "helpers.js",
    "/*__I1_THICKNESS_JS__*/": I1_DIR / "compute" / "thickness.js",
    "/*__I1_PLANK_LAYOUT_CALC_JS__*/": I1_DIR / "compute" / "plank-layout.js",
    "/*__I1_PARTS_JS__*/": I1_DIR / "compute" / "parts.js",
    "/*__I1_COMPUTE_JS__*/": I1_DIR / "compute" / "compute.js",
    "/*__COMMON_DIAGRAMS_JS__*/": COMMON_DIAGRAMS_JS,
    "/*__I1_DIAGRAM_SIZING_JS__*/": I1_DIR / "diagrams" / "sizing.js",
    "/*__I1_DIAGRAM_PANEL_PHOTOS_JS__*/": I1_DIR / "diagrams" / "panel-photos.js",
    "/*__I1_DIAGRAM_PANEL_GENERATED_JS__*/": I1_DIR / "diagrams" / "panel-generated.js",
    "/*__I1_DIAGRAM_PANEL_JS__*/": I1_DIR / "diagrams" / "panel.js",
    "/*__I1_DIAGRAM_TOREC_JS__*/": I1_DIR / "diagrams" / "torec.js",
    "/*__COMMON_CALC_STATE_JS__*/": COMMON_CALC_STATE_JS,
    "/*__COMMON_TABLE_EDITS_JS__*/": COMMON_TABLE_EDITS_JS,
    "/*__COMMON_DIAGRAM_FIT_JS__*/": COMMON_DIAGRAM_FIT_JS,
    "/*__COMMON_PRINT_JS__*/": COMMON_PRINT_JS,
    "/*__COMMON_TIMESETTINGS_JS__*/": COMMON_TIMESETTINGS_JS,
    "/*__I1_OPTIONS_JS__*/": I1_DIR / "options.js",
    "/*__I1_PLANK_LAYOUT_UI_JS__*/": I1_DIR / "plank-layout.js",
    "/*__I1_RENDER_JS__*/": I1_DIR / "render-i1.js",
    "/*__I1_PRINT_JS__*/": I1_DIR / "print-i1.js",
    "/*__I1_CALC_JS__*/": I1_DIR / "calc-i1.js",
}
I1_VARIANTS = [
    {"out_name": "GOST10198_91_I1.html"},
]

I2_DIR = SRC_DIR / "i2"
I2_SHELL = I2_DIR / "shell.html"
# Тип I-2 - отдельная копия I-1 (обшивка с промежутками между досками),
# файлы разложены так же: compute/ - расчёт (backend/src/i2), остальное -
# интерфейс и чертежи (frontend/public/js/i2).
I2_PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__COMMON_SETTINGS_JS__*/": COMMON_SETTINGS_JS,
    "/*__VENDOR_HTML2CANVAS_JS__*/": VENDOR_HTML2CANVAS_JS,
    "/*__VENDOR_JSPDF_JS__*/": VENDOR_JSPDF_JS,
    "/*__I2_HELPERS_JS__*/": I2_DIR / "compute" / "helpers.js",
    "/*__I2_THICKNESS_JS__*/": I2_DIR / "compute" / "thickness.js",
    "/*__I2_PLANK_LAYOUT_CALC_JS__*/": I2_DIR / "compute" / "plank-layout.js",
    "/*__I2_PARTS_JS__*/": I2_DIR / "compute" / "parts.js",
    "/*__I2_COMPUTE_JS__*/": I2_DIR / "compute" / "compute.js",
    "/*__COMMON_DIAGRAMS_JS__*/": COMMON_DIAGRAMS_JS,
    "/*__I2_DIAGRAM_SIZING_JS__*/": I2_DIR / "diagrams" / "sizing.js",
    "/*__I2_DIAGRAM_BOARDS_JS__*/": I2_DIR / "diagrams" / "boards.js",
    "/*__I2_DIAGRAM_PANEL_GENERATED_JS__*/": I2_DIR / "diagrams" / "panel-generated.js",
    "/*__I2_DIAGRAM_PANEL_JS__*/": I2_DIR / "diagrams" / "panel.js",
    "/*__I2_DIAGRAM_TOREC_JS__*/": I2_DIR / "diagrams" / "torec.js",
    "/*__COMMON_CALC_STATE_JS__*/": COMMON_CALC_STATE_JS,
    "/*__COMMON_TABLE_EDITS_JS__*/": COMMON_TABLE_EDITS_JS,
    "/*__COMMON_DIAGRAM_FIT_JS__*/": COMMON_DIAGRAM_FIT_JS,
    "/*__COMMON_PRINT_JS__*/": COMMON_PRINT_JS,
    "/*__COMMON_TIMESETTINGS_JS__*/": COMMON_TIMESETTINGS_JS,
    "/*__I2_OPTIONS_JS__*/": I2_DIR / "options.js",
    "/*__I2_PLANK_LAYOUT_UI_JS__*/": I2_DIR / "plank-layout.js",
    "/*__I2_BOARD_GAPS_JS__*/": I2_DIR / "board-gaps.js",
    "/*__I2_RENDER_JS__*/": I2_DIR / "render-i2.js",
    "/*__I2_PRINT_JS__*/": I2_DIR / "print-i2.js",
    "/*__I2_CALC_JS__*/": I2_DIR / "calc-i2.js",
}
I2_VARIANTS = [
    {"out_name": "GOST10198_91_I2.html"},
]

II1_DIR = SRC_DIR / "ii1"
II1_SHELL = II1_DIR / "shell.html"
# Файлы II-1 разложены так же, как в gost_backend: compute/ - расчёт
# (backend/src/ii1), остальное - интерфейс и чертежи (frontend/public/js/ii1).
II1_PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__COMMON_SETTINGS_JS__*/": COMMON_SETTINGS_JS,
    "/*__VENDOR_HTML2CANVAS_JS__*/": VENDOR_HTML2CANVAS_JS,
    "/*__VENDOR_JSPDF_JS__*/": VENDOR_JSPDF_JS,
    "/*__II1_HELPERS_JS__*/": II1_DIR / "compute" / "helpers.js",
    "/*__II1_GOST_TABLES_JS__*/": II1_DIR / "compute" / "gost-tables.js",
    "/*__II1_LOGIC_JS__*/": II1_DIR / "compute" / "logic.js",
    "/*__II1_SIZING_JS__*/": II1_DIR / "compute" / "sizing.js",
    "/*__II1_DNO_JS__*/": II1_DIR / "compute" / "dno.js",
    "/*__II1_KRYSHKA_JS__*/": II1_DIR / "compute" / "kryshka.js",
    "/*__II1_FRAME_JS__*/": II1_DIR / "compute" / "frame.js",
    "/*__II1_END_PANEL_JS__*/": II1_DIR / "compute" / "end-panel.js",
    "/*__II1_BOKOVOY_JS__*/": II1_DIR / "compute" / "bokovoy.js",
    "/*__II1_COMPUTE_JS__*/": II1_DIR / "compute" / "compute.js",
    "/*__COMMON_DIAGRAMS_JS__*/": COMMON_DIAGRAMS_JS,
    "/*__II1_DIAGRAM_DNO_JS__*/": II1_DIR / "diagrams" / "dno.js",
    "/*__II1_DIAGRAM_KRYSHKA_JS__*/": II1_DIR / "diagrams" / "kryshka.js",
    "/*__II1_DIAGRAM_PANEL_GENERATED_JS__*/": II1_DIR / "diagrams" / "panel-generated.js",
    "/*__II1_DIAGRAM_TOREC_JS__*/": II1_DIR / "diagrams" / "torec.js",
    "/*__II1_DIAGRAM_BOK_JS__*/": II1_DIR / "diagrams" / "bok.js",
    "/*__COMMON_CALC_STATE_JS__*/": COMMON_CALC_STATE_JS,
    "/*__COMMON_TABLE_EDITS_JS__*/": COMMON_TABLE_EDITS_JS,
    "/*__COMMON_DIAGRAM_FIT_JS__*/": COMMON_DIAGRAM_FIT_JS,
    "/*__COMMON_PRINT_JS__*/": COMMON_PRINT_JS,
    "/*__COMMON_TIMESETTINGS_JS__*/": COMMON_TIMESETTINGS_JS,
    "/*__II1_OPTIONS_JS__*/": II1_DIR / "options.js",
    "/*__II1_MANUAL_COUNTS_JS__*/": II1_DIR / "manual-counts.js",
    "/*__II1_FINE_THICKNESS_JS__*/": II1_DIR / "fine-thickness.js",
    "/*__II1_RENDER_JS__*/": II1_DIR / "render-ii1.js",
    "/*__II1_PRINT_JS__*/": II1_DIR / "print-ii1.js",
    "/*__II1_CALC_JS__*/": II1_DIR / "calc-ii1.js",
}
II1_VARIANTS = [
    {"out_name": "GOST10198_91_II1.html"},
]

III1_DIR = SRC_DIR / "iii1"
III1_SHELL = III1_DIR / "shell.html"
# Тип III-1 - отдельная копия II-1 со своими таблицами; файлы разложены так
# же, как в gost_backend: compute/ - расчёт (backend/src/iii1), остальное -
# интерфейс (frontend/public/js/iii1). Чертежи (diagrams/): дно (dno.js),
# щиты (panel.js - общий генератор, torec.js, bok.js); крышки пока нет.
III1_PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__COMMON_SETTINGS_JS__*/": COMMON_SETTINGS_JS,
    "/*__VENDOR_HTML2CANVAS_JS__*/": VENDOR_HTML2CANVAS_JS,
    "/*__VENDOR_JSPDF_JS__*/": VENDOR_JSPDF_JS,
    "/*__III1_HELPERS_JS__*/": III1_DIR / "compute" / "helpers.js",
    "/*__III1_GOST_TABLES_JS__*/": III1_DIR / "compute" / "gost-tables.js",
    "/*__III1_LOGIC_JS__*/": III1_DIR / "compute" / "logic.js",
    "/*__III1_SIZING_JS__*/": III1_DIR / "compute" / "sizing.js",
    "/*__III1_DNO_JS__*/": III1_DIR / "compute" / "dno.js",
    "/*__III1_KRYSHKA_JS__*/": III1_DIR / "compute" / "kryshka.js",
    "/*__III1_FRAME_JS__*/": III1_DIR / "compute" / "frame.js",
    "/*__III1_END_PANEL_JS__*/": III1_DIR / "compute" / "end-panel.js",
    "/*__III1_BOKOVOY_JS__*/": III1_DIR / "compute" / "bokovoy.js",
    "/*__III1_BOLTS_JS__*/": III1_DIR / "compute" / "bolts.js",
    "/*__III1_COMPUTE_JS__*/": III1_DIR / "compute" / "compute.js",
    "/*__COMMON_DIAGRAMS_JS__*/": COMMON_DIAGRAMS_JS,
    "/*__COMMON_CALC_STATE_JS__*/": COMMON_CALC_STATE_JS,
    "/*__COMMON_TABLE_EDITS_JS__*/": COMMON_TABLE_EDITS_JS,
    "/*__COMMON_DIAGRAM_FIT_JS__*/": COMMON_DIAGRAM_FIT_JS,
    "/*__COMMON_PRINT_JS__*/": COMMON_PRINT_JS,
    "/*__COMMON_TIMESETTINGS_JS__*/": COMMON_TIMESETTINGS_JS,
    "/*__III1_OPTIONS_JS__*/": III1_DIR / "options.js",
    "/*__III1_MANUAL_COUNTS_JS__*/": III1_DIR / "manual-counts.js",
    "/*__III1_PANEL_DIAGRAM_JS__*/": III1_DIR / "diagrams" / "panel.js",
    "/*__III1_TOREC_DIAGRAM_JS__*/": III1_DIR / "diagrams" / "torec.js",
    "/*__III1_DNO_DIAGRAM_JS__*/": III1_DIR / "diagrams" / "dno.js",
    "/*__III1_BOK_DIAGRAM_JS__*/": III1_DIR / "diagrams" / "bok.js",
    "/*__III1_RENDER_JS__*/": III1_DIR / "render-iii1.js",
    "/*__III1_PRINT_JS__*/": III1_DIR / "print-iii1.js",
    "/*__III1_CALC_JS__*/": III1_DIR / "calc-iii1.js",
}
III1_VARIANTS = [
    {"out_name": "GOST10198_91_III1.html"},
]

LAUNCHER_DIR = SRC_DIR / "launcher"

# Уровень 1 - стартовая страница (список ГОСТов).
LAUNCHER_SHELL = LAUNCHER_DIR / "launcher.src.html"
LAUNCHER_PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__COMMON_SETTINGS_JS__*/": COMMON_SETTINGS_JS,
    "/*__GOSTS_JS__*/": LAUNCHER_DIR / "gosts.js",
}
LAUNCHER_VARIANTS = [
    {"out_name": "index.html"},
]

# Уровень 2 - страница типов тары внутри одного ГОСТа. Каждая запись - один
# ГОСТ: out_name/GOST_NAME/GOST_TITLE - как в src/launcher/gosts.js (file
# соответствующей записи), TYPES_JS - его файл каталога типов
# (src/launcher/types-*.js). Новый ГОСТ добавляется и сюда, и в gosts.js.
TYPES_SHELL = LAUNCHER_DIR / "types.src.html"
TYPES_PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__COMMON_SETTINGS_JS__*/": COMMON_SETTINGS_JS,
}
TYPES_VARIANTS = [
    {
        "out_name": "gost-10198-91.html",
        "/*__GOST_NAME__*/": "ГОСТ 10198-91",
        "/*__TYPES_JS__*/": LAUNCHER_DIR / "types-10198-91.js",
    },
]


def build_one(shell, parts, variant):
    text = shell.read_text(encoding="utf-8")

    for placeholder, path in parts.items():
        if placeholder not in text:
            print(f"Плейсхолдер {placeholder} не найден в {shell}", file=sys.stderr)
            sys.exit(1)
        text = text.replace(placeholder, path.read_text(encoding="utf-8"))

    for key, path in variant.items():
        if key == "out_name":
            continue
        if key not in text:
            print(f"Плейсхолдер {key} не найден", file=sys.stderr)
            sys.exit(1)
        # Значение варианта - либо путь к файлу (обычный случай), либо просто
        # готовая строка (для плейсхолдеров вида /*__GOST_NAME__*/ на странице
        # типов, где нет смысла заводить отдельный файл на одну строку текста).
        content = path.read_text(encoding="utf-8") if isinstance(path, Path) else path
        text = text.replace(key, content)

    missing = []

    def replace_img(match):
        fname = match.group(1)
        path = IMAGES_DIR / fname
        if not path.exists():
            missing.append(fname)
            return match.group(0)
        data = base64.b64encode(path.read_bytes()).decode("ascii")
        return data

    result = IMG_PLACEHOLDER.sub(replace_img, text)

    if missing:
        print("Не найдены файлы картинок:", ", ".join(missing), file=sys.stderr)
        sys.exit(1)

    out_path = OUT_DIR / variant["out_name"]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(result, encoding="utf-8")
    print(f"Собрано: {out_path} ({out_path.stat().st_size / 1024:.0f} KB)")


def main():
    for variant in I3_VARIANTS:
        build_one(I3_SHELL, I3_PARTS, variant)
    for variant in I1_VARIANTS:
        build_one(I1_SHELL, I1_PARTS, variant)
    for variant in I2_VARIANTS:
        build_one(I2_SHELL, I2_PARTS, variant)
    for variant in II1_VARIANTS:
        build_one(II1_SHELL, II1_PARTS, variant)
    for variant in III1_VARIANTS:
        build_one(III1_SHELL, III1_PARTS, variant)
    for variant in LAUNCHER_VARIANTS:
        build_one(LAUNCHER_SHELL, LAUNCHER_PARTS, variant)
    for variant in TYPES_VARIANTS:
        build_one(TYPES_SHELL, TYPES_PARTS, variant)


if __name__ == "__main__":
    main()

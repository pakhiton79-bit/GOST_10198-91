#!/usr/bin/env python3
"""Собирает src/*.{html,css,js} + src/images/* в готовые файлы docs/*.html.

Два независимых калькулятора (разная методика ГОСТ 10198-91), у каждого
свой набор исходников, но общий src/style.css (единый визуальный стиль),
общий src/common-print.js (механика печати - подгонка под 1 лист А4,
резерв места под вылет подписей чертежей - в обоих типах одинаковая,
кроме содержимого buildPrintHtml(), которое остаётся в каждом типе своё)
и общий src/common-diagrams.js (рендер чертежей-фото renderDiagram() и
общие для обоих типов чертёж торца без раскосины/с 1 раскосиной - у
типа I-1 раскосин на торце не бывает больше одной):

== Тип I-3 (крепление за полозья / к доскам дна) ==
src/calc.src.html - HTML-каркас с плейсхолдерами:
  /*__STYLE_CSS__*/          -> src/style.css
  /*__LOGIC_JS__*/           -> src/logic.js (расчётные формулы ГОСТ)
  /*__COMMON_DIAGRAMS_JS__*/ -> src/common-diagrams.js (общий рендер чертежей)
  /*__DIAGRAMS_JS__*/        -> src/diagrams.js (чертежи деталей)
  /*__COMMON_PRINT_JS__*/    -> src/common-print.js (общая механика печати)
  /*__APP_JS__*/             -> src/app.js (UI, calculate(), buildPrintHtml())
Плюс три плейсхолдера - единственные места, где расходятся два файла этого
типа (иначе всё общее): /*__FLOOR_BOARD_CALC__*/ и /*__FASTENING_DEFAULT__*/
(в src/app.js), <!--__FASTENING_OPTIONS__--> (в src/calc.src.html).
Значения - из src/variants/ (см. I3_VARIANTS ниже):
  - GOST10198_91POLOZIA.html   - крепление за полозья, толщина доски дна
    по новому правилу
  - GOST10198_91DOSKI_DNA.html - крепление к доскам дна, толщина доски дна
    по Таблице 4 п.1.6.9, как было раньше

== Тип I-1 ==
src/i1/shell.html - свой HTML-каркас с плейсхолдерами STYLE_CSS/LOGIC_JS/
DIAGRAMS_JS/COMMON_PRINT_JS (первые два - src/i1/logic.js, src/i1/diagrams.js,
пока заглушки - фото чертежей ещё не пришли; CSS и печать - общие с типом
I-3, файлы те же) плюс UI_JS/CALC_JS (src/i1/ui.js - фильтр толщин и галочка
полоза, src/i1/calc.js - calculate() и buildPrintHtml()).
  - GOST10198_91_I1.html

== Стартовые страницы (2 уровня) ==
Уровень 1 - список ГОСТов (src/launcher/launcher.src.html + src/launcher/
gosts.js) -> уровень 2 - список типов тары внутри выбранного ГОСТа
(src/launcher/types.src.html + свой src/launcher/types-<гост>.js на каждый
ГОСТ, с чертежом общего вида ящика у каждого типа справа) -> сам калькулятор.
Способ крепления груза внутри типа I-3 (за полозья / к доскам дна) - НЕ
отдельный пункт на странице типов, а выпадающий список уже внутри калькулятора
(см. onFasteningTypeChange в src/app.js) - переключает между двумя файлами
(GOST10198_91POLOZIA.html/GOST10198_91DOSKI_DNA.html), но передаёт текущие
введённые значения через URL, чтобы это не выглядело переходом на «другой
калькулятор». Стиль - общий src/style.css (design.md) на всех страницах.
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
VARIANTS_DIR = SRC_DIR / "variants"
OUT_DIR = ROOT / "docs"  # "docs" (не "dist") - так папку можно напрямую указать источником в GitHub Pages

IMG_PLACEHOLDER = re.compile(r"__IMG:([A-Za-z0-9_.-]+)__")

COMMON_PRINT_JS = SRC_DIR / "common-print.js"
COMMON_DIAGRAMS_JS = SRC_DIR / "common-diagrams.js"

I3_SHELL = SRC_DIR / "calc.src.html"
I3_PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__LOGIC_JS__*/": SRC_DIR / "logic.js",
    "/*__COMMON_DIAGRAMS_JS__*/": COMMON_DIAGRAMS_JS,
    "/*__DIAGRAMS_JS__*/": SRC_DIR / "diagrams.js",
    "/*__COMMON_PRINT_JS__*/": COMMON_PRINT_JS,
    "/*__APP_JS__*/": SRC_DIR / "app.js",
}
I3_VARIANTS = [
    {
        "out_name": "GOST10198_91POLOZIA.html",
        "/*__FLOOR_BOARD_CALC__*/": VARIANTS_DIR / "floor_board_new.js",
        "/*__FASTENING_DEFAULT__*/": VARIANTS_DIR / "fastening_default_polozia.js",
        "<!--__FASTENING_OPTIONS__-->": VARIANTS_DIR / "fastening_options_polozia.html",
        "<!--__REMOVE_FLOOR_BOARDS_OPTION__-->": VARIANTS_DIR / "remove_floor_boards_polozia.html",
    },
    {
        "out_name": "GOST10198_91DOSKI_DNA.html",
        "/*__FLOOR_BOARD_CALC__*/": VARIANTS_DIR / "floor_board_table4.js",
        "/*__FASTENING_DEFAULT__*/": VARIANTS_DIR / "fastening_default_doski_dna.js",
        "<!--__FASTENING_OPTIONS__-->": VARIANTS_DIR / "fastening_options_doski_dna.html",
        "<!--__REMOVE_FLOOR_BOARDS_OPTION__-->": VARIANTS_DIR / "remove_floor_boards_doski_dna.html",
    },
]

I1_DIR = SRC_DIR / "i1"
I1_SHELL = I1_DIR / "shell.html"
I1_PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__LOGIC_JS__*/": I1_DIR / "logic.js",
    "/*__COMMON_DIAGRAMS_JS__*/": COMMON_DIAGRAMS_JS,
    "/*__DIAGRAMS_JS__*/": I1_DIR / "diagrams.js",
    "/*__COMMON_PRINT_JS__*/": COMMON_PRINT_JS,
    "/*__UI_JS__*/": I1_DIR / "ui.js",
    "/*__CALC_JS__*/": I1_DIR / "calc.js",
}
I1_VARIANTS = [
    {"out_name": "GOST10198_91_I1.html"},
]

LAUNCHER_DIR = SRC_DIR / "launcher"

# Уровень 1 - стартовая страница (список ГОСТов).
LAUNCHER_SHELL = LAUNCHER_DIR / "launcher.src.html"
LAUNCHER_PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
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
    for variant in LAUNCHER_VARIANTS:
        build_one(LAUNCHER_SHELL, LAUNCHER_PARTS, variant)
    for variant in TYPES_VARIANTS:
        build_one(TYPES_SHELL, TYPES_PARTS, variant)


if __name__ == "__main__":
    main()

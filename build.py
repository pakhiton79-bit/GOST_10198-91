#!/usr/bin/env python3
"""Собирает src/*.{html,css,js} + src/images/* в готовые файлы dist/*.html.

Два независимых калькулятора (разная методика ГОСТ 10198-91), у каждого
свой набор исходников, но общий src/style.css (единый визуальный стиль):

== Тип I-3 (крепление за полозья / к доскам дна) ==
src/calc.src.html - HTML-каркас с плейсхолдерами:
  /*__STYLE_CSS__*/    -> src/style.css
  /*__LOGIC_JS__*/     -> src/logic.js (расчётные формулы ГОСТ)
  /*__DIAGRAMS_JS__*/  -> src/diagrams.js (чертежи деталей)
  /*__APP_JS__*/       -> src/app.js (UI, calculate(), печать)
Плюс три плейсхолдера - единственные места, где расходятся два файла этого
типа (иначе всё общее): /*__FLOOR_BOARD_CALC__*/ и /*__FASTENING_DEFAULT__*/
(в src/app.js), <!--__FASTENING_OPTIONS__--> (в src/calc.src.html).
Значения - из src/variants/ (см. I3_VARIANTS ниже):
  - GOST10198_91POLOZIA.html   - крепление за полозья, толщина доски дна
    по новому правилу
  - GOST10198_91DOSKI_DNA.html - крепление к доскам дна, толщина доски дна
    по Таблице 4 п.1.6.9, как было раньше

== Тип I-1 ==
src/i1/shell.html - свой HTML-каркас с теми же четырьмя плейсхолдерами,
подставляются src/i1/logic.js, src/i1/diagrams.js (пока заглушки - фото
чертежей ещё не пришли), src/i1/app.js. CSS - тот же src/style.css.
  - GOST10198_91_I1.html

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
DIST_DIR = ROOT / "dist"

IMG_PLACEHOLDER = re.compile(r"__IMG:([A-Za-z0-9_.-]+)__")

I3_SHELL = SRC_DIR / "calc.src.html"
I3_PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__LOGIC_JS__*/": SRC_DIR / "logic.js",
    "/*__DIAGRAMS_JS__*/": SRC_DIR / "diagrams.js",
    "/*__APP_JS__*/": SRC_DIR / "app.js",
}
I3_VARIANTS = [
    {
        "out_name": "GOST10198_91POLOZIA.html",
        "/*__FLOOR_BOARD_CALC__*/": VARIANTS_DIR / "floor_board_new.js",
        "/*__FASTENING_DEFAULT__*/": VARIANTS_DIR / "fastening_default_polozia.js",
        "<!--__FASTENING_OPTIONS__-->": VARIANTS_DIR / "fastening_options_polozia.html",
    },
    {
        "out_name": "GOST10198_91DOSKI_DNA.html",
        "/*__FLOOR_BOARD_CALC__*/": VARIANTS_DIR / "floor_board_table4.js",
        "/*__FASTENING_DEFAULT__*/": VARIANTS_DIR / "fastening_default_doski_dna.js",
        "<!--__FASTENING_OPTIONS__-->": VARIANTS_DIR / "fastening_options_doski_dna.html",
    },
]

I1_DIR = SRC_DIR / "i1"
I1_SHELL = I1_DIR / "shell.html"
I1_PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__LOGIC_JS__*/": I1_DIR / "logic.js",
    "/*__DIAGRAMS_JS__*/": I1_DIR / "diagrams.js",
    "/*__APP_JS__*/": I1_DIR / "app.js",
}
I1_VARIANTS = [
    {"out_name": "GOST10198_91_I1.html"},
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
        text = text.replace(key, path.read_text(encoding="utf-8"))

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

    out_path = DIST_DIR / variant["out_name"]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(result, encoding="utf-8")
    print(f"Собрано: {out_path} ({out_path.stat().st_size / 1024:.0f} KB)")


def main():
    for variant in I3_VARIANTS:
        build_one(I3_SHELL, I3_PARTS, variant)
    for variant in I1_VARIANTS:
        build_one(I1_SHELL, I1_PARTS, variant)


if __name__ == "__main__":
    main()

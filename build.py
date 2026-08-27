#!/usr/bin/env python3
"""Собирает src/*.{html,css,js} + src/images/* в готовые файлы dist/*.html.

src/calc.src.html - HTML-каркас (разметка форм и таблиц) с плейсхолдерами:
  /*__STYLE_CSS__*/    -> содержимое src/style.css
  /*__LOGIC_JS__*/     -> содержимое src/logic.js (расчётные формулы ГОСТ)
  /*__DIAGRAMS_JS__*/  -> содержимое src/diagrams.js (чертежи деталей)
  /*__APP_JS__*/       -> содержимое src/app.js (UI, calculate(), печать)
Файлы разделены так, чтобы типичная правка (один чертёж, одна формула)
затрагивала небольшой файл, а не общий HTML на 2500+ строк.

Остаются три плейсхолдера в общих файлах - единственные места, где расходятся
два типа крепления груза (иначе всё содержимое app.js/logic.js/diagrams.js/
style.css/calc.src.html общее для обоих файлов):
  /*__FLOOR_BOARD_CALC__*/    (src/app.js)          - формула толщины доски дна
  /*__FASTENING_DEFAULT__*/   (src/app.js)          - активный тип крепления
  <!--__FASTENING_OPTIONS__--> (src/calc.src.html)  - выпадающий список крепления
Значения подставляются из src/variants/ (см. VARIANTS ниже):
  - GOST10198_91POLOZIA.html   - крепление за полозья, толщина доски дна
    по новому правилу
  - GOST10198_91DOSKI_DNA.html - крепление к доскам дна, толщина доски дна
    по Таблице 4 п.1.6.9, как было раньше

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
SHELL = SRC_DIR / "calc.src.html"
IMAGES_DIR = SRC_DIR / "images"
VARIANTS_DIR = SRC_DIR / "variants"
DIST_DIR = ROOT / "dist"

IMG_PLACEHOLDER = re.compile(r"__IMG:([A-Za-z0-9_.-]+)__")

PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__LOGIC_JS__*/": SRC_DIR / "logic.js",
    "/*__DIAGRAMS_JS__*/": SRC_DIR / "diagrams.js",
    "/*__APP_JS__*/": SRC_DIR / "app.js",
}

VARIANTS = [
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


def build_one(variant):
    text = SHELL.read_text(encoding="utf-8")

    for placeholder, path in PARTS.items():
        if placeholder not in text:
            print(f"Плейсхолдер {placeholder} не найден в {SHELL}", file=sys.stderr)
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
    for variant in VARIANTS:
        build_one(variant)


if __name__ == "__main__":
    main()

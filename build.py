#!/usr/bin/env python3
"""Собирает src/*.{html,css,js} + src/images/* в готовые файлы dist/*.html.

src/calc.src.html - HTML-каркас (разметка форм и таблиц) с плейсхолдерами:
  /*__STYLE_CSS__*/    -> содержимое src/style.css
  /*__LOGIC_JS__*/     -> содержимое src/logic.js (расчётные формулы ГОСТ)
  /*__DIAGRAMS_JS__*/  -> содержимое src/diagrams.js (чертежи деталей)
  /*__APP_JS__*/       -> содержимое src/app.js (UI, calculate(), печать)
Файлы разделены так, чтобы типичная правка (один чертёж, одна формула)
затрагивала небольшой файл, а не общий HTML на 2500+ строк.

Внутри src/app.js остаётся один плейсхолдер /*__FLOOR_BOARD_CALC__*/ -
единственное место, где расходятся два типа крепления груза (иначе всё
содержимое app.js/logic.js/diagrams.js/style.css общее для обоих файлов):
  - GOST10198_91POLOZIA.html   - крепление за полозья, толщина доски дна
    по новому правилу (src/variants/floor_board_new.js)
  - GOST10198_91DOSKI_DNA.html - крепление к доскам дна, толщина доски дна
    по Таблице 4 п.1.6.9, как было раньше (src/variants/floor_board_table4.js)

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
FLOOR_BOARD_PLACEHOLDER = "/*__FLOOR_BOARD_CALC__*/"

PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__LOGIC_JS__*/": SRC_DIR / "logic.js",
    "/*__DIAGRAMS_JS__*/": SRC_DIR / "diagrams.js",
    "/*__APP_JS__*/": SRC_DIR / "app.js",
}

VARIANTS = [
    ("GOST10198_91POLOZIA.html", VARIANTS_DIR / "floor_board_new.js"),
    ("GOST10198_91DOSKI_DNA.html", VARIANTS_DIR / "floor_board_table4.js"),
]


def build_one(out_name, floor_board_snippet):
    text = SHELL.read_text(encoding="utf-8")

    for placeholder, path in PARTS.items():
        if placeholder not in text:
            print(f"Плейсхолдер {placeholder} не найден в {SHELL}", file=sys.stderr)
            sys.exit(1)
        text = text.replace(placeholder, path.read_text(encoding="utf-8"))

    if FLOOR_BOARD_PLACEHOLDER not in text:
        print(f"Плейсхолдер {FLOOR_BOARD_PLACEHOLDER} не найден", file=sys.stderr)
        sys.exit(1)
    text = text.replace(FLOOR_BOARD_PLACEHOLDER, floor_board_snippet.read_text(encoding="utf-8"))

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

    out_path = DIST_DIR / out_name
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(result, encoding="utf-8")
    print(f"Собрано: {out_path} ({out_path.stat().st_size / 1024:.0f} KB)")


def main():
    for out_name, floor_board_snippet in VARIANTS:
        build_one(out_name, floor_board_snippet)


if __name__ == "__main__":
    main()

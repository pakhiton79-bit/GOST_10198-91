#!/usr/bin/env python3
"""Собирает src/*.{html,css,js} + src/images/* в единый готовый файл dist/calc.html.

src/calc.src.html - HTML-каркас (разметка форм и таблиц) с плейсхолдерами:
  /*__STYLE_CSS__*/    -> содержимое src/style.css
  /*__LOGIC_JS__*/     -> содержимое src/logic.js (расчётные формулы ГОСТ)
  /*__DIAGRAMS_JS__*/  -> содержимое src/diagrams.js (чертежи деталей)
  /*__APP_JS__*/       -> содержимое src/app.js (UI, calculate(), печать)
Файлы разделены так, чтобы типичная правка (один чертёж, одна формула)
затрагивала небольшой файл, а не общий HTML на 2500+ строк.

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
OUT = ROOT / "dist" / "calc.html"

IMG_PLACEHOLDER = re.compile(r"__IMG:([A-Za-z0-9_.-]+)__")

PARTS = {
    "/*__STYLE_CSS__*/": SRC_DIR / "style.css",
    "/*__LOGIC_JS__*/": SRC_DIR / "logic.js",
    "/*__DIAGRAMS_JS__*/": SRC_DIR / "diagrams.js",
    "/*__APP_JS__*/": SRC_DIR / "app.js",
}


def main():
    text = SHELL.read_text(encoding="utf-8")

    for placeholder, path in PARTS.items():
        if placeholder not in text:
            print(f"Плейсхолдер {placeholder} не найден в {SHELL}", file=sys.stderr)
            sys.exit(1)
        text = text.replace(placeholder, path.read_text(encoding="utf-8"))

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

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(result, encoding="utf-8")
    print(f"Собрано: {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()

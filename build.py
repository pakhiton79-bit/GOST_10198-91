#!/usr/bin/env python3
"""Собирает src/calc.src.html + src/images/* в единый готовый файл dist/calc.html.

Плейсхолдеры вида __IMG:filename.ext__ в src/calc.src.html заменяются на
base64 содержимое соответствующего файла из src/images/. Запуск:

    python3 build.py
"""
import base64
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src" / "calc.src.html"
IMAGES_DIR = ROOT / "src" / "images"
OUT = ROOT / "dist" / "calc.html"

PLACEHOLDER = re.compile(r"__IMG:([A-Za-z0-9_.-]+)__")


def main():
    text = SRC.read_text(encoding="utf-8")

    missing = []

    def replace(match):
        fname = match.group(1)
        path = IMAGES_DIR / fname
        if not path.exists():
            missing.append(fname)
            return match.group(0)
        data = base64.b64encode(path.read_bytes()).decode("ascii")
        return data

    result = PLACEHOLDER.sub(replace, text)

    if missing:
        print("Не найдены файлы картинок:", ", ".join(missing), file=sys.stderr)
        sys.exit(1)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(result, encoding="utf-8")
    print(f"Собрано: {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Конвертирует Sprite-0002-export.png в JSON-массив матриц 0/1.

Логика:
  - Картинка состоит из 25 ачивок, разделённых зелёными полосами высотой 8px
    (цвет ~ (0,255,133)), идущими во всю ширину.
  - Каждая ачивка — сетка квадратов 8x8: 32 столбца x 18 строк.
  - Каждый квадрат залит одним цветом: чёрным (1) или белым (0).
  - На выходе: список из 25 матриц 18x32 из 0/1.
"""

import json
from PIL import Image

# Захардкоженный путь к картинке
SRC = "/Users/bopohob/Downloads/Telegram Desktop/Sprite-0002-export.png"
DST = "/Users/bopohob/q/snake/achievements.json"

CELL = 8          # размер квадрата
COLS = 32         # квадратов по горизонтали
ROWS = 18         # квадратов по вертикали
N_ACH = 25        # всего ачивок

# Порог яркости: ниже — считаем чёрным (1), выше — белым (0).
# Чёрный в спрайте ~ (34,32,52), белый ~ (255,255,255).
LUMA_THRESHOLD = 128


def is_green(rgb):
    r, g, b = rgb
    return g > 200 and r < 80 and b < 160


def find_green_strips(px, w, h):
    """Возвращает список (y0, y1) — диапазоны сплошных зелёных строк."""
    rows = []
    for y in range(h):
        ok = True
        for x in range(0, w, 4):  # проверяем каждые 4 пикселя — полоса сплошная
            if not is_green(px[x, y]):
                ok = False
                break
        if ok:
            rows.append(y)
    strips = []
    if not rows:
        return strips
    start = prev = rows[0]
    for y in rows[1:]:
        if y == prev + 1:
            prev = y
        else:
            strips.append((start, prev))
            start = prev = y
    strips.append((start, prev))
    return strips


def cell_value(px, x0, y0):
    """Определяем цвет квадрата 8x8 по среднему пикселю квадрата."""
    r, g, b = px[x0 + CELL // 2, y0 + CELL // 2]
    luma = 0.299 * r + 0.587 * g + 0.114 * b
    return 1 if luma < LUMA_THRESHOLD else 0


def main():
    im = Image.open(SRC).convert("RGB")
    w, h = im.size
    px = im.load()
    assert w == COLS * CELL, f"ширина {w} != {COLS * CELL}"

    strips = find_green_strips(px, w, h)
    print(f"Найдено зелёных полос: {len(strips)}")

    # Ачивки — это промежутки между полосами (и до первой / после последней).
    regions = []
    prev_end = -1
    for s, e in strips:
        regions.append((prev_end + 1, s - 1))
        prev_end = e
    # Если после последней полосы нет ачивки — последний регион будет пустым;
    # в нашем случае после последней полосы (1px внизу) ачивки нет, отбросим хвост.

    matrices = []
    for (y0, y1) in regions:
        if y1 < 0:
            continue
        height = y1 - y0 + 1
        if height != ROWS * CELL:
            # пропускаем мусорные/неполные регионы (например, хвост в 1px)
            print(f"  пропуск региона {y0}-{y1}, высота {height}")
            continue
        matrix = []
        for ry in range(ROWS):
            row = []
            for cx in range(COLS):
                x0 = cx * CELL
                yy0 = y0 + ry * CELL
                row.append(cell_value(px, x0, yy0))
            matrix.append(row)
        matrices.append(matrix)

    print(f"Собрано матриц: {len(matrices)}")
    assert len(matrices) == N_ACH, f"ожидалось {N_ACH}, получено {len(matrices)}"

    # Кастомное форматирование: каждая матрица и каждая строка — с новой строки,
    # внутри строк между элементами нет пробелов (компактно), чтобы визуально
    # результат легко было сравнить с исходным изображением.
    def fmt_matrices(mats):
        out = ["["]
        for mi, m in enumerate(mats):
            out.append("  [")
            for ri, row in enumerate(m):
                comma_r = "," if ri < len(m) - 1 else ""
                out.append("    [" + ",".join(str(v) for v in row) + "]" + comma_r)
            comma_m = "," if mi < len(mats) - 1 else ""
            out.append("  ]" + comma_m)
        out.append("]")
        return "\n".join(out) + "\n"

    with open(DST, "w") as f:
        f.write(fmt_matrices(matrices))
    print(f"Сохранено в {DST}")

    # Небольшая сводка для проверки
    for i, m in enumerate(matrices):
        blacks = sum(sum(r) for r in m)
        print(f"  ачивка {i+1:2d}: чёрных квадратов = {blacks}")


if __name__ == "__main__":
    main()

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Computes a set of disjoint (non-overlapping) empty rectangles representing the remaining waste area.
 * It starts with the full sheet and recursively subtracts each placed piece.
 */
export function getDisjointEmptyRects(
  sheetWidth: number,
  sheetHeight: number,
  placements: { x: number; y: number; width: number; height: number }[]
): Rect[] {
  let freeRects: Rect[] = [{ x: 0, y: 0, w: sheetWidth, h: sheetHeight }];

  for (const p of placements) {
    const nextFreeRects: Rect[] = [];

    for (const f of freeRects) {
      // Check if placement p and free rect f overlap
      const overlapX = Math.max(f.x, p.x) < Math.min(f.x + f.w, p.x + p.width);
      const overlapY = Math.max(f.y, p.y) < Math.min(f.y + f.h, p.y + p.height);

      if (!overlapX || !overlapY) {
        nextFreeRects.push(f);
        continue;
      }

      // They overlap. Split f into up to 4 disjoint rectangles outside of p's bounds
      // 1. Left part
      if (p.x > f.x) {
        nextFreeRects.push({ x: f.x, y: f.y, w: p.x - f.x, h: f.h });
      }
      
      // 2. Right part
      if (p.x + p.width < f.x + f.w) {
        nextFreeRects.push({
          x: p.x + p.width,
          y: f.y,
          w: f.x + f.w - (p.x + p.width),
          h: f.h,
        });
      }

      const overlapXStart = Math.max(f.x, p.x);
      const overlapXEnd = Math.min(f.x + f.w, p.x + p.width);
      const overlapW = overlapXEnd - overlapXStart;

      // 3. Bottom part (bounded within the overlap X range to keep sub-rectangles disjoint)
      if (p.y > f.y && overlapW > 0) {
        nextFreeRects.push({
          x: overlapXStart,
          y: f.y,
          w: overlapW,
          h: p.y - f.y,
        });
      }

      // 4. Top part (bounded within the overlap X range)
      if (p.y + p.height < f.y + f.h && overlapW > 0) {
        nextFreeRects.push({
          x: overlapXStart,
          y: p.y + p.height,
          w: overlapW,
          h: f.y + f.h - (p.y + p.height),
        });
      }
    }

    // Filter out very thin slices (e.g. less than 0.1cm) to avoid numerical noise
    freeRects = nextFreeRects.filter((r) => r.w >= 0.1 && r.h >= 0.1);
  }

  return freeRects;
}

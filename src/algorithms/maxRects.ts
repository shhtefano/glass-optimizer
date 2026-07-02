import { Piece } from '../types/Piece';
import { Placement } from '../types/Placement';
import { Sheet } from '../types/Sheet';

export type MaxRectsHeuristic = 'BSSF' | 'BLSF' | 'BAF';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function packMaxRects(
  inputPieces: Piece[],
  sheetWidth: number,
  sheetHeight: number,
  heuristic: MaxRectsHeuristic,
  allowRotation: boolean
): { sheets: Sheet[]; unplacedPieces: { piece: Piece; remainingQty: number }[] } {
  // Flatten pieces based on quantity
  interface FlatItem {
    id: string;
    name?: string;
    width: number;
    height: number;
    rotatable: boolean;
    originalPiece: Piece;
  }

  const itemsToPack: FlatItem[] = [];
  inputPieces.forEach((p) => {
    for (let i = 0; i < p.quantity; i++) {
      itemsToPack.push({
        id: p.id,
        name: p.name || `Pezzo ${p.id.slice(0, 4)}`,
        width: p.width,
        height: p.height,
        rotatable: p.rotatable && allowRotation,
        originalPiece: p,
      });
    }
  });

  // Sort items by decreasing area, or max side to improve packing efficiency
  itemsToPack.sort((a, b) => {
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    if (areaA !== areaB) return areaB - areaA;
    return Math.max(b.width, b.height) - Math.max(a.width, a.height);
  });

  const sheets: Sheet[] = [];
  const unplacedFlat: FlatItem[] = [];

  // Helper function to create a new empty sheet
  function createNewSheet(index: number): Sheet {
    return {
      id: `sheet-${index + 1}`,
      width: sheetWidth,
      height: sheetHeight,
      placements: [],
      usedArea: 0,
      wasteArea: sheetWidth * sheetHeight,
      utilization: 0,
    };
  }

  // We pack items one by one. For each item, we try to place it in existing sheets.
  // If it doesn't fit, we open a new sheet.
  for (const item of itemsToPack) {
    let placed = false;

    // Check if the item is too large for the sheet size
    const fitsNormal = item.width <= sheetWidth && item.height <= sheetHeight;
    const fitsRotated = item.rotatable && item.height <= sheetWidth && item.width <= sheetHeight;

    if (!fitsNormal && !fitsRotated) {
      unplacedFlat.push(item);
      continue;
    }

    // Try to pack into one of the existing sheets
    for (let sIndex = 0; sIndex < sheets.length; sIndex++) {
      const sheet = sheets[sIndex];
      const freeRects = freeRectsBySheet[sIndex];

      const placement = findBestPlacement(item, freeRects, heuristic);
      if (placement) {
        // Place it!
        sheet.placements.push(placement);
        sheet.usedArea += placement.width * placement.height;
        sheet.wasteArea = sheet.width * sheet.height - sheet.usedArea;
        sheet.utilization = (sheet.usedArea / (sheet.width * sheet.height)) * 100;

        // Split free rectangles based on the new placement
        splitFreeRectangles(freeRects, {
          x: placement.x,
          y: placement.y,
          w: placement.width,
          h: placement.height,
        });

        placed = true;
        break;
      }
    }

    // If it didn't fit in any existing sheet, create a new one
    if (!placed) {
      const newSheetIndex = sheets.length;
      const newSheet = createNewSheet(newSheetIndex);
      // Initialize free rectangles for the new sheet
      const newFreeRects: Rect[] = [{ x: 0, y: 0, w: sheetWidth, h: sheetHeight }];
      
      const placement = findBestPlacement(item, newFreeRects, heuristic);
      if (placement) {
        newSheet.placements.push(placement);
        newSheet.usedArea += placement.width * placement.height;
        newSheet.wasteArea = newSheet.width * newSheet.height - newSheet.usedArea;
        newSheet.utilization = (newSheet.usedArea / (newSheet.width * newSheet.height)) * 100;

        splitFreeRectangles(newFreeRects, {
          x: placement.x,
          y: placement.y,
          w: placement.width,
          h: placement.height,
        });

        sheets.push(newSheet);
        freeRectsBySheet.push(newFreeRects);
        placed = true;
      } else {
        // Safe-guard, shouldn't happen unless something is wrong
        unplacedFlat.push(item);
      }
    }
  }

  // Track free rectangles per sheet
  // (We use a module-level or local dictionary initialized above)
  // Let's rewrite the outer scope to cleanly handle freeRects state.
  
  // Convert unplaced flat items back to grouped counts
  const unplacedMap = new Map<string, { piece: Piece; qty: number }>();
  unplacedFlat.forEach((item) => {
    const existing = unplacedMap.get(item.originalPiece.id);
    if (existing) {
      existing.qty++;
    } else {
      unplacedMap.set(item.originalPiece.id, { piece: item.originalPiece, qty: 1 });
    }
  });

  const unplacedPieces = Array.from(unplacedMap.values()).map((val) => ({
    piece: val.piece,
    remainingQty: val.qty,
  }));

  return { sheets, unplacedPieces };
}

// Global or local list of free rectangles during execution
let freeRectsBySheet: Rect[][] = [];

// Initialize/Reset tracking for free rects
export function runMaxRects(
  inputPieces: Piece[],
  sheetWidth: number,
  sheetHeight: number,
  heuristic: MaxRectsHeuristic,
  allowRotation: boolean
): { sheets: Sheet[]; unplacedPieces: { piece: Piece; remainingQty: number }[] } {
  freeRectsBySheet = [];
  return packMaxRects(inputPieces, sheetWidth, sheetHeight, heuristic, allowRotation);
}

// Find placement for a single item in a list of free rectangles using a specific heuristic
function findBestPlacement(
  item: { id: string; name?: string; width: number; height: number; rotatable: boolean },
  freeRects: Rect[],
  heuristic: MaxRectsHeuristic
): Placement | null {
  let bestScore1 = Infinity;
  let bestScore2 = Infinity;
  let bestPlacement: Placement | null = null;

  for (const freeRect of freeRects) {
    // 1. Try normal orientation
    if (item.width <= freeRect.w && item.height <= freeRect.h) {
      const leftoverW = freeRect.w - item.width;
      const leftoverH = freeRect.h - item.height;
      const score = calculateScore(leftoverW, leftoverH, item.width * item.height, heuristic);

      if (score.score1 < bestScore1 || (score.score1 === bestScore1 && score.score2 < bestScore2)) {
        bestScore1 = score.score1;
        bestScore2 = score.score2;
        bestPlacement = {
          pieceId: item.id,
          pieceName: item.name,
          x: freeRect.x,
          y: freeRect.y,
          width: item.width,
          height: item.height,
          rotated: false,
        };
      }
    }

    // 2. Try rotated orientation
    if (item.rotatable && item.height <= freeRect.w && item.width <= freeRect.h) {
      const leftoverW = freeRect.w - item.height;
      const leftoverH = freeRect.h - item.width;
      const score = calculateScore(leftoverW, leftoverH, item.width * item.height, heuristic);

      if (score.score1 < bestScore1 || (score.score1 === bestScore1 && score.score2 < bestScore2)) {
        bestScore1 = score.score1;
        bestScore2 = score.score2;
        bestPlacement = {
          pieceId: item.id,
          pieceName: item.name,
          x: freeRect.x,
          y: freeRect.y,
          width: item.height,
          height: item.width,
          rotated: true,
        };
      }
    }
  }

  return bestPlacement;
}

// Score function for heuristics
function calculateScore(
  leftoverW: number,
  leftoverH: number,
  pieceArea: number,
  heuristic: MaxRectsHeuristic
): { score1: number; score2: number } {
  const shortSide = Math.min(leftoverW, leftoverH);
  const longSide = Math.max(leftoverW, leftoverH);

  switch (heuristic) {
    case 'BSSF': // Best Short Side Fit
      return { score1: shortSide, score2: longSide };
    case 'BLSF': // Best Long Side Fit
      return { score1: longSide, score2: shortSide };
    case 'BAF': // Best Area Fit
      // We score by leftover area of the free rectangle
      const leftoverArea = (leftoverW + (leftoverH === 0 ? 0 : 0)) * leftoverH; // area of free rect minus piece is proportional to leftover dimensions
      // Free Rect Area = (leftoverW + pieceW) * (leftoverH + pieceH)
      // Actually, since pieceArea is constant for the choice, scoring by freeRectArea is exactly equivalent to scoring by leftover area!
      // Let's use freeRectArea = freeRectW * freeRectH
      const freeRectArea = leftoverW * leftoverH; // approximate or exact
      return { score1: freeRectArea, score2: shortSide };
  }
}

// Split overlapping free rectangles
function splitFreeRectangles(freeRects: Rect[], placed: Rect): void {
  const newRects: Rect[] = [];

  for (let i = 0; i < freeRects.length; i++) {
    const f = freeRects[i];

    // Check for overlap
    const overlapX = Math.max(f.x, placed.x) < Math.min(f.x + f.w, placed.x + placed.w);
    const overlapY = Math.max(f.y, placed.y) < Math.min(f.y + f.h, placed.y + placed.h);

    if (!overlapX || !overlapY) {
      newRects.push(f);
      continue;
    }

    // Split
    // 1. Left split
    if (placed.x > f.x && placed.x < f.x + f.w) {
      newRects.push({ x: f.x, y: f.y, w: placed.x - f.x, h: f.h });
    }
    // 2. Right split
    if (placed.x + placed.w < f.x + f.w) {
      newRects.push({
        x: placed.x + placed.w,
        y: f.y,
        w: f.x + f.w - (placed.x + placed.w),
        h: f.h,
      });
    }
    // 3. Bottom split
    if (placed.y > f.y && placed.y < f.y + f.h) {
      newRects.push({ x: f.x, y: f.y, w: f.w, h: placed.y - f.y });
    }
    // 4. Top split
    if (placed.y + placed.h < f.y + f.h) {
      newRects.push({
        x: f.x,
        y: placed.y + placed.h,
        w: f.w,
        h: f.y + f.h - (placed.y + placed.h),
      });
    }
  }

  // Prune free rectangles: remove redundant ones
  const prunedRects: Rect[] = [];
  for (let i = 0; i < newRects.length; i++) {
    let isContained = false;
    for (let j = 0; j < newRects.length; j++) {
      if (i === j) continue;
      if (isSubset(newRects[i], newRects[j])) {
        isContained = true;
        break;
      }
    }
    if (!isContained) {
      prunedRects.push(newRects[i]);
    }
  }

  // Update original array
  freeRects.length = 0;
  freeRects.push(...prunedRects);
}

// Returns true if r1 is completely inside r2
function isSubset(r1: Rect, r2: Rect): boolean {
  return (
    r1.x >= r2.x &&
    r1.y >= r2.y &&
    r1.x + r1.w <= r2.x + r2.w &&
    r1.y + r1.h <= r2.y + r2.h
  );
}

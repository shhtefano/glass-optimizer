import { Piece } from '../types/Piece';
import { Placement } from '../types/Placement';
import { Sheet } from '../types/Sheet';

export type GuillotineHeuristic = 'BSSF' | 'BLSF' | 'BAF';
export type GuillotineSplitRule = 'ShorterAxis' | 'LongerAxis' | 'Horizontal' | 'Vertical';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function packGuillotine(
  inputPieces: Piece[],
  sheetWidth: number,
  sheetHeight: number,
  fitHeuristic: GuillotineHeuristic,
  splitRule: GuillotineSplitRule,
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

  // Sort items by decreasing area
  itemsToPack.sort((a, b) => {
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    if (areaA !== areaB) return areaB - areaA;
    return Math.max(b.width, b.height) - Math.max(a.width, a.height);
  });

  const sheets: Sheet[] = [];
  const freeRectsBySheet: Rect[][] = [];
  const unplacedFlat: FlatItem[] = [];

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

  for (const item of itemsToPack) {
    let placed = false;

    // Check if the item is too large for the sheet size
    const fitsNormal = item.width <= sheetWidth && item.height <= sheetHeight;
    const fitsRotated = item.rotatable && item.height <= sheetWidth && item.width <= sheetHeight;

    if (!fitsNormal && !fitsRotated) {
      unplacedFlat.push(item);
      continue;
    }

    // Try to fit in existing sheets
    for (let sIndex = 0; sIndex < sheets.length; sIndex++) {
      const sheet = sheets[sIndex];
      const freeRects = freeRectsBySheet[sIndex];

      const bestFit = findBestFreeRect(item, freeRects, fitHeuristic);
      if (bestFit) {
        const { freeRectIndex, rotated } = bestFit;
        const freeRect = freeRects[freeRectIndex];

        // Placement details
        const w = rotated ? item.height : item.width;
        const h = rotated ? item.width : item.height;

        const placement: Placement = {
          pieceId: item.id,
          pieceName: item.name,
          x: freeRect.x,
          y: freeRect.y,
          width: w,
          height: h,
          rotated,
        };

        sheet.placements.push(placement);
        sheet.usedArea += w * h;
        sheet.wasteArea = sheet.width * sheet.height - sheet.usedArea;
        sheet.utilization = (sheet.usedArea / (sheet.width * sheet.height)) * 100;

        // Split the chosen free rectangle
        const leftoverRects = splitFreeRect(freeRect, w, h, splitRule);
        
        // Remove the original free rect and add the new ones
        freeRects.splice(freeRectIndex, 1);
        freeRects.push(...leftoverRects.filter((r) => r.w > 0 && r.h > 0));

        placed = true;
        break;
      }
    }

    // If it didn't fit, open a new sheet
    if (!placed) {
      const newSheetIndex = sheets.length;
      const newSheet = createNewSheet(newSheetIndex);
      const freeRects: Rect[] = [{ x: 0, y: 0, w: sheetWidth, h: sheetHeight }];

      const bestFit = findBestFreeRect(item, freeRects, fitHeuristic);
      if (bestFit) {
        const { rotated } = bestFit;
        const w = rotated ? item.height : item.width;
        const h = rotated ? item.width : item.height;

        const placement: Placement = {
          pieceId: item.id,
          pieceName: item.name,
          x: 0,
          y: 0,
          width: w,
          height: h,
          rotated,
        };

        newSheet.placements.push(placement);
        newSheet.usedArea += w * h;
        newSheet.wasteArea = newSheet.width * newSheet.height - newSheet.usedArea;
        newSheet.utilization = (newSheet.usedArea / (newSheet.width * newSheet.height)) * 100;

        const leftoverRects = splitFreeRect(freeRects[0], w, h, splitRule);
        freeRects.length = 0;
        freeRects.push(...leftoverRects.filter((r) => r.w > 0 && r.h > 0));

        sheets.push(newSheet);
        freeRectsBySheet.push(freeRects);
        placed = true;
      } else {
        unplacedFlat.push(item);
      }
    }
  }

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

// Find the best free rectangle for a piece in Guillotine algorithm
function findBestFreeRect(
  item: { width: number; height: number; rotatable: boolean },
  freeRects: Rect[],
  fitHeuristic: GuillotineHeuristic
): { freeRectIndex: number; rotated: boolean } | null {
  let bestIndex = -1;
  let bestRotated = false;
  let bestScore1 = Infinity;
  let bestScore2 = Infinity;

  for (let i = 0; i < freeRects.length; i++) {
    const freeRect = freeRects[i];

    // Try normal
    if (item.width <= freeRect.w && item.height <= freeRect.h) {
      const leftoverW = freeRect.w - item.width;
      const leftoverH = freeRect.h - item.height;
      const score = calculateScore(leftoverW, leftoverH, fitHeuristic);

      if (score.score1 < bestScore1 || (score.score1 === bestScore1 && score.score2 < bestScore2)) {
        bestScore1 = score.score1;
        bestScore2 = score.score2;
        bestIndex = i;
        bestRotated = false;
      }
    }

    // Try rotated
    if (item.rotatable && item.height <= freeRect.w && item.width <= freeRect.h) {
      const leftoverW = freeRect.w - item.height;
      const leftoverH = freeRect.h - item.width;
      const score = calculateScore(leftoverW, leftoverH, fitHeuristic);

      if (score.score1 < bestScore1 || (score.score1 === bestScore1 && score.score2 < bestScore2)) {
        bestScore1 = score.score1;
        bestScore2 = score.score2;
        bestIndex = i;
        bestRotated = true;
      }
    }
  }

  if (bestIndex === -1) return null;
  return { freeRectIndex: bestIndex, rotated: bestRotated };
}

// Score calculations
function calculateScore(
  leftoverW: number,
  leftoverH: number,
  fitHeuristic: GuillotineHeuristic
): { score1: number; score2: number } {
  const shortSide = Math.min(leftoverW, leftoverH);
  const longSide = Math.max(leftoverW, leftoverH);

  switch (fitHeuristic) {
    case 'BSSF': // Best Short Side Fit
      return { score1: shortSide, score2: longSide };
    case 'BLSF': // Best Long Side Fit
      return { score1: longSide, score2: shortSide };
    case 'BAF': // Best Area Fit
      const area = leftoverW * leftoverH;
      return { score1: area, score2: shortSide };
  }
}

// Splits the free rectangle into two sub-rectangles according to split rule
function splitFreeRect(
  freeRect: Rect,
  w: number,
  h: number,
  splitRule: GuillotineSplitRule
): Rect[] {
  const leftoverW = freeRect.w - w;
  const leftoverH = freeRect.h - h;

  let splitHorizontal = false;

  switch (splitRule) {
    case 'Horizontal':
      splitHorizontal = true;
      break;
    case 'Vertical':
      splitHorizontal = false;
      break;
    case 'ShorterAxis':
      // Split along the axis that has the shorter remaining side
      splitHorizontal = leftoverW <= leftoverH;
      break;
    case 'LongerAxis':
      // Split along the axis that has the longer remaining side
      splitHorizontal = leftoverW > leftoverH;
      break;
  }

  if (splitHorizontal) {
    // Cut horizontally first: split along horizontal line
    // Leftover area is divided into:
    // 1. Right of the piece: (freeRect.x + w, freeRect.y, leftoverW, h)
    // 2. Above the piece and its right area: (freeRect.x, freeRect.y + h, freeRect.w, leftoverH)
    return [
      { x: freeRect.x + w, y: freeRect.y, w: leftoverW, h: h },
      { x: freeRect.x, y: freeRect.y + h, w: freeRect.w, h: leftoverH },
    ];
  } else {
    // Cut vertically first: split along vertical line
    // Leftover area is divided into:
    // 1. Right of the piece: (freeRect.x + w, freeRect.y, leftoverW, freeRect.h)
    // 2. Above the piece: (freeRect.x, freeRect.y + h, w, leftoverH)
    return [
      { x: freeRect.x + w, y: freeRect.y, w: leftoverW, h: freeRect.h },
      { x: freeRect.x, y: freeRect.y + h, w: w, h: leftoverH },
    ];
  }
}

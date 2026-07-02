import { Piece } from '../types/Piece';
import { Solution } from '../types/Solution';
import { Sheet } from '../types/Sheet';
import { Placement } from '../types/Placement';
import { runMaxRects, MaxRectsHeuristic } from './maxRects';
import { packGuillotine, GuillotineHeuristic, GuillotineSplitRule } from './guillotine';
import { getDisjointEmptyRects } from '../utils/geometry';

// Generates a unique string hash of a sheet layout to check for equivalence
function getSheetHash(sheet: Sheet): string {
  // Sort placements to ensure hash stability
  const sortedPlacements = [...sheet.placements].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    if (a.y !== b.y) return a.y - b.y;
    return a.width * a.height - b.width * b.height;
  });

  return sortedPlacements
    .map((p) => `${p.pieceId}:${p.x},${p.y},${p.width},${p.height},${p.rotated ? 'R' : 'N'}`)
    .join('|');
}

// Generates a unique string hash of a full solution
function getSolutionHash(sheets: Sheet[]): string {
  // Hash each sheet, sort them, and combine
  return sheets
    .map(getSheetHash)
    .sort()
    .join('||');
}

export function optimizeGlassCutting(
  pieces: Piece[],
  sheetWidth: number = 240,
  sheetHeight: number = 300,
  allowRotation: boolean = true
): Solution[] {
  // Filter out pieces with quantity <= 0 or invalid dimensions
  const validPieces = pieces.filter((p) => p.width > 0 && p.height > 0 && p.quantity > 0);
  if (validPieces.length === 0) {
    return [];
  }

  const candidates: Solution[] = [];

  // Run various heuristic algorithms
  const runConfigurations = () => {
    // List of MaxRects variations
    const maxRectsHeuristics: MaxRectsHeuristic[] = ['BAF', 'BSSF', 'BLSF'];
    maxRectsHeuristics.forEach((h) => {
      try {
        const result = runMaxRects(validPieces, sheetWidth, sheetHeight, h, allowRotation);
        addCandidate(result.sheets, result.unplacedPieces, `MaxRects - Fit: ${h}`);
      } catch (err) {
        console.error('Error running MaxRects config:', err);
      }
    });

    // List of Guillotine variations
    const guillotineHeuristics: GuillotineHeuristic[] = ['BAF', 'BSSF', 'BLSF'];
    const guillotineSplitRules: GuillotineSplitRule[] = ['ShorterAxis', 'LongerAxis', 'Horizontal', 'Vertical'];

    guillotineHeuristics.forEach((h) => {
      guillotineSplitRules.forEach((s) => {
        try {
          const result = packGuillotine(validPieces, sheetWidth, sheetHeight, h, s, allowRotation);
          addCandidate(result.sheets, result.unplacedPieces, `Guillotine - Fit: ${h}, Taglio: ${s}`);
        } catch (err) {
          console.error('Error running Guillotine config:', err);
        }
      });
    });
  };

  function addCandidate(
    sheets: Sheet[],
    unplacedPieces: { piece: Piece; remainingQty: number }[],
    algorithmName: string
  ) {
    if (sheets.length === 0 && unplacedPieces.length === 0) return;

    // Calculate overall statistics
    const sheetsUsed = sheets.length;
    const totalArea = sheetsUsed * sheetWidth * sheetHeight;
    const totalUsedArea = sheets.reduce((acc, s) => acc + s.usedArea, 0);
    const wasteArea = totalArea - totalUsedArea;
    const utilization = totalArea > 0 ? (totalUsedArea / totalArea) * 100 : 0;

    // Calculate and assign wasteRects for each sheet in the solution
    const sheetsWithWaste: Sheet[] = sheets.map((s) => ({
      ...s,
      wasteRects: getDisjointEmptyRects(sheetWidth, sheetHeight, s.placements).map((r) => ({
        x: r.x,
        y: r.y,
        width: r.w,
        height: r.h,
      })),
    }));

    // Format placements array of arrays compatibility
    const placements: Placement[][] = sheetsWithWaste.map((s) => s.placements);

    candidates.push({
      id: Math.random().toString(36).substring(2, 9),
      algorithmName,
      sheets: sheetsWithWaste,
      sheetsUsed,
      wasteArea,
      utilization: parseFloat(utilization.toFixed(2)),
      placements,
      unplacedPieces,
    });
  }

  // Run the configurations
  runConfigurations();

  // If there are no candidates, return empty list
  if (candidates.length === 0) return [];

  // Sort candidates by efficiency metrics:
  // 1. Primary: Minimizzione delle lastre utilizzate (fewer sheets is better)
  // 2. Secondary: Massimizzazione dell'area utilizzata / della percentuale di utilizzo (higher utilization is better)
  // 3. Tertiary: Numero di pezzi non posizionati (fewer is better - should be zero since sheets are added dynamically unless pieces are larger than sheet)
  // 4. Quaternary: Minimizzazione dell'area di scarto
  candidates.sort((a, b) => {
    // First, compare by unplaced count (lower is better)
    const unplacedA = a.unplacedPieces.reduce((acc, p) => acc + p.remainingQty, 0);
    const unplacedB = b.unplacedPieces.reduce((acc, p) => acc + p.remainingQty, 0);
    if (unplacedA !== unplacedB) return unplacedA - unplacedB;

    // Second, compare by number of sheets (lower is better)
    if (a.sheetsUsed !== b.sheetsUsed) return a.sheetsUsed - b.sheetsUsed;

    // Third, compare by utilization percentage (higher is better)
    if (Math.abs(b.utilization - a.utilization) > 0.001) {
      return b.utilization - a.utilization;
    }

    // Fourth, compare by waste area (lower is better)
    return a.wasteArea - b.wasteArea;
  });

  // Filter out duplicate solution layouts
  const uniqueCandidates: Solution[] = [];
  const seenHashes = new Set<string>();

  for (const candidate of candidates) {
    const hash = getSolutionHash(candidate.sheets);
    // Also include unplaced items count in hash check
    const unplacedCount = candidate.unplacedPieces.reduce((acc, p) => acc + p.remainingQty, 0);
    const fullHash = `${hash}_unplaced:${unplacedCount}_sheets:${candidate.sheetsUsed}_util:${candidate.utilization.toFixed(1)}`;

    if (!seenHashes.has(fullHash)) {
      seenHashes.add(fullHash);
      uniqueCandidates.push(candidate);
    }

    // Stop once we have our top 3 solutions
    if (uniqueCandidates.length >= 3) {
      break;
    }
  }

  // If we couldn't get 3 unique layouts, just return what we have (e.g. 1 or 2)
  return uniqueCandidates;
}

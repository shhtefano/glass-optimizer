import { Sheet } from './Sheet';
import { Placement } from './Placement';
import { Piece } from './Piece';

export interface Solution {
  id: string;
  algorithmName: string;
  sheets: Sheet[];
  sheetsUsed: number;
  wasteArea: number;
  utilization: number;       // percentage (0 to 100)
  placements: Placement[][]; // placements[sheetIndex] = array of placements
  unplacedPieces: { piece: Piece; remainingQty: number }[];
}

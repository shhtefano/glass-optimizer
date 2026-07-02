import { Placement } from './Placement';

export interface Sheet {
  id: string;
  width: number;
  height: number;
  placements: Placement[];
  usedArea: number;
  wasteArea: number;
  utilization: number; // percentage (0 to 100)
  wasteRects?: { x: number; y: number; width: number; height: number }[];
}


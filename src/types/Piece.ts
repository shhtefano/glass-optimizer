export interface Piece {
  id: string;
  name?: string; // Optional user-assigned label (e.g. "Finestra Soggiorno")
  width: number;
  height: number;
  quantity: number;
  rotatable: boolean;
}

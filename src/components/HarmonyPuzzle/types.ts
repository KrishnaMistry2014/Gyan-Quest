export interface PuzzleTile {
  id: number; // 0 to 11
  row: number; // 0 to 2 (3 rows)
  col: number; // 0 to 3 (4 cols)
  dataUrl: string; // slice generated dynamically via HTML5 Canvas
  aspectRatio: number;
}

export interface BoardSlot {
  index: number; // 0 to 11
  row: number; // 0 to 2
  col: number; // 0 to 3
  placedTileId: number | null;
}

export interface PuzzleImageTheme {
  id: string;
  name: string;
  subtitle: string;
  src: string;
  wisdomPillar: string;
  shlokaQuote: string;
}

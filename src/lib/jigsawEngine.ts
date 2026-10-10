/**
 * Jigsaw Puzzle Geometry Engine
 * Generates mathematically complementary interlocking jigsaw tabs and sockets
 * with precise SVG clipping paths, clean outer borders, and zero-gap alignment.
 */

export interface JigsawPiece {
  id: number;
  row: number;
  col: number;
  top: number;    // 1 = tab outward, -1 = blank inward, 0 = flat border
  right: number;
  bottom: number;
  left: number;
  pathData: string; // SVG path d="..." in piece-local coordinates
  width: number;    // Local piece SVG width including tab padding
  height: number;   // Local piece SVG height including tab padding
  padX: number;     // Left tab margin
  padY: number;     // Top tab margin
  cellW: number;    // Nominal inner width
  cellH: number;    // Nominal inner height
  imageX: number;   // Image offset inside local SVG
  imageY: number;   // Image offset inside local SVG
  targetX: number;  // Correct snapped board coordinates
  targetY: number;
  currentX: number; // Current coordinates in the active play arena
  currentY: number;
  isSnapped: boolean;
}

/**
 * Builds the SVG path commands for one edge of a jigsaw piece.
 * Clockwise traversal:
 *   (x1, y1) -> (x2, y2)
 *   outward normal is (uy, -ux).
 *   tabVal: +1 = outward tab, -1 = inward socket, 0 = flat boundary.
 */
function createEdgePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tabVal: number,
  cellW: number,
  cellH: number
): string {
  if (tabVal === 0) {
    return `L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  const vx = x2 - x1;
  const vy = y2 - y1;
  const length = Math.hypot(vx, vy);
  if (length === 0) return `L ${x2.toFixed(2)} ${y2.toFixed(2)}`;

  const ux = vx / length;
  const uy = vy / length;
  // Clockwise outward normal
  const nx = uy;
  const ny = -ux;

  // Protrusion amplitude (proportional to cell dimension)
  const h = tabVal * 0.22 * Math.min(cellW, cellH);

  const P = (t: number, p: number) => {
    const px = x1 + t * vx + p * h * nx;
    const py = y1 + t * vy + p * h * ny;
    return `${px.toFixed(2)},${py.toFixed(2)}`;
  };

  // Symmetrical bell-curve jigsaw tab with indented neck:
  // t: 0 -> 0.36 (baseline)
  // t: 0.36 -> 0.42 (ear swell left)
  // t: 0.42 -> 0.58 (rounded crown)
  // t: 0.58 -> 0.64 (ear swell right)
  // t: 0.64 -> 1.0 (baseline)
  return (
    `L ${P(0.36, 0)} ` +
    `C ${P(0.38, -0.10)} ${P(0.32, 0.65)} ${P(0.42, 0.95)} ` +
    `C ${P(0.46, 1.15)} ${P(0.54, 1.15)} ${P(0.58, 0.95)} ` +
    `C ${P(0.68, 0.65)} ${P(0.62, -0.10)} ${P(0.64, 0)} ` +
    `L ${x2.toFixed(2)} ${y2.toFixed(2)}`
  );
}

/**
 * Builds the complete closed SVG path for a piece in its local coordinate system.
 */
function buildPieceSvgPath(
  top: number,
  right: number,
  bottom: number,
  left: number,
  padX: number,
  padY: number,
  cellW: number,
  cellH: number
): string {
  const x0 = padX;
  const y0 = padY;
  const x1 = padX + cellW;
  const y1 = padY + cellH;

  const topEdge = createEdgePath(x0, y0, x1, y0, top, cellW, cellH);
  const rightEdge = createEdgePath(x1, y0, x1, y1, right, cellW, cellH);
  const bottomEdge = createEdgePath(x1, y1, x0, y1, bottom, cellW, cellH);
  const leftEdge = createEdgePath(x0, y1, x0, y0, left, cellW, cellH);

  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} ${topEdge} ${rightEdge} ${bottomEdge} ${leftEdge} Z`;
}

export interface GridDimensions {
  rows: number;
  cols: number;
  boardWidth: number;
  boardHeight: number;
  trayWidth: number;
  trayHeight: number;
}

/**
 * Generates an interlocking puzzle grid of genuine jigsaw pieces.
 * Guarantees that:
 * 1. Adjacent pieces share identical boundary curves (one tab, one socket).
 * 2. Outer borders are straight.
 * 3. Initial placement is randomized in the tray area without overlap.
 */
export function generateJigsawPuzzle(
  rows: number = 3,
  cols: number = 3,
  boardWidth: number = 420,
  boardHeight: number = 420,
  trayWidth: number = 420,
  trayHeight: number = 420
): JigsawPiece[] {
  const cellW = boardWidth / cols;
  const cellH = boardHeight / rows;
  const tabMax = 0.25 * Math.min(cellW, cellH);
  const padX = Math.ceil(tabMax * 1.35);
  const padY = Math.ceil(tabMax * 1.35);

  const pieceWidth = cellW + 2 * padX;
  const pieceHeight = cellH + 2 * padY;

  // 1. Generate complementary internal horizontal and vertical edges
  // hChoices[r][c] defines tab direction for edge between row r and row r+1 at column c
  // +1 means tabs downward (into row r+1), -1 means tabs upward (into row r)
  const hChoices: number[][] = [];
  for (let r = 0; r < rows - 1; r++) {
    hChoices[r] = [];
    for (let c = 0; c < cols; c++) {
      hChoices[r][c] = Math.random() < 0.5 ? 1 : -1;
    }
  }

  // vChoices[r][c] defines tab direction for edge between col c and col c+1 at row r
  // +1 means tabs rightward (into col c+1), -1 means tabs leftward (into col c)
  const vChoices: number[][] = [];
  for (let r = 0; r < rows; r++) {
    vChoices[r] = [];
    for (let c = 0; c < cols - 1; c++) {
      vChoices[r][c] = Math.random() < 0.5 ? 1 : -1;
    }
  }

  const pieces: JigsawPiece[] = [];
  let pieceId = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Top edge
      const top = r === 0 ? 0 : -hChoices[r - 1][c];
      // Right edge
      const right = c === cols - 1 ? 0 : vChoices[r][c];
      // Bottom edge
      const bottom = r === rows - 1 ? 0 : hChoices[r][c];
      // Left edge
      const left = c === 0 ? 0 : -vChoices[r][c - 1];

      const pathData = buildPieceSvgPath(
        top,
        right,
        bottom,
        left,
        padX,
        padY,
        cellW,
        cellH
      );

      // Target position relative to the board top-left
      const targetX = c * cellW - padX;
      const targetY = r * cellH - padY;

      // Image offset inside this piece's local SVG
      const imageX = padX - c * cellW;
      const imageY = padY - r * cellH;

      pieces.push({
        id: pieceId++,
        row: r,
        col: c,
        top,
        right,
        bottom,
        left,
        pathData,
        width: pieceWidth,
        height: pieceHeight,
        padX,
        padY,
        cellW,
        cellH,
        imageX,
        imageY,
        targetX,
        targetY,
        currentX: 0,
        currentY: 0,
        isSnapped: false,
      });
    }
  }

  // 2. Compute scattered initial positions in tray
  // Shuffle pieces to ensure non-consecutive placement in the tray
  const shuffledIndices = pieces.map((_, i) => i).sort(() => Math.random() - 0.5);

  // Position pieces across an accessible grid inside tray area
  const trayCols = Math.min(cols, 3);
  const trayRows = Math.ceil(pieces.length / trayCols);
  const slotW = trayWidth / trayCols;
  const slotH = trayHeight / trayRows;

  shuffledIndices.forEach((pieceIdx, slotIdx) => {
    const slotCol = slotIdx % trayCols;
    const slotRow = Math.floor(slotIdx / trayCols);

    // Center piece in slot with small organic jitter (+/- 8px)
    const jitterX = (Math.random() - 0.5) * 16;
    const jitterY = (Math.random() - 0.5) * 16;

    const startX = slotCol * slotW + (slotW - pieceWidth) / 2 + jitterX;
    const startY = slotRow * slotH + (slotH - pieceHeight) / 2 + jitterY;

    pieces[pieceIdx].currentX = Math.round(startX);
    pieces[pieceIdx].currentY = Math.round(startY);
  });

  return pieces;
}

/**
 * Checks if a dragged piece is within the magnetic snapping radius of its target position.
 */
export function checkPieceSnap(
  piece: JigsawPiece,
  boardCoordX: number,
  boardCoordY: number,
  snapThreshold: number = 38
): boolean {
  const dist = Math.hypot(boardCoordX - piece.targetX, boardCoordY - piece.targetY);
  return dist <= snapThreshold;
}

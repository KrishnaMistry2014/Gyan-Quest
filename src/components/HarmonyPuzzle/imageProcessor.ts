import { PuzzleTile } from './types';

export interface SlicedPuzzleResult {
  tiles: PuzzleTile[];
  aspectRatio: number; // width / height
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * Loads the source image and automatically divides it into a 4-column by 3-row grid (12 rectangular tiles)
 * using an off-screen HTML5 Canvas.
 * Preserves exact proportions with zero gaps, distortion, stretching, or incorrect cropping.
 */
export async function slicePuzzleImage(
  imageSrc: string,
  cols: number = 4,
  rows: number = 3
): Promise<SlicedPuzzleResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        if (!naturalWidth || !naturalHeight) {
          throw new Error('Invalid image dimensions');
        }

        const aspectRatio = naturalWidth / naturalHeight;
        const tileWidth = naturalWidth / cols;
        const tileHeight = naturalHeight / rows;

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(tileWidth);
        canvas.height = Math.round(tileHeight);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to create canvas 2D context');
        }

        const tiles: PuzzleTile[] = [];

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const id = r * cols + c;

            // Clear canvas for pristine slice
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw slice with pixel precision
            const sx = c * tileWidth;
            const sy = r * tileHeight;

            ctx.drawImage(
              img,
              sx,
              sy,
              tileWidth,
              tileHeight,
              0,
              0,
              canvas.width,
              canvas.height
            );

            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

            tiles.push({
              id,
              row: r,
              col: c,
              dataUrl,
              aspectRatio: tileWidth / tileHeight,
            });
          }
        }

        // Clean up canvas
        canvas.width = 0;
        canvas.height = 0;

        resolve({
          tiles,
          aspectRatio,
          naturalWidth,
          naturalHeight,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error(`Failed to load puzzle image from: ${imageSrc}`));
    };

    img.src = imageSrc;
  });
}

/**
 * Fisher-Yates array shuffle for truly randomized puzzle pieces
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

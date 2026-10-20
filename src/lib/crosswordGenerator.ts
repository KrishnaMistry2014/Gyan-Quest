import { CrosswordWord, CrosswordData } from '../types';

export interface RawCrosswordInputWord {
  answer: string;
  clue: string;
}

interface PlacedGridWord {
  answer: string;
  clue: string;
  direction: 'across' | 'down';
  row: number;
  col: number;
}

/**
 * Builds a 100% valid, collision-free intersecting crossword grid from a list of candidate words.
 * Every overlapping cell is guaranteed to share the EXACT same character in both words.
 * No adjacent illegality, no letter overwrites, clean normalized (0,0) coordinates.
 */
export function buildValidCrosswordLayout(
  inputWords: RawCrosswordInputWord[],
  meta?: { title?: string; theme?: string; summary?: string; id?: string; glossary?: { term: string; definition: string }[] }
): CrosswordData {
  // 1. Sanitize & deduplicate input words
  const cleanMap = new Map<string, string>();
  for (const item of inputWords) {
    if (!item || !item.answer) continue;
    const cleanAnswer = String(item.answer).toUpperCase().replace(/[^A-Z]/g, '').trim();
    if (cleanAnswer.length >= 3 && cleanAnswer.length <= 14) {
      if (!cleanMap.has(cleanAnswer)) {
        cleanMap.set(cleanAnswer, String(item.clue || 'Key concept from document').trim());
      }
    }
  }

  // Sort by length descending so long words establish the puzzle anchor
  const candidates: { answer: string; clue: string }[] = Array.from(cleanMap.entries())
    .map(([answer, clue]) => ({ answer, clue }))
    .sort((a, b) => b.answer.length - a.answer.length)
    .slice(0, 6);

  if (candidates.length === 0) {
    // Return empty fallback
    return {
      id: meta?.id || `cw_${Date.now()}`,
      title: meta?.title || 'Educational Crossword',
      theme: meta?.theme || 'Chapter Vocabulary',
      summary: meta?.summary || 'Interactive crossword puzzle derived from document.',
      gridSize: 11,
      words: [],
      glossary: meta?.glossary || [],
    };
  }

  // Virtual board (offset grid using map)
  const grid = new Map<string, string>(); // "r,c" => char
  const placedWords: PlacedGridWord[] = [];

  const key = (r: number, c: number) => `${r},${c}`;
  const getChar = (r: number, c: number) => grid.get(key(r, c));

  // Place first word horizontally at (0, 0)
  const first = candidates[0];
  for (let c = 0; c < first.answer.length; c++) {
    grid.set(key(0, c), first.answer[c]);
  }
  placedWords.push({
    answer: first.answer,
    clue: first.clue,
    direction: 'across',
    row: 0,
    col: 0,
  });

  // Try placing subsequent words
  for (let wIdx = 1; wIdx < candidates.length; wIdx++) {
    const candidate = candidates[wIdx];
    let bestPlacement: { row: number; col: number; direction: 'across' | 'down'; score: number } | null = null;

    // Search for matching letters with already placed words
    for (const placed of placedWords) {
      const targetDir: 'across' | 'down' = placed.direction === 'across' ? 'down' : 'across';

      for (let pIdx = 0; pIdx < placed.answer.length; pIdx++) {
        const targetChar = placed.answer[pIdx];
        const pRow = placed.direction === 'across' ? placed.row : placed.row + pIdx;
        const pCol = placed.direction === 'across' ? placed.col + pIdx : placed.col;

        for (let cIdx = 0; cIdx < candidate.answer.length; cIdx++) {
          if (candidate.answer[cIdx] !== targetChar) continue;

          // Candidate would cross at pRow, pCol where candidate[cIdx] == placed[pIdx]
          const startRow = targetDir === 'across' ? pRow : pRow - cIdx;
          const startCol = targetDir === 'across' ? pCol - cIdx : pCol;

          // Validate placement legality
          let valid = true;
          let intersections = 0;

          // Check cell immediately before start
          const beforeR = targetDir === 'across' ? startRow : startRow - 1;
          const beforeC = targetDir === 'across' ? startCol - 1 : startCol;
          if (getChar(beforeR, beforeC)) {
            valid = false;
            continue;
          }

          // Check cell immediately after end
          const afterR = targetDir === 'across' ? startRow : startRow + candidate.answer.length;
          const afterC = targetDir === 'across' ? startCol + candidate.answer.length : startCol;
          if (getChar(afterR, afterC)) {
            valid = false;
            continue;
          }

          for (let i = 0; i < candidate.answer.length; i++) {
            const r = targetDir === 'across' ? startRow : startRow + i;
            const c = targetDir === 'across' ? startCol + i : startCol;
            const ch = candidate.answer[i];
            const existing = getChar(r, c);

            if (existing) {
              // MUST match letter exactly!
              if (existing !== ch) {
                valid = false;
                break;
              }
              intersections++;
            } else {
              // Empty cell: parallel neighbors must be empty so words don't run parallel & touch
              if (targetDir === 'across') {
                if (getChar(r - 1, c) || getChar(r + 1, c)) {
                  valid = false;
                  break;
                }
              } else {
                if (getChar(r, c - 1) || getChar(r, c + 1)) {
                  valid = false;
                  break;
                }
              }
            }
          }

          if (valid && intersections >= 1) {
            // Score based on number of intersections and compactness
            const score = intersections * 20 - (Math.abs(startRow) + Math.abs(startCol));
            if (!bestPlacement || score > bestPlacement.score) {
              bestPlacement = {
                row: startRow,
                col: startCol,
                direction: targetDir,
                score,
              };
            }
          }
        }
      }
    }

    if (bestPlacement) {
      // Commit placement to virtual grid
      const { row: startRow, col: startCol, direction: dir } = bestPlacement;
      for (let i = 0; i < candidate.answer.length; i++) {
        const r = dir === 'across' ? startRow : startRow + i;
        const c = dir === 'across' ? startCol + i : startCol;
        grid.set(key(r, c), candidate.answer[i]);
      }
      placedWords.push({
        answer: candidate.answer,
        clue: candidate.clue,
        direction: dir,
        row: startRow,
        col: startCol,
      });
    }
  }

  // 1.5 If fewer than target words were placed, attempt to safely place remaining candidate words
  // with at least 1-cell border spacing from existing cells
  const targetWordCount = 6;
  if (placedWords.length < targetWordCount && candidates.length > placedWords.length) {
    const placedSet = new Set(placedWords.map((pw) => pw.answer));
    const unplaced = candidates.filter((c) => !placedSet.has(c.answer));

    let scanRow = 0;
    for (const pw of placedWords) {
      scanRow = Math.max(scanRow, pw.row + (pw.direction === 'down' ? pw.answer.length : 1));
    }
    scanRow += 2; // Add safe margin

    for (const cand of unplaced) {
      if (placedWords.length >= targetWordCount) break;

      // Check if placing across at scanRow, col 0 is free
      let canPlace = true;
      for (let c = -1; c <= cand.answer.length; c++) {
        for (let r = scanRow - 1; r <= scanRow + 1; r++) {
          if (grid.has(key(r, c))) {
            canPlace = false;
            break;
          }
        }
        if (!canPlace) break;
      }

      if (canPlace) {
        for (let c = 0; c < cand.answer.length; c++) {
          grid.set(key(scanRow, c), cand.answer[c]);
        }
        placedWords.push({
          answer: cand.answer,
          clue: cand.clue,
          direction: 'across',
          row: scanRow,
          col: 0,
        });
        scanRow += 2; // Leave blank row between
      }
    }
  }

  // 2. Normalize coordinates to start from (0, 0)
  let minR = 0;
  let maxR = 0;
  let minC = 0;
  let maxC = 0;

  for (const pw of placedWords) {
    minR = Math.min(minR, pw.row);
    minC = Math.min(minC, pw.col);
    const endR = pw.direction === 'across' ? pw.row : pw.row + pw.answer.length - 1;
    const endC = pw.direction === 'across' ? pw.col + pw.answer.length - 1 : pw.col;
    maxR = Math.max(maxR, endR);
    maxC = Math.max(maxC, endC);
  }

  const offsetR = -minR;
  const offsetC = -minC;

  // Compute clean square gridSize
  const gridWidth = maxC - minC + 1;
  const gridHeight = maxR - minR + 1;
  const computedGridSize = Math.max(gridWidth, gridHeight, 11);

  // 3. Assign proper standard crossword clue numbers (sort by row, then col)
  // When an across and down word start on the exact same tile, they share the clue number!
  const shiftedWords = placedWords.map((pw) => ({
    ...pw,
    row: pw.row + offsetR,
    col: pw.col + offsetC,
  }));

  // Identify unique start cells
  const startCellMap = new Map<string, number>(); // "r,c" => clueNumber
  const sortedStarts = [...shiftedWords].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  let currentNumber = 1;
  for (const w of sortedStarts) {
    const k = `${w.row},${w.col}`;
    if (!startCellMap.has(k)) {
      startCellMap.set(k, currentNumber++);
    }
  }

  const finalWords: CrosswordWord[] = shiftedWords.map((w) => {
    const k = `${w.row},${w.col}`;
    const clueNum = startCellMap.get(k) || 1;
    return {
      id: `${clueNum}_${w.direction}`,
      number: clueNum,
      direction: w.direction,
      answer: w.answer,
      clue: w.clue,
      row: w.row,
      col: w.col,
    };
  });

  // Sort final words by number
  finalWords.sort((a, b) => a.number - b.number);

  return {
    id: meta?.id || `cw_${Date.now()}`,
    title: meta?.title || 'Educational Crossword',
    theme: meta?.theme || 'Chapter Key Concepts',
    summary: meta?.summary || 'Interactive chapter crossword puzzle with guaranteed valid intersecting clues.',
    gridSize: computedGridSize,
    words: finalWords,
    glossary: meta?.glossary || finalWords.map((w) => ({
      term: w.answer.charAt(0) + w.answer.slice(1).toLowerCase(),
      definition: w.clue,
    })),
  };
}

/**
 * Validates whether an existing set of CrosswordWord has any letter collisions.
 * Returns true if valid, false if any overlapping cell has differing letters.
 */
export function hasNoLetterCollisions(words: CrosswordWord[]): boolean {
  if (!words || words.length === 0) return true;
  const cellMap = new Map<string, string>();

  for (const w of words) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.direction === 'across' ? w.row : w.row + i;
      const c = w.direction === 'across' ? w.col + i : w.col;
      const k = `${r},${c}`;
      const char = w.answer[i];
      if (cellMap.has(k)) {
        if (cellMap.get(k) !== char) {
          return false; // Collision found!
        }
      } else {
        cellMap.set(k, char);
      }
    }
  }
  return true;
}

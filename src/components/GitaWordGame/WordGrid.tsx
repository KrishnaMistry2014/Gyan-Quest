import React from 'react';

interface WordGridProps {
  guesses: string[];
  currentGuess: string;
  targetWord: string;
  maxAttempts: number;
  wordLength?: number;
}

export type TileStatus = 'correct' | 'present' | 'absent' | 'empty' | 'typing';

export function getLetterStatuses(guess: string, target: string): TileStatus[] {
  const result: TileStatus[] = Array(5).fill('absent');
  const targetChars = target.split('');
  const guessChars = guess.split('');

  // First pass: mark correct letters
  guessChars.forEach((char, idx) => {
    if (char === targetChars[idx]) {
      result[idx] = 'correct';
      targetChars[idx] = ''; // consumed
    }
  });

  // Second pass: mark present letters
  guessChars.forEach((char, idx) => {
    if (result[idx] !== 'correct' && targetChars.includes(char)) {
      result[idx] = 'present';
      targetChars[targetChars.indexOf(char)] = ''; // consume one instance
    }
  });

  return result;
}

export const WordGrid: React.FC<WordGridProps> = ({
  guesses,
  currentGuess,
  targetWord,
  maxAttempts,
  wordLength = 5,
}) => {
  const rows = Array.from({ length: maxAttempts });

  return (
    <div className="flex flex-col items-center justify-center gap-2 mb-6">
      {rows.map((_, rowIndex) => {
        const isCurrentRow = rowIndex === guesses.length;
        const isPastRow = rowIndex < guesses.length;
        const rowWord = isPastRow
          ? guesses[rowIndex]
          : isCurrentRow
          ? currentGuess
          : '';

        const tileStatuses: TileStatus[] = isPastRow
          ? getLetterStatuses(rowWord, targetWord)
          : Array(wordLength).fill(rowWord ? 'typing' : 'empty');

        return (
          <div key={rowIndex} className="flex gap-2">
            {Array.from({ length: wordLength }).map((_, colIndex) => {
              const letter = rowWord[colIndex] || '';
              const status = isPastRow ? tileStatuses[colIndex] : letter ? 'typing' : 'empty';

              let tileStyle =
                'border-2 border-[#D8C7B0] dark:border-[#3E342B] bg-[#FFFDF8] dark:bg-[#1E1914] text-[#1C1917] dark:text-[#F8EFEA]';

              if (status === 'typing') {
                tileStyle =
                  'border-2 border-[#B45309] dark:border-[#F59E0B] bg-[#FFFDF8] dark:bg-[#251F19] text-[#1C1917] dark:text-[#F8EFEA] scale-105 shadow-xs';
              } else if (status === 'correct') {
                tileStyle = 'border-2 border-[#15803D] dark:border-[#166534] bg-[#15803D] text-white shadow-xs';
              } else if (status === 'present') {
                tileStyle = 'border-2 border-[#D97706] dark:border-[#B45309] bg-[#D97706] text-white shadow-xs';
              } else if (status === 'absent') {
                tileStyle =
                  'border-2 border-[#78716C] dark:border-[#44403C] bg-[#78716C] dark:bg-[#38332E] text-white';
              }

              return (
                <div
                  key={colIndex}
                  className={`w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center font-serif-heading font-bold text-xl sm:text-2xl rounded-xl transition-all duration-200 select-none ${tileStyle} ${
                    letter && isCurrentRow ? 'scale-105' : ''
                  }`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { Delete } from 'lucide-react';

interface VirtualKeyboardProps {
  onChar: (char: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  guesses: string[];
  targetWord: string;
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onChar,
  onEnter,
  onBackspace,
  guesses,
  targetWord,
  disabled = false,
}) => {
  // Compute key statuses
  const keyStatuses: Record<string, 'correct' | 'present' | 'absent'> = {};
  guesses.forEach((guess) => {
    guess.split('').forEach((char, idx) => {
      if (targetWord[idx] === char) {
        keyStatuses[char] = 'correct';
      } else if (targetWord.includes(char) && keyStatuses[char] !== 'correct') {
        keyStatuses[char] = 'present';
      } else if (!targetWord.includes(char)) {
        if (!keyStatuses[char]) {
          keyStatuses[char] = 'absent';
        }
      }
    });
  });

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-1.5 sm:gap-2 px-1">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1 sm:gap-1.5 w-full">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
            const status = keyStatuses[key];

            let buttonClass = 'bg-[#EDE4D5] text-[#29221C] border-[#D6CBB8] hover:bg-[#E3D9C7] active:bg-[#D8CCB7]';
            if (status === 'correct') {
              buttonClass = 'bg-[#15803D] text-white border-[#15803D] hover:bg-[#166534]';
            } else if (status === 'present') {
              buttonClass = 'bg-[#D97706] text-white border-[#D97706] hover:bg-[#B45309]';
            } else if (status === 'absent') {
              buttonClass = 'bg-[#A8A29E] text-white border-[#A8A29E] opacity-75';
            }

            const handleClick = () => {
              if (disabled) return;
              if (key === 'ENTER') onEnter();
              else if (key === 'BACKSPACE') onBackspace();
              else onChar(key);
            };

            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={handleClick}
                aria-label={key === 'BACKSPACE' ? 'Backspace' : key === 'ENTER' ? 'Submit' : key}
                className={`h-11 sm:h-12 border font-semibold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center select-none shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSpecial
                    ? 'px-2 sm:px-3 min-w-[48px] sm:min-w-[64px] bg-[#E2D4BF] text-[#451A03]'
                    : 'w-8 sm:w-10 min-w-[30px] sm:min-w-[38px]'
                } ${buttonClass}`}
              >
                {key === 'BACKSPACE' ? (
                  <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : key === 'ENTER' ? (
                  <span className="flex items-center gap-1 text-[10px] sm:text-xs tracking-wider">
                    SUBMIT
                  </span>
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

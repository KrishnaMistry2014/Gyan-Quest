import React from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

interface ProgressBarProps {
  currentIndex: number;
  totalWords: number;
  attemptsUsed: number;
  maxAttempts: number;
  chapter: number;
  verse: string;
  chapterName: string;
  score: number;
  onReset: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentIndex,
  totalWords,
  attemptsUsed,
  maxAttempts,
  chapter,
  verse,
  chapterName,
  score,
  onReset,
}) => {
  const percentComplete = Math.min(100, Math.round(((currentIndex) / totalWords) * 100));
  const remainingAttempts = Math.max(0, maxAttempts - attemptsUsed);

  return (
    <div className="w-full mb-6">
      {/* Top Tracker Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-serif-heading text-xs sm:text-sm font-bold text-[#B45309] tracking-wider uppercase">
            Chapter/Verse Quest: Word {currentIndex + 1} of {totalWords}
          </span>
          <span className="text-[#A8A29E] hidden sm:inline">•</span>
          <span className="text-xs text-[#78350F] font-medium hidden sm:inline">
            Ch {chapter}:{verse} ({chapterName})
          </span>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Score: <strong className="tabular-nums font-mono">{score}</strong> pts</span>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[#78716C] hover:text-[#C2410C] transition-colors py-1 px-2 rounded hover:bg-[#F5EEDF] cursor-pointer"
            title="Reset Quest to Word 1"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="text-[11px]">Restart</span>
          </button>
        </div>
      </div>

      {/* Vedic Progress Bar */}
      <div className="w-full bg-[#EFE7DA] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#E7DECF]">
        <div
          className="h-full bg-gradient-to-r from-[#EA580C] via-[#D97706] to-[#F59E0B] rounded-full transition-all duration-500 ease-out shadow-xs"
          style={{ width: `${Math.max(5, percentComplete)}%` }}
        />
      </div>

      {/* Attempts Remaining Indicator */}
      <div className="flex items-center justify-between mt-2 text-xs text-[#78350F]">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">Chances Remaining:</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxAttempts }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < remainingAttempts
                    ? 'bg-[#EA580C] ring-2 ring-[#FFEDD5]'
                    : 'bg-[#D6D3D1]'
                }`}
                title={`Attempt ${i + 1}`}
              />
            ))}
          </div>
          <span className="font-bold tabular-nums ml-1">({remainingAttempts}/{maxAttempts})</span>
        </div>
        <div className="text-[11px] text-[#A8A29E] font-medium">
          Auto-saved to localStorage
        </div>
      </div>
    </div>
  );
};

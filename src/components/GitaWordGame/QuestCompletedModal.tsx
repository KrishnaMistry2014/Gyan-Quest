import React from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { GITA_WORDS } from '../../data/gitaQuestData';

interface QuestCompletedModalProps {
  isOpen: boolean;
  score: number;
  wordsSolvedCount: number;
  totalWords: number;
  onRestart: () => void;
  imageLotus: string;
}

export const QuestCompletedModal: React.FC<QuestCompletedModalProps> = ({
  isOpen,
  score,
  wordsSolvedCount,
  totalWords,
  onRestart,
  imageLotus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-xl max-h-[90vh] bg-[#FFFDF9] border border-[#E7DECF] rounded-3xl shadow-2xl p-6 sm:p-8 text-center text-[#29221C] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lotus Icon / Sacred Asset */}
        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-md">
          <img
            src={imageLotus}
            alt="Sacred Lotus"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] text-xs font-bold text-[#92400E] border border-[#FDE68A] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
          <span>Brahmavidya Quest Completed</span>
        </div>

        <h2 className="font-serif-heading text-2xl sm:text-3xl font-extrabold text-[#C2410C] mb-2">
          Shubham! Quest Mastered!
        </h2>

        <p className="font-serif text-base sm:text-lg text-[#574D43] italic mb-6 max-w-md mx-auto">
          You have journeyed through the timeless teachings of the Bhagavad Gita, sharpening your mind with discipline, duty, and discernment.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 bg-[#FAF5ED] p-4 rounded-2xl border border-[#EBE2D4] mb-6">
          <div>
            <span className="text-xs text-[#78716C] font-semibold block">Total Words</span>
            <span className="font-serif-heading text-xl sm:text-2xl font-bold text-[#C2410C] tabular-nums font-mono">
              {totalWords}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#78716C] font-semibold block">Solved</span>
            <span className="font-serif-heading text-xl sm:text-2xl font-bold text-[#15803D] tabular-nums font-mono">
              {wordsSolvedCount}
            </span>
          </div>
          <div>
            <span className="text-xs text-[#78716C] font-semibold block">Total Score</span>
            <span className="font-serif-heading text-xl sm:text-2xl font-bold text-[#B45309] tabular-nums font-mono">
              {score}
            </span>
          </div>
        </div>

        {/* Word Mastery List */}
        <div className="text-left mb-6">
          <span className="text-xs font-bold text-[#78350F] uppercase tracking-wider block mb-2">
            Verses & Words in your Journey:
          </span>
          <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-[#FFFDF8] rounded-xl border border-[#E7DECF] text-xs">
            {GITA_WORDS.map((w, idx) => (
              <div key={w.id} className="flex items-center justify-between py-1 px-2 border-b border-[#FAF5ED] last:border-0">
                <span className="font-bold text-[#9A3412] font-serif-heading">
                  {idx + 1}. {w.word}
                </span>
                <span className="text-[#78716C]">Ch {w.verse} • {w.chapterName.split('(')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#EA580C] to-[#C2410C] hover:from-[#C2410C] hover:to-[#9A3412] shadow-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Play Again from Start</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { GitaWordItem } from '../../data/gitaQuestData';

interface ResultBannerProps {
  item: GitaWordItem;
  isWon: boolean;
  attemptsUsed: number;
  onNextWord: () => void;
  isLastWord: boolean;
}

export const ResultBanner: React.FC<ResultBannerProps> = ({
  item,
  isWon,
  attemptsUsed,
  onNextWord,
  isLastWord,
}) => {
  return (
    <div
      className={`w-full rounded-2xl p-5 sm:p-6 border shadow-md animate-in fade-in mt-6 transition-all ${
        isWon
          ? 'bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] border-[#86EFAC]'
          : 'bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7] border-[#FDE68A]'
      }`}
    >
      {/* Banner Title */}
      <div className="flex items-center gap-2.5 mb-3">
        {isWon ? (
          <>
            <CheckCircle2 className="w-6 h-6 text-[#15803D] shrink-0" />
            <div>
              <h3 className="font-serif-heading text-lg sm:text-xl font-bold text-[#14532D]">
                Shubham! Wisdom Unlocked!
              </h3>
              <p className="text-xs text-[#166534]">
                Mastered in {attemptsUsed} {attemptsUsed === 1 ? 'attempt' : 'attempts'} • Chapter {item.chapter}:{item.verse}
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-6 h-6 text-[#B45309] shrink-0" />
            <div>
              <h3 className="font-serif-heading text-lg sm:text-xl font-bold text-[#78350F]">
                The Sacred Word is Revealed
              </h3>
              <p className="text-xs text-[#92400E]">
                All 6 attempts explored • Learn the lesson and proceed
              </p>
            </div>
          </>
        )}
      </div>

      {/* Target Word Callout */}
      <div className="bg-white/80 rounded-xl p-4 border border-[#E5E7EB] mb-4 text-center">
        <span className="text-xs uppercase tracking-widest text-[#78350F] font-semibold">
          Target 5-Letter Word:
        </span>
        <div className="font-serif-heading text-2xl sm:text-3xl font-extrabold text-[#C2410C] tracking-widest my-1">
          {item.word}
        </div>
        <p className="text-xs text-[#574D43] italic">
          {item.wordMeaning}
        </p>
      </div>

      {/* Verse Translation & Shloka */}
      <div className="bg-[#FAF5ED] rounded-xl p-4 border border-[#E7DECF] mb-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#B45309] mb-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Verse {item.verse} ({item.chapterName}):</span>
        </div>
        <p className="font-serif italic text-base sm:text-lg text-[#2C2117] font-semibold leading-relaxed mb-2">
          "{item.translation}"
        </p>
        <div className="text-xs text-[#78350F] font-mono whitespace-pre-line bg-[#FFFDF9] p-2 rounded border border-[#F3E8D2]">
          {item.sanskritShloka}
        </div>
      </div>

      {/* Student Life Takeaway */}
      <div className="bg-white/90 rounded-xl p-4 border border-[#E5E7EB] mb-5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#9A3412] mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
          <span>Student Wisdom & Success Takeaway:</span>
        </div>
        <p className="text-xs sm:text-sm text-[#451A03] leading-relaxed">
          {item.studentWisdom}
        </p>
      </div>

      {/* The Next Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNextWord}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#EA580C] to-[#C2410C] hover:from-[#C2410C] hover:to-[#9A3412] shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          <span>{isLastWord ? 'View Final Quest Summary' : 'Proceed to Next Word'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

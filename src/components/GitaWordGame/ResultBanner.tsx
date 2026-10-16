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
          ? 'bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7] dark:from-[#052E16]/70 dark:to-[#064E3B]/60 border-[#86EFAC] dark:border-[#047857]'
          : 'bg-gradient-to-b from-[#FFFBEB] to-[#FEF3C7] dark:from-[#451A03]/60 dark:to-[#291404]/70 border-[#FDE68A] dark:border-[#B45309]'
      }`}
    >
      {/* Banner Title */}
      <div className="flex items-center gap-2.5 mb-3">
        {isWon ? (
          <>
            <CheckCircle2 className="w-6 h-6 text-[#15803D] dark:text-[#4ADE80] shrink-0" />
            <div>
              <h3 className="font-serif-heading text-lg sm:text-xl font-bold text-[#14532D] dark:text-[#86EFAC]">
                Shubham! Wisdom Unlocked!
              </h3>
              <p className="text-xs text-[#166534] dark:text-[#A7F3D0]">
                Mastered in {attemptsUsed} {attemptsUsed === 1 ? 'attempt' : 'attempts'} • Chapter {item.chapter}:{item.verse}
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-6 h-6 text-[#B45309] dark:text-[#FBBF24] shrink-0" />
            <div>
              <h3 className="font-serif-heading text-lg sm:text-xl font-bold text-[#78350F] dark:text-[#FDE68A]">
                The Sacred Word is Revealed
              </h3>
              <p className="text-xs text-[#92400E] dark:text-[#FCD34D]">
                All 6 attempts explored • Learn the lesson and proceed
              </p>
            </div>
          </>
        )}
      </div>

      {/* Target Word Callout */}
      <div
        className="rounded-xl p-4 border mb-4 text-center"
        style={{
          backgroundColor: 'var(--bg-main)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--accent-saffron-text)' }}>
          Target 5-Letter Word:
        </span>
        <div className="font-serif-heading text-2xl sm:text-3xl font-extrabold tracking-widest my-1" style={{ color: 'var(--accent-saffron-bright)' }}>
          {item.word}
        </div>
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          {item.wordMeaning}
        </p>
      </div>

      {/* Verse Translation & Shloka */}
      <div
        className="rounded-xl p-4 border mb-4"
        style={{
          backgroundColor: 'var(--bg-card-subtle)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-bold mb-1" style={{ color: 'var(--accent-saffron-bright)' }}>
          <BookOpen className="w-3.5 h-3.5" />
          <span>Verse {item.verse} ({item.chapterName}):</span>
        </div>
        <p className="font-serif italic text-base sm:text-lg font-semibold leading-relaxed mb-2" style={{ color: 'var(--text-primary)' }}>
          "{item.translation}"
        </p>
        <div
          className="text-xs font-mono whitespace-pre-line p-2 rounded border"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--border-warm)',
            color: 'var(--accent-saffron-text)',
            fontFamily: "'Noto Serif Devanagari', 'Rozha One', serif",
          }}
        >
          {item.sanskritShloka}
        </div>
      </div>

      {/* Student Life Takeaway */}
      <div
        className="rounded-xl p-4 border mb-5"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-bold mb-1.5" style={{ color: 'var(--accent-saffron-bright)' }}>
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Student Wisdom & Success Takeaway:</span>
        </div>
        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {item.studentWisdom}
        </p>
      </div>

      {/* The Next Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNextWord}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          style={{
            backgroundColor: 'var(--accent-saffron)',
          }}
        >
          <span>{isLastWord ? 'Complete Quest' : 'Next Sacred Word'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Lightbulb, BookMarked, Sparkles } from 'lucide-react';
import { GitaWordItem } from '../../data/gitaQuestData';

interface VerseClueCardProps {
  item: GitaWordItem;
  imageHero: string;
}

export const VerseClueCard: React.FC<VerseClueCardProps> = ({ item, imageHero }) => {
  const [showHint, setShowHint] = useState(false);
  const [showSanskrit, setShowSanskrit] = useState(false);

  // Split sentence at '_____'
  const parts = item.sentence.split('_____');

  return (
    <div className="w-full bg-[#FFFDF9] border border-[#E7DECF] rounded-2xl p-5 sm:p-6 shadow-xs mb-6 relative overflow-hidden">
      {/* Subtle Vedic watermark motif */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-15 pointer-events-none">
        <img
          src={imageHero}
          alt="Sacred art motif"
          className="w-full h-full object-cover rounded-bl-full"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Header Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#B45309]">
          <BookMarked className="w-4 h-4 text-[#EA580C]" />
          <span>Chapter {item.chapter} • Verse {item.verse}</span>
          <span className="text-[#D6D3D1]">|</span>
          <span className="text-[#78350F] italic">{item.chapterName}</span>
        </div>

        <div className="flex items-center gap-2 z-10">
          <button
            type="button"
            onClick={() => setShowSanskrit(!showSanskrit)}
            className="text-[11px] font-medium text-[#78350F] hover:text-[#C2410C] hover:underline transition-colors cursor-pointer"
          >
            {showSanskrit ? 'Hide Sanskrit' : 'View Shloka'}
          </button>
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A] transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3 h-3 text-[#D97706]" />
            <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
          </button>
        </div>
      </div>

      {/* The Central Clue Sentence */}
      <div className="bg-[#FAF5ED] rounded-xl p-4 sm:p-5 border border-[#EBE2D4] my-2 text-center">
        <p className="font-serif italic text-xl sm:text-2xl font-semibold leading-relaxed text-[#2C2117]">
          {parts[0]}
          <span className="inline-block px-3 py-0.5 mx-1.5 border-b-2 border-[#EA580C] bg-[#FFEDD5] text-[#C2410C] font-serif-heading font-bold tracking-widest text-lg sm:text-xl rounded-t">
            _ _ _ _ _
          </span>
          {parts[1] || ''}
        </p>
      </div>

      {/* Optional Sanskrit Shloka Expansion */}
      {showSanskrit && (
        <div className="mt-3 p-3 bg-[#FDF8EE] rounded-lg border border-[#F3E8D2] text-center animate-in fade-in">
          <div className="text-sm sm:text-base font-serif font-bold text-[#78350F] whitespace-pre-line leading-relaxed">
            {item.sanskritShloka}
          </div>
          <p className="text-xs text-[#574D43] mt-1.5 italic">
            "{item.translation}"
          </p>
        </div>
      )}

      {/* Optional Hint Expansion */}
      {showHint && (
        <div className="mt-3 p-3 bg-[#FFFBEB] rounded-lg border border-[#FDE68A] flex items-start gap-2.5 text-xs text-[#92400E] animate-in fade-in">
          <Sparkles className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Clue Insight: </span>
            {item.hint}
          </div>
        </div>
      )}
    </div>
  );
};

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
    <div
      className="w-full rounded-2xl p-5 sm:p-6 shadow-xs mb-6 relative overflow-hidden border transition-colors"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-warm)',
      }}
    >
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
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--accent-saffron-bright)' }}>
          <BookMarked className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Chapter {item.chapter} • Verse {item.verse}</span>
          <span style={{ color: 'var(--border-warm)' }}>|</span>
          <span className="italic" style={{ color: 'var(--accent-saffron-text)' }}>{item.chapterName}</span>
        </div>

        <div className="flex items-center gap-2 z-10">
          <button
            type="button"
            onClick={() => setShowSanskrit(!showSanskrit)}
            className="text-[11px] font-medium hover:underline transition-colors cursor-pointer"
            style={{ color: 'var(--accent-saffron-text)' }}
          >
            {showSanskrit ? 'Hide Sanskrit' : 'View Shloka'}
          </button>
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer border"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--border-warm)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
          </button>
        </div>
      </div>

      {/* The Central Clue Sentence */}
      <div
        className="rounded-xl p-4 sm:p-5 border my-2 text-center"
        style={{
          backgroundColor: 'var(--bg-main)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <p className="font-serif italic text-xl sm:text-2xl font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {parts[0]}
          <span
            className="inline-block px-3 py-0.5 mx-1.5 border-b-2 font-serif-heading font-bold tracking-widest text-lg sm:text-xl rounded-t"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--accent-saffron)',
              color: 'var(--accent-saffron-bright)',
            }}
          >
            _ _ _ _ _
          </span>
          {parts[1] || ''}
        </p>
      </div>

      {/* Optional Sanskrit Shloka Expansion */}
      {showSanskrit && (
        <div
          className="mt-3 p-3 rounded-lg border text-center animate-in fade-in"
          style={{
            backgroundColor: 'var(--bg-card-subtle)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div
            className="text-base sm:text-lg font-serif font-bold whitespace-pre-line leading-relaxed"
            style={{
              fontFamily: "'Noto Serif Devanagari', 'Rozha One', serif",
              color: 'var(--accent-saffron-text)',
            }}
          >
            {item.sanskritShloka}
          </div>
          <p className="text-xs mt-1.5 italic" style={{ color: 'var(--text-muted)' }}>
            "{item.translation}"
          </p>
        </div>
      )}

      {/* Optional Hint Expansion */}
      {showHint && (
        <div
          className="mt-3 p-3 rounded-lg border flex items-start gap-2.5 text-xs animate-in fade-in"
          style={{
            backgroundColor: 'var(--accent-saffron-light)',
            borderColor: 'var(--accent-saffron)',
            color: 'var(--accent-saffron-text)',
          }}
        >
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Clue Insight: </span>
            {item.hint}
          </div>
        </div>
      )}
    </div>
  );
};

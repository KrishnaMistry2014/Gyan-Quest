import React, { useState } from 'react';
import {
  Scroll,
  BookOpen,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  BookMarked,
  Layers,
  MessageSquare,
  Gamepad2,
  Puzzle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface BhagavadGitaViewProps {
  onOpenGuruChatWithPrompt?: (prompt: string) => void;
  onNavigateHome?: () => void;
  onNavigateMyBooks?: () => void;
  onStartGitaGame?: () => void;
  onNavigateReader?: () => void;
  onStartHarmonyPuzzle?: () => void;
}

interface GitaChapterPreview {
  number: number;
  sanskritName: string;
  englishTitle: string;
  theme: 'Karma' | 'Bhakti' | 'Jnana';
  versesCount: number;
  summary: string;
}

const GITA_CHAPTERS: GitaChapterPreview[] = [
  {
    number: 6,
    sanskritName: 'Dhyana Yoga',
    englishTitle: 'The Yoga of Meditation',
    theme: 'Jnana',
    versesCount: 47,
    summary: 'Mastery of the wandering mind through single-pointed focus, equanimity, self-restraint, and regular contemplative practice.',
  },
];

export const BhagavadGitaView: React.FC<BhagavadGitaViewProps> = ({
  onOpenGuruChatWithPrompt,
  onNavigateHome,
  onNavigateMyBooks,
  onStartGitaGame,
  onNavigateReader,
  onStartHarmonyPuzzle,
}) => {
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [selectedChapter, setSelectedChapter] = useState<GitaChapterPreview | null>(GITA_CHAPTERS[0]);

  const handleLearnClick = () => {
    if (!user) {
      showToast({
        title: 'Sign In Required',
        message: 'Please sign in to access the Bhagavad Gita Chapter 6 lesson and Play Quest.',
        type: 'info',
      });
      openAuthModal();
    } else {
      if (onNavigateReader) {
        onNavigateReader();
      } else {
        onStartGitaGame?.();
      }
    }
  };

  return (
    <div id="bhagavad-gita-view" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div
        className="rounded-3xl border p-6 sm:p-10 relative overflow-hidden shadow-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <Scroll className="w-3.5 h-3.5" />
            <span>Sacred Classical Course Module • Preview</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            Learn Bhagavad Gita
          </h1>

          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The Bhagavad Gita is a 700-verse dialogue between Arjuna and Krishna on the battlefield of Kurukshetra. It forms the ultimate philosophical guide on duty, moral clarity, emotion mastery, and selfless action in the face of life’s deepest dilemmas.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onOpenGuruChatWithPrompt && (
              <button
                type="button"
                onClick={() => onOpenGuruChatWithPrompt('Teach me the core concepts of Bhagavad Gita Chapter 6 Dhyana Yoga with practical student examples.')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask Guru AI about Chapter 6</span>
              </button>
            )}

            {onNavigateMyBooks && (
              <button
                type="button"
                onClick={onNavigateMyBooks}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all hover:opacity-90 active:scale-98 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore My Books</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapters Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Chapter Explorer
            </h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              Interactive Dhyana Yoga study with shloka breakdown, wisdom reflections, and Word Quest gameplay.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {GITA_CHAPTERS.map((ch) => {
            const isSelected = selectedChapter?.number === ch.number;
            return (
              <div
                key={ch.number}
                onClick={() => setSelectedChapter(ch)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected ? 'ring-2 ring-amber-500 shadow-sm' : 'hover:opacity-95'
                }`}
                style={{
                  backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-card-subtle)',
                  borderColor: isSelected ? 'var(--accent-saffron)' : 'var(--border-warm)',
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span
                      className="px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: 'var(--accent-saffron-light)',
                        color: 'var(--accent-saffron-text)',
                      }}
                    >
                      Chapter {ch.number}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {ch.versesCount} Verses • {ch.theme}
                    </span>
                  </div>

                  <h3 className="font-bold text-base leading-snug font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                    {ch.sanskritName}
                  </h3>
                  <div className="text-xs font-medium" style={{ color: 'var(--accent-saffron-bright)' }}>
                    {ch.englishTitle}
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--text-muted)' }}>
                    {ch.summary}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: 'var(--border-warm)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Status:{' '}
                    {ch.number === 6 ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Game Ready</span>
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">Curating</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedChapter(ch);
                      if (ch.number === 6) {
                        handleLearnClick();
                      }
                    }}
                    className="flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    style={{ color: 'var(--accent-saffron-text)' }}
                  >
                    <span>{ch.number === 6 ? 'Play Quest' : 'Details'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Chapter Deep Dive */}
      {selectedChapter && (
        <div
          className="p-6 rounded-3xl border space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <BookMarked className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                Chapter {selectedChapter.number}: {selectedChapter.sanskritName}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {selectedChapter.englishTitle} • {selectedChapter.versesCount} Verses
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {selectedChapter.summary}
          </p>

          <div
            className="p-4 rounded-2xl border text-xs leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div>
              <span className="font-bold block" style={{ color: 'var(--text-primary)' }}>
                Would you like Guru AI to teach you this chapter?
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                You can ask questions regarding Sanskrit terms, practical moral applications, or philosophical inquiries.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
              {onOpenGuruChatWithPrompt && (
                <button
                  type="button"
                  id="btn-ask-guru-ai"
                  onClick={() => onOpenGuruChatWithPrompt(`Teach me the key concepts of Bhagavad Gita Chapter ${selectedChapter.number} (${selectedChapter.sanskritName}) with real-life student examples.`)}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-102 active:scale-98 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-saffron)',
                    color: '#FFFFFF',
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask Guru AI</span>
                </button>
              )}

              {/* In CH-6 under / alongside Ask Guru AI: Option of Learn */}
              {selectedChapter.number === 6 && (
                <button
                  type="button"
                  id="btn-learn-ch6-game"
                  onClick={handleLearnClick}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-xs"
                  style={{
                    backgroundColor: 'var(--accent-saffron-light)',
                    borderColor: 'var(--accent-saffron)',
                    color: 'var(--accent-saffron-text)',
                  }}
                  title="Learn Dhyana Yoga through the Interactive Word Quest Game"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>Learn</span>
                </button>
              )}
            </div>
          </div>

          {/* Dedicated Chapter 6 Interactive Game Showcase Banner */}
          {selectedChapter.number === 6 && (
            <div
              className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--accent-saffron)',
              }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-300">
                    Interactive Word Quest Game • Chapter 6 Verse 6.17
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Practice moderation, sleep habits, and mental discipline from Dhyana Yoga. Guess the 5-letter sacred keywords (YUKTA, DHYAN, SLEEP, HABIT, FOCUS) in 6 attempts!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {onStartHarmonyPuzzle && (
                  <button
                    type="button"
                    id="btn-start-jigsaw-ch6"
                    onClick={onStartHarmonyPuzzle}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-2xs"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--accent-saffron)',
                      color: 'var(--accent-saffron-text)',
                    }}
                  >
                    <Puzzle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Harmony Jigsaw</span>
                  </button>
                )}

                <button
                  type="button"
                  id="btn-start-game-ch6-banner"
                  onClick={handleLearnClick}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer text-white"
                  style={{
                    backgroundColor: 'var(--accent-saffron)',
                  }}
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Start Word Quest</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

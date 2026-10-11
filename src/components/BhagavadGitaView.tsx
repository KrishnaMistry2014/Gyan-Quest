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
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BhagavadGitaViewProps {
  onOpenGuruChatWithPrompt?: (prompt: string) => void;
  onNavigateHome?: () => void;
  onNavigateMyBooks?: () => void;
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
    number: 1,
    sanskritName: 'Arjuna Vishada Yoga',
    englishTitle: 'The Yoga of Despondency',
    theme: 'Karma',
    versesCount: 47,
    summary: 'Arjuna beholds friends, teachers, and kin on the sacred field of Kurukshetra and experiences moral crisis and overwhelming doubt.',
  },
  {
    number: 2,
    sanskritName: 'Sankhya Yoga',
    englishTitle: 'The Yoga of Analytic Knowledge',
    theme: 'Jnana',
    versesCount: 72,
    summary: 'Lord Krishna reveals the eternal, indestructible nature of the soul (Atman) and introduces Karma Yoga: selfless action without attachment to fruits.',
  },
  {
    number: 3,
    sanskritName: 'Karma Yoga',
    englishTitle: 'The Yoga of Action',
    theme: 'Karma',
    versesCount: 43,
    summary: 'The science of work as sacrifice (Yajna). Performing ordained duties for the welfare of the world (Lokasamgraha) without selfish desire.',
  },
  {
    number: 4,
    sanskritName: 'Jnana Karma Sannyasa Yoga',
    englishTitle: 'The Yoga of Knowledge & Renunciation',
    theme: 'Jnana',
    versesCount: 42,
    summary: 'The ancient lineage of wisdom, the divine descent of Avatars to restore Dharma, and how the fire of true knowledge burns all karmic bondage.',
  },
  {
    number: 5,
    sanskritName: 'Karma Sannyasa Yoga',
    englishTitle: 'The Yoga of Renunciation of Action',
    theme: 'Karma',
    versesCount: 29,
    summary: 'Reconciling renunciation with active duty. The enlightened sage sees divine presence in all beings and remains tranquil in success or adversity.',
  },
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
}) => {
  const { user } = useAuth();
  const [selectedChapter, setSelectedChapter] = useState<GitaChapterPreview | null>(GITA_CHAPTERS[1]);

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

          {/* Key Verse Highlight */}
          <div
            className="p-5 rounded-2xl border space-y-2 mt-4"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--accent-saffron)' }}>
              Featured Shloka • Chapter 2, Verse 47
            </span>
            <p className="font-serif italic text-base sm:text-lg leading-relaxed font-semibold" style={{ color: 'var(--text-primary)' }}>
              "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥"
            </p>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              "You have a right only to perform your prescribed duty, but never to claim its fruits. Never let the fruits of action be your motive, nor let your attachment be to inaction."
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onOpenGuruChatWithPrompt && (
              <button
                type="button"
                onClick={() => onOpenGuruChatWithPrompt('Explain the core teaching of Bhagavad Gita Chapter 2 Verse 47 for students.')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Discuss Verse with Guru AI</span>
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

      {/* Chapters Preview Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Curated Chapter Explorer
            </h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              Comprehensive 18-chapter interactive syllabus currently being compiled with shloka audio & word breakdowns.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    Status: <span className="text-amber-600 dark:text-amber-400">Curating</span>
                  </span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--accent-saffron-text)' }}>
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
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
            className="p-4 rounded-2xl border text-xs leading-relaxed flex items-center justify-between gap-4"
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

            {onOpenGuruChatWithPrompt && (
              <button
                type="button"
                onClick={() => onOpenGuruChatWithPrompt(`Teach me the key concepts of Bhagavad Gita Chapter ${selectedChapter.number} (${selectedChapter.sanskritName}) with real-life student examples.`)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-102 active:scale-98 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Guru AI</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

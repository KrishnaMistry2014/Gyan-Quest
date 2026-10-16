import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Scroll,
  MessageSquare,
  CheckCircle2,
  BookMarked,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface RamayanaViewProps {
  onOpenGuruChatWithPrompt?: (prompt: string) => void;
  onNavigateHome?: () => void;
  onNavigateMyBooks?: () => void;
}

interface RamayanaChapter {
  number: number;
  title: string;
  subtitle: string;
  summary: string;
  moral: string;
}

const RAMAYANA_CHAPTERS: RamayanaChapter[] = [
  {
    number: 1,
    title: 'The Birth of Lord Rama',
    subtitle: 'Ayodhya & The Four Princes',
    summary: 'King Dasharatha of Ayodhya was blessed with four noble sons: Rama, Bharata, Lakshmana, and Shatrughna. Rama grew up exemplifying truth, courage, and respect.',
    moral: 'Discipline, good conduct, and character are the foundations of true leadership.'
  },
  {
    number: 2,
    title: 'Rama Meets Sita',
    subtitle: 'Swayamvara & Shiva’s Bow',
    summary: 'Accompanied by Sage Vishwamitra to protect sacred rituals, Rama and Lakshmana traveled to Mithila, where Rama won the hand of Sita by gracefully stringing the mighty bow of Lord Shiva.',
    moral: 'Steadfast focus, humility, and inner strength overcome the greatest challenges.'
  },
  {
    number: 3,
    title: 'Rama’s Exile',
    subtitle: 'Sacrificing for Truth & Father’s Honor',
    summary: 'Bound by King Dasharatha’s past promises, Rama joyfully embraced fourteen years of forest exile accompanied by devoted Sita and loyal Lakshmana.',
    moral: 'Honoring commitments and protecting parental and moral duty above personal comfort.'
  },
  {
    number: 4,
    title: 'Life in the Forest',
    subtitle: 'Panchavati & The Abduction',
    summary: 'Living simply in Panchavati, the trio served sages and protected the forest. Driven by pride and deceitful traps, Ravana abducted Sita to Lanka.',
    moral: 'Unchecked ego and desire lead to downfall, while noble souls remain pure in adversity.'
  },
  {
    number: 5,
    title: 'Rama Meets Hanuman',
    subtitle: 'Alliance with Sugriva & The Vanaras',
    summary: 'Searching for Sita, Rama met Hanuman, the embodiment of wisdom and devotion, forming a sacred alliance with Sugriva to unite the forest forces.',
    moral: 'True strength is magnified through selfless devotion, humility, and loyal partnership.'
  },
  {
    number: 6,
    title: 'Hanuman Finds Sita in Lanka',
    subtitle: 'Ashoka Vatika & Message of Hope',
    summary: 'Hanuman leapt across the ocean to Lanka, delivered Rama’s ring to Sita in Ashoka Vatika, and reassured her of their impending rescue.',
    moral: 'Courage, faith, and resourcefulness overcome impossible obstacles.'
  },
  {
    number: 7,
    title: 'The Bridge to Lanka',
    subtitle: 'Rama Setu & The Vanara Army',
    summary: 'The vanara army engineered Rama Setu across the ocean. After Ravana refused peaceful reconciliation, preparations for the righteous battle began.',
    moral: 'Unity and collective determination achieve what individual effort cannot.'
  },
  {
    number: 8,
    title: 'The Defeat of Ravana',
    subtitle: 'The Righteous Battle',
    summary: 'In a decisive battle, Rama defeated the mighty Ravana, restoring justice and rescuing Sita after her steadfast devotion and trial by innocence.',
    moral: 'Dharma (righteousness) ultimately prevails over adharma and pride.'
  },
  {
    number: 9,
    title: 'Rama Returns to Ayodhya',
    subtitle: 'Rama Rajya & Diwali',
    summary: 'Returning in the Pushpaka Vimana, Rama was crowned king, initiating Rama Rajya—an era of peace, prosperity, and fairness commemorated by Diwali.',
    moral: 'Responsible leadership brings lasting peace and public happiness.'
  },
  {
    number: 10,
    title: 'The Later Story of Rama and Sita',
    subtitle: 'Legacy of Lava & Kusha',
    summary: 'Lava and Kusha grew up under Sage Valmiki, reciting the Ramayana in Ayodhya and reminding all of eternal duty, truth, and enduring legacy.',
    moral: 'Stories of truth and virtue inspire generations across millennia.'
  }
];

export const RamayanaView: React.FC<RamayanaViewProps> = ({
  onOpenGuruChatWithPrompt,
  onNavigateHome,
  onNavigateMyBooks,
}) => {
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [selectedChapter, setSelectedChapter] = useState<RamayanaChapter>(RAMAYANA_CHAPTERS[0]);

  return (
    <div id="ramayana-view" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div
        className="rounded-3xl border p-6 sm:p-10 relative overflow-hidden shadow-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="max-w-3xl space-y-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Epics of Bharat Module • The Complete Ramayana</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            The Complete Ramayana
          </h1>

          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            A journey of courage, duty, and goodness. Composed by Sage Valmiki, the Ramayana chronicles the eternal journey of Sri Rama, exemplifying Maryada Purushottama—truth, humility, and steadfast righteousness.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onOpenGuruChatWithPrompt && (
              <button
                type="button"
                onClick={() => onOpenGuruChatWithPrompt('Teach me the core lessons of the Ramayana and its relevance for young scholars.')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask Guru AI about Ramayana</span>
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
                <BookMarked className="w-4 h-4" />
                <span>Explore My Books</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapters Explorer Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            Epic Chapters (1–10)
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Explore every stage of Sri Rama's journey from Ayodhya to Lanka and back.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RAMAYANA_CHAPTERS.map((ch) => {
            const isSelected = selectedChapter.number === ch.number;
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
                      Section {ch.number}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Valmiki Epic
                    </span>
                  </div>

                  <h3 className="font-bold text-base leading-snug font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                    {ch.title}
                  </h3>
                  <div className="text-xs font-medium" style={{ color: 'var(--accent-saffron-bright)' }}>
                    {ch.subtitle}
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {ch.summary}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-warm)' }}>
                  <span className="italic text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Moral: {ch.moral}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Chapter Detail Card */}
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
            <ShieldCheck className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Section {selectedChapter.number}: {selectedChapter.title}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {selectedChapter.subtitle}
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {selectedChapter.summary}
        </p>

        <div
          className="p-4 rounded-2xl border text-xs leading-relaxed space-y-1"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <span className="font-bold block" style={{ color: 'var(--accent-saffron-text)' }}>
            Key Student Lesson:
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {selectedChapter.moral}
          </span>
        </div>

        {onOpenGuruChatWithPrompt && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onOpenGuruChatWithPrompt(`Explain Section ${selectedChapter.number} of the Ramayana (${selectedChapter.title}) and what students can learn from it.`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-102 active:scale-98 cursor-pointer text-white"
              style={{ backgroundColor: 'var(--accent-saffron)' }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discuss Section {selectedChapter.number} with Guru AI</span>
            </button>
          </div>
        )}
      </div>

      {/* Core Learnings Summary */}
      <div
        className="p-6 rounded-3xl border space-y-4"
        style={{
          backgroundColor: 'var(--bg-card-subtle)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
          What Can We Learn from the Ramayana?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border bg-card flex items-start gap-2.5" style={{ borderColor: 'var(--border-warm)' }}>
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block" style={{ color: 'var(--text-primary)' }}>Truth and Honesty</span>
              <span style={{ color: 'var(--text-muted)' }}>Rama keeps his promises even when difficult.</span>
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-card flex items-start gap-2.5" style={{ borderColor: 'var(--border-warm)' }}>
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block" style={{ color: 'var(--text-primary)' }}>Respect & Responsibility</span>
              <span style={{ color: 'var(--text-muted)' }}>Honoring duties towards family, society, and leadership.</span>
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-card flex items-start gap-2.5" style={{ borderColor: 'var(--border-warm)' }}>
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block" style={{ color: 'var(--text-primary)' }}>Loyalty & Friendship</span>
              <span style={{ color: 'var(--text-muted)' }}>Lakshmana, Hanuman, and Sugriva support each other through trials.</span>
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-card flex items-start gap-2.5" style={{ borderColor: 'var(--border-warm)' }}>
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block" style={{ color: 'var(--text-primary)' }}>Courage & Pride</span>
              <span style={{ color: 'var(--text-muted)' }}>Sita remains resolute; Ravana's pride brings destruction.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

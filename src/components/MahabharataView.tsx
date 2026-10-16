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
  Compass,
  Layers,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface MahabharataViewProps {
  onOpenGuruChatWithPrompt?: (prompt: string) => void;
  onNavigateHome?: () => void;
  onNavigateMyBooks?: () => void;
}

interface MahabharataChapter {
  number: number;
  title: string;
  timeline: string;
  setting: string;
  summary: string;
  moral: string;
}

const MAHABHARATA_CHAPTERS: MahabharataChapter[] = [
  {
    number: 1,
    title: 'The Foundations of the Kuru Lineage and Devavrata’s Vow',
    timeline: 'End of Dvapara Yuga (Ancestral generation)',
    setting: 'Banks of River Ganga & Hastinapur Palace',
    summary: 'King Shantanu weds Ganga, and later Satyavati. To secure his father’s happiness, Devavrata takes a solemn vow of lifelong celibacy and renounces the throne, becoming Bhishma ("He of the terrible vow").',
    moral: 'True filial devotion (Pitri-bhakti) and supreme sacrifice, balanced against the rigidity of oaths.'
  },
  {
    number: 2,
    title: 'Royal Education and Growing Rivalry',
    timeline: 'Early Childhood to Youth of the Princes',
    setting: 'Gurukul of Drona & Hastinapur Arena',
    summary: 'Drona trains the 100 Kauravas and 5 Pandavas. Duryodhana’s deep envy leads to poisoning Bhima. At the graduation tournament, Karna challenges Arjuna and is crowned King of Anga by Duryodhana.',
    moral: 'The poison of envy and how unchecked jealousy degrades virtue while testing true merit (Guna).'
  },
  {
    number: 3,
    title: 'The Conspiracy of Lakshagriha & The Fire-Born Princess',
    timeline: 'Early Adulthood of the Princes',
    setting: 'Varanavata (Palace of Wax) & Panchala',
    summary: 'Duryodhana attempts to assassinate the Pandavas in a wax palace. Escaping through a tunnel, the Pandavas travel to Panchala where Arjuna wins Draupadi’s hand at her Swayamvara.',
    moral: 'Integrity in adversity and obedience to truth and maternal guidance.'
  },
  {
    number: 4,
    title: 'The Game of Dice and the Humiliation of Draupadi',
    timeline: 'Golden Age of Indraprastha & Rajasuya Yajna',
    setting: 'Royal Assembly Hall (Sabha) in Hastinapur',
    summary: 'Invited by Duryodhana and rigged by Shakuni, Yudhisthira loses his kingdom and Draupadi in a dice game. Draupadi is publicly humiliated, and Lord Krishna intervenes with endless divine silk. The Pandavas are sent to 12 years of exile and 1 year incognito.',
    moral: 'The catastrophic failure of silent authority figures during injustice and the power of surrender.'
  },
  {
    number: 5,
    title: 'Exile, Secret Disguise, and the Call to Peace',
    timeline: '12 Years Forest Exile + 1 Year Agnatavasa',
    setting: 'Dwaitavana Forest & Virata Kingdom',
    summary: 'The Pandavas spend 12 years gaining celestial strength and 1 year living incognito in Virata. After fulfilling exile terms, Duryodhana refuses to return Indraprastha. Krishna’s peace mission is rejected as he reveals his Vishvarupa.',
    moral: 'Exhausting every avenue for peaceful diplomacy (Dharma-Yuddha) before conflict.'
  },
  {
    number: 6,
    title: 'The Bhagavad Gita and the Battle of Kurukshetra',
    timeline: '18-Day Kurukshetra War',
    setting: 'Plains of Kurukshetra',
    summary: 'Facing moral paralysis on the battlefield, Arjuna receives the immortal wisdom of the Bhagavad Gita from Lord Krishna. The 18-day war unfolds with fierce battles, ultimate strategies, and the downfall of Bhishma, Drona, Karna, and Duryodhana.',
    moral: 'Nishkama Karma: fulfilling moral duty without attachment to the fruits of action.'
  },
  {
    number: 7,
    title: 'The Aftermath, Coronation, and Ultimate Ascent',
    timeline: 'Post-War Era to the Onset of Kali Yuga',
    setting: 'Hastinapur & Himalayan Mahaprasthana Path',
    summary: 'Yudhisthira is crowned king, learning statecraft from the dying Bhishma on a bed of arrows. After 36 years, following Krishna’s departure, the Pandavas undertake their final pilgrimage up the Himalayas toward eternal peace.',
    moral: 'Impermanence of earthly power and ultimate liberation through strict adherence to Dharma.'
  }
];

export const MahabharataView: React.FC<MahabharataViewProps> = ({
  onOpenGuruChatWithPrompt,
  onNavigateHome,
  onNavigateMyBooks,
}) => {
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [selectedChapter, setSelectedChapter] = useState<MahabharataChapter>(MAHABHARATA_CHAPTERS[0]);

  return (
    <div id="mahabharata-view" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
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
            <Scroll className="w-3.5 h-3.5" />
            <span>Itihasa Epic Module • The Mahabharata</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            The Mahabharata
          </h1>

          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The monumental epic composed by Sage Vyasa chronicling the Kuru lineage, the Kurukshetra War, and the eternal victory of Dharma over adharma. It is the longest epic poem known, exploring every facet of human duty, ethics, and spirituality.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onOpenGuruChatWithPrompt && (
              <button
                type="button"
                onClick={() => onOpenGuruChatWithPrompt('Teach me the core philosophical pillars and chapters of the Mahabharata.')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask Guru AI about Mahabharata</span>
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
            Chronological Chapters (1–7)
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Trace the complete epic arc from Shantanu's vows to Yudhisthira's final ascent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MAHABHARATA_CHAPTERS.map((ch) => {
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
                      Chapter {ch.number}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {ch.timeline}
                    </span>
                  </div>

                  <h3 className="font-bold text-base leading-snug font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                    {ch.title}
                  </h3>
                  <div className="text-xs font-medium" style={{ color: 'var(--accent-saffron-bright)' }}>
                    Setting: {ch.setting}
                  </div>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {ch.summary}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-warm)' }}>
                  <span className="italic text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Learning: {ch.moral}
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
              Chapter {selectedChapter.number}: {selectedChapter.title}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {selectedChapter.timeline} • Setting: {selectedChapter.setting}
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
            Core Philosophical Insight:
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {selectedChapter.moral}
          </span>
        </div>

        {onOpenGuruChatWithPrompt && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onOpenGuruChatWithPrompt(`Explain Chapter ${selectedChapter.number} of the Mahabharata (${selectedChapter.title}) in detail with practical student takeaways.`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-102 active:scale-98 cursor-pointer text-white"
              style={{ backgroundColor: 'var(--accent-saffron)' }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discuss Chapter {selectedChapter.number} with Guru AI</span>
            </button>
          </div>
        )}
      </div>

      {/* Philosophical Pillars Summary */}
      <div
        className="p-6 rounded-3xl border space-y-4"
        style={{
          backgroundColor: 'var(--bg-card-subtle)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
          Core Philosophical Pillars of the Mahabharata
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl border bg-card flex items-start gap-2.5" style={{ borderColor: 'var(--border-warm)' }}>
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block" style={{ color: 'var(--text-primary)' }}>Dharma</span>
              <span style={{ color: 'var(--text-muted)' }}>Moral duty, cosmic order, and righteousness.</span>
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-card flex items-start gap-2.5" style={{ borderColor: 'var(--border-warm)' }}>
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block" style={{ color: 'var(--text-primary)' }}>Karma</span>
              <span style={{ color: 'var(--text-muted)' }}>Law of cause and effect governing all actions.</span>
            </div>
          </div>
          <div className="p-3 rounded-xl border bg-card flex items-start gap-2.5" style={{ borderColor: 'var(--border-warm)' }}>
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block" style={{ color: 'var(--text-primary)' }}>Moksha</span>
              <span style={{ color: 'var(--text-muted)' }}>Ultimate spiritual liberation from rebirth.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

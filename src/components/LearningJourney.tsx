import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  BookOpen,
  Headphones,
  Brain,
  ClipboardCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface StageData {
  id: string;
  step: string;
  english: string;
  sanskrit: string;
  tagline: string;
  description: string;
  icon: typeof BookOpen;
  xpReward: number;
  xpLabel: string;
  isOptional?: boolean;
  shloka: string;
  essence: string;
  action: string;
  outcome: string;
}

const STAGES: StageData[] = [
  {
    id: 'vidya',
    step: '01',
    english: 'Vidya',
    sanskrit: 'विद्या',
    tagline: 'Structured Knowledge',
    description: 'Foundational acquisition of core concepts, definitions, and formulas.',
    icon: BookOpen,
    xpReward: 15,
    xpLabel: '+15 XP',
    isOptional: false,
    shloka: 'ज्ञानं परमं बलम् · Knowledge is supreme strength',
    essence: 'Clear, accurate foundational comprehension before engaging in deep contemplation.',
    action: 'Read concise, structured chapter notes extracted directly from your textbook or uploaded PDF.',
    outcome: 'Solid conceptual grounding in all scientific, historical, or mathematical definitions.',
  },
  {
    id: 'shravan',
    step: '02',
    english: 'Shravan',
    sanskrit: 'श्रवण',
    tagline: 'Attentive Listening',
    description: 'Immersive spoken discourse to reinforce auditory memory and conceptual flow.',
    icon: Headphones,
    xpReward: 10,
    xpLabel: '+10 XP',
    isOptional: false,
    shloka: 'श्रुतेन प्रज्ञा वर्धते · Wisdom expands through listening',
    essence: 'The ancient tradition of oral transmission—absorbing ideas without visual screen fatigue.',
    action: 'Listen to a natural, educational voice narration summarizing the entire chapter with clarity.',
    outcome: 'Heightened conceptual retention and intuitive synthesis across interconnected ideas.',
  },
  {
    id: 'manan',
    step: '03',
    english: 'Manan',
    sanskrit: 'मनन',
    tagline: 'Deep Reflection',
    description: 'Contemplating ideas, connecting hypotheses, and developing genuine intuition.',
    icon: Brain,
    xpReward: 25,
    xpLabel: '+25 XP',
    isOptional: false,
    shloka: 'मननेन बोधः सिध्यति · Through reflection, realization is attained',
    essence: 'Intellectual churning—transforming passive data into internalized insight.',
    action: 'Engage with visual reflection puzzles and articulate key concepts in your own words.',
    outcome: 'Authentic intellectual ownership, moving far beyond rote memorization.',
  },
  {
    id: 'pariksha',
    step: '04',
    english: 'Pariksha',
    sanskrit: 'परीक्षा',
    tagline: 'Mastery Validation',
    description: 'An adaptive assessment to confirm durable understanding and retention.',
    icon: ClipboardCheck,
    xpReward: 50,
    xpLabel: '+50 XP',
    isOptional: false,
    shloka: 'सिद्धेः प्रमाणं परीक्षा · Assessment is the verification of mastery',
    essence: 'Validation of true learning—ensuring knowledge is permanent, dependable, and durable.',
    action: 'Solve the 6-word chapter crossword exam. Each word solved has a weightage of 8 XP.',
    outcome: 'Verified chapter mastery, achievement milestone, and 50 XP added to your scholar journey.',
  },
];

interface LearningJourneyProps {
  onNavigatePariksha?: () => void;
  onStartLearning?: () => void;
  onOpenIndusValley?: () => void;
}

export const LearningJourney: React.FC<LearningJourneyProps> = ({
  onNavigatePariksha,
  onStartLearning,
  onOpenIndusValley,
}) => {
  const { recordStreakActivity } = useAuth();
  const { language, t } = useLanguage();
  const [activeStageId, setActiveStageId] = useState<string>('vidya');

  const handleStageChange = (stageId: string) => {
    setActiveStageId(stageId);
    recordStreakActivity('stage_view');
  };

  const currentStage = STAGES.find((s) => s.id === activeStageId) || STAGES[0];

  return (
    <section id="journey" className="py-8 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Minimalist Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-3">
        <div className="text-xs font-serif tracking-widest uppercase font-semibold" style={{ color: 'var(--accent-saffron-text)' }}>
          चतुष्पदी · The Sacred Fourfold Progression
        </div>

        <h2
          id="journey-section-title"
          className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight font-serif-heading"
          style={{ color: 'var(--text-primary)' }}
        >
          {t.journeyTitle}
        </h2>

        <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal" style={{ color: 'var(--text-secondary)' }}>
          {t.journeySubtitle}
        </p>
      </div>

      {/* 4 Stage Horizontal Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {STAGES.map((stage) => {
          const isSelected = stage.id === activeStageId;
          const Icon = stage.icon;
          return (
            <button
              key={stage.id}
              type="button"
              id={`stage-card-${stage.id}`}
              onClick={() => handleStageChange(stage.id)}
              className={`text-left p-4 rounded-2xl border transition-all relative flex flex-col justify-between h-full cursor-pointer shadow-2xs ${
                isSelected
                  ? 'ring-2 ring-amber-600 dark:ring-amber-500'
                  : 'hover:border-amber-400/60'
              }`}
              style={{
                backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-main)',
                borderColor: isSelected ? 'var(--accent-saffron)' : 'var(--border-warm)',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-muted)' }}>
                    {stage.step}
                  </span>
                  <span className="text-[11px] font-mono font-bold" style={{ color: 'var(--accent-saffron-text)' }}>
                    {stage.xpLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-warm)',
                      color: 'var(--accent-saffron-text)',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-serif-heading leading-tight" style={{ color: 'var(--text-primary)' }}>
                      {stage.english}
                    </h3>
                    <div className="text-[11px] font-serif opacity-80" style={{ color: 'var(--text-secondary)' }}>
                      {stage.sanskrit}
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed pt-1 font-normal" style={{ color: 'var(--text-secondary)' }}>
                  {stage.description}
                </p>
              </div>

              <div
                className="mt-3 pt-2 border-t flex items-center justify-between text-xs font-medium"
                style={{ borderColor: 'var(--border-warm)' }}
              >
                <span style={{ color: isSelected ? 'var(--accent-saffron-text)' : 'var(--text-secondary)' }}>
                  {isSelected ? 'Viewing Essence' : 'Explore'}
                </span>
                <ChevronRight
                  className="w-3.5 h-3.5"
                  style={{ color: isSelected ? 'var(--accent-saffron-text)' : 'var(--text-secondary)' }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Panel */}
      <div
        id="stage-detail-panel"
        className="rounded-3xl border p-6 sm:p-8 shadow-xs relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-warm)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-serif font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              चरण {currentStage.step}
            </span>
            <span className="text-lg sm:text-xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              {currentStage.english} ({currentStage.sanskrit}) · {currentStage.tagline}
            </span>
          </div>

          <div className="text-xs font-mono font-semibold" style={{ color: 'var(--accent-saffron-text)' }}>
            {currentStage.isOptional ? 'Optional Reflection' : `Milestone Reward: ${currentStage.xpLabel}`}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 items-stretch">
          {/* Left Column: Philosophical Principle */}
          <div
            className="lg:col-span-5 rounded-2xl border p-5 flex flex-col justify-between space-y-4"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="space-y-3">
              <div className="text-xs font-serif italic text-amber-700 dark:text-amber-400">
                {currentStage.shloka}
              </div>
              <p className="text-sm leading-relaxed font-normal" style={{ color: 'var(--text-primary)' }}>
                {currentStage.essence}
              </p>
            </div>

            <div className="pt-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              Stage {currentStage.step} of 04 in the Gyan Quest curriculum
            </div>
          </div>

          {/* Right Column: Practice & Realization */}
          <div
            className="lg:col-span-7 rounded-2xl border p-5 space-y-4"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="space-y-1.5">
              <div className="text-xs font-serif uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-400">
                The Seeker's Practice · साधना
              </div>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {currentStage.action}
              </p>
            </div>

            <div className="pt-3 border-t space-y-1.5" style={{ borderColor: 'var(--border-warm)' }}>
              <div className="text-xs font-serif uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-400">
                Mastery Outcome · सिद्धि
              </div>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {currentStage.outcome}
              </p>
            </div>

            {currentStage.id === 'pariksha' && onNavigatePariksha && (
              <div className="pt-2">
              </div>
            )}
            {currentStage.id !== 'pariksha' && onStartLearning && (
              <div className="pt-2">
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Interactive History Chapter Banner */}
      {onOpenIndusValley && (
        <div
          id="featured-indus-valley-banner"
          className="mt-6 rounded-3xl border p-5 sm:p-7 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-md bg-teal-900/10 dark:bg-teal-400/10 text-teal-800 dark:text-teal-300 border border-teal-700/20">
                NCERT History · Classes 6–8
              </span>
              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
                16 Sections · 7 Interactive Visuals · +100 XP Full Loop
              </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              The Indus Valley Civilization (Harappan Civilization)
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Discover the cities, people, technology, trade, and mysteries of one of the world&apos;s earliest urban civilizations (c. 2600–1900 BCE) with interactive diagrams, site comparisons, glossary cards, and instant quizzes.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenIndusValley}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:opacity-95 cursor-pointer shrink-0"
            style={{ backgroundColor: '#1E293B' }}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Explore Interactive Chapter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};


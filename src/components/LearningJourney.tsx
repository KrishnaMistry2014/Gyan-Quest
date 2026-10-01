import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Headphones,
  Brain,
  MessageCircleQuestion,
  ClipboardCheck,
  ChevronRight,
  Scroll,
  CheckCircle2,
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
  methodology: {
    categoryTitle: string;
    overview: string;
    studentAction: string;
    learningObjectives: string;
    masteryOutcome: string;
    pedagogicalPrinciple: string;
  };
}

const STAGES: StageData[] = [
  {
    id: 'vidya',
    step: '01',
    english: 'Vidya',
    sanskrit: '(विद्या)',
    tagline: 'STRUCTURED READING',
    description: 'Learning and acquiring foundational knowledge from the chapter.',
    icon: BookOpen,
    xpReward: 10,
    xpLabel: '+10 XP',
    isOptional: false,
    methodology: {
      categoryTitle: 'STRUCTURED KNOWLEDGE ACQUISITION',
      overview: 'The student reads and studies concise, structured chapter notes extracted directly from the textbook or uploaded PDF, focusing on core concepts, definitions, and formulas.',
      studentAction: 'Absorb core chapter definitions, formulas, and structural outline.',
      learningObjectives: 'Extract essential scientific and mathematical fundamentals.',
      masteryOutcome: 'Complete foundational comprehension of all primary concepts in the chapter.',
      pedagogicalPrinciple: 'Receiving clear, accurate knowledge before engaging in analysis or contemplation.',
    },
  },
  {
    id: 'shravan',
    step: '02',
    english: 'Shravan',
    sanskrit: '(श्रवण)',
    tagline: 'AUDIO EXPLANATION',
    description: 'Listening to a concise explanation or summary of the chapter.',
    icon: Headphones,
    xpReward: 5,
    xpLabel: '+5 XP',
    isOptional: false,
    methodology: {
      categoryTitle: 'AUDITORY SYNTHESIS & RETENTION',
      overview: 'Listen to a concise, narrated audio breakdown of the chapter designed to reinforce auditory memory and clarify complex conceptual relationships.',
      studentAction: 'Listen attentively to the audio summary and connect theoretical concepts.',
      learningObjectives: 'Reinforce memory encoding through clear spoken discourse.',
      masteryOutcome: 'Auditory reinforcement and high-level conceptual clarity across topics.',
      pedagogicalPrinciple: 'Oral reception—internalizing ideas through focused, uninterrupted listening.',
    },
  },
  {
    id: 'manan',
    step: '03',
    english: 'Manan',
    sanskrit: '(मनन)',
    tagline: 'DEEP REFLECTION',
    description: 'Reflecting on the chapter, connecting ideas, and developing deeper understanding.',
    icon: Brain,
    xpReward: 15,
    xpLabel: '+15 XP',
    isOptional: false,
    methodology: {
      categoryTitle: 'DEEP CONCEPTUAL CONTEMPLATION',
      overview: 'Moving past rote memorization by prompting students to articulate hypotheses in their own words and connect chapter ideas to everyday phenomena.',
      studentAction: 'Synthesize chapter concepts and formulate personal reflections.',
      learningObjectives: 'Develop critical thinking and authentic intellectual ownership.',
      masteryOutcome: 'Internalized intuition and authentic intellectual ownership of the material.',
      pedagogicalPrinciple: 'Deliberate intellectual churning—transforming information into wisdom.',
    },
  },
  {
    id: 'prashna',
    step: '04',
    english: 'Prashna',
    sanskrit: '(प्रश्न)',
    tagline: 'SOCRATIC AI INQUIRY',
    description: 'Asking questions and clearing doubts to improve understanding with Guru.',
    icon: MessageCircleQuestion,
    xpReward: 0,
    xpLabel: 'Optional (0 XP)',
    isOptional: true,
    methodology: {
      categoryTitle: 'CONTEXT-BOUNDED DOUBT RESOLUTION',
      overview: 'Optional stage with no XP pressure. Students can formulate questions and clear lingering doubts with the Socratic Guru without fear of losing points.',
      studentAction: 'Investigate lingering doubts with Guru AI without fear of point loss.',
      learningObjectives: 'Targeted resolution of ambiguities before formal assessment.',
      masteryOutcome: 'Complete resolution of ambiguities and heightened readiness for assessment.',
      pedagogicalPrinciple: 'Inquisitive dialogue—refining understanding through questioning.',
    },
  },
  {
    id: 'pariksha',
    step: '05',
    english: 'Pariksha',
    sanskrit: '(परीक्षा)',
    tagline: 'ADAPTIVE ASSESSMENT',
    description: 'Testing understanding through an interactive assessment with 5 questions.',
    icon: ClipboardCheck,
    xpReward: 50,
    xpLabel: '+50 XP Full',
    isOptional: false,
    methodology: {
      categoryTitle: 'MASTERY VERIFICATION ASSESSMENT',
      overview: 'Adaptive chapter test verifying concept retention. Complete with 100% accuracy to earn the maximum 50 XP achievement reward.',
      studentAction: 'Complete the 5-question chapter test to prove retention.',
      learningObjectives: 'Validate durable retention of all chapter learning outcomes.',
      masteryOutcome: 'Documented concept mastery, full 50 XP achievement reward, and validated chapter completion.',
      pedagogicalPrinciple: 'Validation of true attainment—confirming knowledge is durable and permanent.',
    },
  },
];

export const LearningJourney: React.FC = () => {
  const { recordStreakActivity } = useAuth();
  const [activeStageId, setActiveStageId] = useState<string>('vidya');

  const handleStageChange = (stageId: string) => {
    setActiveStageId(stageId);
    recordStreakActivity('stage_view');
  };

  const currentStage = STAGES.find((s) => s.id === activeStageId) || STAGES[0];

  return (
    <section id="journey" className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-2.5">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs"
          style={{
            backgroundColor: 'var(--accent-saffron-light)',
            borderColor: 'var(--border-warm)',
            color: 'var(--accent-saffron-text)',
          }}
        >
          <Scroll className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          <span>TRADITIONAL PEDAGOGY • MODERN MASTERY</span>
        </div>

        <h2
          id="journey-section-title"
          className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight font-serif-heading"
          style={{ color: 'var(--text-primary)' }}
        >
          The Gyan Quest Journey
        </h2>

        <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Rooted in the timeless Indian sequence of knowledge acquisition, every textbook chapter is experienced as one unbroken progression toward complete mastery.
        </p>
      </div>

      {/* 5 Stage Cards Row (Matching screen.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        {STAGES.map((stage) => {
          const isSelected = stage.id === activeStageId;
          return (
            <button
              key={stage.id}
              id={`stage-card-${stage.id}`}
              onClick={() => handleStageChange(stage.id)}
              className={`text-left p-4 rounded-2xl border transition-all relative flex flex-col justify-between h-full cursor-pointer shadow-2xs ${
                isSelected
                  ? 'ring-2 ring-amber-600 dark:ring-amber-500 shadow-xs'
                  : 'hover:border-amber-400/60'
              }`}
              style={{
                backgroundColor: isSelected ? 'var(--bg-card)' : 'var(--bg-card)',
                borderColor: isSelected ? 'var(--accent-saffron)' : 'var(--border-warm)',
              }}
            >
              <div>
                {/* Top Row: 01 box + XP badge */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      borderColor: 'var(--border-warm)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {stage.step}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      stage.isOptional
                        ? 'text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                        : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40'
                    }`}
                  >
                    {stage.xpLabel}
                  </span>
                </div>

                {/* Stage Title */}
                <h3 className="text-base font-bold font-serif-heading mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  {stage.english} <span className="font-normal text-xs">{stage.sanskrit}</span>
                </h3>

                {/* Tagline */}
                <div
                  className="text-[9px] font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--accent-saffron-text)' }}
                >
                  {stage.tagline}
                </div>

                {/* Description */}
                <p className="text-[11px] leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                  {stage.description}
                </p>
              </div>

              {/* Bottom selection indicator */}
              <div
                className="mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-semibold"
                style={{ borderColor: 'var(--border-warm)' }}
              >
                <span style={{ color: isSelected ? 'var(--accent-saffron-text)' : 'var(--text-secondary)' }}>
                  {isSelected ? 'Active Focus' : 'Methodology'}
                </span>
                <ChevronRight
                  className="w-3 h-3"
                  style={{ color: isSelected ? 'var(--accent-saffron-text)' : 'var(--text-secondary)' }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Card below (Matching screen.png) */}
      <div
        id="stage-detail-panel"
        className="rounded-[24px] border p-5 sm:p-7 shadow-xs transition-all space-y-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-warm)' }}>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                borderColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              STAGE {currentStage.step} PROGRESSION
            </span>
            <span className="text-base sm:text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              {currentStage.english} {currentStage.sanskrit}
            </span>
          </div>

          <div
            className="text-[11px] font-bold text-amber-700 dark:text-amber-400"
          >
            {currentStage.isOptional ? 'Optional Stage (0 XP)' : `Mandatory Milestone (${currentStage.xpLabel})`}
          </div>
        </div>

        {/* Two Columns: Left (Overview) + Right (2x2 Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: Category & Overview */}
          <div
            className="lg:col-span-5 rounded-2xl border p-4 sm:p-5 flex flex-col justify-between space-y-3"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="space-y-2">
              <div
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                {currentStage.methodology.categoryTitle}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {currentStage.methodology.overview}
              </p>
            </div>

            <div
              className="pt-2 text-[10px] font-bold"
              style={{ color: 'var(--accent-saffron-text)' }}
            >
              Task Milestone XP: {currentStage.xpLabel} upon completing {currentStage.english.toLowerCase()}
            </div>
          </div>

          {/* Right Column: 2x2 Grid */}
          <div
            className="lg:col-span-7 rounded-2xl border p-4 sm:p-5 space-y-3"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'var(--accent-saffron-text)' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>STAGE METHODOLOGY & PROGRESSION RULES</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}>
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Student Action
                </div>
                <p className="text-[11px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
                  {currentStage.methodology.studentAction}
                </p>
              </div>

              <div className="p-3 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}>
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Core Learning Objectives
                </div>
                <p className="text-[11px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
                  {currentStage.methodology.learningObjectives}
                </p>
              </div>

              <div className="p-3 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}>
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Mastery Outcome
                </div>
                <p className="text-[11px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
                  {currentStage.methodology.masteryOutcome}
                </p>
              </div>

              <div className="p-3 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}>
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Pedagogical Principle
                </div>
                <p className="text-[11px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
                  {currentStage.methodology.pedagogicalPrinciple}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

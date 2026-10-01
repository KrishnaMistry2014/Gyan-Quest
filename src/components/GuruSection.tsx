import React from 'react';
import {
  Compass,
  Lock,
  Lightbulb,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

export const GuruSection: React.FC = () => {
  return (
    <section id="guru" className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 space-y-2.5">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs"
          style={{
            backgroundColor: 'var(--accent-saffron-light)',
            borderColor: 'var(--border-warm)',
            color: 'var(--accent-saffron-text)',
          }}
        >
          <Compass className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          <span>AN INTEGRATED STUDY COMPANION</span>
        </div>

        <h2
          id="guru-section-title"
          className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight font-serif-heading"
          style={{ color: 'var(--text-primary)' }}
        >
          Meet Guru
        </h2>

        <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Guru is Gyan Quest's intelligent study assistant. It helps students understand concepts and clear doubts while keeping the conversation focused on the topic being studied.
        </p>
      </div>

      {/* Callout Banner (Matching screen.png) */}
      <div
        className="max-w-2xl mx-auto mb-8 p-3 rounded-2xl border flex items-center justify-center gap-2 text-center text-xs shadow-2xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
          color: 'var(--text-primary)',
        }}
      >
        <CheckCircle2 className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
        <span className="font-medium text-[11px] sm:text-xs">
          Important distinction: Gyan Quest is the complete learning platform; Guru is one supportive part of it.
        </span>
      </div>

      {/* 3 Pillar Cards (Matching screen.png) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div
          className="rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </div>

            <h3 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Strict Syllabus Guardrails
            </h3>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Unlike open-ended chatbots that drift into distractions and hallucinations, Guru remains strictly anchored to the specific chapter and curriculum concepts currently open in the student's quest.
            </p>
          </div>

          <div
            className="pt-2.5 border-t flex items-center gap-1.5 text-[11px] font-medium"
            style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Topic-locked guarantee</span>
          </div>
        </div>

        {/* Card 2 */}
        <div
          className="rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Lightbulb className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </div>

            <h3 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Socratic Concept Building
            </h3>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Guru guides through intuition-building inquiry rather than simply giving answers away. Students learn by constructing fundamental understanding from first principles, building authentic intellectual independence.
            </p>
          </div>

          <div
            className="pt-2.5 border-t flex items-center gap-1.5 text-[11px] font-medium"
            style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active intellectual reasoning</span>
          </div>
        </div>

        {/* Card 3 */}
        <div
          className="rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <MessageSquare className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            </div>

            <h3 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Instant Doubt Resolution (Prashna)
            </h3>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Directly powers Stage 4 of the journey. Students unpack confusing formulas or subtle nuances in real-time dialogue before validating their mastery in the comprehensive Pariksha (परीक्षा) evaluation.
            </p>
          </div>

          <div
            className="pt-2.5 border-t flex items-center gap-1.5 text-[11px] font-medium"
            style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Real-time milestone support</span>
          </div>
        </div>
      </div>
    </section>
  );
};

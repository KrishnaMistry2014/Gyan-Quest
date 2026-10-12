import React from 'react';
import {
  Compass,
  Lock,
  Lightbulb,
  MessageSquare
} from 'lucide-react';

export const GuruSection: React.FC = () => {
  return (
    <section id="guru" className="py-8 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Minimalist Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-3">
        <div className="text-xs font-serif tracking-widest uppercase font-semibold" style={{ color: 'var(--accent-saffron-text)' }}>
          मार्गदर्शन · Socratic Guidance
        </div>

        <h2
          id="guru-section-title"
          className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight font-serif-heading"
          style={{ color: 'var(--text-primary)' }}
        >
          Meet Guru — Your Study Guide
        </h2>

        <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal" style={{ color: 'var(--text-secondary)' }}>
          Guru is Gyan Quest's dedicated academic guide and cultural mentor. It helps students master concepts, explore Indian traditions, mythology, and Sanskrit, and clear doubts with depth and clarity.
        </p>
      </div>

      {/* 3 Scholastic Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Academic Guardrails */}
        <div
          className="rounded-2xl border p-6 shadow-xs flex flex-col justify-between space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Lock className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>

            <div className="text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
              मर्यादा · Academic Guardrails
            </div>

            <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Devoted to Learning
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Unlike open-ended chatbots that drift into pop culture gossip and distractions, Guru remains devoted to academic mastery, curriculum concepts, and authentic explorations of Indian culture and Sanskrit wisdom.
            </p>
          </div>

          <div className="pt-3 border-t text-xs font-serif italic" style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}>
            Wisdom-centered academic focus
          </div>
        </div>

        {/* Card 2: Socratic Inquiry */}
        <div
          className="rounded-2xl border p-6 shadow-xs flex flex-col justify-between space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Lightbulb className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>

            <div className="text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
              जिज्ञासा · Socratic Dialogue
            </div>

            <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Inquiry Over Answers
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Guru acts as a true teacher: asking guiding questions that provoke critical analysis and self-realization rather than passively feeding pre-packaged answers.
            </p>
          </div>

          <div className="pt-3 border-t text-xs font-serif italic" style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}>
            Provoking deeper critical thinking
          </div>
        </div>

        {/* Card 3: Contextual Clarity */}
        <div
          className="rounded-2xl border p-6 shadow-xs flex flex-col justify-between space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <MessageSquare className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>

            <div className="text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
              विवेक · Intuitive Analogies
            </div>

            <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Real-World Clarity
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Connect complex textbook physics, chemistry, or mathematics formulas to tangible analogies and real-world phenomena for lasting clarity.
            </p>
          </div>

          <div className="pt-3 border-t text-xs font-serif italic" style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}>
            Intuitive understanding of principles
          </div>
        </div>
      </div>
    </section>
  );
};

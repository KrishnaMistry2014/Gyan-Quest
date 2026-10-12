import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Brain, Sparkles } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-8 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border p-6 sm:p-10 lg:p-12 shadow-xs relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="max-w-3xl mx-auto text-center mb-10 space-y-3">
          <div className="text-xs font-serif tracking-widest uppercase font-semibold text-amber-700 dark:text-amber-400">
            दर्शन एवं विज्ञान · Ancient Roots, Modern Science
          </div>

          <h2
            id="about-section-title"
            className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight font-serif-heading"
            style={{ color: 'var(--text-primary)' }}
          >
            Bridging Ancient Wisdom With Modern Pedagogy
          </h2>

          <p className="text-sm sm:text-base leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>
            Traditional Indian scholarship never treated students as passive vessels to be filled. It structured learning as an active, living inquiry: receiving clear knowledge, churning it through personal reflection, clarifying subtleties with the preceptor, and demonstrating real mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            className="rounded-2xl border p-6 space-y-3 shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <h3 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Active Over Passive
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Instead of passively re-reading dense textbook pages, students engage with bite-sized concepts, active recall prompts, and auditory summaries.
            </p>
          </div>

          <div
            className="rounded-2xl border p-6 space-y-3 shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Brain className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <h3 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Churning Thought (मंथन)
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Knowledge truly takes root only when articulated in one's own words. Manan bridges the gap between memory and deep understanding.
            </p>
          </div>

          <div
            className="rounded-2xl border p-6 space-y-3 shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <h3 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Socratic Dialogue
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Questions are the doorway to clarity. Guru acts as a companion guiding you toward your own insights, strictly bound to academic truth.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

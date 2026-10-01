import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Sparkles, Brain, Award, ShieldCheck } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[32px] border p-6 sm:p-10 shadow-sm transition-all relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            Philosophy & Pedagogy
          </div>
          <h2
            id="about-section-title"
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Bridging Ancient Wisdom With Modern Science
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Traditional Indian education never relied on passive cramming. It structured learning as a dynamic progression: listening to clear discourse, introspecting deeply, formulating deep questions, and proving mastery.
          </p>
        </div>

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.12,
                delayChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            className="rounded-2xl border p-6 space-y-3 transition-transform hover:-translate-y-0.5 hover:shadow-xs"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron)',
              }}
            >
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              From Passive to Active
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Instead of mindlessly re-reading dense textbook pages, students engage with bite-sized concepts, active recall prompts, and auditory summaries.
            </p>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            className="rounded-2xl border p-6 space-y-3 transition-transform hover:-translate-y-0.5 hover:shadow-xs"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron)',
              }}
            >
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Reflection Over Rote
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The <em>Manan</em> stage prompts students to articulate explanations in their own words, establishing permanent neural connections and intuition.
            </p>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            className="rounded-2xl border p-6 space-y-3 transition-transform hover:-translate-y-0.5 hover:shadow-xs"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron)',
              }}
            >
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Wholesome Gamification
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              XP and streaks are tailored to cultivate self-discipline and quiet accomplishment, without flashy slot-machine mechanics or addictive notifications.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

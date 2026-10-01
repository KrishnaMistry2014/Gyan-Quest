import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, BookOpen, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FinalCTAProps {
  onStartQuest: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onStartQuest }) => {
  return (
    <section id="final-cta" className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        id="final-cta-card"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[32px] border p-8 sm:p-14 text-center shadow-sm transition-all relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        {/* Subtle decorative background ambient accents */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: 'var(--accent-saffron)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: 'var(--accent-saffron)' }}
        />

        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-2xs"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-saffron)' }} />
            <span>Embark On Meaningful Learning</span>
          </div>

          <h2
            id="final-cta-title"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Your learning journey starts here.
          </h2>

          <p
            className="text-base sm:text-lg max-w-xl mx-auto font-normal leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Transform any textbook into an inspiring quest. Master concepts through Vidya, Shravan, Manan, Prashna, and Pariksha today.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="final-cta-button"
              onClick={onStartQuest}
              className="group w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base shadow-sm transition-all hover:opacity-95 hover:shadow-md active:scale-95"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <span>Start Your Quest</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
            </button>
          </div>

          <div
            className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="flex items-center gap-1.5">• Free Guest Access</span>
            <span className="flex items-center gap-1.5">• Universal Textbook Support</span>
            <span className="flex items-center gap-1.5">• Distraction-Free Pedagogy</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

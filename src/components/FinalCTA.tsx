import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FinalCTAProps {
  onStartQuest: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onStartQuest }) => {
  const { language, t } = useLanguage();

  return (
    <section id="final-cta" className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        id="final-cta-card"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border p-8 sm:p-14 text-center shadow-xs relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          <div className="text-xs font-serif tracking-widest uppercase font-semibold text-amber-700 dark:text-amber-400">
            ॐ असतो मा सद्गमय तमसो मा ज्योतिर्गमय
          </div>

          <h2
            id="final-cta-title"
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight font-serif-heading"
            style={{ color: 'var(--text-primary)' }}
          >
            {t.ctaTitle}
          </h2>

          <p
            className="text-base sm:text-lg max-w-xl mx-auto font-normal leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t.ctaSubtitle}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="final-cta-button"
              type="button"
              onClick={onStartQuest}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-sm shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <span>{t.ctaButton}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div
            className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>Free Guest Access</span>
            <span aria-hidden="true">·</span>
            <span>Universal PDF & Textbook Support</span>
            <span aria-hidden="true">·</span>
            <span>Distraction-Free Vedic Pedagogy</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

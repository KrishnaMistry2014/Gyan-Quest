import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface HeroProps {
  onStartQuest: () => void;
  onExplore: () => void;
  onPdfUpload?: (file: File) => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartQuest, onExplore, onPdfUpload }) => {
  const { openAuthModal, user } = useAuth();
  const { language, t } = useLanguage();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');
      if (isPdf && onPdfUpload) {
        onPdfUpload(file);
      }
      e.target.value = '';
    }
  };

  return (
    <section id="home" className="pt-4 sm:pt-8 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Minimalist Pavilion Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border p-6 sm:p-10 lg:p-14 shadow-xs relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        {/* Subtle Ancient Decorative Ring / Mandala Watermark */}
        <div
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full border border-amber-600/10 dark:border-amber-400/5 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -right-12 -top-12 w-72 h-72 rounded-full border border-dashed border-amber-600/10 dark:border-amber-400/5 pointer-events-none"
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center relative z-10">
          {/* Left Column: Hero Proposition */}
          <div className="lg:col-span-12 space-y-6">
            {/* Elegant Sanskrit Kicker (Unboxed text with subtle separator) */}
            <div className="flex items-center gap-2 text-xs font-serif tracking-wider" style={{ color: 'var(--accent-saffron-text)' }}>
              <span className="font-semibold text-sm">{t.heroSanskrit}</span>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span className="text-[12px] uppercase tracking-widest font-sans font-medium opacity-85">
                {t.heroKicker}
              </span>
            </div>

            {/* Headline */}
            <h1
              id="hero-title"
              className="text-4xl sm:text-5xl lg:text-[52px] font-bold tracking-tight leading-[1.12] font-serif-heading"
              style={{ color: 'var(--text-primary)' }}
            >
              {t.heroTitlePre}
              <span className="text-amber-600 dark:text-amber-400 font-serif">
                {t.heroTitleHighlight}
              </span>{' '}
              {t.heroTitlePost}
            </h1>

            {/* Description */}
            <p
              id="hero-subtitle"
              className="text-base sm:text-lg leading-relaxed max-w-2xl font-normal"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t.heroSubtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                id="hero-start-quest-btn"
                type="button"
                onClick={user ? onStartQuest : openAuthModal}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <span>{t.beginQuest}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-explore-pedagogy-btn"
                type="button"
                onClick={onExplore}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-98 cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{t.exploreStages}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="hero-pdf-file-input"
              />
            </div>

            {/* Quiet, unboxed text metadata footer */}
            <div
              className="pt-4 border-t flex flex-wrap items-center gap-4 text-xs font-medium"
              style={{
                borderColor: 'var(--border-warm)',
                color: 'var(--text-secondary)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Custom PDF & Textbook Synthesis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Socratic Guru Mentorship</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>100 XP Milestone Mastery</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

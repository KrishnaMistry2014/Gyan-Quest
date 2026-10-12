import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Timer, Clock, Flame, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FocusModeSection: React.FC = () => {
  const { user, streak, openStreakModal } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState<number>(25);

  const durationOptions = [
    { minutes: 15, label: 'लघु · 15 Min', desc: 'Audio summary & reflective puzzle' },
    { minutes: 25, label: 'मानक · 25 Min', desc: 'Full Vidya notes & Pariksha test' },
    { minutes: 40, label: 'गहन · 40 Min', desc: 'Complex chapter with derivations' },
  ];

  return (
    <section id="focus-mode" className="py-8 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        id="focus-mode-card"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-serif tracking-widest uppercase font-semibold text-amber-700 dark:text-amber-400">
              ध्यान · Digital Wellness by Design
            </div>

            <h2
              id="focus-mode-title"
              className="text-3xl sm:text-4xl font-bold tracking-tight font-serif-heading"
              style={{ color: 'var(--text-primary)' }}
            >
              Focus Mode for Mindful Study
            </h2>

            <p className="text-sm sm:text-base leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>
              Inspired by the Vedic practice of *Ekagrata* (one-pointed concentration), Focus Mode structures learning in concentrated, uninterrupted windows, discouraging endless screen fatigue and mindless browsing.
            </p>

            <div className="space-y-2 pt-2 text-xs sm:text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Encourages deliberate study in focused 15 to 40 minute intervals.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Gentle session completion prompts invite you to rest your eyes and reflect offline.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Interval Selector */}
          <div className="lg:col-span-5">
            <div
              className="rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-warm)' }}>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span className="text-xs font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                    Study Session Windows
                  </span>
                </div>
                {user && (
                  <button
                    type="button"
                    onClick={openStreakModal}
                    className="flex items-center gap-1 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{streak}d</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {durationOptions.map((opt) => {
                  const isSelected = selectedDuration === opt.minutes;
                  return (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() => setSelectedDuration(opt.minutes)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected ? 'ring-2 ring-amber-600 dark:ring-amber-500 shadow-2xs' : 'hover:border-amber-400/50'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--bg-card)' : 'transparent',
                        borderColor: isSelected ? 'var(--accent-saffron)' : 'var(--border-warm)',
                      }}
                    >
                      <div>
                        <div className="text-xs font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                          {opt.label}
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {opt.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                Concentrated effort leads to lasting understanding.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

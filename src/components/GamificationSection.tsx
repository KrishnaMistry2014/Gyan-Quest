import React from 'react';
import {
  Zap,
  TrendingUp,
  Flame,
  Award,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const GamificationSection: React.FC = () => {
  const { user, streak, openStreakModal, openAuthModal } = useAuth();

  return (
    <section id="gamification" className="py-8 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Minimalist Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-3">
        <div className="text-xs font-serif tracking-widest uppercase font-semibold" style={{ color: 'var(--accent-saffron-text)' }}>
          अभ्यास एवं सिद्धि · Disciplined Practice
        </div>

        <h2
          id="gamification-section-title"
          className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight font-serif-heading"
          style={{ color: 'var(--text-primary)' }}
        >
          Motivation Rooted in Mastery
        </h2>

        <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal" style={{ color: 'var(--text-secondary)' }}>
          Gyan Quest designs progression strictly around educational psychology. We celebrate disciplined study, thoughtful inquiry, and real comprehension rather than superficial clicks.
        </p>
      </div>

      {/* 3 Serene Scholastic Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Purposeful XP */}
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
              <Zap className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>

            <div className="text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
              कर्मफल · Purposeful XP
            </div>

            <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Rewarded for Cognitive Depth
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Earn milestone XP through genuine effort: Vidya (10 XP), Shravan (5 XP), Manan (15 XP), and Pariksha (50 XP full score), summing to 80 XP per chapter mastered.
            </p>
          </div>

          <div className="pt-3 border-t text-xs font-mono font-semibold" style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}>
            80 Total Chapter Milestone XP
          </div>
        </div>

        {/* Card 2: Daily Sadhana (Streak) */}
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
              <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>

            <div className="text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
              नित्य साधना · Daily Habit
            </div>

            <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Unbroken Daily Practice
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Ancient scholars valued regular, uninterrupted daily study above all. Keep your flame burning by completing any reading, audio summary, or assessment daily.
            </p>
          </div>

          <div className="pt-3 border-t flex items-center justify-between text-xs font-medium" style={{ borderColor: 'var(--border-warm)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Active Streak:</span>
            {user ? (
              <button
                type="button"
                onClick={openStreakModal}
                className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {streak} Day{streak === 1 ? '' : 's'} 🔥
              </button>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Sign in to track
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Continuous Mastery */}
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
              <Award className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>

            <div className="text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
              सिद्धि · Concept Attainment
            </div>

            <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Curriculum Aligned
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Granular tracking across CBSE and custom textbook chapters. Clear visual indicators confirm which concepts are thoroughly internalized and ready for school exams.
            </p>
          </div>

          <div className="pt-3 border-t text-xs font-mono font-semibold" style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}>
            Durable Retention Over Cramming
          </div>
        </div>
      </div>
    </section>
  );
};

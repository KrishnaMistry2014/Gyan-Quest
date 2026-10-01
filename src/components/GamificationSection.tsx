import React from 'react';
import {
  Zap,
  TrendingUp,
  MapPin,
  Trophy,
  Flame,
  CheckCircle2,
  Sparkles,
  Award,
  Flag,
  Calendar,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const GamificationSection: React.FC = () => {
  const { user, streak, isStreakActiveToday, openStreakModal, openAuthModal } = useAuth();

  const xpRules = [
    { name: 'Vidya (विद्या)', xp: '10 XP', desc: 'Reading' },
    { name: 'Shravan (श्रवण)', xp: '5 XP', desc: 'Audio' },
    { name: 'Manan (मनन)', xp: '15 XP', desc: 'Reflection' },
    { name: 'Prashna (प्रश्न)', xp: '0 XP', desc: 'Optional' },
    { name: 'Pariksha (परीक्षा)', xp: '50 XP', desc: 'Full Score' },
  ];

  return (
    <section id="gamification" className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
          <Award className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          <span>MOTIVATION WITH PURPOSE</span>
        </div>

        <h2
          id="gamification-section-title"
          className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight font-serif-heading"
          style={{ color: 'var(--text-primary)' }}
        >
          Turn Learning Into a Quest
        </h2>

        <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Gyan Quest designs gamification strictly around educational psychology. We celebrate disciplined study, thoughtful inquiry, and real comprehension rather than endless superficial clicks.
        </p>
      </div>

      {/* Official Task XP Rules Ribbon (Matching screen.png) */}
      <div
        className="rounded-2xl border p-4 sm:p-5 mb-6 shadow-xs space-y-3"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="flex items-center justify-between text-xs pb-2.5 border-b" style={{ borderColor: 'var(--border-warm)' }}>
          <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--text-primary)' }}>
            <Award className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>Official Task XP Rules</span>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded border"
            style={{
              backgroundColor: 'var(--accent-saffron)',
              borderColor: 'var(--accent-saffron)',
              color: '#FFFFFF',
            }}
          >
            Max 80 XP / Chapter
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          {xpRules.map((rule) => (
            <div
              key={rule.name}
              className="p-2 sm:p-2.5 rounded-xl border transition-all"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div className="text-[11px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {rule.name}
              </div>
              <div className="text-sm font-bold my-0.5" style={{ color: 'var(--accent-saffron-text)' }}>
                {rule.xp}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                {rule.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5 Pedagogical Bento Cards (Row 1: 3 cards, Row 2: 2 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Card 1: Experience Points */}
        <div
          className="rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)', color: 'var(--text-secondary)' }}>
                5 TO 50 XP PER TASK
              </span>
            </div>
            <h3 className="text-base font-bold font-serif-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              Experience Points (XP)
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Earn purposeful XP through authentic intellectual effort: Vidya (10 XP), Shravan (5 XP), Manan (15 XP), Prashna (Optional / 0 XP), and Pariksha (50 XP full score).
            </p>
          </div>
          <div className="pt-2 border-t flex items-center gap-1.5 text-[11px] font-medium" style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rewards cognitive depth over guessing.</span>
          </div>
        </div>

        {/* Card 2: Continuous Progress */}
        <div
          className="rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)', color: 'var(--text-secondary)' }}>
                CBSE SYLLABUS BOUND
              </span>
            </div>
            <h3 className="text-base font-bold font-serif-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              Continuous Progress
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Track granular concept-level mastery across any CBSE subject. Clear visual completion indicators show how thoroughly each chapter is conquered.
            </p>
          </div>
          <div className="pt-2 border-t flex items-center gap-1.5 text-[11px] font-medium" style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Transparent concept-by-concept tracking.</span>
          </div>
        </div>

        {/* Card 3: Chapter Quests */}
        <div
          className="rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <Flag className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)', color: 'var(--text-secondary)' }}>
                FOCUSED STUDY WINDOWS
              </span>
            </div>
            <h3 className="text-base font-bold font-serif-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              Chapter Quests
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Large, intimidating NCERT textbooks are broken down into achievable 5-stage mini-quests that fit easily into 20–30 minute focused study windows.
            </p>
          </div>
          <div className="pt-2 border-t flex items-center gap-1.5 text-[11px] font-medium" style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}>
            <Clock className="w-3.5 h-3.5" />
            <span>Sequential clarity replacing overwhelm.</span>
          </div>
        </div>
      </div>

      {/* Row 2: 2 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 4: Scholarly Achievements */}
        <div
          className="rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)', color: 'var(--text-secondary)' }}>
                COMPETENCY BADGES
              </span>
            </div>
            <h3 className="text-base font-bold font-serif-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              Scholarly Achievements
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Unlock educational badges celebrating deep inquiry, consistent curiosity, and high diagnostic retention without superficial tricks or noise.
            </p>
          </div>
          <div className="pt-2 border-t flex items-center gap-1.5 text-[11px] font-medium" style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Meaningful proof of subject mastery.</span>
          </div>
        </div>

        {/* Card 5: Learning Streaks */}
        <div
          className="rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)', color: 'var(--text-secondary)' }}>
                DAILY PRACTICE RITUAL
              </span>
            </div>
            <h3 className="text-base font-bold font-serif-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              Learning Streaks
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Build sustainable study habits. A gentle streak counter celebrates steady daily presence without harsh penalties, promoting quiet daily reflection and consistency.
            </p>
          </div>
          <div className="pt-2 border-t flex items-center gap-1.5 text-[11px] font-medium" style={{ borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Encourages consistent daily reflection.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

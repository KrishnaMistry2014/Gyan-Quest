import React, { useState } from 'react';
import { X, Flame, Sparkles, CheckCircle2, Trophy, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCurrentWeekDays } from '../lib/streak';

interface StreakModalProps {
  onStartLearning?: () => void;
}

export const StreakModal: React.FC<StreakModalProps> = ({ onStartLearning }) => {
  const {
    isStreakModalOpen,
    closeStreakModal,
    streak,
    longestStreak,
    isStreakActiveToday,
    activeDays,
    claimDailyStreak,
  } = useAuth();

  const [isClaiming, setIsClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);

  if (!isStreakModalOpen) return null;

  const weekDays = getCurrentWeekDays(activeDays);

  const handleClaim = async () => {
    if (isStreakActiveToday || isClaiming) return;
    setIsClaiming(true);
    try {
      const success = await claimDailyStreak();
      if (success) {
        setJustClaimed(true);
        setTimeout(() => setJustClaimed(false), 4000);
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const handleGoLearn = () => {
    closeStreakModal();
    if (onStartLearning) {
      onStartLearning();
    }
  };

  return (
    <div
      id="streak-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeStreakModal();
      }}
    >
      <div
        id="streak-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="streak-modal-title"
        className="w-full max-w-lg rounded-[32px] border p-6 sm:p-8 shadow-2xl relative transition-all overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Ambient Warm Aura */}
        <div
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: 'var(--accent-saffron)' }}
        />

        {/* Close Button */}
        <button
          id="streak-modal-close"
          onClick={closeStreakModal}
          className="absolute top-4 right-4 p-2 rounded-xl transition-colors hover:opacity-80 active:scale-95 cursor-pointer z-10"
          style={{ backgroundColor: 'var(--bg-icon)', color: 'var(--text-primary)' }}
          aria-label="Close streak dialog"
        >
          <X className="w-5 h-5 text-current" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--border-warm)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Habit Mastery</span>
          </div>
        </div>

        {/* Big Flame & Hero Stats */}
        <div className="text-center py-2 sm:py-4">
          <div className="relative inline-flex items-center justify-center mb-3">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center border shadow-inner transition-transform ${
                isStreakActiveToday || justClaimed ? 'scale-105' : 'animate-pulse'
              }`}
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <Flame
                className={`w-12 h-12 sm:w-14 sm:h-14 transition-all ${
                  isStreakActiveToday || justClaimed
                    ? 'text-orange-500 fill-orange-500 drop-shadow-md'
                    : 'text-amber-500 fill-amber-400/60'
                }`}
              />
            </div>
            {(isStreakActiveToday || justClaimed) && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            )}
          </div>

          <h2 id="streak-modal-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {streak} {streak === 1 ? 'Day' : 'Days'} Streak
          </h2>

          <p className="text-xs sm:text-sm mt-1 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {justClaimed
              ? '🎉 Daily streak claimed! Your learning momentum is locked in.'
              : isStreakActiveToday
              ? 'Flame protected for today! Complete any quest stage to expand your mastery.'
              : streak > 0
              ? 'Check in or complete a learning quest today to extend your streak!'
              : 'Start your continuous learning journey today!'}
          </p>
        </div>

        {/* Weekly Activity Tracker */}
        <div
          className="rounded-2xl border p-4 my-4"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex items-center justify-between mb-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              This Week's Activity
            </span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--accent-saffron-text)' }}>
              {weekDays.filter((d) => d.isActive).length}/7 Days Active
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
            {weekDays.map((day) => {
              const active = day.isActive;
              return (
                <div key={day.dateStr} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    {day.dayLabel}
                  </span>
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all border ${
                      active
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : day.isToday
                        ? 'border-dashed border-orange-400 font-extrabold'
                        : 'border-transparent text-stone-400'
                    }`}
                    style={{
                      backgroundColor: active
                        ? 'var(--accent-saffron)'
                        : day.isToday
                        ? 'var(--accent-saffron-light)'
                        : 'transparent',
                      color: active ? '#FFFFFF' : day.isToday ? 'var(--accent-saffron-text)' : undefined,
                    }}
                    title={`${day.fullDayName} (${day.dateStr})${active ? ' - Active' : day.isToday ? ' - Today' : ''}`}
                  >
                    {active ? (
                      <Flame className="w-4 h-4 fill-current" />
                    ) : (
                      <span>{day.dayNumber}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-4 text-center">
          <div
            className="p-3 rounded-2xl border"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Current
            </div>
            <div className="text-lg sm:text-xl font-extrabold mt-0.5" style={{ color: 'var(--accent-saffron-text)' }}>
              {streak}d
            </div>
          </div>

          <div
            className="p-3 rounded-2xl border"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <Trophy className="w-3 h-3 text-amber-500" />
              <span>Record</span>
            </div>
            <div className="text-lg sm:text-xl font-extrabold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {longestStreak}d
            </div>
          </div>

          <div
            className="p-3 rounded-2xl border"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Status</span>
            </div>
            <div className="text-xs sm:text-sm font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
              {isStreakActiveToday || justClaimed ? 'Secured' : 'Pending'}
            </div>
          </div>
        </div>

        {/* Interactive Action Area */}
        <div className="space-y-2.5 pt-2">
          {!isStreakActiveToday && !justClaimed ? (
            <button
              type="button"
              id="btn-claim-daily-streak"
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-sm font-bold shadow-md transition-all hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <Flame className="w-4 h-4 fill-current text-white" />
              <span>{isClaiming ? 'Securing Streak...' : 'Claim Today\'s Streak (+1 Day)'}</span>
            </button>
          ) : (
            <div
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-semibold border"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Streak secured for today! Come back tomorrow for Day {streak + 1}.</span>
            </div>
          )}

          <button
            type="button"
            id="btn-streak-continue-quest"
            onClick={handleGoLearn}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-semibold border transition-all hover:opacity-90 active:scale-[0.99] cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
          >
            <span>Practice Chapter & Earn XP</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Gentle Pedagogy Note */}
        <p className="text-[11px] text-center mt-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Gyan Quest daily streaks celebrate steady presence without anxiety. Completing Vidya reading, Shravan listening, or Pariksha tests automatically maintains your streak.
        </p>
      </div>
    </div>
  );
};

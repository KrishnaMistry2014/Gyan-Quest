import React, { useState, useEffect } from 'react';
import {
  Timer,
  Clock,
  Footprints,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Volume2,
  BookOpen,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { playMindfulChime } from '../lib/chime';

interface FocusModeViewProps {
  onNavigateMyBooks?: () => void;
  onOpenSettingsModal?: () => void;
}

export const FocusModeView: React.FC<FocusModeViewProps> = ({
  onNavigateMyBooks,
  onOpenSettingsModal,
}) => {
  const { user, streak, openStreakModal, settings } = useAuth();
  const { t } = useLanguage();

  // Active Timer state
  const [selectedMinutes, setSelectedMinutes] = useState<number>(() => {
    const raw = localStorage.getItem('gyanquest_focus_mode_minutes') || '25';
    const parsed = parseInt(raw, 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : 25;
  });

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(selectedMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('gyanquest_focus_sessions_today') || '0', 10);
    } catch (_) {
      return 0;
    }
  });

  // Adjust timeLeft when user changes duration while timer is stopped
  const handleSelectMinutes = (mins: number) => {
    setSelectedMinutes(mins);
    if (!isRunning) {
      setTimeLeftSeconds(mins * 60);
    }
    localStorage.setItem('gyanquest_focus_mode_minutes', String(mins));
    window.dispatchEvent(new Event('gyanquest_focus_mode_changed'));
  };

  // Timer Tick
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          // Play chime sound
          playMindfulChime();
          // Dispatch break event to trigger FocusBreakOverlay
          window.dispatchEvent(new Event('gyanquest_force_focus_break'));
          setCompletedSessions((c) => {
            const next = c + 1;
            localStorage.setItem('gyanquest_focus_sessions_today', String(next));
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleToggleTimer = () => {
    if (timeLeftSeconds === 0) {
      setTimeLeftSeconds(selectedMinutes * 60);
    }
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeftSeconds(selectedMinutes * 60);
  };

  const handleTestChime = () => {
    playMindfulChime();
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(0, Math.min(100, ((selectedMinutes * 60 - timeLeftSeconds) / (selectedMinutes * 60)) * 100));

  return (
    <div id="focus-mode-view" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div
        className="rounded-3xl border p-6 sm:p-10 relative overflow-hidden shadow-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{t.digitalWellness}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              {t.focusModeTitle}
            </h1>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {t.focusModeSubtitle}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3">
            <div
              className="p-4 rounded-2xl border text-center min-w-[130px]"
              style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-warm)' }}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                {t.sessionsToday}
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums" style={{ color: 'var(--accent-saffron-text)' }}>
                {completedSessions}
              </span>
            </div>

            {user && (
              <button
                type="button"
                onClick={openStreakModal}
                className="p-4 rounded-2xl border text-center min-w-[130px] hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-warm)' }}
                title="View Streak Details"
              >
                <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  {t.activeStreakBadge}
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                  <span>🔥</span>
                  <span>{streak}d</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Focus Timer Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Timer Display */}
        <div
          className="lg:col-span-7 rounded-3xl border p-6 sm:p-10 shadow-xs space-y-6 flex flex-col items-center text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          {/* Duration Selector Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[15, 25, 40, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleSelectMinutes(mins)}
                disabled={isRunning}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  selectedMinutes === mins
                    ? 'shadow-xs border'
                    : 'hover:opacity-80'
                } ${isRunning ? 'opacity-60 cursor-not-allowed' : ''}`}
                style={{
                  backgroundColor: selectedMinutes === mins ? 'var(--accent-saffron)' : 'var(--bg-card-subtle)',
                  borderColor: selectedMinutes === mins ? 'var(--accent-saffron)' : 'var(--border-warm)',
                  color: selectedMinutes === mins ? '#FFFFFF' : 'var(--text-primary)',
                }}
              >
                {mins} mins
              </button>
            ))}
          </div>

          {/* Big Countdown Clock */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex flex-col items-center justify-center my-4">
            {/* Circular Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-current"
                strokeWidth="6"
                fill="transparent"
                style={{ color: 'var(--bg-card-subtle)' }}
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-current transition-all duration-1000 ease-linear"
                strokeWidth="6"
                strokeDasharray={276}
                strokeDashoffset={276 - (276 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
                style={{ color: 'var(--accent-saffron)' }}
              />
            </svg>

            {/* Time readout in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {formatTime(timeLeftSeconds)}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isRunning ? 'var(--accent-saffron)' : 'var(--text-muted)' }}>
                {isRunning ? 'Session Active' : 'Ready to Focus'}
              </span>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleTimer}
              className="px-6 py-3 rounded-2xl text-sm font-bold shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-2"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isRunning ? t.pauseFocusTimer : t.startFocusTimer}</span>
            </button>

            <button
              type="button"
              onClick={handleResetTimer}
              className="p-3 rounded-2xl border transition-all hover:opacity-80 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleTestChime}
              className="p-3 rounded-2xl border transition-all hover:opacity-80 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
              title="Test Temple Chime Audio"
              aria-label="Test Temple Chime Audio"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Principles & Quick Actions */}
        <div className="lg:col-span-5 space-y-5">
          {/* Walking Pause Explanation */}
          <div
            className="p-6 rounded-3xl border space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex items-center gap-2.5 font-bold text-sm" style={{ color: 'var(--accent-saffron-text)' }}>
              <Footprints className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t.mandatoryPause}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              When your timer elapses, your screen blurs with a calm breathing animation. Stand up, drink water, and walk around for 180 seconds. Physical circulation oxygenates the brain and cements information in long-term memory.
            </p>
          </div>

          {/* Quick Navigation to Study Material */}
          <div
            className="p-6 rounded-3xl border space-y-4"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <h3 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              {t.readyToStudy}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Keep this Focus timer active while reading your uploaded NCERT textbooks or listening to Shravan audio recitations.
            </p>

            <div className="flex flex-col gap-2.5 pt-1">
              {onNavigateMyBooks && (
                <button
                  type="button"
                  onClick={onNavigateMyBooks}
                  className="w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all hover:opacity-90 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{t.openMyBooks}</span>
                  </div>
                  <span>→</span>
                </button>
              )}

              {onOpenSettingsModal && (
                <button
                  type="button"
                  onClick={onOpenSettingsModal}
                  className="w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all hover:opacity-90 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{t.configureFocus}</span>
                  </div>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { BookOpen, Zap, Flame, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onResumeLearning?: () => void;
  onStartLearning?: () => void;
  onPdfUpload?: (file: File) => void;
  onNavigatePariksha?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onResumeLearning, onStartLearning }) => {
  const { streak, isStreakActiveToday, openStreakModal, profile } = useAuth();

  return (
    <div id="gyan-dashboard" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8 relative">
      {/* Three responsive rounded-square cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card 1: Start Learning / Resume Learning */}
        <div
          id="card-start-learning"
          className="aspect-square rounded-3xl border p-6 sm:p-8 shadow-sm flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron)',
              }}
            >
              <BookOpen className="w-6 h-6" />
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-secondary)',
              }}
            >
              Active Quest
            </span>
          </div>

          <div className="space-y-3 pt-4">
            <button
              type="button"
              id="btn-card-start-learning"
              onClick={onStartLearning}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 hover:scale-[1.02] hover:shadow-md active:scale-[0.99] cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-card-resume-learning"
              onClick={onResumeLearning}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 hover:scale-[1.02] hover:shadow-md active:scale-[0.99] cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <span>Resume Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: XP */}
        <div
          id="card-xp"
          className="aspect-square rounded-3xl border p-6 sm:p-8 shadow-sm flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron)',
              }}
            >
              <Zap className="w-6 h-6 fill-current text-amber-500" />
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-secondary)',
              }}
            >
              Mastery Score
            </span>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>
              XP
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {profile?.xp || 0} XP
            </div>
            <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              Vidya (10), Shravan (5), Manan (15), Pariksha (50)
            </p>
          </div>

          <div className="text-xs font-medium" style={{ color: 'var(--accent-saffron-text)' }}>
            Earn up to 80 XP per completed chapter
          </div>
        </div>

        {/* Card 3: Daily Streak */}
        <div
          id="card-daily-streak"
          onClick={openStreakModal}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openStreakModal();
            }
          }}
          aria-label={`Daily Streak: ${streak} days. Click to view streak details.`}
          className="aspect-square rounded-3xl border p-6 sm:p-8 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:border-orange-400 hover:shadow-md group focus:outline-none focus:ring-2 focus:ring-orange-400"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 ${
                isStreakActiveToday ? '' : 'animate-pulse'
              }`}
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron)',
              }}
            >
              <Flame className="w-6 h-6 fill-current text-orange-500" />
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border transition-colors group-hover:border-orange-400"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-secondary)',
              }}
            >
              {isStreakActiveToday ? 'Protected' : 'Daily Habit'}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Daily Streak
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-baseline gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>{streak}</span>
              <span className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                {streak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              {isStreakActiveToday
                ? 'Active today • Your momentum is safe!'
                : 'Practice a chapter today to build your streak!'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs font-semibold" style={{ color: 'var(--accent-saffron-text)' }}>
              {isStreakActiveToday ? 'Streak Safe' : 'Daily Habit'}
            </div>
            <div
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all group-hover:scale-105 shadow-xs"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <span>View Streak</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

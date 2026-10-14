import React from 'react';
import {
  Home,
  RotateCcw,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Eye,
  EyeOff,
  BookOpen
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { vedicAudio } from '../../utils/gitaAudio';

interface PuzzleHeaderProps {
  scoreXP: number;
  placedCount: number;
  totalPieces: number;
  showGhostHint: boolean;
  onToggleGhostHint: () => void;
  onRestart: () => void;
  onHome: () => void;
  onOpenReader?: () => void;
}

export const PuzzleHeader: React.FC<PuzzleHeaderProps> = ({
  scoreXP,
  placedCount,
  totalPieces,
  showGhostHint,
  onToggleGhostHint,
  onRestart,
  onHome,
  onOpenReader,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [isMuted, setIsMuted] = React.useState(vedicAudio.muted);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    vedicAudio.muted = nextMuted;
    if (!nextMuted) {
      vedicAudio.playKeyType();
    }
  };

  const progressPercent = Math.round((placedCount / totalPieces) * 100);

  return (
    <header className="w-full space-y-4">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Home and Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-puzzle-home"
            onClick={onHome}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
            title="Return to Home Dashboard"
          >
            <Home className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Home</span>
          </button>

          {onOpenReader && (
            <button
              type="button"
              id="btn-puzzle-open-reader"
              onClick={onOpenReader}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
              title="Read Chapter 6: Balance in Every Day"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Chapter 6 Wisdom</span>
            </button>
          )}
        </div>

        {/* Right: Sound, Hint, Theme, and Restart */}
        <div className="flex items-center gap-2">
          {/* Ghost Hint Toggle */}
          <button
            type="button"
            id="btn-puzzle-hint"
            onClick={onToggleGhostHint}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showGhostHint ? 'ring-1 ring-amber-500 font-bold' : 'opacity-85 hover:opacity-100'
            }`}
            style={{
              backgroundColor: showGhostHint ? 'var(--accent-saffron-light)' : 'var(--bg-card)',
              borderColor: showGhostHint ? 'var(--accent-saffron)' : 'var(--border-warm)',
              color: showGhostHint ? 'var(--accent-saffron-text)' : 'var(--text-secondary)',
            }}
            title={showGhostHint ? 'Hide background guide' : 'Show faint guide'}
          >
            {showGhostHint ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Guide On</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Guide</span>
              </>
            )}
          </button>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            id="btn-puzzle-mute"
            onClick={handleToggleMute}
            className="p-2 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-secondary)',
            }}
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-stone-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
          </button>

          {/* Surya / Chandra Light Switcher */}
          <button
            type="button"
            id="btn-puzzle-theme"
            onClick={() => {
              toggleTheme();
              vedicAudio.playKeyType();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer hover:scale-102 active:scale-98 shadow-2xs"
            style={{
              backgroundColor: isDark ? '#2B2117' : '#FEF3C7',
              borderColor: isDark ? '#D97706' : '#FDE68A',
              color: isDark ? '#FBBF24' : '#92400E',
            }}
            title={isDark ? 'Switch to Surya (Light) mode' : 'Switch to Chandra (Dark) mode'}
          >
            {isDark ? (
              <>
                <Moon className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span className="hidden sm:inline">Chandra</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 fill-current text-amber-600" />
                <span className="hidden sm:inline">Surya</span>
              </>
            )}
          </button>

          {/* Restart Button */}
          <button
            type="button"
            id="btn-puzzle-restart"
            onClick={onRestart}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-2xs"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--accent-saffron)',
            }}
            title="Reshuffle pieces and reset puzzle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Main Title and Stats Header Banner */}
      <div
        className="rounded-3xl border p-4 sm:p-6 shadow-xs relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title & Subtitle */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono"
                style={{
                  backgroundColor: 'var(--accent-saffron-light)',
                  color: 'var(--accent-saffron-text)',
                }}
              >
                GyanQuest Jigsaw
              </span>
              <span
                className="text-[11px] font-semibold flex items-center gap-1"
                style={{ color: 'var(--text-muted)' }}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Bhagavad Gita 6.17</span>
              </span>
            </div>

            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif-heading"
              style={{ color: 'var(--text-primary)' }}
            >
              Harmony of Life
            </h1>
            <p
              className="text-xs sm:text-sm mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Balance in Every Day — Assemble the sacred sacred artwork
            </p>
          </div>

          {/* XP & Progress Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {/* XP Award Counter */}
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Earned XP
                </span>
                <span
                  className="block text-base sm:text-lg font-black font-mono leading-none"
                  style={{ color: 'var(--accent-saffron-text)' }}
                >
                  +{scoreXP} XP
                </span>
              </div>
            </div>

            {/* Pieces Progress Counter */}
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Progress
                </span>
                <span
                  className="block text-base sm:text-lg font-bold font-mono leading-none"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {placedCount} / {totalPieces}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: 'var(--text-muted)' }}>
              {placedCount === totalPieces
                ? 'All pieces in harmony!'
                : `${totalPieces - placedCount} pieces left to place`}
            </span>
            <span className="font-mono font-bold" style={{ color: 'var(--accent-saffron-text)' }}>
              {progressPercent}% Complete
            </span>
          </div>

          <div
            className="w-full h-2.5 rounded-full overflow-hidden border"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                background:
                  progressPercent === 100
                    ? 'linear-gradient(90deg, #10B981, #059669)'
                    : 'linear-gradient(90deg, #F59E0B, #D97706)',
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

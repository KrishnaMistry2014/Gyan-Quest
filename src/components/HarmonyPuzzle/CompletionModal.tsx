import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  Zap,
  RotateCcw,
  BookOpen,
  Home,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { vedicAudio } from '../../utils/gitaAudio';

interface CompletionModalProps {
  isOpen: boolean;
  scoreXP: number;
  totalPieces: number;
  completedImageSrc: string;
  onPlayAgain: () => void;
  onHome: () => void;
  onOpenReader?: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  scoreXP,
  totalPieces,
  completedImageSrc,
  onPlayAgain,
  onHome,
  onOpenReader,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Play full victory raag fanfare
      vedicAudio.playVictoryChime();

      // Launch joyful celebratory confetti burst
      try {
        const count = 200;
        const defaults = {
          origin: { y: 0.65 },
          colors: ['#F59E0B', '#10B981', '#FBBF24', '#34D399', '#D97706'],
        };

        function fire(particleRatio: number, opts: confetti.Options) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        }

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
        });
        fire(0.2, {
          spread: 60,
        });
        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8,
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2,
        });
        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        });
      } catch {
        // Fallback if canvas-confetti is unavailable
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
      <div
        className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Celebration Banner */}
        <div className="relative bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-800 text-white p-6 text-center overflow-hidden">
          <div className="relative z-10 flex flex-col items-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-amber-200 shadow-md">
              <Trophy className="w-8 h-8 fill-current" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Puzzle Completed</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-serif-heading">
              Wonderful! You restored the Harmony of Life!
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 max-w-md">
              Every piece of your day has found its rightful place in divine balance.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Completed Image Showcase */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-lg group">
            <img
              src={completedImageSrc}
              alt="Completed Harmony of Life artwork"
              className="w-full h-auto object-cover max-h-[260px] mx-auto block"
            />
            <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full Artwork Restored</span>
            </div>
          </div>

          {/* Stats Badges Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-3.5 rounded-2xl border text-center"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto mb-1 flex items-center justify-center">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="block text-[11px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Total XP Earned
              </span>
              <span className="block text-xl font-black font-mono" style={{ color: 'var(--accent-saffron-text)' }}>
                +{scoreXP} XP
              </span>
            </div>

            <div
              className="p-3.5 rounded-2xl border text-center"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto mb-1 flex items-center justify-center">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <span className="block text-[11px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Pieces Assembled
              </span>
              <span className="block text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                {totalPieces} / {totalPieces}
              </span>
            </div>
          </div>

          {/* Gita 6.17 Wisdom Lesson */}
          <div
            className="p-4 rounded-2xl border text-xs space-y-1.5"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--accent-saffron-text)' }}>
              <BookOpen className="w-3.5 h-3.5" />
              <span>Wisdom from Bhagavad Gita 6.17</span>
            </div>
            <p className="font-serif italic" style={{ color: 'var(--text-primary)' }}>
              "yuktāhāra-vihārasya yukta-ceṣṭasya karmasu..."
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Just like every puzzle tile has its exact place, balance in your food, sleep, study, and play harmonizes your mind and frees you from all stress.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              id="btn-puzzle-play-again"
              onClick={onPlayAgain}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
              }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again (Reshuffle Pieces)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {onOpenReader && (
                <button
                  type="button"
                  id="btn-puzzle-completion-reader"
                  onClick={onOpenReader}
                  className="py-2.5 px-3 rounded-xl font-semibold text-xs border transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Read Chapter 6</span>
                </button>
              )}

              <button
                type="button"
                id="btn-puzzle-completion-home"
                onClick={onHome}
                className="py-2.5 px-3 rounded-xl font-semibold text-xs border transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                <Home className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Home Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Footprints, Sparkles, Clock, EyeOff, AlertTriangle, Maximize2 } from 'lucide-react';
import {
  playMindfulChime,
  playLoudFocusWarningChime,
  requestAppFullscreen,
} from '../lib/chime';

const BREAK_DURATION_SECONDS = 180; // 3 minutes (180 seconds)

/**
 * Checks if a break countdown was in progress before reload.
 */
function getInitialBreakState() {
  try {
    const storedBreakEnd = localStorage.getItem('gyanquest_break_end_time');
    if (storedBreakEnd) {
      const endTime = parseInt(storedBreakEnd, 10);
      const diffSeconds = Math.ceil((endTime - Date.now()) / 1000);
      if (diffSeconds > 0) {
        return { active: true, remaining: Math.min(BREAK_DURATION_SECONDS, diffSeconds) };
      } else {
        localStorage.removeItem('gyanquest_break_end_time');
      }
    }
  } catch (_) {}
  return { active: false, remaining: BREAK_DURATION_SECONDS };
}

/**
 * Halts any active audio narration, speech synthesis, and broadcasts events
 * to stop in-progress learning activities when the break triggers.
 */
function stopAllActiveOperations() {
  try {
    const audios = document.querySelectorAll('audio');
    audios.forEach((audioEl) => {
      try {
        audioEl.pause();
      } catch (_) {}
    });
  } catch (err) {
    console.debug('Error pausing document audio:', err);
  }

  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch (_) {}

  try {
    window.dispatchEvent(new CustomEvent('gyanquest_stop_activity'));
    window.dispatchEvent(new CustomEvent('gyanquest_break_started'));
  } catch (_) {}
}

export const FocusBreakOverlay: React.FC = () => {
  const [isBreakActive, setIsBreakActive] = useState(() => getInitialBreakState().active);
  const [remainingSeconds, setRemainingSeconds] = useState(() => getInitialBreakState().remaining);
  const [isFocusModeActive, setIsFocusModeActive] = useState<boolean>(() => {
    return localStorage.getItem('gyanquest_focus_mode_active') === 'true';
  });

  // Warning states ONLY active when Focus Mode is ON
  const [leftFullscreenWarning, setLeftFullscreenWarning] = useState<boolean>(false);
  const [leftTabWarning, setLeftTabWarning] = useState<boolean>(false);

  const breakCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const warningChimeLoopRef = useRef<NodeJS.Timeout | null>(null);
  const originalTitleRef = useRef<string>(document.title || 'Gyan Quest');

  const triggerThreeMinuteBreak = useCallback(() => {
    stopAllActiveOperations();

    // Mark Focus Mode session completed and start mandatory 3-minute break
    localStorage.setItem('gyanquest_focus_mode_active', 'false');
    localStorage.removeItem('gyanquest_focus_end_time');
    try {
      const prevSessions = parseInt(localStorage.getItem('gyanquest_focus_sessions_today') || '0', 10);
      localStorage.setItem('gyanquest_focus_sessions_today', String((isNaN(prevSessions) ? 0 : prevSessions) + 1));
    } catch (_) {}

    const breakEndTime = Date.now() + BREAK_DURATION_SECONDS * 1000;
    localStorage.setItem('gyanquest_break_end_time', String(breakEndTime));

    setIsFocusModeActive(false);
    setLeftFullscreenWarning(false);
    setLeftTabWarning(false);
    setIsBreakActive(true);
    setRemainingSeconds(BREAK_DURATION_SECONDS);

    playLoudFocusWarningChime();
    playMindfulChime();
    window.dispatchEvent(new Event('gyanquest_focus_state_changed'));
  }, []);

  // Sync Focus Mode active status
  useEffect(() => {
    const handleStateChange = () => {
      const active = localStorage.getItem('gyanquest_focus_mode_active') === 'true';
      setIsFocusModeActive(active);
      if (!active) {
        setLeftFullscreenWarning(false);
        setLeftTabWarning(false);
        document.title = originalTitleRef.current;
      } else {
        // Ensure fullscreen when Focus Mode turns on
        const isFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
        if (!isFs) {
          requestAppFullscreen().then((entered) => {
            if (!entered && !document.fullscreenElement) {
              setLeftFullscreenWarning(true);
              playLoudFocusWarningChime();
            }
          });
        }
      }
    };

    const handleForceBreak = () => {
      triggerThreeMinuteBreak();
    };

    window.addEventListener('gyanquest_focus_state_changed', handleStateChange);
    window.addEventListener('gyanquest_force_focus_break', handleForceBreak);
    window.addEventListener('storage', handleStateChange);
    return () => {
      window.removeEventListener('gyanquest_focus_state_changed', handleStateChange);
      window.removeEventListener('gyanquest_force_focus_break', handleForceBreak);
      window.removeEventListener('storage', handleStateChange);
    };
  }, [triggerThreeMinuteBreak]);

  // Monitor Focus Mode countdown globally so the 3-minute break triggers even if user is on another view
  useEffect(() => {
    if (!isFocusModeActive || isBreakActive) return;

    const interval = setInterval(() => {
      const endRaw = localStorage.getItem('gyanquest_focus_end_time');
      if (!endRaw) return;
      const endTime = parseInt(endRaw, 10);
      if (Date.now() >= endTime) {
        clearInterval(interval);
        triggerThreeMinuteBreak();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isFocusModeActive, isBreakActive, triggerThreeMinuteBreak]);

  // STRICT FOCUS MODE ENFORCEMENT (Fullscreen + Tab-Leave Detection & Prevention)
  // ONLY active when isFocusModeActive === true
  useEffect(() => {
    if (!isFocusModeActive) {
      setLeftFullscreenWarning(false);
      setLeftTabWarning(false);
      document.title = originalTitleRef.current;
      return;
    }

    const handleFullscreenChange = () => {
      const isActiveNow = localStorage.getItem('gyanquest_focus_mode_active') === 'true';
      if (!isActiveNow) return;

      const isFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isFs) {
        setLeftFullscreenWarning(true);
        playLoudFocusWarningChime();
      } else {
        setLeftFullscreenWarning(false);
      }
    };

    const handleVisibilityChange = () => {
      const isActiveNow = localStorage.getItem('gyanquest_focus_mode_active') === 'true';
      if (!isActiveNow) return;

      if (document.hidden) {
        setLeftTabWarning(true);
        document.title = '⚠️ RETURN TO GYAN QUEST — FOCUS MODE ACTIVE!';
        playLoudFocusWarningChime();
        try {
          window.focus();
        } catch (_) {}
      } else {
        document.title = originalTitleRef.current;
        playLoudFocusWarningChime();
      }
    };

    const handleWindowBlur = () => {
      const isActiveNow = localStorage.getItem('gyanquest_focus_mode_active') === 'true';
      if (!isActiveNow) return;

      setLeftTabWarning(true);
      document.title = '⚠️ RETURN TO GYAN QUEST — FOCUS MODE ACTIVE!';
      playLoudFocusWarningChime();
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isActiveNow = localStorage.getItem('gyanquest_focus_mode_active') === 'true';
      if (!isActiveNow) return;
      playLoudFocusWarningChime();
      e.preventDefault();
      e.returnValue = 'Focus Mode is active! Please stay on the Gyan Quest tab until your study timer completes.';
      return e.returnValue;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isActiveNow = localStorage.getItem('gyanquest_focus_mode_active') === 'true';
      if (!isActiveNow) return;
      if (
        e.key === 'Escape' ||
        ((e.ctrlKey || e.metaKey) && ['w', 'W', 't', 'T', 'n', 'N'].includes(e.key)) ||
        (e.altKey && e.key === 'F4')
      ) {
        e.preventDefault();
        e.stopPropagation();
        playLoudFocusWarningChime();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.title = originalTitleRef.current;
    };
  }, [isFocusModeActive]);

  // Repeating loud full-volume chime while warning is active (left fullscreen or left tab while Focus Mode is ON)
  useEffect(() => {
    if (isFocusModeActive && (leftFullscreenWarning || leftTabWarning)) {
      warningChimeLoopRef.current = setInterval(() => {
        playLoudFocusWarningChime();
      }, 3000);
    } else if (warningChimeLoopRef.current) {
      clearInterval(warningChimeLoopRef.current);
      warningChimeLoopRef.current = null;
    }

    return () => {
      if (warningChimeLoopRef.current) {
        clearInterval(warningChimeLoopRef.current);
        warningChimeLoopRef.current = null;
      }
    };
  }, [isFocusModeActive, leftFullscreenWarning, leftTabWarning]);

  // 3-minute break countdown handler - precise timestamp comparison every 250ms
  useEffect(() => {
    if (!isBreakActive) {
      return;
    }

    stopAllActiveOperations();

    const countdown = setInterval(() => {
      try {
        const storedEnd = localStorage.getItem('gyanquest_break_end_time');
        const endTime = storedEnd ? parseInt(storedEnd, 10) : 0;
        const now = Date.now();
        const diff = Math.ceil((endTime - now) / 1000);

        if (diff <= 0 || !storedEnd) {
          clearInterval(countdown);
          localStorage.removeItem('gyanquest_break_end_time');
          playMindfulChime();
          setIsBreakActive(false);

          try {
            window.dispatchEvent(new CustomEvent('gyanquest_break_ended'));
          } catch (_) {}

          setRemainingSeconds(BREAK_DURATION_SECONDS);
          return;
        }

        setRemainingSeconds(diff);
      } catch (_) {
        setRemainingSeconds((prev) => Math.max(0, prev - 1));
      }
    }, 250);

    breakCountdownRef.current = countdown;
    return () => clearInterval(countdown);
  }, [isBreakActive]);

  // Prevent closing via Escape during mandatory 3-min break
  useEffect(() => {
    if (!isBreakActive) return;
    const preventEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', preventEscape, true);
    return () => window.removeEventListener('keydown', preventEscape, true);
  }, [isBreakActive]);

  // 1. Render Fullscreen / Tab-Leave Warning Modal when Focus Mode is ON and student leaves fullscreen or tab
  if (isFocusModeActive && (leftFullscreenWarning || leftTabWarning) && !isBreakActive) {
    return (
      <aside
        id="focus-mode-violation-warning"
        aria-label="Focus Mode Warning"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-2xl bg-red-950/90 text-white select-none animate-in fade-in"
      >
        <div className="w-full max-w-lg rounded-[32px] border-2 border-red-400 bg-stone-950 p-8 sm:p-10 text-center shadow-2xl flex flex-col items-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 animate-bounce">
            <AlertTriangle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
              Focus Mode Alert
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-heading text-white">
              {leftFullscreenWarning
                ? 'Warning: Fullscreen Mode Required!'
                : 'Warning: Do Not Leave the Gyan Quest Tab!'}
            </h2>

            <p className="text-xs sm:text-sm text-red-100 leading-relaxed max-w-md mx-auto">
              {leftFullscreenWarning
                ? 'Focus Mode forces full screen study. You exited fullscreen mode while your Focus Mode timer is active. Return to fullscreen immediately to stop the alert chime.'
                : 'Switching tabs or leaving the Gyan Quest window is not allowed while Focus Mode is on. Stay focused on your study session!'}
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              await requestAppFullscreen();
              setLeftFullscreenWarning(false);
              setLeftTabWarning(false);
              document.title = originalTitleRef.current;
            }}
            className="w-full py-4 px-6 rounded-2xl text-sm sm:text-base font-extrabold text-white shadow-xl transition-transform hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-500"
          >
            <Maximize2 className="w-5 h-5" />
            <span>Return to Fullscreen Focus Mode</span>
          </button>
        </div>
      </aside>
    );
  }

  // 2. Render 3-Minute Walk Around Break Screen when Focus Mode Timer Elapses
  if (!isBreakActive) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((BREAK_DURATION_SECONDS - remainingSeconds) / BREAK_DURATION_SECONDS) * 100;

  return (
    <aside
      id="focus-break-screen-blur"
      aria-label="Focus Break & Walking Pause"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl bg-black/85 text-white select-none transition-all duration-700 animate-in fade-in cursor-default"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        id="focus-break-card"
        className="w-full max-w-lg rounded-[36px] border border-amber-500/40 bg-stone-900/95 p-8 sm:p-10 text-center shadow-2xl relative flex flex-col items-center space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Mindful Walking Icon */}
        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
          <Footprints className="w-10 h-10 animate-pulse text-amber-400" />
        </div>

        {/* Heading & Instructions */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Focus Mode Completed</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-amber-100">
            Mandatory Walking & Eye Rest
          </h2>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-md mx-auto">
            Your focus study session has elapsed. Ongoing narration and learning tasks have been paused. Please step away from your screen and take a <strong>full 3-minute break</strong> to rest your eyes and walk around.
          </p>
        </div>

        {/* 3-Minute Countdown Display */}
        <div className="w-full py-4 px-6 rounded-2xl bg-black/50 border border-stone-800 space-y-3">
          <div className="flex items-center justify-center gap-2 text-stone-400 text-xs font-semibold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Walking Pause Countdown</span>
          </div>

          <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-widest text-amber-400">
            {formattedTime}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-amber-600 to-amber-400 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Wellness Prompts */}
        <div className="grid grid-cols-2 gap-2.5 w-full text-left text-xs">
          <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/50 flex items-center gap-2.5 text-stone-300">
            <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Look 20 feet away to rest eye muscles</span>
          </div>
          <div className="p-3 rounded-xl bg-stone-800/60 border border-stone-700/50 flex items-center gap-2.5 text-stone-300">
            <Footprints className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Take 100 gentle steps around your room</span>
          </div>
        </div>
      </div>
    </aside>
  );
};


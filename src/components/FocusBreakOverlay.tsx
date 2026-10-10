import React, { useState, useEffect, useRef } from 'react';
import { Footprints, Sparkles, Clock, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playMindfulChime } from '../lib/chime';

const BREAK_DURATION_SECONDS = 180; // 3 minutes

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
        return { active: true, remaining: diffSeconds };
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
  // Pause all playing audio elements across the document
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

  // Cancel any browser Web Speech synthesis
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch (_) {}

  // Broadcast window events to notify learning pages and modals
  try {
    window.dispatchEvent(new CustomEvent('gyanquest_stop_activity'));
    window.dispatchEvent(new CustomEvent('gyanquest_break_started'));
  } catch (_) {}
}

export const FocusBreakOverlay: React.FC = () => {
  const { user, isEmailUnverified } = useAuth();
  const [isBreakActive, setIsBreakActive] = useState(() => getInitialBreakState().active);
  const [remainingSeconds, setRemainingSeconds] = useState(() => getInitialBreakState().remaining);
  const [focusSetting, setFocusSetting] = useState<string>(() => {
    return localStorage.getItem('gyanquest_focus_mode_minutes') || 'none';
  });

  const sessionStartRef = useRef<number>(Date.now());
  const timerCheckRef = useRef<NodeJS.Timeout | null>(null);
  const breakCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const hasChimedBreakStartRef = useRef<boolean>(false);

  // Read current focus mode configuration from localStorage
  const getFocusMinutes = (): number | null => {
    const raw = localStorage.getItem('gyanquest_focus_mode_minutes') || 'none';
    if (raw === 'none' || raw === 'no_limit') return null;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
  };

  // Listen to focus mode updates from SettingsModal
  useEffect(() => {
    const handleSettingChange = () => {
      const updated = localStorage.getItem('gyanquest_focus_mode_minutes') || 'none';
      setFocusSetting(updated);
    };

    window.addEventListener('gyanquest_focus_mode_changed', handleSettingChange);
    window.addEventListener('gyanquest_settings_applied', handleSettingChange);
    window.addEventListener('storage', handleSettingChange);
    return () => {
      window.removeEventListener('gyanquest_focus_mode_changed', handleSettingChange);
      window.removeEventListener('gyanquest_settings_applied', handleSettingChange);
      window.removeEventListener('storage', handleSettingChange);
    };
  }, []);

  // When user signs in or app reloads, initialize session start timestamp & verify break state
  useEffect(() => {
    if (user && !isEmailUnverified) {
      // Check if break is currently still active from storage
      const storedBreakEnd = localStorage.getItem('gyanquest_break_end_time');
      if (storedBreakEnd) {
        const endTime = parseInt(storedBreakEnd, 10);
        const diffSeconds = Math.ceil((endTime - Date.now()) / 1000);
        if (diffSeconds > 0) {
          setIsBreakActive(true);
          setRemainingSeconds(diffSeconds);
          stopAllActiveOperations();
        } else {
          localStorage.removeItem('gyanquest_break_end_time');
          setIsBreakActive(false);
        }
      }

      const storedStart = localStorage.getItem('gq_session_signin_time') || sessionStorage.getItem('gq_session_signin_time');
      if (storedStart) {
        sessionStartRef.current = parseInt(storedStart, 10);
      } else {
        sessionStartRef.current = Date.now();
        localStorage.setItem('gq_session_signin_time', String(sessionStartRef.current));
        sessionStorage.setItem('gq_session_signin_time', String(sessionStartRef.current));
      }
    } else {
      localStorage.removeItem('gq_session_signin_time');
      sessionStorage.removeItem('gq_session_signin_time');
      localStorage.removeItem('gyanquest_break_end_time');
      setIsBreakActive(false);
    }
  }, [user?.uid, isEmailUnverified]);

  // Main session elapsed monitor
  useEffect(() => {
    if (!user || isEmailUnverified || isBreakActive) return;

    const interval = setInterval(() => {
      const targetMins = getFocusMinutes();
      if (targetMins === null) return; // "no time limit" selected

      const elapsedMs = Date.now() - sessionStartRef.current;
      const targetMs = targetMins * 60 * 1000;

      if (elapsedMs >= targetMs) {
        // Stop any currently playing audio and running activities immediately!
        stopAllActiveOperations();

        // Trigger mandatory 3-minute break & persist end timestamp
        const breakEndTime = Date.now() + BREAK_DURATION_SECONDS * 1000;
        localStorage.setItem('gyanquest_break_end_time', String(breakEndTime));
        setIsBreakActive(true);
        setRemainingSeconds(BREAK_DURATION_SECONDS);

        // Sound audible chime when the "take a walk" screen appears
        if (!hasChimedBreakStartRef.current) {
          playMindfulChime();
          hasChimedBreakStartRef.current = true;
        }
      }
    }, 500);

    timerCheckRef.current = interval;
    return () => clearInterval(interval);
  }, [user, isEmailUnverified, isBreakActive, focusSetting]);

  // 3-minute break countdown handler - precise timestamp comparison every 250ms to prevent skipping seconds
  useEffect(() => {
    if (!isBreakActive) {
      hasChimedBreakStartRef.current = false;
      return;
    }

    // Immediately ensure activities remain stopped while break is active
    stopAllActiveOperations();

    const countdown = setInterval(() => {
      try {
        const storedEnd = localStorage.getItem('gyanquest_break_end_time');
        const endTime = storedEnd ? parseInt(storedEnd, 10) : 0;
        const now = Date.now();
        const diff = Math.ceil((endTime - now) / 1000);

        if (diff <= 0 || !storedEnd) {
          // Break strictly finished! Learning time resumes!
          clearInterval(countdown);
          localStorage.removeItem('gyanquest_break_end_time');
          playMindfulChime(); // Play chime when learning time resumes
          setIsBreakActive(false);

          // Reset session timer for the next focus period
          sessionStartRef.current = Date.now();
          localStorage.setItem('gq_session_signin_time', String(sessionStartRef.current));
          sessionStorage.setItem('gq_session_signin_time', String(sessionStartRef.current));

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

  // Prevent closing via Escape or keyboard during mandatory 5-min break
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

  if (!isBreakActive || !user) return null;

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
        // Prevent dismissal on clicking backdrop
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
            Your focus study session has elapsed. Ongoing narration and learning tasks have been paused. Please step away from your screen and take a <strong>full 3-minute break</strong> to rest your eyes and stretch your body.
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

          <span className="text-[11px] text-stone-400 block">
            Screen is blurred to protect your eyesight and encourage healthy movement
          </span>
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

        {/* Enforced Waiting Notice */}
        <div className="pt-2 w-full">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 rounded-2xl">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Mandatory 3-min break in progress • Learning unlocks automatically at 00:00</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Footprints, Sparkles, Clock, CheckCircle2, Play, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playMindfulChime } from '../lib/chime';

const BREAK_DURATION_SECONDS = 300; // 5 minutes

export const FocusBreakOverlay: React.FC = () => {
  const { user, isEmailUnverified } = useAuth();
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(BREAK_DURATION_SECONDS);
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
    window.addEventListener('storage', handleSettingChange);
    return () => {
      window.removeEventListener('gyanquest_focus_mode_changed', handleSettingChange);
      window.removeEventListener('storage', handleSettingChange);
    };
  }, []);

  // When user signs in, initialize session start timestamp in sessionStorage
  useEffect(() => {
    if (user && !isEmailUnverified) {
      const storedStart = sessionStorage.getItem('gq_session_signin_time');
      if (storedStart) {
        sessionStartRef.current = parseInt(storedStart, 10);
      } else {
        sessionStartRef.current = Date.now();
        sessionStorage.setItem('gq_session_signin_time', String(sessionStartRef.current));
      }
    } else {
      sessionStorage.removeItem('gq_session_signin_time');
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
        // Time has passed! Trigger 5-minute break
        setIsBreakActive(true);
        setRemainingSeconds(BREAK_DURATION_SECONDS);

        // Sound audible chime
        if (!hasChimedBreakStartRef.current) {
          playMindfulChime();
          hasChimedBreakStartRef.current = true;
        }
      }
    }, 1000);

    timerCheckRef.current = interval;
    return () => clearInterval(interval);
  }, [user, isEmailUnverified, isBreakActive, focusSetting]);

  // 5-minute break countdown handler
  useEffect(() => {
    if (!isBreakActive) {
      hasChimedBreakStartRef.current = false;
      return;
    }

    const countdown = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Break finished!
          clearInterval(countdown);
          playMindfulChime(); // Welcome back chime
          setIsBreakActive(false);

          // Reset session timer for the next focus period
          sessionStartRef.current = Date.now();
          sessionStorage.setItem('gq_session_signin_time', String(sessionStartRef.current));
          return BREAK_DURATION_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    breakCountdownRef.current = countdown;
    return () => clearInterval(countdown);
  }, [isBreakActive]);

  const handleResumeEarly = () => {
    playMindfulChime();
    setIsBreakActive(false);
    sessionStartRef.current = Date.now();
    sessionStorage.setItem('gq_session_signin_time', String(sessionStartRef.current));
  };

  if (!isBreakActive || !user) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((BREAK_DURATION_SECONDS - remainingSeconds) / BREAK_DURATION_SECONDS) * 100;

  return (
    <aside
      id="focus-break-screen-blur"
      aria-label="Focus Break & Walking Pause"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl bg-black/80 text-white select-none transition-all duration-700 animate-in fade-in"
    >
      <div
        id="focus-break-card"
        className="w-full max-w-lg rounded-[36px] border border-amber-500/30 bg-stone-900/90 p-8 sm:p-10 text-center shadow-2xl relative flex flex-col items-center space-y-6"
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
            Time to Walk Around & Rest
          </h2>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-md mx-auto">
            You've completed your designated study duration! Step away from your screen, stretch your body, drink some water, and walk around for <strong>5 minutes</strong> to recharge your focus.
          </p>
        </div>

        {/* 5-Minute Countdown Display */}
        <div className="w-full py-4 px-6 rounded-2xl bg-black/40 border border-stone-800 space-y-3">
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
            Screen is blurred to protect your eyes and encourage movement
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

        {/* Early Resume Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleResumeEarly}
            className="text-xs font-semibold text-stone-400 hover:text-amber-300 underline underline-offset-4 transition-colors cursor-pointer"
          >
            I'm back, resume learning now
          </button>
        </div>
      </div>
    </aside>
  );
};

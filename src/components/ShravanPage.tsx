import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { SavedChapter, updateChapterAudio, generateUniqueChapterCode } from '../lib/chapters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { claimChapterStageReward } from '../lib/firebase';
import { getScriptureDefinition } from '../lib/scriptureData';
import { synthesizeSpeechBrowser } from '../lib/geminiClient';

interface ShravanPageProps {
  chapter: SavedChapter;
  onBackToVidya: () => void;
  onNavigateDashboard?: () => void;
  onNavigateManan?: (chapter: SavedChapter) => void;
}

// Helper to resolve an audio source string (data URI, blob URL, or base64)
function resolveAudioSrc(src: string): string {
  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http')) {
    return src;
  }
  // Check if RIFF (WAV) base64 or MP3 base64
  const mime = src.startsWith('UklGR') ? 'audio/wav' : 'audio/mpeg';
  return `data:${mime};base64,${src}`;
}

// Helper to strip Markdown formatting so TTS narrates clean, natural spoken plain text in a single prompt
function stripMarkdownForSpeech(md: string): string {
  if (!md) return '';
  return md
    // Strip image markers ![alt](url)
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    // Strip links [text](url) -> text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Strip code blocks ``` ... ```
    .replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1')
    // Strip inline backticks `code` -> code
    .replace(/`([^`]+)`/g, '$1')
    .replace(/`/g, '')
    // Strip heading markers (#, ##, etc. at start of line)
    .replace(/^[ \t]*#+[ \t]*/gm, '')
    // Strip bold/italic formatting (***text***, **text**, *text*, ___text___, __text__, _text_)
    .replace(/(\*{1,3}|_{1,3})([^*_\n]+)\1/g, '$2')
    // Remove any remaining stray asterisks or underscores used for styling
    .replace(/[*_]/g, '')
    // Strip blockquote markers (> at start of line)
    .replace(/^[ \t]*>[ \t]*/gm, '')
    // Strip bullet markers (-, *, +) at start of line
    .replace(/^[ \t]*[-*+][ \t]+/gm, '')
    // Strip numbered list prefixes (1., 2.) at start of line
    .replace(/^[ \t]*\d+\.[ \t]+/gm, '')
    // Strip horizontal rules (---, ***, ___)
    .replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '')
    // Collapse all whitespace and line breaks into a single continuous prompt string
    .replace(/\s+/g, ' ')
    .trim();
}

export const ShravanPage: React.FC<ShravanPageProps> = ({
  chapter,
  onBackToVidya,
  onNavigateDashboard,
  onNavigateManan,
}) => {
  const { user, refreshUser, updateProfileXp, isStreakActiveToday, recordStreakActivity } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const scripture = getScriptureDefinition(chapter);
  const [selectedVoice, setSelectedVoice] = useState<'Adinath' | 'Vidur' | 'Sumed'>('Adinath');
  const [ttsMeta, setTtsMeta] = useState<{ voice?: string; fromCache?: boolean } | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(chapter.audioBase64 || null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    chapter.audioBase64 ? 'ready' : 'idle'
  );
  const [isWakingUp, setIsWakingUp] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasPlayedFullAudio, setHasPlayedFullAudio] = useState<boolean>(Boolean(chapter.shravanCompleted));
  const [isUsingWebSpeech, setIsUsingWebSpeech] = useState<boolean>(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTextRef = useRef<string>('');
  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Automatically maintain daily streak for Shravan activity if not yet active today
  useEffect(() => {
    if (!isStreakActiveToday && recordStreakActivity) {
      recordStreakActivity('shravan').catch(() => {});
    }
  }, [isStreakActiveToday, recordStreakActivity]);

  const handleGoToManan = async () => {
    let ch = { ...chapter };
    if (!ch.uniqueCode || ch.uniqueCode.length !== 10) {
      ch.uniqueCode = generateUniqueChapterCode();
    }

    // Award 5 XP when Go to Manan is clicked for the first time on this chapter
    try {
      const reward = await claimChapterStageReward(ch, 'manan', user);
      if (reward.awarded) {
        showToast({
          title: `+${reward.xpAdded} XP Added!`,
          message: `Manan reflection unlocked • Total: ${reward.newTotal} XP`,
          type: 'xp',
          xpAmount: reward.xpAdded,
        });
        updateProfileXp(reward.newTotal);
        refreshUser?.();
      }
    } catch (err) {
      console.warn('Error claiming Manan XP upon entering:', err);
    }

    if (onNavigateManan) {
      onNavigateManan(ch);
    }
  };

  const generateAudio = async (voiceToUse = selectedVoice) => {
    const apiVoiceMap: Record<'Adinath' | 'Vidur' | 'Sumed', string> = {
      Adinath: 'Puck',
      Vidur: 'Charon',
      Sumed: 'Fenrir',
    };
    const serverVoice = apiVoiceMap[voiceToUse] || 'Puck';

    // If audio already cached on chapter and voice matches default, use it
    if (chapter.audioBase64 && voiceToUse === 'Adinath') {
      setAudioBase64(chapter.audioBase64);
      setStatus('ready');
      setIsWakingUp(false);
      return;
    }

    const rawSummaryText = (chapter.summary || scripture?.summary || '').trim();

    if (!rawSummaryText) {
      setStatus('error');
      setIsWakingUp(false);
      setErrorMessage('No chapter summary available to narrate. Please open or generate a chapter summary first.');
      return;
    }

    // Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Set status to loading and clear existing error message
    setStatus('loading');
    setErrorMessage('');
    setIsWakingUp(false);
    setIsUsingWebSpeech(false);

    const synthesizeChunk = async (chunkText: string, signal: AbortSignal): Promise<Blob> => {
      // 1. Primary: Browser Gemini API keys (VITE_GURU_GEMINI_API_KEY & VITE_GEMINI_API_KEY)
      try {
        const browserResult = await synthesizeSpeechBrowser(chunkText, serverVoice, signal);
        setTtsMeta({ voice: browserResult.voiceUsed, fromCache: browserResult.fromCache });
        return browserResult.blob;
      } catch (browserErr: any) {
        if (signal.aborted || browserErr?.name === 'AbortError') {
          throw browserErr;
        }
        console.warn('[Shravan TTS] Browser Gemini TTS notice, attempting /api/tts fallback:', browserErr);
      }

      // 2. Fallback: Express backend /api/tts
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/wav',
        },
        body: JSON.stringify({
          text: chunkText,
          voice: serverVoice,
        }),
        signal,
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errData = await response.json().catch(() => null);
        if (errData?.fallbackToWebSpeech || !errData?.success) {
          throw new Error(errData?.error || 'TTS voice engine busy. Switching to Web Speech API.');
        }
      }

      if (contentType.includes('text/html')) {
        throw new Error('TTS voice server is warming up. Activating Web Speech API fallback.');
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `TTS voice server returned HTTP ${response.status}`);
      }

      const voiceUsed = response.headers.get('X-TTS-Voice') || serverVoice;
      const fromCache = response.headers.get('X-TTS-Cached') === 'true';
      setTtsMeta({ voice: voiceUsed, fromCache });

      const blob = await response.blob();
      if (!blob || blob.size === 0 || blob.type.includes('text/html')) {
        throw new Error('Received invalid audio response.');
      }
      return blob;
    };

    try {
      const plainText = stripMarkdownForSpeech(rawSummaryText);

      // Always send the entire text in a single TTS request (single prompt / single part)
      const blob = await synthesizeChunk(plainText, controller.signal);

      if (controller.signal.aborted) return;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      const newAudioUrl = URL.createObjectURL(blob);
      objectUrlRef.current = newAudioUrl;
      setAudioUrl(newAudioUrl);
      setStatus('ready');
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setIsWakingUp(false);
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      console.warn('[Shravan TTS] Gemini TTS unavailable, activating Web Speech API fallback:', err);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const plainText = stripMarkdownForSpeech(rawSummaryText);
        speechTextRef.current = plainText;
        setIsUsingWebSpeech(true);
        const words = plainText.split(/\s+/).filter(Boolean).length;
        const estDuration = Math.max(15, Math.round(words / 2.3));
        setDuration(estDuration);
        setCurrentTime(0);
        setStatus('ready');
        setTtsMeta({ voice: 'Web Speech API (Teacher Voice Engine)', fromCache: false });
        return;
      }
      setStatus('error');
      setErrorMessage(
        err?.message || 'Unable to generate audio narration at this moment. The voice service may be experiencing temporary rate limits. Please retry in a few moments.'
      );
    }
  };

  // Reset audio state on chapter or voice change; wait for user to click generate
  useEffect(() => {
    // Abort any in-flight request before initiating a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (chapter.audioBase64) {
      setAudioBase64(chapter.audioBase64);
      setAudioUrl(null);
      setStatus('ready');
    } else {
      setAudioUrl(null);
      setAudioBase64(null);
      setStatus('idle');
    }

    return () => {
      // Abort in-flight request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [chapter.id, selectedVoice]);

  const getTargetAudioSpeed = (): number => {
    try {
      const raw = localStorage.getItem('gyanquest_audio_speed') || '1.0';
      const parsed = parseFloat(raw);
      return !isNaN(parsed) && parsed > 0 ? parsed : 1.0;
    } catch (_) {
      return 1.0;
    }
  };

  // Dynamically apply audio speed from settings and stop playback on focus break
  useEffect(() => {
    const applySpeed = (newSpeed?: number) => {
      const speed = typeof newSpeed === 'number' ? newSpeed : getTargetAudioSpeed();
      if (audioRef.current) {
        audioRef.current.playbackRate = speed;
        audioRef.current.defaultPlaybackRate = speed;
      }
    };

    applySpeed();

    const handleSpeedApplied = (e: any) => {
      const spd = typeof e.detail?.speed === 'number' ? e.detail.speed : parseFloat(e.detail?.speed || '1.0');
      if (!isNaN(spd) && spd > 0) {
        applySpeed(spd);
      } else {
        applySpeed();
      }
    };

    const handleSettingsApplied = (e: any) => {
      if (e.detail?.audioSpeed) {
        const spd = parseFloat(e.detail.audioSpeed);
        if (!isNaN(spd) && spd > 0) {
          applySpeed(spd);
          return;
        }
      }
      applySpeed();
    };

    const handleStopActivity = () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    };

    const handleStorageChange = () => applySpeed();

    window.addEventListener('gyanquest_audio_speed_applied', handleSpeedApplied);
    window.addEventListener('gyanquest_settings_applied', handleSettingsApplied);
    window.addEventListener('gyanquest_stop_activity', handleStopActivity);
    window.addEventListener('gyanquest_break_started', handleStopActivity);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('gyanquest_audio_speed_applied', handleSpeedApplied);
      window.removeEventListener('gyanquest_settings_applied', handleSettingsApplied);
      window.removeEventListener('gyanquest_stop_activity', handleStopActivity);
      window.removeEventListener('gyanquest_break_started', handleStopActivity);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Autoplay support when status transitions to ready
  useEffect(() => {
    if (status === 'ready' && audioRef.current) {
      const speed = getTargetAudioSpeed();
      audioRef.current.playbackRate = speed;
      audioRef.current.defaultPlaybackRate = speed;
      const autoplay = localStorage.getItem('gyanquest_autoplay_audio') === 'true';
      if (autoplay && !isPlaying) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.debug('Autoplay policy caught:', err);
        });
      }
    }
  }, [status, audioUrl, audioBase64]);

  const handleTogglePlay = () => {
    if (isUsingWebSpeech) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (isPlaying) {
          window.speechSynthesis.pause();
          setIsPlaying(false);
          if (speechTimerRef.current) clearInterval(speechTimerRef.current);
        } else {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setIsPlaying(true);
          } else {
            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(speechTextRef.current);
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice =
              voices.find((v) => v.lang.includes('IN') || v.lang.includes('hi')) ||
              voices.find((v) => v.lang.startsWith('en'));
            if (preferredVoice) utt.voice = preferredVoice;
            utt.rate = getTargetAudioSpeed();
            utt.volume = volume;
            utt.onend = () => {
              setIsPlaying(false);
              setHasPlayedFullAudio(true);
              setCurrentTime(duration);
              if (speechTimerRef.current) clearInterval(speechTimerRef.current);
            };
            utt.onerror = () => {
              setIsPlaying(false);
              if (speechTimerRef.current) clearInterval(speechTimerRef.current);
            };
            speechUtteranceRef.current = utt;
            window.speechSynthesis.speak(utt);
            setIsPlaying(true);
          }
          if (speechTimerRef.current) clearInterval(speechTimerRef.current);
          speechTimerRef.current = setInterval(() => {
            setCurrentTime((prev) => {
              if (prev >= duration) {
                if (speechTimerRef.current) clearInterval(speechTimerRef.current);
                return duration;
              }
              return prev + 1;
            });
          }, 1000);
        }
      }
      return;
    }

    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const targetSpeed = getTargetAudioSpeed();
      audioRef.current.playbackRate = targetSpeed;
      audioRef.current.defaultPlaybackRate = targetSpeed;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio playback notice:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);
      if (audioRef.current.duration > 0 && cur >= audioRef.current.duration - 0.3) {
        setHasPlayedFullAudio(true);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      const targetSpeed = getTargetAudioSpeed();
      audioRef.current.playbackRate = targetSpeed;
      audioRef.current.defaultPlaybackRate = targetSpeed;

      const autoplay = localStorage.getItem('gyanquest_autoplay_audio') === 'true';
      if (autoplay && !isPlaying) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.debug('Autoplay policy notice:', err);
        });
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      const targetSpeed = getTargetAudioSpeed();
      audioRef.current.playbackRate = targetSpeed;
      audioRef.current.defaultPlaybackRate = targetSpeed;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (isUsingWebSpeech && speechUtteranceRef.current) {
      speechUtteranceRef.current.volume = val;
    }
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const handleToggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleRepeat = () => {
    if (isUsingWebSpeech) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setCurrentTime(0);
        setIsPlaying(false);
        setTimeout(() => handleTogglePlay(), 50);
      }
      return;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      const targetSpeed = getTargetAudioSpeed();
      audioRef.current.playbackRate = targetSpeed;
      audioRef.current.defaultPlaybackRate = targetSpeed;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeekRelative = (seconds: number) => {
    if (isUsingWebSpeech) {
      const targetTime = Math.max(0, Math.min(duration, currentTime + seconds));
      setCurrentTime(targetTime);
      return;
    }
    if (audioRef.current) {
      const maxDuration = duration || 10000;
      const targetTime = Math.max(0, Math.min(maxDuration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      const targetSpeed = getTargetAudioSpeed();
      audioRef.current.playbackRate = targetSpeed;
      audioRef.current.defaultPlaybackRate = targetSpeed;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToVidya}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80 cursor-pointer shadow-2xs"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
            color: 'var(--text-primary)',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToVidya}</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs"
          style={{
            backgroundColor: 'var(--accent-saffron-light)',
            borderColor: 'var(--border-warm)',
            color: 'var(--accent-saffron-text)',
          }}
        >
          <Headphones className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          <span>{t.shravanStageBadge}</span>
        </div>
      </div>

      {/* Main Container Card */}
      <div
        className="rounded-3xl border p-6 sm:p-10 shadow-sm space-y-8"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t.shravanTitle}
          </h1>
          <p className="text-sm sm:text-base font-medium truncate" style={{ color: 'var(--accent-saffron-text)' }}>
            {chapter.title.replace(/^Vidya:\s*/i, '')}
          </p>

        </div>

        {/* IDLE STATE */}
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-5 max-w-md mx-auto">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xs border"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Headphones className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Ready to Listen & Learn
              </h3>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Click below to start high-quality immersive audio narration of this chapter.
              </p>
            </div>
            <button
              type="button"
              onClick={() => generateAudio('Adinath')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all hover:opacity-95 cursor-pointer"
              style={{ backgroundColor: 'var(--accent-saffron)', color: '#FFFFFF' }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Audio Narration</span>
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div
              className="w-14 h-14 rounded-full border-4 border-stone-200 dark:border-stone-800 border-t-orange-500 animate-spin shrink-0"
              style={{ borderTopColor: 'var(--accent-saffron)' }}
            />
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {`Preparing Guru Narration with ${selectedVoice}...`}
            </h3>
            <p className="text-xs sm:text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
              Preparing natural teacher voice narration in a single prompt. Please allow a few moments...
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-red-700 dark:text-red-300">
              Audio Narration Notice
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {errorMessage || 'Failed to synthesize audio narration with the Indian Guru voice engine.'}
            </p>
            <button
              type="button"
              onClick={() => {
                generateAudio(selectedVoice);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: 'var(--accent-saffron)', color: '#FFFFFF' }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Narration</span>
            </button>
          </div>
        )}

        {/* READY / AUDIO PLAYER STATE */}
        {status === 'ready' && (audioUrl || audioBase64 || isUsingWebSpeech) && (
          <div className="space-y-8 max-w-2xl mx-auto">
            {!isUsingWebSpeech && (
              <audio
                ref={audioRef}
                src={audioUrl || (audioBase64 ? resolveAudioSrc(audioBase64) : undefined)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                  setIsPlaying(false);
                  setHasPlayedFullAudio(true);
                }}
              />
            )}

            {/* Visual Equalizer / Waveform Graphic */}
            <div
              className="flex items-center justify-center gap-1.5 h-20 px-6 rounded-2xl border shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
              }}
            >
              {[40, 70, 30, 90, 60, 100, 50, 80, 65, 35, 75, 95, 45, 85, 55, 70, 40].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full transition-all duration-300"
                  style={{
                    height: isPlaying ? `${Math.max(15, (h * (Math.sin(Date.now() / 200 + i) + 1.5)) / 2.5)}%` : '20%',
                    backgroundColor: isPlaying ? 'var(--accent-saffron)' : 'var(--border-warm)',
                  }}
                />
              ))}
            </div>

            {/* Progress Bar / Slider */}
            <div className="space-y-2">
              <input
                id="audio-progress-slider"
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-600 dark:accent-amber-500"
                style={{ backgroundColor: 'var(--border-warm)' }}
              />
              <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Player Controls (Repeat, -10s, Play/Pause, +10s, Volume) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                {/* Repeat Button */}
                <button
                  type="button"
                  onClick={handleRepeat}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs"
                  style={{
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                  title="Repeat from beginning"
                >
                  <RotateCcw className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>Repeat</span>
                </button>
              </div>

              {/* Playback & Seek Controls Cluster */}
              <div className="flex items-center gap-3">
                {/* 10s Backward */}
                <button
                  type="button"
                  id="btn-seek-backward-10"
                  onClick={() => handleSeekRelative(-10)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs active:scale-95"
                  style={{
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                  title="Seek 10s backward"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>-10s</span>
                </button>

                {/* Play / Pause Main Button */}
                <button
                  type="button"
                  id="btn-toggle-play"
                  onClick={handleTogglePlay}
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-saffron)',
                    color: '#FFFFFF',
                  }}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current translate-x-0.5" />
                  )}
                </button>

                {/* 10s Forward */}
                <button
                  type="button"
                  id="btn-seek-forward-10"
                  onClick={() => handleSeekRelative(10)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs active:scale-95"
                  style={{
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                  title="Seek 10s forward"
                >
                  <RotateCw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>+10s</span>
                </button>
              </div>

              {/* Volume & Mute Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="p-2 rounded-xl border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  style={{
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  )}
                </button>
                <input
                  id="audio-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 sm:w-24 h-2 rounded-lg appearance-none cursor-pointer accent-amber-600 dark:accent-amber-500"
                  style={{ backgroundColor: 'var(--border-warm)' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="pt-6 border-t flex flex-wrap items-center justify-between gap-4" style={{ borderColor: 'var(--border-warm)' }}>
          <button
            type="button"
            onClick={onBackToVidya}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToVidya}</span>
          </button>

          {hasPlayedFullAudio && (
            <button
              type="button"
              id="btn-go-to-manan"
              onClick={handleGoToManan}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer animate-in fade-in duration-300"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <span>{t.proceedToManan}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

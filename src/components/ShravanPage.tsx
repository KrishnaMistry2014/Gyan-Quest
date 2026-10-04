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
import { SavedChapter, updateChapterAudio } from '../lib/chapters';
import { useAuth } from '../context/AuthContext';
import { addUserXp } from '../lib/firebase';

interface ShravanPageProps {
  chapter: SavedChapter;
  onBackToVidya: () => void;
  onNavigateDashboard?: () => void;
}

export const ShravanPage: React.FC<ShravanPageProps> = ({
  chapter,
  onBackToVidya,
  onNavigateDashboard,
}) => {
  const { user, refreshUser } = useAuth();
  const [audioBase64, setAudioBase64] = useState<string | null>(chapter.audioBase64 || null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(chapter.audioBase64 ? 'ready' : 'loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [xpToast, setXpToast] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateAudio = async () => {
    // If audio already cached on chapter, use it immediately
    if (chapter.audioBase64) {
      setAudioBase64(chapter.audioBase64);
      setStatus('ready');
      checkAndAwardXp();
      return;
    }

    // Strictly generate via Gemini 3.1 Flash TTS ONLY
    setStatus('loading');
    setErrorMessage('');

    try {
      console.log('[Shravan] Requesting audio generation from Gemini 3.1 Flash TTS (Indian accent female ~30 years old)...');
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chapter.summary }),
      });

      const data = await response.json().catch(() => null);

      if (data && data.success && data.audioBase64) {
        const b64 = data.audioBase64;
        setAudioBase64(b64);
        chapter.audioBase64 = b64;
        setStatus('ready');

        // Save to chapter (Firestore + local storage)
        await updateChapterAudio(chapter.id, b64, true);
        checkAndAwardXp();
      } else {
        const err = data?.error || `Gemini 3.1 Flash TTS failed (HTTP ${response.status})`;
        setStatus('error');
        setErrorMessage(err);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Network error while generating audio with Gemini 3.1 Flash TTS. Please check your connection.');
    }
  };

  // Generate audio or retrieve cached version on mount
  useEffect(() => {
    generateAudio();
  }, [chapter.id]);

  const checkAndAwardXp = async () => {
    // If Shravan XP not yet claimed for this chapter across sessions
    if (!chapter.shravanCompleted) {
      try {
        await addUserXp(user, 10);
        chapter.shravanCompleted = true;
        await updateChapterAudio(chapter.id, chapter.audioBase64 || audioBase64 || '', true);
        await refreshUser?.();
        
        setXpToast('+10 XP Earned for Shravan (Audio Milestone)!');
        setTimeout(() => setXpToast(null), 4000);
      } catch (err) {
        console.warn('Failed to claim Shravan XP:', err);
      }
    }
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio playback notice:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
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
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeekRelative = (seconds: number) => {
    if (audioRef.current) {
      const maxDuration = duration || 10000;
      const targetTime = Math.max(0, Math.min(maxDuration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
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
      {/* XP Toast Notification Banner */}
      {xpToast && (
        <div
          id="shravan-xp-toast"
          className="fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-lg animate-bounce"
          style={{
            backgroundColor: 'var(--accent-saffron-light)',
            borderColor: 'var(--accent-saffron)',
            color: 'var(--accent-saffron-text)',
          }}
        >
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm font-bold">{xpToast}</span>
        </div>
      )}

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
          <span>Go back to Vidya</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs"
          style={{
            backgroundColor: 'var(--accent-saffron-light)',
            borderColor: 'var(--border-warm)',
            color: 'var(--accent-saffron-text)',
          }}
        >
          <Headphones className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          <span>Vidya • Stage 02: Shravan (श्रवण)</span>
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
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Shravan Audio Narration
          </h1>
          <p className="text-sm sm:text-base font-medium truncate" style={{ color: 'var(--accent-saffron-text)' }}>
            {chapter.title}
          </p>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            Powered by Gemini 3.1 Flash TTS • Indian Accent Female (~30 Yrs) • (+10 XP)
          </p>
        </div>

        {/* LOADING STATE */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div
              className="w-14 h-14 rounded-full border-4 border-stone-200 dark:border-stone-800 border-t-orange-500 animate-spin shrink-0"
              style={{ borderTopColor: 'var(--accent-saffron)' }}
            />
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Generating Shravan Audio...
            </h3>
            <p className="text-xs sm:text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
              Gemini 3.1 Flash TTS is synthesizing your chapter summary into an Indian accent female (~30 years old) voice narration in sections of 3,000–4,000 words (65s processing per chunk). Please hold on a moment.
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
              Audio Generation Notice
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {errorMessage || 'Failed to generate audio with Gemini 3.1 Flash TTS.'}
            </p>
            <button
              type="button"
              onClick={() => {
                generateAudio();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: 'var(--accent-saffron)', color: '#FFFFFF' }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Generating Audio</span>
            </button>
          </div>
        )}

        {/* READY / AUDIO PLAYER STATE */}
        {status === 'ready' && audioBase64 && (
          <div className="space-y-8 max-w-2xl mx-auto">
            <audio
              ref={audioRef}
              src={`data:audio/wav;base64,${audioBase64}`}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />

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
            <span>Go back to Vidya</span>
          </button>

          {onNavigateDashboard && (
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

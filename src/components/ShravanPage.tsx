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
import { useToast } from '../context/ToastContext';
import { claimChapterStageReward } from '../lib/firebase';

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
  // Check if legacy RIFF (WAV) base64 or Edge TTS MP3 base64
  const mime = src.startsWith('UklGR') ? 'audio/wav' : 'audio/mpeg';
  return `data:${mime};base64,${src}`;
}

// Helper to strip Markdown formatting so TTS narrates clean, natural spoken plain text
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
    // Normalize spaces and multiple blank lines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Helper to divide long chapter summaries into optimal sections of ~350-450 words
// to guarantee fast synthesis and prevent 502/timeouts on Render & Cloudflare.
function chunkTextForTTS(text: string, maxWordsPerChunk = 400): string[] {
  if (!text) return [];
  const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const paraWords = para.split(/\s+/).length;
    const currentWords = currentChunk ? currentChunk.split(/\s+/).length : 0;

    if (currentWords + paraWords <= maxWordsPerChunk) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      if (paraWords > maxWordsPerChunk) {
        const sentences = para.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [para];
        for (const sentence of sentences) {
          const sentWords = sentence.split(/\s+/).length;
          const curWords = currentChunk ? currentChunk.split(/\s+/).length : 0;
          if (curWords + sentWords <= maxWordsPerChunk) {
            currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
          } else {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = sentence;
          }
        }
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [text];
}

export const ShravanPage: React.FC<ShravanPageProps> = ({
  chapter,
  onBackToVidya,
  onNavigateDashboard,
  onNavigateManan,
}) => {
  const { user, refreshUser, updateProfileXp, isStreakActiveToday, recordStreakActivity } = useAuth();
  const { showToast } = useToast();
  const [audioBase64, setAudioBase64] = useState<string | null>(chapter.audioBase64 || null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(chapter.audioBase64 ? 'ready' : 'loading');
  const [isWakingUp, setIsWakingUp] = useState<boolean>(false);
  const [chunkProgress, setChunkProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasPlayedFullAudio, setHasPlayedFullAudio] = useState<boolean>(Boolean(chapter.shravanCompleted));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Automatically maintain daily streak for Shravan activity if not yet active today
  useEffect(() => {
    if (!isStreakActiveToday && recordStreakActivity) {
      recordStreakActivity('shravan').catch(() => {});
    }
  }, [isStreakActiveToday, recordStreakActivity]);

  const handleGoToManan = () => {
    if (onNavigateManan) {
      onNavigateManan(chapter);
    }
  };

  const generateAudio = async () => {
    // If audio already cached on chapter, use it immediately
    if (chapter.audioBase64) {
      setAudioBase64(chapter.audioBase64);
      setStatus('ready');
      setIsWakingUp(false);
      return;
    }

    if (!chapter.summary || typeof chapter.summary !== 'string' || chapter.summary.trim().length === 0) {
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

    try {
      const plainText = stripMarkdownForSpeech(chapter.summary);
      const chunks = chunkTextForTTS(plainText, 400);
      setChunkProgress({ current: 0, total: chunks.length });

      // Step 1: Check if Render TTS service is booting / waking up or already active
      // Using a quick 2.5s probe to /health. Render cold boot takes ~45-60s, returning no fast response.
      let serviceAwake = false;
      try {
        const probeController = new AbortController();
        const probeTimeout = setTimeout(() => probeController.abort(), 2500);
        const probeRes = await fetch('https://gyanquest-edge-tts.onrender.com/health', {
          method: 'GET',
          signal: probeController.signal,
        });
        clearTimeout(probeTimeout);
        if (probeRes.ok) {
          serviceAwake = true;
        }
      } catch {
        serviceAwake = false;
      }

      if (controller.signal.aborted) return;

      if (!serviceAwake) {
        setIsWakingUp(true);
        // Wait up to 75 seconds for Render TTS service to finish waking up
        const wakeStartTime = Date.now();
        const WAKE_TIMEOUT_MS = 75000; // Strictly 75s timeout for waking up the service ONLY

        while (!serviceAwake && Date.now() - wakeStartTime < WAKE_TIMEOUT_MS) {
          if (controller.signal.aborted) return;
          await new Promise((r) => setTimeout(r, 2000));
          if (controller.signal.aborted) return;

          try {
            const checkController = new AbortController();
            const checkTimeout = setTimeout(() => checkController.abort(), 4000);
            const res = await fetch('https://gyanquest-edge-tts.onrender.com/health', {
              method: 'GET',
              signal: checkController.signal,
            });
            clearTimeout(checkTimeout);
            if (res.ok) {
              serviceAwake = true;
              break;
            }
          } catch {
            // Service still waking up, continue polling until 75s timeout
          }
        }

        if (!serviceAwake && !controller.signal.aborted) {
          setIsWakingUp(false);
          throw new Error('TTS service wake-up timed out after 75 seconds. The voice server is taking longer than expected to start up. Please try again.');
        }

        setIsWakingUp(false);
      }

      if (controller.signal.aborted) return;

      console.log(`[Shravan] Starting TTS synthesis for ${chunks.length} sections (${plainText.split(/\s+/).length} total words)...`);
      const audioBlobs: Blob[] = [];

      for (let i = 0; i < chunks.length; i++) {
        if (controller.signal.aborted) return;
        setChunkProgress({ current: i + 1, total: chunks.length });

        let attempts = 0;
        let success = false;
        let lastErr: any = null;

        while (attempts < 2 && !success) {
          attempts++;
          try {
            const chunkController = new AbortController();
            const onParentAbort = () => chunkController.abort();
            controller.signal.addEventListener('abort', onParentAbort, { once: true });
            const timeoutId = setTimeout(() => chunkController.abort(), 40000);

            try {
              console.log(`[Shravan] Fetching section ${i + 1}/${chunks.length} (${chunks[i].split(/\s+/).length} words)...`);
              const response = await fetch('https://gyanquest-edge-tts.onrender.com/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: chunks[i],
                  voice: 'en-IN-NeerjaNeural',
                  rate: '+25%',
                }),
                signal: chunkController.signal,
              });

              if (!response.ok) {
                throw new Error(`Edge TTS returned HTTP ${response.status}`);
              }

              const blob = await response.blob();
              if (!blob || blob.size === 0) {
                throw new Error('Received empty audio section response.');
              }

              audioBlobs.push(blob);
              success = true;
            } finally {
              clearTimeout(timeoutId);
              controller.signal.removeEventListener('abort', onParentAbort);
            }
          } catch (chunkErr: any) {
            if (controller.signal.aborted) return;
            lastErr = chunkErr;
            console.warn(`[Shravan] Section ${i + 1} attempt ${attempts} warning:`, chunkErr);
            if (attempts < 2) {
              await new Promise((r) => setTimeout(r, 1000));
            }
          }
        }

        if (!success) {
          throw lastErr || new Error(`Failed to generate audio for section ${i + 1}`);
        }
      }

      if (controller.signal.aborted) return;

      // Combine all MP3 chunks into one unified seamless MP3 blob
      const combinedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });

      // Revoke any prior object URL to avoid memory leaks
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      // Create browser object URL for immediate playback (no base64 conversion or localStorage/Firestore persistence)
      const newAudioUrl = URL.createObjectURL(combinedBlob);
      objectUrlRef.current = newAudioUrl;
      setAudioUrl(newAudioUrl);
      setStatus('ready');
      setIsWakingUp(false);
      setChunkProgress(null);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setChunkProgress(null);
      setIsWakingUp(false);
      // Treat AbortError as intentional user cancellation rather than a voice-service error
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        console.log('[Shravan] Edge TTS request was intentionally cancelled.');
        return;
      }
      console.error('[Shravan] Edge TTS error:', err);
      setStatus('error');
      setErrorMessage(
        err?.message || 'Unable to generate audio narration at this moment. The voice service may be waking up or temporarily unavailable. Please retry in a few moments.'
      );
    }
  };

  // Generate audio or retrieve cached version on mount / chapter change
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
    setAudioUrl(null);
    setAudioBase64(chapter.audioBase64 || null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    generateAudio();

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
  }, [chapter.id]);

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
      const targetSpeed = getTargetAudioSpeed();
      audioRef.current.playbackRate = targetSpeed;
      audioRef.current.defaultPlaybackRate = targetSpeed;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeekRelative = (seconds: number) => {
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
            {chapter.title.replace(/^Vidya:\s*/i, '')}
          </p>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            Powered by Edge TTS
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
              {isWakingUp
                ? 'Service is Waking up'
                : chunkProgress && chunkProgress.total > 1
                ? `Generating Audio Section ${chunkProgress.current} of ${chunkProgress.total}...`
                : 'Generating Shravan Audio...'}
            </h3>
            <p className="text-xs sm:text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
              {isWakingUp
                ? 'The TTS narration service is starting up after inactivity. Please allow a short moment...'
                : chunkProgress && chunkProgress.total > 1
                ? `Synthesizing educational chapter summary in fast, smooth sections (${chunkProgress.current}/${chunkProgress.total}). Please hold on.`
                : 'Connecting to Edge TTS voice service. Please wait a few moments...'}
            </p>
            {chunkProgress && chunkProgress.total > 1 && !isWakingUp && (
              <div className="w-56 h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    backgroundColor: 'var(--accent-saffron)',
                    width: `${Math.round((chunkProgress.current / chunkProgress.total) * 100)}%`,
                  }}
                />
              </div>
            )}
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
              {errorMessage || 'Failed to generate audio narration with voice service.'}
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
        {status === 'ready' && (audioUrl || audioBase64) && (
          <div className="space-y-8 max-w-2xl mx-auto">
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
            <span>Go back to Vidya</span>
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
              <span>Go to Manan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

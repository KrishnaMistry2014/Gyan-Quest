import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Gamepad2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  Sun,
  Moon,
  CheckCircle2,
  Shield,
  Layers,
  HeartPulse,
  Brain,
  Coffee,
  Flame,
  Radio,
  ExternalLink,
  Puzzle
} from 'lucide-react';
import { STUDENT_ARTICLE_DATA } from '../data/gitaQuestData';
import { useTheme } from '../context/ThemeContext';
import { vedicAudio } from '../utils/gitaAudio';

import heroDiyaImg from '../assets/images/gyanquest_hero_diya_1791870559877.jpg';
import krishnaChariotImg from '../assets/images/gyanquest_krishna_chariot_1791870561061.jpg';

interface GitaVoiceReaderProps {
  onBack: () => void;
  onPlayQuest: () => void;
  onPlayJigsaw?: () => void;
}

export const GitaVoiceReader: React.FC<GitaVoiceReaderProps> = ({
  onBack,
  onPlayQuest,
  onPlayJigsaw,
}) => {
  const { isDark, toggleTheme } = useTheme();

  // TTS Speech State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeItem, setActiveItem] = useState<'shloka' | number | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isVoiceSupported, setIsVoiceSupported] = useState<boolean>(true);

  const activeIndexRef = useRef<'shloka' | number | null>(null);
  activeIndexRef.current = activeItem;

  // Sync audio engine theme
  useEffect(() => {
    vedicAudio.setTheme(isDark ? 'chandra' : 'surya');
  }, [isDark]);

  // Clean up speech on unmount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsVoiceSupported(true);
    } else {
      setIsVoiceSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /**
   * Helper to speak a given text with speech synthesis
   */
  const speakText = (text: string, onEndCallback?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // In Chandra (night) mode, speak with a calm, gentle pace
    utterance.rate = isDark ? Math.max(0.8, speechRate * 0.92) : speechRate;
    utterance.pitch = isDark ? 0.92 : 1.05;

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.includes('en-IN')) ||
      voices.find((v) => v.lang.includes('en-GB')) ||
      voices.find((v) => v.lang.includes('en-US')) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      if (onEndCallback) {
        onEndCallback();
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setActiveItem(null);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setActiveItem(null);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  /**
   * Speak individual section
   */
  const handleListenSection = (index: number) => {
    const sec = STUDENT_ARTICLE_DATA.sections[index];
    if (!sec) return;

    vedicAudio.playTempleBell();
    setActiveItem(index);
    const textToSpeak = `${sec.title}. ${sec.description} Student practice takeaway: ${sec.takeaway}`;
    speakText(textToSpeak, () => {
      setIsPlaying(false);
      setActiveItem(null);
    });
  };

  /**
   * Speak Sanskrit Shloka and Translation
   */
  const handleListenShloka = () => {
    vedicAudio.playTempleBell();
    setActiveItem('shloka');
    const text = `Bhagavad Gita Chapter 6, Verse 17. ${STUDENT_ARTICLE_DATA.translation}`;
    speakText(text, () => {
      setIsPlaying(false);
      setActiveItem(null);
    });
  };

  /**
   * Sequentially read the whole lesson
   */
  const handlePlayFullLesson = () => {
    if (isPlaying && !isPaused) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    if (isPaused) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
      return;
    }

    vedicAudio.playTempleBell();

    const sections = STUDENT_ARTICLE_DATA.sections;
    let currentStep = -1; // -1 for Shloka, 0..N for sections

    const playNextStep = () => {
      if (currentStep === -1) {
        setActiveItem('shloka');
        currentStep = 0;
        const shlokaSpeech = `Welcome to Bhagavad Gita for Students. Chapter 6 Dhyana Yoga, Verse 17. ${STUDENT_ARTICLE_DATA.translation}. Here are the Six Pillars of Student Success.`;
        speakText(shlokaSpeech, playNextStep);
      } else if (currentStep < sections.length) {
        const secIndex = currentStep;
        setActiveItem(secIndex);
        currentStep++;
        const sec = sections[secIndex];
        const secSpeech = `Pillar ${secIndex + 1}: ${sec.title}. ${sec.description} Student Practice: ${sec.takeaway}`;
        speakText(secSpeech, playNextStep);
      } else {
        // Complete
        setIsPlaying(false);
        setIsPaused(false);
        setActiveItem(null);
        vedicAudio.playVictoryChime();
      }
    };

    playNextStep();
  };

  const handleStopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveItem(null);
  };

  return (
    <div
      id="gita-voice-reader-page"
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300"
    >
      {/* Top Breadcrumb & Action Navigation Bar */}
      <div
        className="p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:scale-102 active:scale-98 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Chapter 6</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Learn Bhagavad Gita</span>
            <span style={{ color: 'var(--border-warm)' }}>/</span>
            <span className="font-bold" style={{ color: 'var(--accent-saffron-text)' }}>
              Voice Reader & Lesson
            </span>
          </div>
        </div>

        {/* Right actions: Surya/Chandra Switcher and PLAY QUEST Button */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Surya / Chandra theme mode button with acoustic alignment indicator */}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-2xs"
            style={{
              backgroundColor: isDark ? '#2C231B' : '#FEF3C7',
              borderColor: isDark ? '#D97706' : '#FDE68A',
              color: isDark ? '#FBBF24' : '#92400E',
            }}
            title={isDark ? 'Switch to Surya Mode (Daylight resonance)' : 'Switch to Chandra Mode (Night peace resonance)'}
          >
            {isDark ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span>Chandra (Night)</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600 fill-current" />
                <span>Surya (Light)</span>
              </>
            )}
          </button>

          {/* Harmony Jigsaw Puzzle button */}
          {onPlayJigsaw && (
            <button
              type="button"
              id="btn-play-jigsaw-top"
              onClick={onPlayJigsaw}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all hover:scale-103 active:scale-97 cursor-pointer shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--accent-saffron)',
                color: 'var(--accent-saffron-text)',
              }}
              title="Play 12-Piece Harmony of Life Jigsaw Puzzle"
            >
              <Puzzle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Harmony Puzzle</span>
            </button>
          )}

          {/* Prominent Play Quest button */}
          <button
            type="button"
            id="btn-play-quest-top"
            onClick={onPlayQuest}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:scale-103 active:scale-97 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-saffron)',
            }}
          >
            <Gamepad2 className="w-4 h-4 text-white animate-pulse" />
            <span>Play Quest</span>
          </button>
        </div>
      </div>

      {/* Main Hero Header Card */}
      <div
        className="rounded-3xl border p-6 sm:p-8 relative overflow-hidden shadow-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none rounded-bl-full overflow-hidden">
          <img
            src={krishnaChariotImg}
            alt="Krishna Chariot"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{STUDENT_ARTICLE_DATA.chapter} • {STUDENT_ARTICLE_DATA.verse}</span>
            </span>

            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
              style={{
                backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-secondary)',
              }}
            >
              <span>Aligned with {isDark ? '🌙 Chandra Audio Harmonics' : '☀️ Surya Solar Resonance'}</span>
            </span>
          </div>

          <h1
            className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif-heading"
            style={{ color: 'var(--text-primary)' }}
          >
            {STUDENT_ARTICLE_DATA.title}
          </h1>

          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {STUDENT_ARTICLE_DATA.subtitle}
          </p>

          {/* Voice Narration & Audio Controls Dock */}
          <div
            className="pt-4 border-t flex flex-wrap items-center gap-3"
            style={{ borderColor: 'var(--border-warm)' }}
          >
            {/* Play / Pause Voice Narration Button */}
            <button
              type="button"
              id="btn-play-voice-lesson"
              onClick={handlePlayFullLesson}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
              style={{
                backgroundColor: isPlaying && !isPaused ? '#B45309' : 'var(--accent-saffron)',
              }}
            >
              {isPlaying && !isPaused ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Lesson</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isPaused ? 'Resume Lesson' : 'Listen to Full Lesson'}</span>
                </>
              )}
            </button>

            {/* Stop Button */}
            {isPlaying && (
              <button
                type="button"
                onClick={handleStopSpeech}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer hover:opacity-90"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            )}

            {/* Recitation Speed Dropdown */}
            <div className="flex items-center gap-1 text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Speed:</span>
              {[0.8, 1.0, 1.2].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeechRate(rate)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold border cursor-pointer transition-all ${
                    speechRate === rate
                      ? 'border-amber-500 ring-1 ring-amber-500'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: speechRate === rate ? 'var(--accent-saffron-light)' : 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                    color: speechRate === rate ? 'var(--accent-saffron-text)' : 'var(--text-primary)',
                  }}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shloka 6.17 Sacred Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border transition-all ${
          activeItem === 'shloka' ? 'ring-3 ring-amber-500 shadow-md' : 'shadow-xs'
        }`}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: activeItem === 'shloka' ? 'var(--accent-saffron)' : 'var(--border-warm)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <h2 className="text-sm font-bold uppercase tracking-wider font-serif-heading" style={{ color: 'var(--accent-saffron-bright)' }}>
              Sacred Shloka • Dhyana Yoga (6.17)
            </h2>
          </div>

          <button
            type="button"
            onClick={handleListenShloka}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-102 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--accent-saffron)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Listen to Shloka</span>
          </button>
        </div>

        {/* Sanskrit Text in Devanagari */}
        <div
          className="p-6 rounded-2xl border text-center my-3 relative overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <p
            className="text-2xl sm:text-3xl font-bold leading-relaxed whitespace-pre-line mb-3 tracking-wide"
            style={{
              fontFamily: "'Noto Serif Devanagari', 'Rozha One', serif",
              color: 'var(--accent-saffron-text)',
            }}
          >
            {STUDENT_ARTICLE_DATA.shloka}
          </p>

          <div className="text-xs font-serif italic max-w-xl mx-auto mb-3" style={{ color: 'var(--text-muted)' }}>
            yuktāhāra-vihārasya yukta-ceṣṭasya karmasu • yukta-svapnāvabodhasya yogo bhavati duḥkha-hā
          </div>

          <p className="font-serif italic text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-primary)' }}>
            "{STUDENT_ARTICLE_DATA.translation}"
          </p>
        </div>

        {/* Word-by-Word Sanskrit Breakdown */}
        <div className="mt-5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Word-by-Word Sanskrit Breakdown</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {STUDENT_ARTICLE_DATA.wordMeanings.map((wm, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border text-xs transition-all hover:scale-101"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <div className="font-bold text-sm font-serif-heading" style={{ color: 'var(--accent-saffron-bright)' }}>
                  {wm.sanskrit}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {wm.english}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The Six Pillars of Student Success Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              The Six Pillars of Student Success
            </h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              Practical scientific and yogic applications derived from Chapter 6 Verse 17.
            </p>
          </div>

          <button
            type="button"
            onClick={onPlayQuest}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:scale-102 cursor-pointer self-start sm:self-auto"
            style={{
              backgroundColor: 'var(--accent-saffron)',
            }}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-white" />
            <span>Play Quest Now</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STUDENT_ARTICLE_DATA.sections.map((sec, idx) => {
            const isSectionActive = activeItem === idx;
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
                  isSectionActive
                    ? 'ring-3 ring-amber-500 shadow-lg scale-101'
                    : 'hover:shadow-xs'
                }`}
                style={{
                  backgroundColor: isSectionActive ? 'var(--bg-main)' : 'var(--bg-card)',
                  borderColor: isSectionActive ? 'var(--accent-saffron)' : 'var(--border-warm)',
                }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-base flex items-center gap-2 font-serif-heading" style={{ color: 'var(--accent-saffron-text)' }}>
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                        style={{
                          backgroundColor: 'var(--accent-saffron-light)',
                          color: 'var(--accent-saffron-text)',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span>{sec.title}</span>
                    </h3>

                    <button
                      type="button"
                      onClick={() => handleListenSection(idx)}
                      className="p-1.5 rounded-lg border text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                      style={{
                        backgroundColor: isSectionActive ? 'var(--accent-saffron)' : 'var(--bg-card-subtle)',
                        borderColor: 'var(--border-warm)',
                        color: isSectionActive ? '#FFFFFF' : 'var(--text-secondary)',
                      }}
                      title={`Listen to ${sec.title}`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {sec.description}
                  </p>
                </div>

                <div
                  className="p-3 rounded-xl border text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--accent-saffron-text)',
                  }}
                >
                  <strong className="block text-[11px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
                    Student Practice:
                  </strong>
                  {sec.takeaway}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cognitive Traits Strengthened */}
      <div
        className="p-5 sm:p-6 rounded-3xl border space-y-3"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 font-serif-heading" style={{ color: 'var(--accent-saffron-bright)' }}>
          <Brain className="w-4 h-4 text-amber-500" />
          <span>Cognitive Traits Strengthened by this Practice:</span>
        </h3>

        <div className="flex flex-wrap gap-2">
          {STUDENT_ARTICLE_DATA.studentTraits.map((trait, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{trait}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Bottom CTA to Play the Word Quest Game */}
      <div
        className="p-6 sm:p-8 rounded-3xl border relative overflow-hidden text-center space-y-4 shadow-md"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--accent-saffron)',
        }}
      >
        <div className="max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Mastery Assessment</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            Ready to Play the Chapter 6 Word Quest?
          </h2>

          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Test your understanding of Verse 6.17 keywords. Guess 5-letter sacred terms like <strong>YUKTA</strong>, <strong>DHYAN</strong>, and <strong>FOCUS</strong> in 6 attempts with acoustic sound feedback aligned with {isDark ? 'Chandra' : 'Surya'} mode.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {onPlayJigsaw && (
            <button
              type="button"
              id="btn-play-jigsaw-bottom"
              onClick={onPlayJigsaw}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold border transition-all hover:scale-104 active:scale-96 cursor-pointer shadow-md"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--accent-saffron)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Puzzle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Play Harmony Jigsaw (12 Pieces)</span>
            </button>
          )}

          <button
            type="button"
            id="btn-play-quest-bottom"
            onClick={onPlayQuest}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all hover:scale-104 active:scale-96 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-saffron)',
            }}
          >
            <Gamepad2 className="w-5 h-5 text-white animate-bounce" />
            <span>Play Quest</span>
          </button>
        </div>
      </div>
    </div>
  );
};

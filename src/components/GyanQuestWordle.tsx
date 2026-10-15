import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RotateCcw,
  Info,
  Volume2,
  VolumeX,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Trophy,
  ArrowRight,
  BookOpen,
  X,
  HelpCircle,
} from 'lucide-react';
import { SavedChapter } from '../lib/chapters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export interface WordleQuestion {
  question: string;
  answer: string;
  hint: string;
  lore?: string;
}

const DEFAULT_QUESTION_DECK: WordleQuestion[] = [
  {
    question: "What 5-letter vital breath is celebrated in ancient scripture as the invisible life current animating mortal vessels?",
    answer: "PRANA",
    hint: "Directly relates to breath and vital life energy (Pranayama) — begins with P and ends with A (5 letters).",
    lore: "In Yogic philosophy, prana flows through 72,000 nadis, sustaining the cosmic heartbeat."
  },
  {
    question: "What 6-letter universal law of cosmic duty, righteousness, and moral order sustains the entire cosmos?",
    answer: "DHARMA",
    hint: "Directly relates to universal duty and ethical conduct — begins with D and ends with A (6 letters).",
    lore: "Dharma upholds cosmic harmony, aligning individual conduct with universal order."
  },
  {
    question: "What 4-letter primordial sacrificial flame acts as the divine messenger between earth and cosmic realms?",
    answer: "AGNI",
    hint: "Directly relates to the holy transformative fire honored in Rigveda — begins with A and ends with I (4 letters).",
    lore: "Agni represents divine illumination and the transformation of worldly matter into energy."
  },
  {
    question: "What 6-letter state of supreme inner peace and tranquility calms the restless student mind?",
    answer: "SHANTI",
    hint: "Directly relates to peace recited three times at the close of sacred mantras — begins with S and ends with I (6 letters).",
    lore: "Shanti establishes peaceful equilibrium across body, mind, and cosmic surroundings."
  },
  {
    question: "What 7-letter supreme state of meditative absorption dissolves all duality in transcendent stillness?",
    answer: "SAMADHI",
    hint: "Directly relates to the highest limb of Raja Yoga meditation — begins with S and ends with I (7 letters).",
    lore: "In Patanjali's Yoga Sutras, Samadhi is the pinnacle of spiritual stillness."
  },
  {
    question: "What 5-letter universal law of action and consequence teaches that every intention shapes mortal destiny?",
    answer: "KARMA",
    hint: "Directly relates to the cosmic principle of cause and effect — begins with K and ends with A (5 letters).",
    lore: "Nishkama Karma guides the seeker to act selflessly without clinging to outcomes."
  }
];

const KB_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

interface GyanQuestWordleProps {
  chapter: SavedChapter;
  onExit?: () => void;
  onCompleteChapter?: () => void;
}

export const GyanQuestWordle: React.FC<GyanQuestWordleProps> = ({
  chapter,
  onExit,
  onCompleteChapter,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [deck, setDeck] = useState<WordleQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [enteredLetters, setEnteredLetters] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [solvedIndices, setSolvedIndices] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState<number>(0);
  const [isHintRevealed, setIsHintRevealed] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Inscribe your answer & press ENTER');
  const [statusType, setStatusType] = useState<'neutral' | 'correct' | 'wrong'>('neutral');
  const [rowShake, setRowShake] = useState<boolean>(false);
  const [tilesFeedback, setTilesFeedback] = useState<'none' | 'correct' | 'wrong'>('none');

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio feedback
  const playSound = useCallback((type: 'tap' | 'correct' | 'wrong') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      if (type === 'tap') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'correct') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const bell = ctx.createOscillator();
          const bellGain = ctx.createGain();
          bell.type = 'sine';
          bell.frequency.setValueAtTime(freq, now + idx * 0.06);
          bellGain.gain.setValueAtTime(0.18, now + idx * 0.06);
          bellGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 1.0);
          bell.connect(bellGain);
          bellGain.connect(ctx.destination);
          bell.start(now + idx * 0.06);
          bell.stop(now + idx * 0.06 + 1.0);
        });
      } else if (type === 'wrong') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (_) {}
  }, [soundEnabled]);

  // Fallback client question generator from chapter summary
  const generateFallbackQuestions = useCallback((text: string, title: string): WordleQuestion[] => {
    const words = text.toUpperCase().replace(/[^A-Z\s]/g, ' ').split(/\s+/);
    const stopwords = new Set([
      'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'ANY', 'CAN', 'HAD', 'HER', 'WAS', 'ONE', 'OUR',
      'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO',
      'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'THAT', 'WITH', 'HAVE', 'THIS', 'FROM',
      'THEY', 'WENT', 'WERE', 'WHAT', 'WHEN', 'SOME', 'THEM', 'THEN', 'LIKE', 'TIME', 'JUST', 'KNOW', 'TAKE',
      'INTO', 'YEAR', 'YOUR', 'GOOD', 'COULD', 'WOULD', 'THERE', 'THESE', 'OTHER', 'AFTER', 'FIRST', 'ABOUT',
      'THEIR', 'WHICH', 'WHERE', 'EVERY', 'BECAUSE', 'THROUGH', 'BEFORE', 'SHOULD', 'PEOPLE', 'LITTLE', 'WILL',
      'OVER', 'SUCH', 'EVEN', 'MOST', 'MADE', 'ALSO', 'BACK', 'WELL', 'MUCH', 'ONLY', 'VERY', 'SOME'
    ]);
    const candidates = [...new Set(words.filter((w) => w.length >= 3 && w.length <= 10 && !stopwords.has(w)))];
    const templates = [
      (len: number) => `What ${len}-letter core concept highlighted in this chapter represents a foundational principle?`,
      (len: number) => `According to this chapter, which ${len}-letter keyword signifies a key insight or truth?`,
      (len: number) => `What ${len}-letter term in the passage guides the reader toward greater understanding?`,
      (len: number) => `Which ${len}-letter essential term is emphasized as central in this text?`,
      (len: number) => `What ${len}-letter principle embodies the deeper focus discussed in this chapter?`,
    ];

    if (candidates.length >= 3) {
      const shuffled = [...candidates].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 6);
      return selected.map((word, idx) => {
        const len = word.length;
        return {
          question: templates[idx % templates.length](len),
          answer: word,
          hint: `Directly related to chapter — begins with '${word[0]}' and ends with '${word[len - 1]}' (${len} letters).`,
          lore: `A foundational keyword identified within "${title}".`
        };
      });
    }
    return DEFAULT_QUESTION_DECK;
  }, []);

  // Fetch or generate questions strictly for uploaded chapter
  const loadChapterDeck = useCallback(async () => {
    setIsLoading(true);
    setEnteredLetters('');
    setIsEvaluating(false);
    setSolvedIndices(new Set());
    setIsVictoryOpen(false);
    setCurrentIdx(0);
    setAttempts(0);
    setIsHintRevealed(false);

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: (chapter.summary || '') + '\n\n' + (chapter.title || ''),
          title: chapter.title || 'Uploaded Chapter',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          setDeck(data.questions);
          setIsLoading(false);
          setTimerSeconds(30);
          setIsTimerRunning(true);
          return;
        }
      }
      throw new Error('Fallback required');
    } catch (err) {
      const fallback = generateFallbackQuestions(
        (chapter.summary || '') + ' ' + (chapter.title || ''),
        chapter.title || 'Chapter'
      );
      setDeck(fallback);
      setIsLoading(false);
      setTimerSeconds(30);
      setIsTimerRunning(true);
    }
  }, [chapter, generateFallbackQuestions]);

  useEffect(() => {
    loadChapterDeck();
  }, [loadChapterDeck]);

  // Current Question details
  const currentQuestion = deck[currentIdx];
  const targetAnswer = currentQuestion?.answer?.trim()?.toUpperCase()?.replace(/[^A-Z]/g, '') || '';
  const targetLen = targetAnswer.length;

  // Reset inputs when switching questions
  const selectQuestion = useCallback((idx: number) => {
    if (isEvaluating) return;
    setCurrentIdx(idx);
    setEnteredLetters('');
    setAttempts(0);
    setIsHintRevealed(false);
    setTilesFeedback('none');
    setStatusMessage(`Inscribe a ${deck[idx]?.answer?.length || 5}-letter answer & press ENTER`);
    setStatusType('neutral');
    setTimerSeconds(30);
    setIsTimerRunning(true);
  }, [deck, isEvaluating]);

  // Advance to next unsolved question
  const advanceToNextQuestion = useCallback(() => {
    if (!deck.length) return;
    if (solvedIndices.size >= deck.length) {
      setIsTimerRunning(false);
      setIsVictoryOpen(true);
      playSound('correct');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_) {}
      return;
    }

    let nextIdx = (currentIdx + 1) % deck.length;
    for (let i = 0; i < deck.length; i++) {
      const candidate = (currentIdx + 1 + i) % deck.length;
      if (!solvedIndices.has(candidate)) {
        nextIdx = candidate;
        break;
      }
    }
    selectQuestion(nextIdx);
  }, [deck.length, solvedIndices, currentIdx, playSound, selectQuestion]);

  // Handle timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && !isEvaluating && !isLoading && !isVictoryOpen && deck.length > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Time expired
            setIsTimerRunning(false);
            playSound('wrong');
            setStatusMessage(`Time's up! The sacred answer was: ${targetAnswer}`);
            setStatusType('wrong');
            setTilesFeedback('wrong');
            setEnteredLetters(targetAnswer);
            setTimeout(() => {
              advanceToNextQuestion();
            }, 1800);
            return 0;
          }
          if (prev <= 6) {
            playSound('tap');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isEvaluating, isLoading, isVictoryOpen, deck.length, targetAnswer, playSound, advanceToNextQuestion]);

  // Submit Answer
  const submitAnswer = useCallback(() => {
    if (isEvaluating || !currentQuestion || isLoading || isVictoryOpen) return;

    if (enteredLetters.length < targetLen) {
      showToast(`Please inscribe all ${targetLen} letters`);
      setRowShake(true);
      setTimeout(() => setRowShake(false), 450);
      return;
    }

    setIsEvaluating(true);

    if (enteredLetters === targetAnswer) {
      // 🟢 CORRECT ANSWER
      playSound('correct');
      setStatusMessage(`Correct! "${targetAnswer}" is the sacred answer.`);
      setStatusType('correct');
      setTilesFeedback('correct');
      setIsTimerRunning(false);

      const nextSolved = new Set(solvedIndices);
      nextSolved.add(currentIdx);
      setSolvedIndices(nextSolved);

      showToast(`+15 XP Earned for "${targetAnswer}"!`, 'success');

      if (nextSolved.size >= deck.length) {
        if (onCompleteChapter) onCompleteChapter();
        setTimeout(() => {
          setIsEvaluating(false);
          setIsVictoryOpen(true);
          try {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          } catch (_) {}
        }, 1200);
      } else {
        setTimeout(() => {
          setIsEvaluating(false);
          advanceToNextQuestion();
        }, 1100);
      }
    } else {
      // 🔴 WRONG ANSWER
      playSound('wrong');
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setStatusMessage(`Incorrect inscription (${newAttempts} attempt${newAttempts > 1 ? 's' : ''})`);
      setStatusType('wrong');
      setTilesFeedback('wrong');
      setRowShake(true);
      setTimeout(() => setRowShake(false), 450);

      if (newAttempts >= 2) {
        setIsHintRevealed(true);
      }

      // Erase tiles after flash so user can retype immediately
      setTimeout(() => {
        setEnteredLetters('');
        setTilesFeedback('none');
        setStatusMessage(`Answer erased. Inscribe your ${targetLen}-letter attempt:`);
        setStatusType('neutral');
        setIsEvaluating(false);
      }, 750);
    }
  }, [
    isEvaluating,
    currentQuestion,
    isLoading,
    isVictoryOpen,
    enteredLetters,
    targetLen,
    targetAnswer,
    playSound,
    showToast,
    solvedIndices,
    currentIdx,
    deck.length,
    onCompleteChapter,
    advanceToNextQuestion,
    attempts,
  ]);

  // Key press handler
  const handleKey = useCallback((key: string) => {
    if (isEvaluating || isLoading || isVictoryOpen || !targetLen) return;

    if (key === 'ENTER') {
      submitAnswer();
    } else if (key === 'BACKSPACE') {
      if (enteredLetters.length > 0) {
        setEnteredLetters((prev) => prev.slice(0, -1));
        playSound('tap');
      }
    } else if (/^[A-Z]$/.test(key)) {
      if (enteredLetters.length < targetLen) {
        setEnteredLetters((prev) => prev + key);
        playSound('tap');
      }
    }
  }, [isEvaluating, isLoading, isVictoryOpen, targetLen, submitAnswer, enteredLetters.length, playSound]);

  // Physical keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isHelpOpen || isVictoryOpen) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleKey('ENTER');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKey('BACKSPACE');
      } else {
        const char = e.key.toUpperCase();
        if (/^[A-Z]$/.test(char) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          handleKey(char);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey, isHelpOpen, isVictoryOpen]);

  // Timer SVG math
  const circ = 91.1;
  const strokeOffset = circ * (1 - Math.max(0, timerSeconds) / 30);
  const isTimerUrgent = timerSeconds <= 5;

  return (
    <div
      className="w-full max-w-4xl mx-auto rounded-3xl border shadow-2xl p-4 sm:p-7 relative overflow-hidden select-none transition-all"
      style={{
        backgroundColor: '#0f1118',
        borderColor: '#d4af374d',
        color: '#f5e6a3',
      }}
    >
      {/* Background Vedic Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER */}
      <header className="flex items-center justify-between pb-4 border-b border-amber-500/20 mb-5 relative z-10">
        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 sm:px-3 sm:py-2 rounded-xl border border-amber-500/30 hover:border-amber-400 bg-black/40 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/10"
          title={soundEnabled ? 'Disable Sound Feedback' : 'Enable Sound Feedback'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          <span className="hidden sm:inline">🪔 Sound</span>
        </button>

        {/* Brand Center Title */}
        <div className="text-center">
          <div className="text-[10px] sm:text-xs font-bold tracking-widest text-amber-400 uppercase font-serif-heading">
            ज्ञान खोज · GYAN QUEST SHABDA
          </div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2 font-serif-heading">
            <span>WORD QUEST</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              Chapter Edition
            </span>
          </h2>
        </div>

        {/* Right Actions: Rules & Exit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="p-2 rounded-xl border border-amber-500/30 hover:border-amber-400 bg-black/40 text-amber-300 transition cursor-pointer hover:bg-amber-500/10"
            title="Laws of Gyan Quest Word Quest"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={loadChapterDeck}
            className="p-2 rounded-xl border border-amber-500/30 hover:border-amber-400 bg-black/40 text-amber-300 transition cursor-pointer hover:bg-amber-500/10"
            title="Reset & Re-forge Quest"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="p-2 rounded-xl border border-slate-700 bg-black/40 text-slate-400 hover:text-white transition cursor-pointer hover:bg-slate-800"
              title="Close Word Quest"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* ACTIVE CHAPTER MANUSCRIPT BAR (Strictly tied to the uploaded chapter) */}
      <div className="mb-5 p-3 sm:p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-black/40 to-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
            CHAPTER
          </span>
          <div className="truncate">
            <span className="text-xs sm:text-sm font-bold text-white block truncate">
              {chapter.title}
            </span>
            <span className="text-[10px] text-amber-200/60 block truncate">
              {chapter.fileName || 'Uploaded PDF'} · Vocabulary quest generated from chapter concepts only
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={loadChapterDeck}
          disabled={isLoading}
          className="self-stretch sm:self-auto px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:brightness-110 active:scale-98 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Regenerate Quest 🪷</span>
        </button>
      </div>

      {isLoading ? (
        /* Loading Scriptorium State */
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 animate-spin">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Consulting Chapter Manuscript...</h4>
            <p className="text-xs text-amber-200/70 max-w-sm mt-1">
              Guru AI is reading &ldquo;{chapter.title}&rdquo; to forge your 3-to-10 letter reflection questions.
            </p>
          </div>
        </div>
      ) : deck.length === 0 ? (
        <div className="py-16 text-center text-stone-400">
          <p className="mb-4">No questions could be formulated for this chapter.</p>
          <button
            type="button"
            onClick={loadChapterDeck}
            className="px-5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs cursor-pointer hover:bg-amber-400"
          >
            Try Again
          </button>
        </div>
      ) : (
        /* ACTIVE QUEST INTERFACE */
        <div className="space-y-4 sm:space-y-6 relative z-10">
          {/* QUESTION CARD */}
          <div
            className="rounded-2xl border p-4 sm:p-5 relative shadow-xl flex flex-col gap-3.5"
            style={{
              borderColor: '#d4af3766',
              background: 'linear-gradient(180deg, rgba(32, 36, 48, 0.95) 0%, rgba(18, 20, 28, 0.98) 100%)',
            }}
          >
            {/* Question Card Header: Badge, Timer & Skip */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif-heading">
                <span>🪷</span>
                <span>
                  QUESTION {currentIdx + 1} OF {deck.length} · {targetLen} LETTERS
                </span>
              </span>

              <div className="flex items-center gap-3">
                {/* Skip Question Button */}
                <button
                  type="button"
                  onClick={advanceToNextQuestion}
                  disabled={isEvaluating}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-300 bg-white/5 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
                  title="Skip to next unsolved question"
                >
                  Skip ➔
                </button>

                {/* 30-Second Countdown Meter */}
                <div
                  className={`relative w-9 h-9 flex items-center justify-center ${
                    isTimerUrgent ? 'animate-pulse' : ''
                  }`}
                  title="30-second countdown"
                >
                  <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="14.5"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="3.5"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14.5"
                      fill="none"
                      stroke={isTimerUrgent ? '#ff4757' : '#d4af37'}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      strokeDashoffset={strokeOffset}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <span
                    className={`absolute text-[11px] font-bold font-mono ${
                      isTimerUrgent ? 'text-red-400' : 'text-amber-200'
                    }`}
                  >
                    {Math.max(0, timerSeconds)}
                  </span>
                </div>
              </div>
            </div>

            {/* Question Prompt / Riddle */}
            <div className="min-h-[50px] flex items-center text-sm sm:text-base font-medium text-white leading-relaxed">
              {currentQuestion?.question}
            </div>

            {/* Sage's Hint Bar */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-all ${
                isHintRevealed
                  ? 'border-amber-400 bg-amber-950/40 shadow-xs'
                  : 'border-dashed border-amber-500/30 bg-black/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400 tracking-wider text-[11px] flex items-center gap-1 shrink-0 font-serif-heading">
                  <Lightbulb className="w-3.5 h-3.5" />
                  SAGE&apos;S HINT:
                </span>
                <span className="text-amber-100/80 italic text-xs">
                  {isHintRevealed
                    ? currentQuestion?.hint
                    : attempts >= 2
                    ? 'Hint unlocked!'
                    : 'Unlocks after 2 attempts, or click reveal'}
                </span>
              </div>

              {!isHintRevealed && (
                <button
                  type="button"
                  onClick={() => {
                    setIsHintRevealed(true);
                    showToast("Sage's Hint Revealed");
                  }}
                  className="self-end sm:self-auto px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:bg-amber-500/10 transition cursor-pointer"
                >
                  Reveal Hint
                </button>
              )}
            </div>

            {/* Question Navigation Selector Dots */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-amber-500/15 overflow-x-auto pb-1">
              {deck.map((q, idx) => {
                const isActive = idx === currentIdx;
                const isSolved = solvedIndices.has(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectQuestion(idx)}
                    className={`min-w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer border ${
                      isSolved
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                        : isActive
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-xs shadow-amber-500/30'
                        : 'bg-black/40 border-amber-500/20 text-stone-400 hover:text-white hover:border-amber-500/40'
                    }`}
                    title={`Question ${idx + 1} (${q.answer.length} letters)`}
                  >
                    {isSolved ? '✓' : idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ANSWER TILES ROW (Dynamic 3 to 10 letter boxes) */}
          <div className="flex flex-col items-center gap-3">
            <div
              className={`flex items-center justify-center gap-2 sm:gap-3 w-full max-w-lg transition-transform ${
                rowShake ? 'animate-bounce' : ''
              }`}
            >
              {Array.from({ length: targetLen }).map((_, i) => {
                const letter = enteredLetters[i] || '';
                const isFilled = i < enteredLetters.length;
                const isNextInput = i === enteredLetters.length;

                let tileBg = 'rgba(28, 33, 45, 0.9)';
                let tileBorder = 'rgba(212, 175, 55, 0.25)';
                let tileColor = '#f5e6a3';

                if (tilesFeedback === 'correct') {
                  tileBg = '#2ec076';
                  tileBorder = '#2ec076';
                  tileColor = '#ffffff';
                } else if (tilesFeedback === 'wrong') {
                  tileBg = '#ef4444';
                  tileBorder = '#ef4444';
                  tileColor = '#ffffff';
                } else if (isNextInput) {
                  tileBorder = '#d4af37';
                }

                return (
                  <div
                    key={i}
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center text-lg sm:text-2xl font-black font-mono uppercase transition-all shadow-inner ${
                      isFilled ? 'scale-105 shadow-md' : ''
                    } ${isNextInput ? 'ring-2 ring-amber-400/40' : ''}`}
                    style={{
                      backgroundColor: tileBg,
                      borderColor: tileBorder,
                      color: tileColor,
                    }}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>

            {/* Status Feedback Bar */}
            <div
              className={`text-xs sm:text-sm font-semibold tracking-wide min-h-[22px] transition-colors ${
                statusType === 'correct'
                  ? 'text-emerald-400 font-bold'
                  : statusType === 'wrong'
                  ? 'text-red-400 font-bold'
                  : 'text-amber-200/70'
              }`}
            >
              {statusMessage}
            </div>
          </div>

          {/* VIRTUAL KEYBOARD */}
          <div className="flex flex-col gap-1.5 sm:gap-2 max-w-xl mx-auto pt-2">
            {KB_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex items-center justify-center gap-1 sm:gap-1.5 w-full">
                {row.map((key) => {
                  const isAction = key === 'ENTER' || key === 'BACKSPACE';
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKey(key)}
                      className={`h-11 sm:h-12 rounded-lg font-bold text-xs sm:text-sm transition active:scale-95 flex items-center justify-center cursor-pointer border select-none ${
                        isAction
                          ? 'flex-[1.5] bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                          : 'flex-1 bg-slate-900/90 border-slate-800 text-slate-100 hover:border-amber-500/40 hover:bg-slate-800'
                      }`}
                    >
                      {key === 'BACKSPACE' ? '⌫' : key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RULES / HELP MODAL */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-3xl border p-6 max-w-md w-full space-y-4 shadow-2xl relative"
            style={{
              backgroundColor: '#161921',
              borderColor: '#d4af3766',
            }}
          >
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2 font-serif-heading">
                <span>🪷</span>
                <span>Laws of Gyan Quest Word Quest</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-stone-300 space-y-2.5 leading-relaxed">
              <p>1. <strong>Chapter-Specific</strong>: Every question is formulated strictly from this uploaded chapter&apos;s concepts.</p>
              <p>2. <strong>3 to 10 Letters</strong>: Each answer corresponds to the exact letter boxes shown.</p>
              <p>3. <strong>Green for Truth</strong>: Inscribe the correct word to illuminate the tiles green and advance.</p>
              <p>4. <strong>Red to Re-inscribe</strong>: Incorrect attempts flash red and automatically erase so you can retype.</p>
              <p>5. <strong>Sage&apos;s Hint</strong>: Unlocks after 2 attempts, or click &ldquo;Reveal Hint&rdquo; at any time.</p>
              <p>6. <strong>30-Second Timer</strong>: Contemplate swiftly before the sacred countdown expires.</p>
            </div>

            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md"
            >
              Begin Quest
            </button>
          </div>
        </div>
      )}

      {/* VICTORY MODAL */}
      {isVictoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="rounded-3xl border p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl relative"
            style={{
              backgroundColor: '#141722',
              borderColor: '#d4af3788',
            }}
          >
            <div className="text-5xl">🪷</div>
            <h3 className="text-2xl font-black text-amber-200 tracking-wide font-serif-heading">
              WISDOM MASTERED
            </h3>
            <p className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              ALL CHAPTER QUESTIONS DECIPHERED
            </p>
            <p className="text-xs sm:text-sm italic text-stone-300 bg-black/40 p-3.5 rounded-2xl border border-amber-500/20">
              &ldquo;Through contemplation, discernment, and steadfast inquiry into {chapter.title}, the seeker unveils the light of wisdom.&rdquo;
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
                <span className="text-[10px] text-stone-400 block uppercase font-bold">Questions Solved</span>
                <span className="text-lg font-bold text-emerald-400">{deck.length} / {deck.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
                <span className="text-[10px] text-stone-400 block uppercase font-bold">XP Awarded</span>
                <span className="text-lg font-bold text-amber-300">+{deck.length * 15} XP</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={loadChapterDeck}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md"
              >
                Play Another Round 🪷
              </button>
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="px-4 py-3 rounded-xl border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-white/5 cursor-pointer"
                >
                  Return to Manan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

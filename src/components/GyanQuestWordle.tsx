import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RotateCcw,
  Info,
  Volume2,
  VolumeX,
  Lightbulb,
  ArrowRight,
  BookOpen,
  X,
} from 'lucide-react';
import { SavedChapter } from '../lib/chapters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  generateWordleQuestionsForChapter,
  SCRIPTURE_WORDLE_DECKS,
} from '../lib/geminiClient';
import { getScriptureDefinition } from '../lib/scriptureData';

export interface WordleQuestion {
  question: string;
  answer: string;
  hint: string;
  lore?: string;
}

export type LetterFeedbackState = 'correct' | 'present' | 'absent';

export interface GuessEntry {
  word: string;
  states: LetterFeedbackState[];
}

/**
 * Standard Wordle two-pass letter evaluation:
 * - 'correct' (Green): Letter is in the word and in the exact position.
 * - 'present' (Yellow): Letter is in the word but in a different position.
 * - 'absent'  (Gray): Letter is not in the word in any remaining position.
 */
export function evaluateWordleGuess(guess: string, target: string): LetterFeedbackState[] {
  const len = target.length;
  const states: LetterFeedbackState[] = Array(len).fill('absent');
  const remainingCounts: Record<string, number> = {};

  // Pass 1: Identify exact matches (Green) and count unmatched target letters
  for (let i = 0; i < len; i++) {
    const tChar = target[i];
    const gChar = guess[i];
    if (gChar === tChar) {
      states[i] = 'correct';
    } else {
      remainingCounts[tChar] = (remainingCounts[tChar] || 0) + 1;
    }
  }

  // Pass 2: Identify misplaced matches (Yellow) vs absent (Gray)
  for (let i = 0; i < len; i++) {
    if (states[i] === 'correct') continue;
    const gChar = guess[i];
    if (remainingCounts[gChar] && remainingCounts[gChar] > 0) {
      states[i] = 'present';
      remainingCounts[gChar] -= 1;
    } else {
      states[i] = 'absent';
    }
  }

  return states;
}

const KB_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

interface GyanQuestWordleProps {
  chapter: SavedChapter;
  onExit?: () => void;
  onCompleteChapter?: () => void;
  onNextActivity?: () => void;
}

export const GyanQuestWordle: React.FC<GyanQuestWordleProps> = ({
  chapter,
  onExit,
  onCompleteChapter,
  onNextActivity,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const scripture = getScriptureDefinition(chapter);

  const [deck, setDeck] = useState<WordleQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [enteredLetters, setEnteredLetters] = useState<string>('');
  const [guessHistory, setGuessHistory] = useState<GuessEntry[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [solvedIndices, setSolvedIndices] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState<number>(0);
  const [isHintRevealed, setIsHintRevealed] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isReadLessonOpen, setIsReadLessonOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [isFailureOpen, setIsFailureOpen] = useState<boolean>(false);
  const [missedCount, setMissedCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Inscribe your answer & press ENTER');
  const [statusType, setStatusType] = useState<'neutral' | 'correct' | 'wrong'>('neutral');
  const [rowShake, setRowShake] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio feedback
  const playSound = useCallback(
    (type: 'tap' | 'correct' | 'wrong') => {
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
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
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
    },
    [soundEnabled]
  );

  // Fetch or generate questions strictly for the active chapter / scripture using Browser API keys & Gemini 3.5 Flash Lite
  const loadChapterDeck = useCallback(async () => {
    setIsLoading(true);
    setEnteredLetters('');
    setGuessHistory([]);
    setIsEvaluating(false);
    setSolvedIndices(new Set());
    setIsVictoryOpen(false);
    setIsFailureOpen(false);
    setMissedCount(0);
    setCurrentIdx(0);
    setAttempts(0);
    setIsHintRevealed(false);

    try {
      const generated = await generateWordleQuestionsForChapter(chapter);
      if (generated && generated.length > 0) {
        setDeck(generated);
        setIsLoading(false);
        setTimerSeconds(60);
        setIsTimerRunning(true);
        setStatusMessage(`Inscribe a ${generated[0]?.answer?.length || 5}-letter answer & press ENTER`);
        setStatusType('neutral');
        return;
      }
      throw new Error('Fallback required');
    } catch (_) {
      const fallback = scripture
        ? SCRIPTURE_WORDLE_DECKS[scripture.scriptureKey]
        : SCRIPTURE_WORDLE_DECKS.gita;
      setDeck(fallback);
      setIsLoading(false);
      setTimerSeconds(60);
      setIsTimerRunning(true);
      setStatusMessage(`Inscribe a ${fallback[0]?.answer?.length || 5}-letter answer & press ENTER`);
      setStatusType('neutral');
    }
  }, [chapter, scripture]);

  useEffect(() => {
    loadChapterDeck();
  }, [loadChapterDeck]);

  // Current Question details
  const currentQuestion = deck[currentIdx];
  const targetAnswer = currentQuestion?.answer?.trim()?.toUpperCase()?.replace(/[^A-Z]/g, '') || '';
  const targetLen = targetAnswer.length;

  // Compute keyboard letter states from guessHistory (correct > present > absent)
  const keyboardLetterStates = useMemo(() => {
    const map: Record<string, LetterFeedbackState> = {};
    const priority: Record<LetterFeedbackState, number> = {
      correct: 3,
      present: 2,
      absent: 1,
    };

    for (const entry of guessHistory) {
      for (let i = 0; i < entry.word.length; i++) {
        const ch = entry.word[i];
        const st = entry.states[i];
        const existing = map[ch];
        if (!existing || priority[st] > priority[existing]) {
          map[ch] = st;
        }
      }
    }
    return map;
  }, [guessHistory]);

  // Reset inputs when switching questions
  const selectQuestion = useCallback(
    (idx: number) => {
      if (isEvaluating) return;
      setCurrentIdx(idx);
      setEnteredLetters('');
      setGuessHistory([]);
      setAttempts(0);
      setIsHintRevealed(false);
      setStatusMessage(`Inscribe a ${deck[idx]?.answer?.length || 5}-letter answer & press ENTER`);
      setStatusType('neutral');
      setTimerSeconds(60);
      setIsTimerRunning(true);
    },
    [deck, isEvaluating]
  );

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
          origin: { y: 0.6 },
        });
      } catch (_) {}
      return;
    }

    let nextIdx = -1;
    for (let i = 0; i < deck.length; i++) {
      const candidate = (currentIdx + 1 + i) % deck.length;
      if (!solvedIndices.has(candidate)) {
        nextIdx = candidate;
        break;
      }
    }

    if (nextIdx !== -1) {
      selectQuestion(nextIdx);
    } else {
      setIsTimerRunning(false);
      setIsFailureOpen(true);
    }
  }, [deck.length, solvedIndices, currentIdx, playSound, selectQuestion]);

  // Handle timer countdown (60 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      isTimerRunning &&
      !isEvaluating &&
      !isLoading &&
      !isVictoryOpen &&
      !isFailureOpen &&
      !isReadLessonOpen &&
      !isHelpOpen &&
      deck.length > 0
    ) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTimerRunning(false);
            playSound('wrong');
            setMissedCount((c) => c + 1);
            setStatusMessage(`Time's up! The sacred answer was: ${targetAnswer}`);
            setStatusType('wrong');
            setTimeout(() => {
              setIsFailureOpen(true);
            }, 1800);
            return 0;
          }
          if (prev <= 8) {
            playSound('tap');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [
    isTimerRunning,
    isEvaluating,
    isLoading,
    isVictoryOpen,
    isFailureOpen,
    isReadLessonOpen,
    isHelpOpen,
    deck.length,
    targetAnswer,
    playSound,
  ]);

  // Submit Answer with full Wordle Green / Yellow / Gray feedback
  const submitAnswer = useCallback(() => {
    if (isEvaluating || !currentQuestion || isLoading || isVictoryOpen) return;

    if (enteredLetters.length < targetLen) {
      showToast(`Please inscribe all ${targetLen} letters`);
      setRowShake(true);
      setTimeout(() => setRowShake(false), 450);
      return;
    }

    setIsEvaluating(true);
    const guessWord = enteredLetters.toUpperCase();
    const states = evaluateWordleGuess(guessWord, targetAnswer);
    const newEntry: GuessEntry = { word: guessWord, states };

    setGuessHistory((prev) => [...prev, newEntry]);
    setEnteredLetters('');

    if (guessWord === targetAnswer) {
      // 🟢 ALL GREEN — CORRECT ANSWER
      playSound('correct');
      setStatusMessage(`All Green! "${targetAnswer}" is the sacred answer.`);
      setStatusType('correct');
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
        }, 1200);
      }
    } else {
      // 🟩🟨⬛ PARTIAL / WRONG ATTEMPT — Keep color-coded row visible & allow next guess
      playSound('wrong');
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const greenCount = states.filter((s) => s === 'correct').length;
      const yellowCount = states.filter((s) => s === 'present').length;

      setStatusMessage(
        `Attempt #${newAttempts}: ${greenCount} Green (exact spot), ${yellowCount} Yellow (wrong spot). Try your next guess below!`
      );
      setStatusType('wrong');
      setRowShake(true);
      setTimeout(() => setRowShake(false), 450);

      if (newAttempts >= 2) {
        setIsHintRevealed(true);
      }

      setTimeout(() => {
        setIsEvaluating(false);
      }, 300);
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
  const handleKey = useCallback(
    (key: string) => {
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
    },
    [isEvaluating, isLoading, isVictoryOpen, targetLen, submitAnswer, enteredLetters.length, playSound]
  );

  // Physical keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isHelpOpen || isVictoryOpen || isReadLessonOpen) return;

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
  }, [handleKey, isHelpOpen, isVictoryOpen, isReadLessonOpen]);

  // Timer SVG math (60 seconds)
  const circ = 91.1;
  const strokeOffset = circ * (1 - Math.max(0, timerSeconds) / 60);
  const isTimerUrgent = timerSeconds <= 8;
  const isCurrentQuestionSolved = solvedIndices.has(currentIdx);

  const getTileStyle = (state: LetterFeedbackState) => {
    if (state === 'correct') {
      // Green (Original Wordle exact match)
      return {
        backgroundColor: '#16a34a',
        borderColor: '#22c55e',
        color: '#ffffff',
      };
    }
    if (state === 'present') {
      // Yellow (Original Wordle wrong spot)
      return {
        backgroundColor: '#ca8a04',
        borderColor: '#eab308',
        color: '#ffffff',
      };
    }
    // Gray (Original Wordle not in word)
    return {
      backgroundColor: '#334155',
      borderColor: '#475569',
      color: '#e2e8f0',
    };
  };

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
              {scripture ? 'Scripture Edition' : 'Chapter Edition'}
            </span>
          </h2>
        </div>

        {/* Right Actions: Read Lesson, Rules & Exit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsReadLessonOpen(true)}
            className="px-3 py-2 rounded-xl border border-amber-500/30 hover:border-amber-400 bg-black/40 text-amber-300 transition cursor-pointer hover:bg-amber-500/10 flex items-center gap-1.5 text-xs font-bold"
            title="Read Chapter Lesson"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Read Lesson</span>
          </button>
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
            className="px-3 py-2 rounded-xl border border-amber-500/30 hover:border-amber-400 bg-black/40 text-amber-300 transition cursor-pointer hover:bg-amber-500/10 flex items-center gap-1.5 text-xs font-bold"
            title="Retry Puzzle & Regenerate Questions"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Retry Puzzle</span>
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

      {/* ACTIVE CHAPTER MANUSCRIPT BAR */}
      <div className="mb-5 p-3 sm:p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-black/40 to-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
            {scripture ? 'SCRIPTURE' : 'CHAPTER'}
          </span>
          <div className="truncate">
            <span className="text-xs sm:text-sm font-bold text-white block truncate">
              {chapter.title}
            </span>
            <span className="text-[10px] text-amber-200/60 block truncate">
              {chapter.fileName || 'Sacred Manuscript'} · Powered by Gemini 3.5 Flash Lite
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
              Guru AI (Gemini 3.5 Flash Lite) is reading &ldquo;{chapter.title}&rdquo; to forge your chapter-specific Word Quest.
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
        <div className="space-y-4 sm:space-y-5 relative z-10">
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

                {/* 60-Second Countdown Meter */}
                <div
                  className={`relative w-9 h-9 flex items-center justify-center ${
                    isTimerUrgent ? 'animate-pulse' : ''
                  }`}
                  title="60-second countdown"
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
            <div className="min-h-[46px] flex items-center text-sm sm:text-base font-medium text-white leading-relaxed">
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

          {/* WORDLE COLOR LEGEND BAR */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-stone-300 bg-black/30 py-2 px-4 rounded-xl border border-amber-500/15">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#16a34a] border border-[#22c55e] inline-block" />
              <span>Green: Exact Spot</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#ca8a04] border border-[#eab308] inline-block" />
              <span>Yellow: In Word, Wrong Spot</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#334155] border border-[#475569] inline-block" />
              <span>Gray: Not in Word</span>
            </span>
          </div>

          {/* WORDLE GUESS GRID (Submitted color-coded rows + Active input row) */}
          <div className="flex flex-col items-center gap-2.5">
            {/* Previous Submitted Attempts with Green, Yellow, and Gray tiles */}
            {guessHistory.map((entry, gIdx) => (
              <div
                key={gIdx}
                className="flex items-center justify-center gap-2 sm:gap-2.5 w-full max-w-lg animate-in fade-in duration-200"
              >
                {Array.from({ length: targetLen }).map((_, i) => {
                  const ch = entry.word[i] || '';
                  const st = entry.states[i] || 'absent';
                  const styleObj = getTileStyle(st);
                  return (
                    <div
                      key={i}
                      className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl border-2 flex items-center justify-center text-lg sm:text-2xl font-black font-mono uppercase shadow-md transition-all"
                      style={styleObj}
                      title={
                        st === 'correct'
                          ? `${ch}: Correct spot (Green)`
                          : st === 'present'
                          ? `${ch}: In word, wrong spot (Yellow)`
                          : `${ch}: Not in word (Gray)`
                      }
                    >
                      {ch}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Active Input Row (shown while question is not yet solved) */}
            {!isCurrentQuestionSolved && (
              <div
                className={`flex items-center justify-center gap-2 sm:gap-2.5 w-full max-w-lg transition-transform ${
                  rowShake ? 'animate-bounce' : ''
                }`}
              >
                {Array.from({ length: targetLen }).map((_, i) => {
                  const letter = enteredLetters[i] || '';
                  const isFilled = i < enteredLetters.length;
                  const isNextInput = i === enteredLetters.length;

                  const tileBg = 'rgba(28, 33, 45, 0.9)';
                  const tileBorder = isNextInput ? '#d4af37' : 'rgba(212, 175, 55, 0.25)';
                  const tileColor = '#f5e6a3';

                  return (
                    <div
                      key={i}
                      className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl border-2 flex items-center justify-center text-lg sm:text-2xl font-black font-mono uppercase transition-all shadow-inner ${
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
            )}

            {/* Status Feedback Bar */}
            <div
              className={`text-xs sm:text-sm font-semibold tracking-wide min-h-[22px] text-center transition-colors ${
                statusType === 'correct'
                  ? 'text-emerald-400 font-bold'
                  : statusType === 'wrong'
                  ? 'text-amber-300 font-bold'
                  : 'text-amber-200/70'
              }`}
            >
              {statusMessage}
            </div>
          </div>

          {/* VIRTUAL KEYBOARD WITH GREEN / YELLOW / GRAY FEEDBACK */}
          <div className="flex flex-col gap-1.5 sm:gap-2 max-w-xl mx-auto pt-1">
            {KB_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex items-center justify-center gap-1 sm:gap-1.5 w-full">
                {row.map((key) => {
                  const isAction = key === 'ENTER' || key === 'BACKSPACE';
                  const kState = !isAction ? keyboardLetterStates[key] : undefined;

                  let keyStyle: React.CSSProperties | undefined;
                  let keyClass =
                    'flex-1 bg-slate-900/90 border-slate-800 text-slate-100 hover:border-amber-500/40 hover:bg-slate-800';

                  if (isAction) {
                    keyClass =
                      'flex-[1.5] bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30';
                  } else if (kState) {
                    keyStyle = getTileStyle(kState);
                    keyClass = 'flex-1 hover:brightness-110';
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKey(key)}
                      style={keyStyle}
                      className={`h-11 sm:h-12 rounded-lg font-bold text-xs sm:text-sm transition active:scale-95 flex items-center justify-center cursor-pointer border select-none ${keyClass}`}
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
              <p>1. <strong>Lesson-Specific</strong>: Every question is formulated strictly from this scripture or chapter&apos;s concepts.</p>
              <p>2. <strong>Wordle Color Feedback</strong>: After each ENTER submission, tiles and keyboard keys light up:</p>
              <ul className="pl-4 space-y-1">
                <li>🟩 <strong className="text-emerald-400">Green</strong>: Correct letter in the exact right position.</li>
                <li>🟨 <strong className="text-yellow-400">Yellow</strong>: Letter is in the word, but in a different spot.</li>
                <li>⬛ <strong className="text-slate-400">Gray</strong>: Letter is not in the target word.</li>
              </ul>
              <p>3. <strong>Read Lesson Anytime</strong>: Click &ldquo;Read Lesson&rdquo; in the top bar to review the chapter summary.</p>
              <p>4. <strong>Sage&apos;s Hint</strong>: Unlocks after 2 attempts, or click &ldquo;Reveal Hint&rdquo; at any time.</p>
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

      {/* READ LESSON MODAL */}
      {isReadLessonOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="rounded-3xl border p-6 max-w-lg w-full space-y-4 shadow-2xl relative max-h-[80vh] flex flex-col"
            style={{
              backgroundColor: '#161921',
              borderColor: '#d4af3766',
            }}
          >
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2 font-serif-heading">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>Chapter Lesson: {chapter.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReadLessonOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-stone-300 space-y-3 leading-relaxed overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20 text-amber-200/90 font-medium">
                {chapter.fileName || chapter.title}
              </div>
              <div className="whitespace-pre-line text-stone-200">
                {chapter.summary ||
                  scripture?.summary ||
                  'Review the core concepts, definitions, and principles of this chapter to help you solve the Word Quest.'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsReadLessonOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md"
            >
              Resume Word Quest
            </button>
          </div>
        </div>
      )}

      {/* VICTORY MODAL (100% Correct) */}
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
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
              100% CORRECT • ALL QUESTIONS DECIPHERED
            </p>
            <p className="text-xs sm:text-sm italic text-stone-300 bg-black/40 p-3.5 rounded-2xl border border-amber-500/20">
              &ldquo;Through contemplation, discernment, and steadfast inquiry into {chapter.title}, the seeker unveils the light of wisdom.&rdquo;
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
                <span className="text-[10px] text-stone-400 block uppercase font-bold">Questions Solved</span>
                <span className="text-lg font-bold text-emerald-400">
                  {deck.length} / {deck.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
                <span className="text-[10px] text-stone-400 block uppercase font-bold">Accuracy</span>
                <span className="text-lg font-bold text-amber-300">100%</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {onNextActivity && (
                <button
                  type="button"
                  onClick={onNextActivity}
                  className="flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: 'var(--accent-saffron)' }}
                >
                  <span>Next Activity: Crossword</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={loadChapterDeck}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md"
              >
                Retry Puzzle 🪷
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAILURE MODAL (< 100% Correct) */}
      {isFailureOpen && !isVictoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="rounded-3xl border p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl relative"
            style={{
              backgroundColor: '#141722',
              borderColor: '#ef444488',
            }}
          >
            <div className="text-5xl">⏳</div>
            <h3 className="text-2xl font-black text-rose-300 tracking-wide font-serif-heading">
              CONTEMPLATION INCOMPLETE
            </h3>
            <p className="text-xs uppercase tracking-widest text-rose-400 font-bold">
              100% ACCURACY REQUIRED TO ADVANCE
            </p>
            <p className="text-xs sm:text-sm text-stone-300 bg-black/40 p-3.5 rounded-2xl border border-rose-500/20 leading-relaxed">
              You solved {solvedIndices.size} of {deck.length} questions (
              {deck.length > 0 ? Math.round((solvedIndices.size / deck.length) * 100) : 0}%). In Manan, 100% accuracy is required before advancing to the next activity.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={loadChapterDeck}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Puzzle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

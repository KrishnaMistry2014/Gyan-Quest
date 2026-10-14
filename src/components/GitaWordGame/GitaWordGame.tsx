import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, BookOpen, HelpCircle, ArrowLeft, Sun, Moon, Radio, Puzzle } from 'lucide-react';
import { GITA_WORDS, GitaWordItem } from '../../data/gitaQuestData';
import { ProgressBar } from './ProgressBar';
import { VerseClueCard } from './VerseClueCard';
import { WordGrid } from './WordGrid';
import { VirtualKeyboard } from './VirtualKeyboard';
import { ResultBanner } from './ResultBanner';
import { StudentWisdomModal } from './StudentWisdomModal';
import { HowToPlayModal } from './HowToPlayModal';
import { QuestCompletedModal } from './QuestCompletedModal';
import { vedicAudio } from '../../utils/gitaAudio';
import { useTheme } from '../../context/ThemeContext';

import heroDiyaImg from '../../assets/images/gyanquest_hero_diya_1791870559877.jpg';
import krishnaChariotImg from '../../assets/images/gyanquest_krishna_chariot_1791870561061.jpg';
import sacredLotusImg from '../../assets/images/gyanquest_sacred_lotus_1791870561244.jpg';

const STORAGE_KEY = 'gyanquest_state_v1';
const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

interface PersistedGameState {
  currentIndex: number;
  guesses: string[];
  score: number;
  completedWords: number[];
  isMuted: boolean;
}

interface GitaWordGameProps {
  onBackToGita: () => void;
  onOpenReader?: () => void;
  onOpenJigsaw?: () => void;
}

export const GitaWordGame: React.FC<GitaWordGameProps> = ({ onBackToGita, onOpenReader, onOpenJigsaw }) => {
  const { isDark, toggleTheme } = useTheme();

  // Load state from localStorage or use defaults
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [completedWords, setCompletedWords] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // UI Modals
  const [isWisdomOpen, setIsWisdomOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isQuestCompletedOpen, setIsQuestCompletedOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Align sound synthesizer theme with Surya / Chandra
  useEffect(() => {
    vedicAudio.setTheme(isDark ? 'chandra' : 'surya');
  }, [isDark]);

  // Load from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data: PersistedGameState = JSON.parse(saved);
        if (typeof data.currentIndex === 'number' && data.currentIndex < GITA_WORDS.length) {
          setCurrentIndex(data.currentIndex);
        }
        if (Array.isArray(data.guesses)) {
          setGuesses(data.guesses);
        }
        if (typeof data.score === 'number') {
          setScore(data.score);
        }
        if (Array.isArray(data.completedWords)) {
          setCompletedWords(data.completedWords);
        }
        if (typeof data.isMuted === 'boolean') {
          setIsMuted(data.isMuted);
          vedicAudio.isMuted = data.isMuted;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      const payload: PersistedGameState = {
        currentIndex,
        guesses,
        score,
        completedWords,
        isMuted,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore
    }
  }, [currentIndex, guesses, score, completedWords, isMuted]);

  const currentItem: GitaWordItem = GITA_WORDS[currentIndex] || GITA_WORDS[0];
  const targetWord = currentItem.word;

  // Determine game status for the current word
  const isWon = guesses.length > 0 && guesses[guesses.length - 1] === targetWord;
  const isFailed = !isWon && guesses.length >= MAX_ATTEMPTS;
  const isRoundOver = isWon || isFailed;

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    vedicAudio.playInvalidWord();
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2200);
  };

  // Handle typing a character
  const handleChar = useCallback(
    (char: string) => {
      if (isRoundOver) return;
      if (currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => prev + char.toUpperCase());
        vedicAudio.playKeyType();
      }
    },
    [isRoundOver, currentGuess]
  );

  // Handle Backspace
  const handleBackspace = useCallback(() => {
    if (isRoundOver) return;
    if (currentGuess.length > 0) {
      setCurrentGuess((prev) => prev.slice(0, -1));
      vedicAudio.playBackspace();
    }
  }, [isRoundOver, currentGuess]);

  // Handle Enter / Submit Guess
  const handleSubmit = useCallback(() => {
    if (isRoundOver) return;

    if (currentGuess.length < WORD_LENGTH) {
      showToast('Need 5 letters for the Vedic keyword');
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');

    const wonThisTurn = currentGuess === targetWord;
    const reachedMaxAttempts = newGuesses.length >= MAX_ATTEMPTS;

    if (wonThisTurn) {
      const attemptPoints = Math.max(10, (MAX_ATTEMPTS - newGuesses.length + 1) * 20);
      setScore((prev) => prev + attemptPoints);
      if (!completedWords.includes(currentIndex)) {
        setCompletedWords((prev) => [...prev, currentIndex]);
      }
      vedicAudio.playVictoryChime();
    } else if (reachedMaxAttempts) {
      vedicAudio.playWordReveal();
    } else {
      vedicAudio.playSubmitAttempt();
    }
  }, [isRoundOver, currentGuess, guesses, targetWord, currentIndex, completedWords]);

  // Physical Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if any modal is active or focused inside inputs
      if (
        isWisdomOpen ||
        isHowToPlayOpen ||
        isQuestCompletedOpen ||
        isResetConfirmOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleChar(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, handleBackspace, handleChar, isWisdomOpen, isHowToPlayOpen, isQuestCompletedOpen, isResetConfirmOpen]);

  // Progress to next word
  const handleNextWord = () => {
    if (currentIndex < GITA_WORDS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setGuesses([]);
      setCurrentGuess('');
      vedicAudio.playTempleBell();
    } else {
      // Completed all words
      setIsQuestCompletedOpen(true);
      vedicAudio.playVictoryChime();
    }
  };

  // Reset progress
  const handleConfirmReset = () => {
    setCurrentIndex(0);
    setGuesses([]);
    setCurrentGuess('');
    setScore(0);
    setCompletedWords([]);
    setIsResetConfirmOpen(false);
    setIsQuestCompletedOpen(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    vedicAudio.playTempleBell();
  };

  const handleOpenResetDialog = () => {
    setIsResetConfirmOpen(true);
  };

  const handleToggleSound = () => {
    setIsMuted((prev) => {
      const next = !prev;
      vedicAudio.isMuted = next;
      return next;
    });
  };

  const handleOpenLesson = () => {
    if (onOpenReader) {
      onOpenReader();
    } else {
      setIsWisdomOpen(true);
    }
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col antialiased pb-12 animate-in fade-in duration-300 transition-colors"
      style={{
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Game Header */}
      <header
        className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 py-3.5 px-4 sm:px-6 border-b backdrop-blur-sm sticky top-0 z-20 shadow-xs transition-colors"
        style={{
          backgroundColor: 'var(--bg-nav)',
          borderColor: 'var(--border-warm)',
        }}
      >
        {/* Back to Gita View & Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBackToGita}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
              color: 'var(--accent-saffron-text)',
            }}
            title="Return to Chapter Explorer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Gita</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl select-none" role="img" aria-label="Sacred Lamp">🪔</span>
            <div className="flex flex-col">
              <span className="font-serif-heading text-base sm:text-lg font-bold tracking-tight whitespace-nowrap leading-none" style={{ color: 'var(--accent-saffron-bright)' }}>
                GyanQuest
              </span>
              <span className="text-[10px] font-semibold hidden sm:inline mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Bhagavad Gita Word Quest
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Surya/Chandra Indicator */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Surya / Chandra Theme & Audio Alignment Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all hover:scale-102 cursor-pointer shadow-2xs"
            style={{
              backgroundColor: isDark ? '#2C231B' : '#FEF3C7',
              borderColor: isDark ? '#D97706' : '#FDE68A',
              color: isDark ? '#FBBF24' : '#92400E',
            }}
            title={isDark ? 'Chandra Night Mode (tranquil audio frequencies active)' : 'Surya Day Mode (solar radiant audio frequencies active)'}
          >
            {isDark ? (
              <>
                <Moon className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span className="hidden sm:inline">Chandra</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600 fill-current" />
                <span className="hidden sm:inline">Surya</span>
              </>
            )}
          </button>

          {/* Harmony Puzzle Button */}
          {onOpenJigsaw && (
            <button
              type="button"
              id="btn-switch-to-jigsaw"
              onClick={onOpenJigsaw}
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer hover:scale-102 shadow-2xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--accent-saffron)',
                color: 'var(--accent-saffron-text)',
              }}
              title="Play 12-Piece Harmony of Life Jigsaw Puzzle"
            >
              <Puzzle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">Harmony Puzzle</span>
              <span className="md:hidden">Puzzle</span>
            </button>
          )}

          {/* Gita Voice Reader Button */}
          <button
            type="button"
            onClick={handleOpenLesson}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer hover:scale-102"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-secondary)',
            }}
            title="Read Chapter 6.17 Student Lesson & Voice Reader"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden md:inline">Voice Reader</span>
            <span className="md:hidden">Reader</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHowToPlayOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-secondary)',
            }}
            title="Game Rules & Instructions"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Rules</span>
          </button>

          <button
            type="button"
            onClick={handleToggleSound}
            className="p-2 rounded-xl border transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-secondary)',
            }}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center">
        {/* Vedic Hero Banner Strip */}
        <div
          className="w-full border rounded-2xl p-4 sm:p-5 shadow-xs mb-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 transition-colors"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-amber-600/40 shadow-xs">
            <img
              src={heroDiyaImg}
              alt="Gita Manuscript & Diya"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-center sm:text-left flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--accent-saffron-bright)' }}>
              Timeless Vedic Wisdom • Chapter 6 Verse 6.17
            </span>
            <h1 className="font-serif-heading text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Bhagavad Gita Word Quest
            </h1>
            <p className="text-xs mt-0.5 font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Unravel key 5-letter words from the sacred Bhagavad Gita text. 6 chances per verse.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenLesson}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap self-stretch sm:self-auto text-center cursor-pointer hover:scale-102"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--accent-saffron)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            Read Student Lesson →
          </button>
        </div>

        {/* Quest Progress Tracker */}
        <ProgressBar
          currentIndex={currentIndex}
          totalWords={GITA_WORDS.length}
          attemptsUsed={guesses.length}
          maxAttempts={MAX_ATTEMPTS}
          chapter={currentItem.chapter}
          verse={currentItem.verse}
          chapterName={currentItem.chapterName}
          score={score}
          onReset={handleOpenResetDialog}
        />

        {/* Toast Alert Message */}
        {toastMessage && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-[#78350F] text-white text-xs font-semibold shadow-md animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* Clue Card */}
        <VerseClueCard item={currentItem} imageHero={heroDiyaImg} />

        {/* 6-Attempt 5-Letter Word Grid */}
        <WordGrid
          guesses={guesses}
          currentGuess={currentGuess}
          targetWord={targetWord}
          maxAttempts={MAX_ATTEMPTS}
          wordLength={WORD_LENGTH}
        />

        {/* Virtual Vedic Keyboard (Visible when round is active) */}
        {!isRoundOver && (
          <VirtualKeyboard
            onChar={handleChar}
            onEnter={handleSubmit}
            onBackspace={handleBackspace}
            guesses={guesses}
            targetWord={targetWord}
            disabled={isRoundOver}
          />
        )}

        {/* Result & Next Button Banner */}
        {isRoundOver && (
          <ResultBanner
            item={currentItem}
            isWon={isWon}
            attemptsUsed={guesses.length}
            onNextWord={handleNextWord}
            isLastWord={currentIndex === GITA_WORDS.length - 1}
          />
        )}
      </main>

      {/* Modals */}
      <StudentWisdomModal
        isOpen={isWisdomOpen}
        onClose={() => setIsWisdomOpen(false)}
        imageChariot={krishnaChariotImg}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <QuestCompletedModal
        isOpen={isQuestCompletedOpen}
        score={score}
        wordsSolvedCount={completedWords.length}
        totalWords={GITA_WORDS.length}
        onRestart={handleConfirmReset}
        imageLotus={sacredLotusImg}
      />

      {/* In-App Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-sm border rounded-2xl shadow-xl p-6 text-center"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
          >
            <h3 className="font-serif-heading text-lg font-bold mb-2" style={{ color: 'var(--accent-saffron-bright)' }}>
              Restart GyanQuest?
            </h3>
            <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to restart your journey from Word 1? Your solved progress and current score will be cleared.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border cursor-pointer hover:opacity-90"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                Continue Quest
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white cursor-pointer hover:opacity-90"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                }}
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

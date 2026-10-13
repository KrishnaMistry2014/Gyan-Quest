import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, BookOpen, HelpCircle, ArrowLeft } from 'lucide-react';
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
}

export const GitaWordGame: React.FC<GitaWordGameProps> = ({ onBackToGita }) => {
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

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (isRoundOver) return;
    if (currentGuess.length > 0) {
      setCurrentGuess((prev) => prev.slice(0, -1));
      vedicAudio.playBackspace();
    }
  }, [isRoundOver, currentGuess]);

  // Handle submit attempt
  const handleSubmit = useCallback(() => {
    if (isRoundOver) return;
    if (currentGuess.length < WORD_LENGTH) {
      showToast('Word must be 5 letters');
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (currentGuess === targetWord) {
      // Correct!
      const points = (MAX_ATTEMPTS - guesses.length) * 20; // up to 120 points
      setScore((prev) => prev + points);
      setCompletedWords((prev) => (prev.includes(currentItem.id) ? prev : [...prev, currentItem.id]));
      vedicAudio.playVictoryChime();
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      // Failed attempts exhausted
      vedicAudio.playWordReveal();
    } else {
      // Partial attempt
      vedicAudio.playSubmitAttempt();
    }
  }, [isRoundOver, currentGuess, guesses, targetWord, currentItem.id]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
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
  }, [handleSubmit, handleBackspace, handleChar]);

  // Proceed to next word
  const handleNextWord = () => {
    if (currentIndex < GITA_WORDS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setGuesses([]);
      setCurrentGuess('');
    } else {
      setIsQuestCompletedOpen(true);
    }
  };

  // Reset entire quest
  const handleOpenResetDialog = () => {
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    setCurrentIndex(0);
    setGuesses([]);
    setCurrentGuess('');
    setScore(0);
    setCompletedWords([]);
    localStorage.removeItem(STORAGE_KEY);
    setIsResetConfirmOpen(false);
  };

  // Toggle audio
  const handleToggleSound = () => {
    setIsMuted((prev) => {
      const next = !prev;
      vedicAudio.isMuted = next;
      return next;
    });
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#FAF5ED] text-[#29221C] antialiased selection:bg-amber-200 selection:text-amber-900 pb-12 animate-in fade-in duration-300">
      {/* Game Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 py-4 px-4 sm:px-6 border-b border-[#E7DECF] bg-[#FFFDF9]/90 backdrop-blur-sm sticky top-0 z-20 shadow-xs">
        {/* Back to Gita View & Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBackToGita}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border border-[#E7DECF] bg-[#FAF5ED] text-xs font-bold text-[#78350F] hover:bg-[#EFE7DA] transition-all cursor-pointer shadow-2xs"
            title="Return to Bhagavad Gita Chapters"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Gita</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl select-none" role="img" aria-label="Sacred Lamp">🪔</span>
            <div className="flex flex-col">
              <span className="font-serif-heading text-base sm:text-lg font-bold tracking-tight text-[#C2410C] whitespace-nowrap leading-none">
                GyanQuest
              </span>
              <span className="text-[10px] font-semibold text-[#78350F] hidden sm:inline mt-0.5">
                Bhagavad Gita Word Journey
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsWisdomOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-[#574D43] hover:text-[#C2410C] hover:bg-[#FEF3C7] transition-colors whitespace-nowrap cursor-pointer"
            title="Explore Chapter 6.17 Student Wisdom"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#B45309]" />
            <span className="hidden md:inline">Student Wisdom (Ch 6.17)</span>
            <span className="md:hidden">Wisdom</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHowToPlayOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-[#574D43] hover:text-[#C2410C] hover:bg-[#FEF3C7] transition-colors whitespace-nowrap cursor-pointer"
            title="Game Rules & Instructions"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Rules</span>
          </button>

          <button
            type="button"
            onClick={handleToggleSound}
            className="p-2 rounded-lg border border-[#E7DECF] bg-[#FAF6F0] text-[#574D43] hover:text-[#C2410C] hover:border-[#D4AF37] transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center">
        {/* Vedic Hero Banner Strip */}
        <div className="w-full bg-[#FFFDF9] border border-[#E7DECF] rounded-2xl p-4 sm:p-5 shadow-xs mb-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-[#D4AF37] shadow-xs">
            <img
              src={heroDiyaImg}
              alt="Gita Manuscript & Diya"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-center sm:text-left flex-1">
            <span className="text-[11px] font-bold text-[#B45309] uppercase tracking-wider block">
              Timeless Vedic Wisdom • Chapter 6 Verse 6.17
            </span>
            <h1 className="font-serif-heading text-xl sm:text-2xl font-bold text-[#C2410C]">
              GyanQuest WordGame
            </h1>
            <p className="text-xs text-[#574D43] mt-0.5 font-medium leading-relaxed">
              Unravel key 5-letter words from the sacred Bhagavad Gita text. 6 chances per verse.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsWisdomOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#78350F] bg-[#FEF3C7] border border-[#FDE68A] hover:bg-[#FDE68A] rounded-lg transition-colors whitespace-nowrap self-stretch sm:self-auto text-center cursor-pointer"
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
          <div className="w-full max-w-sm bg-[#FFFDF9] border border-[#E7DECF] rounded-2xl shadow-xl p-6 text-center text-[#29221C]">
            <h3 className="font-serif-heading text-lg font-bold text-[#C2410C] mb-2">
              Restart GyanQuest?
            </h3>
            <p className="text-xs text-[#574D43] mb-5 leading-relaxed">
              Are you sure you want to restart your journey from Word 1? Your solved progress and current score will be cleared.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E7DECF] bg-[#FAF5ED] text-[#78350F] hover:bg-[#EFE7DA] cursor-pointer"
              >
                Continue Quest
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#C2410C] text-white hover:bg-[#9A3412] cursor-pointer"
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

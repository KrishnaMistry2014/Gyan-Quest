import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Clock,
  Sparkles,
  Flame,
  Heart,
  HelpCircle,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Bookmark,
  Printer,
  RotateCcw,
  BookOpen,
  FileText,
  Layers,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  Check,
  AlertCircle,
  ExternalLink,
  Globe,
  Brain,
  ClipboardCheck
} from 'lucide-react';
import { SavedChapter, updateChapterPariksha, generateUniqueChapterCode } from '../lib/chapters';
import { claimChapterStageReward } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ParikshaData, ParikshaQuestion, ParikshaFlashcard } from '../types';

interface ParikshaViewProps {
  chapter?: SavedChapter | null;
  onNavigateHome?: () => void;
  onNavigateDashboard?: () => void;
  onNavigateMyChapters?: () => void;
  onNavigateVidya?: (chapter: SavedChapter) => void;
  onNavigateManan?: (chapter: SavedChapter) => void;
  onPdfUpload?: (file: File) => void;
}

export const ParikshaView: React.FC<ParikshaViewProps> = ({
  chapter,
  onNavigateHome,
  onNavigateDashboard,
  onNavigateMyChapters,
  onNavigateVidya,
  onNavigateManan,
  onPdfUpload,
}) => {
  const { user, profile, updateProfileXp, isStreakActiveToday, recordStreakActivity } = useAuth();
  const { showToast } = useToast();

  const [activeChapter, setActiveChapter] = useState<SavedChapter | null>(chapter || null);
  const [viewState, setViewState] = useState<'prompt-upload' | 'generating' | 'exam' | 'results'>('prompt-upload');
  const [testData, setTestData] = useState<ParikshaData | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<number, number[]>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<number[]>([]);
  const [doubleJeopardyQuestions, setDoubleJeopardyQuestions] = useState<Record<number, boolean>>({});

  // Lifelines
  const [fiftyFiftyLeft, setFiftyFiftyLeft] = useState<number>(2);
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [doubleJeopardyLeft, setDoubleJeopardyLeft] = useState<number>(3);

  // Gamification state
  const [lives, setLives] = useState<number>(3);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [answeredState, setAnsweredState] = useState<'unanswered' | 'answered'>('unanswered');
  const [generationProgress, setGenerationProgress] = useState<string>('Synthesizing questions from chapter PDF...');
  const [resultsTab, setResultsTab] = useState<'diagnostic' | 'flashcards'>('diagnostic');
  const [diagnosticFilter, setDiagnosticFilter] = useState<'all' | 'correct' | 'incorrect' | 'bookmarked'>('all');
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState<number>(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState<boolean>(false);
  const [examMode, setExamMode] = useState<'interactive' | 'portal'>('interactive');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync incoming chapter
  useEffect(() => {
    if (chapter) {
      setActiveChapter(chapter);
    }
  }, [chapter]);

  // If chapter is active, automatically trigger exam generation
  useEffect(() => {
    if (activeChapter && (activeChapter.summary || activeChapter.title)) {
      generateExam(activeChapter);
    } else {
      setViewState('prompt-upload');
    }
  }, [activeChapter]);

  // Timer loop during exam
  useEffect(() => {
    if (viewState === 'exam' && isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewState, isTimerRunning]);

  const generateExam = async (chap: SavedChapter) => {
    setViewState('generating');
    setGenerationProgress(`Synthesizing 25-Question Pariksha strictly from "${chap.title}"...`);

    const progressMessages = [
      'Extracting verified textbook definitions with Gemini 3.5 Flash-Lite...',
      'Formulating Stage 1: Foundation Warmup (Q1–Q5)...',
      'Structuring Stage 2: Conceptual Depth (Q6–Q10)...',
      'Designing Stage 3: Analytical Arena (Q11–Q15)...',
      'Forging Stage 4: Mastery Crucible (Q16–Q20)...',
      'Constructing Stage 5: Grand Boss Round (Q21–Q25)...',
      'Compiling high-yield summary flashcards...',
      'Finalizing 25-Question diagnostic assessment...',
    ];
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % progressMessages.length;
      setGenerationProgress(progressMessages[msgIdx]);
    }, 3500);

    try {
      const response = await fetch('/api/generate-pariksha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: chap.fileName || `${chap.title}.pdf`,
          chapterSummary: chap.summary,
          difficulty: 'scholastic',
        }),
      });

      clearInterval(interval);

      if (!response.ok) {
        throw new Error(`Generation failed (HTTP ${response.status})`);
      }

      const data: ParikshaData = await response.json();
      if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Invalid test structure received');
      }

      setTestData(data);
      resetExamState();
      setViewState('exam');
      setIsTimerRunning(true);
    } catch (err: any) {
      clearInterval(interval);
      console.error('[Pariksha] Exam generation error:', err);
      showToast({
        title: 'Exam Synthesis Notice',
        message: 'Synthesizing adaptive test fallback directly from chapter text.',
        type: 'info',
      });
      // Resilient local synthesis fallback
      const fallback = createLocalFallbackTest(chap);
      setTestData(fallback);
      resetExamState();
      setViewState('exam');
      setIsTimerRunning(true);
    }
  };

  const createLocalFallbackTest = (chap: SavedChapter): ParikshaData => {
    const rawLines = chap.summary
      .split('\n')
      .map((l) => l.replace(/^[*#\-•\s]+/, '').trim())
      .filter((l) => l.length > 25 && l.length < 240);

    const stageNames: Record<number, string> = {
      1: 'Foundation Warmup',
      2: 'Conceptual Depth',
      3: 'Analytical Arena',
      4: 'Mastery Crucible',
      5: 'Grand Boss Round',
    };
    const stagePoints: Record<number, number> = {
      1: 100, 2: 150, 3: 200, 4: 250, 5: 350,
    };
    const stageDiff: Record<number, 'easy' | 'medium' | 'hard' | 'boss'> = {
      1: 'easy', 2: 'medium', 3: 'medium', 4: 'hard', 5: 'boss',
    };

    const questions: ParikshaQuestion[] = [];
    for (let i = 0; i < 25; i++) {
      const stage = Math.min(5, Math.floor(i / 5) + 1);
      const fact = rawLines[i % (rawLines.length || 1)] || `${chap.title} provides fundamental insights and academic guidelines.`;
      
      const qText = stage === 1
        ? `According to the chapter notes on ${chap.title}, which definition is verified?`
        : stage === 2
        ? `What conceptual mechanism is affirmed by: "${fact.slice(0, 45)}..."?`
        : stage === 3
        ? `Analyzing cause and effect in ${chap.title}, which observation holds true?`
        : stage === 4
        ? `In the advanced problem-solving crucible, which relationship distinguishes this phenomenon?`
        : `[Capstone Grand Boss] Integrating all principles of ${chap.title}, which conclusion is scientifically sound?`;

      questions.push({
        id: String(i + 1),
        stage,
        stageName: stageNames[stage],
        question: qText,
        options: [
          fact,
          'This parameter operates unconditionally without energy exchange',
          'The state remains unchanged and produces no observable consequence',
          'This reaction is strictly prohibited under standard conditions'
        ],
        correctIndex: 0,
        points: stagePoints[stage],
        hint: `Recall the foundational chapter notes for ${chap.title}.`,
        explanation: `As detailed in the chapter summary: "${fact}".`,
        topic: `${chap.title} — Unit ${stage}`,
        difficulty: stageDiff[stage],
      });
    }

    return {
      testTitle: `${chap.title} Pariksha`,
      sourceFileName: chap.fileName,
      createdAt: new Date().toISOString(),
      topicsCovered: [chap.title, 'Foundational Concepts', 'Analytical Applications', 'Capstone Synthesis'],
      questions,
      summaryFlashcards: [
        { concept: `${chap.title} Core Concept`, takeaway: rawLines[0] || 'Foundational principles.' },
        { concept: 'Key Mechanism', takeaway: rawLines[1] || 'Primary governing process.' },
        { concept: 'Scientific Law', takeaway: rawLines[2] || 'Governing relationships and formulas.' },
      ],
    };
  };

  const resetExamState = () => {
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setEliminatedOptions({});
    setRevealedHints({});
    setBookmarkedQuestions([]);
    setDoubleJeopardyQuestions({});
    setFiftyFiftyLeft(2);
    setHintsLeft(3);
    setDoubleJeopardyLeft(3);
    setLives(3);
    setStreak(0);
    setMaxStreak(0);
    setTotalScore(0);
    setElapsedSeconds(0);
    setAnsweredState('unanswered');
    setActiveFlashcardIndex(0);
    setIsFlashcardFlipped(false);
  };

  const handleSelectAnswer = (optionIdx: number) => {
    if (answeredState === 'answered' || !testData) return;
    const currentQ = testData.questions[currentQIndex];
    if (!currentQ) return;

    setSelectedAnswers((prev) => ({ ...prev, [currentQIndex]: optionIdx }));
    setAnsweredState('answered');

    const isCorrect = optionIdx === currentQ.correctIndex;
    const isDouble = Boolean(doubleJeopardyQuestions[currentQIndex]);

    if (isCorrect) {
      const multiplier = 1 + Math.min(1.5, streak * 0.2); // Up to 2.5x multiplier
      const basePoints = currentQ.points;
      const earned = Math.round(basePoints * (isDouble ? 2 : 1) * multiplier);

      setTotalScore((prev) => prev + earned);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      // Trigger celebratory mini-confetti on streak milestones or boss stages
      if (newStreak % 5 === 0 || currentQ.stage === 5) {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#B45309', '#F59E0B', '#D97706'],
        });
      }
    } else {
      setStreak(0);
      const remainingLives = Math.max(0, lives - 1);
      setLives(remainingLives);
      if (remainingLives === 0) {
        showToast({
          title: 'All Lives Exhausted',
          message: 'Reviewing diagnostic results and comprehensive answer explanations.',
          type: 'info',
        });
        finishExam();
      }
    }
  };

  const handleNextQuestion = () => {
    if (!testData) return;
    if (currentQIndex < testData.questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setAnsweredState('unanswered');
    } else {
      finishExam();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex((prev) => prev - 1);
      setAnsweredState(selectedAnswers[currentQIndex - 1] !== undefined ? 'answered' : 'unanswered');
    }
  };

  const finishExam = async () => {
    setIsTimerRunning(false);
    setViewState('results');

    // Trigger grand celebratory confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#B45309', '#F59E0B', '#9A3412', '#FBBF24'],
    });

    if (activeChapter) {
      const totalCorrect = testData?.questions.reduce((acc, q, idx) => {
        return selectedAnswers[idx] === q.correctIndex ? acc + 1 : acc;
      }, 0) || 0;

      // Update Pariksha completion & claim 50 XP in Firestore & profile
      try {
        await updateChapterPariksha(activeChapter.id, totalCorrect, 25, user?.uid);
        const reward = await claimChapterStageReward(activeChapter, 'pariksha', user);
        if (reward.awarded) {
          showToast({
            title: `+${reward.xpAdded} XP Awarded!`,
            message: `Pariksha Mastered • 50 XP Added • Total: ${reward.newTotal} XP`,
            type: 'xp',
            xpAmount: reward.xpAdded,
          });
          updateProfileXp(reward.newTotal);
        }
      } catch (err) {
        console.warn('Pariksha XP Claim notice:', err);
      }

      // Record daily streak activity
      try {
        if (!isStreakActiveToday && recordStreakActivity) {
          recordStreakActivity('pariksha').catch(() => {});
        }
      } catch (_) {}
    }
  };

  // Lifeline: 50:50
  const handleUseFiftyFifty = () => {
    if (fiftyFiftyLeft <= 0 || !testData || answeredState === 'answered') return;
    const currentQ = testData.questions[currentQIndex];
    if (!currentQ || eliminatedOptions[currentQIndex]) return;

    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== currentQ.correctIndex);
    // Shuffle and pick 2 to eliminate
    const shuffledWrong = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);

    setEliminatedOptions((prev) => ({ ...prev, [currentQIndex]: shuffledWrong }));
    setFiftyFiftyLeft((prev) => prev - 1);
    showToast({
      title: '50:50 Activated',
      message: 'Eliminated two incorrect distractors.',
      type: 'info',
    });
  };

  // Lifeline: Hint
  const handleUseHint = () => {
    if (hintsLeft <= 0 || !testData || revealedHints[currentQIndex]) return;
    setRevealedHints((prev) => ({ ...prev, [currentQIndex]: true }));
    setHintsLeft((prev) => prev - 1);
  };

  // Lifeline: Double Jeopardy
  const handleUseDoubleJeopardy = () => {
    if (doubleJeopardyLeft <= 0 || !testData || doubleJeopardyQuestions[currentQIndex] || answeredState === 'answered') return;
    setDoubleJeopardyQuestions((prev) => ({ ...prev, [currentQIndex]: true }));
    setDoubleJeopardyLeft((prev) => prev - 1);
    showToast({
      title: 'Double Jeopardy Activated!',
      message: '2x Points on this question if correct.',
      type: 'info',
    });
  };

  const handleToggleBookmark = (idx: number) => {
    setBookmarkedQuestions((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      e.target.value = '';

      setViewState('generating');
      setGenerationProgress(`Analyzing and extracting "${file.name}"...`);

      try {
        let base64Data = '';
        if (file.size <= 50 * 1024 * 1024) {
          base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const commaIdx = res.indexOf(',');
              resolve(commaIdx !== -1 ? res.substring(commaIdx + 1) : res);
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
        }

        const extractRes = await fetch('/api/extract-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: base64Data,
            fileName: file.name,
          }),
        });

        let chapterTitle = file.name.replace(/\.[^/.]+$/, '');
        let chapterSummary = '';

        if (extractRes.ok) {
          const extractData = await extractRes.json();
          chapterSummary = extractData.summary || extractData.rawText || '';
          if (extractData.docTitle) chapterTitle = extractData.docTitle;
        }

        if (!chapterSummary) {
          chapterSummary = `Study material for ${file.name}.`;
        }

        const newChapter: SavedChapter = {
          id: `pariksha_${Date.now()}`,
          uniqueCode: generateUniqueChapterCode(),
          fileName: file.name,
          title: chapterTitle,
          summary: chapterSummary,
          createdAt: new Date().toISOString(),
        };

        setActiveChapter(newChapter);
        await generateExam(newChapter);
      } catch (err) {
        console.error('Pariksha direct PDF processing error:', err);
        const fallbackChapter: SavedChapter = {
          id: `pariksha_${Date.now()}`,
          uniqueCode: generateUniqueChapterCode(),
          fileName: file.name,
          title: file.name.replace(/\.[^/.]+$/, ''),
          summary: `Study notes for ${file.name}`,
          createdAt: new Date().toISOString(),
        };
        setActiveChapter(fallbackChapter);
        await generateExam(fallbackChapter);
      }
    }
  };

  // Helper metrics for results screen
  const correctCount = testData?.questions.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.correctIndex ? acc + 1 : acc;
  }, 0) || 0;

  const accuracyPct = testData ? Math.round((correctCount / testData.questions.length) * 100) : 0;

  const currentQ = testData?.questions[currentQIndex];
  const isCurrentDouble = Boolean(doubleJeopardyQuestions[currentQIndex]);
  const isCurrentHintRevealed = Boolean(revealedHints[currentQIndex]);
  const currentEliminated = eliminatedOptions[currentQIndex] || [];
  const selectedCurrentIdx = selectedAnswers[currentQIndex];

  return (
    <div
      id="pariksha-container"
      className="flex-1 w-full min-h-[calc(100vh-5rem)] flex flex-col py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
      style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
        id="pariksha-file-input"
      />

      {/* Top Header & Stage Navigation */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 sm:pb-6 mb-6" style={{ borderColor: 'var(--border-warm)' }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>STAGE 05 • PARIKSHA (परीक्षा)</span>
            </span>

            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-muted)',
              }}
            >
              Mastery Validation • 50 XP
            </span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-extrabold font-serif-heading tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {activeChapter?.title || 'Chapter Examination'}
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            25-question adaptive examination engine strictly grounded in your textbook notes.
          </p>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-2xl border shadow-2xs" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}>
            <button
              type="button"
              onClick={() => setExamMode('interactive')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                examMode === 'interactive' ? 'shadow-xs text-white' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: examMode === 'interactive' ? 'var(--accent-saffron)' : 'transparent',
                color: examMode === 'interactive' ? '#FFFFFF' : 'var(--text-primary)',
              }}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Interactive Exam</span>
            </button>

            <button
              type="button"
              onClick={() => setExamMode('portal')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                examMode === 'portal' ? 'shadow-xs text-white' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: examMode === 'portal' ? 'var(--accent-saffron)' : 'transparent',
                color: examMode === 'portal' ? '#FFFFFF' : 'var(--text-primary)',
              }}
              title="GyanQuest Pariksha Portal (gyanquest-pariksha.ai.studio)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Pariksha Portal</span>
            </button>
          </div>

          {onNavigateManan && activeChapter && (
            <button
              type="button"
              onClick={() => onNavigateManan(activeChapter)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Manan</span>
            </button>
          )}

          {onNavigateVidya && activeChapter && (
            <button
              type="button"
              onClick={() => onNavigateVidya(activeChapter)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs hidden md:inline-flex"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <BookOpen className="w-4 h-4" />
              <span>Vidya Notes</span>
            </button>
          )}

          {onNavigateDashboard && (
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <span>Dashboard</span>
            </button>
          )}
        </div>
      </header>

      {examMode === 'portal' ? (
        <div className="space-y-4">
          <div
            className="p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                style={{
                  backgroundColor: 'var(--accent-saffron-light)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--accent-saffron)',
                }}
              >
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm sm:text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                    GyanQuest Pariksha Portal
                  </h3>
                </div>
                <p className="text-xs font-mono text-amber-600 dark:text-amber-400">
                  gyanquest-pariksha.ai.studio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://gyanquest-pariksha.ai.studio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div
            className="rounded-3xl border overflow-hidden shadow-lg transition-all"
            style={{
              borderColor: 'var(--border-warm)',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            <iframe
              src="https://gyanquest-pariksha.ai.studio"
              title="GyanQuest Pariksha Portal"
              className="w-full h-[75vh] sm:h-[82vh] border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      ) : (
        <>
          {/* ==============================================================
              STATE 0: PROMPT UPLOAD (When no chapter is active)
              ============================================================== */}
          {viewState === 'prompt-upload' && (
            <div
              id="pariksha-prompt-upload"
              className="flex-1 flex flex-col items-center justify-center text-center p-8 sm:p-14 my-auto rounded-3xl border shadow-sm max-w-xl mx-auto w-full"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
              }}
            >
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mb-6 border shadow-xs"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--border-warm)',
              color: 'var(--accent-saffron)',
            }}
          >
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <span>Stage 05 • Pariksha (परीक्षा)</span>
          </div>

          <h2
            className="text-2xl sm:text-3xl font-extrabold font-serif-heading tracking-tight mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            The 25-Question Examination Engine
          </h2>

          <p className="text-sm sm:text-base leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            Pariksha generates an authentic 5-stage adaptive examination (Foundation to Boss Crucible) strictly from your uploaded chapter PDF.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold shadow-xs transition-all hover:opacity-90 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Chapter PDF</span>
            </button>

            {onNavigateMyChapters && (
              <button
                type="button"
                onClick={onNavigateMyChapters}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                style={{
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-card-subtle)',
                }}
              >
                <Layers className="w-4 h-4" />
                <span>Select Saved Chapter</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==============================================================
          STATE 1: GENERATING EXAM SCREEN
          ============================================================== */}
      {viewState === 'generating' && (
        <div
          id="pariksha-generating-view"
          className="flex-1 flex flex-col items-center justify-center text-center p-8 sm:p-14 my-auto rounded-3xl border shadow-sm max-w-2xl mx-auto w-full transition-all"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 my-6 rounded-full border-4 border-stone-200 dark:border-stone-800 border-t-orange-500 animate-spin shrink-0"
            style={{
              borderTopColor: 'var(--accent-saffron)',
            }}
          />

          <h2
            className="text-2xl sm:text-3xl font-extrabold font-serif-heading tracking-tight mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Forging 25-Question Pariksha
          </h2>

          {activeChapter?.title && (
            <p className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 max-w-md truncate mb-4">
              Source Chapter: {activeChapter.title.replace(/^Vidya:\s*/i, '')}
            </p>
          )}

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold mb-6 shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
            <span>{generationProgress}</span>
          </div>

          <div className="grid grid-cols-5 gap-2 w-full max-w-md text-center">
            {['Foundation', 'Concepts', 'Analytics', 'Crucible', 'Boss Stage'].map((stage, sIdx) => (
              <div
                key={sIdx}
                className="p-2 rounded-xl border text-[11px] font-semibold"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-secondary)',
                }}
              >
                <div className="font-bold text-amber-700 dark:text-amber-400">Stage {sIdx + 1}</div>
                <div className="truncate">{stage}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==============================================================
          STATE 2: ACTIVE 25-QUESTION EXAM
          ============================================================== */}
      {viewState === 'exam' && testData && currentQ && (
        <div id="pariksha-exam-view" className="space-y-6">
          {/* Top Exam Status Bar */}
          <header
            className="p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            {/* Title & Stage Pill */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                style={{
                  backgroundColor: 'var(--accent-saffron-light)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--accent-saffron)',
                }}
              >
                <Trophy className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent-saffron-text)' }}>
                  <span>Stage 0{currentQ.stage}</span>
                  <span>•</span>
                  <span>{currentQ.stageName}</span>
                  <span>•</span>
                  <span>{currentQ.points} Pts</span>
                  {isCurrentDouble && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white font-extrabold text-[10px]">
                      2X ACTIVE
                    </span>
                  )}
                </div>
                <h1 className="text-sm sm:text-base font-bold font-serif-heading truncate" style={{ color: 'var(--text-primary)' }}>
                  {testData.testTitle}
                </h1>
              </div>
            </div>

            {/* Live Stats: Lives, Streak, Score, Timer */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              {/* Lives */}
              <div
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                  color: '#EF4444',
                }}
                title={`${lives} lives remaining`}
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 ${i < lives ? 'fill-current text-red-500' : 'text-stone-300 dark:text-stone-700'}`}
                  />
                ))}
              </div>

              {/* Streak */}
              <div
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold font-mono"
                style={{
                  backgroundColor: 'var(--accent-saffron-light)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--accent-saffron-text)',
                }}
                title={`Streak: ${streak} | Multiplier: ${(1 + Math.min(1.5, streak * 0.2)).toFixed(1)}x`}
              >
                <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                <span>{streak}x</span>
              </div>

              {/* Score */}
              <div
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-extrabold font-mono"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>{totalScore.toLocaleString()} Pts</span>
              </div>

              {/* Timer */}
              <div
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium font-mono"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>
            </div>
          </header>

          {/* Question Stepper Bar (1 to 25) */}
          <div
            className="p-3 rounded-2xl border shadow-xs overflow-x-auto"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="flex items-center gap-1.5 min-w-max">
              {testData.questions.map((q, idx) => {
                const isAnswered = selectedAnswers[idx] !== undefined;
                const isCorrect = isAnswered && selectedAnswers[idx] === q.correctIndex;
                const isCurrent = idx === currentQIndex;
                const isBookmarked = bookmarkedQuestions.includes(idx);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentQIndex(idx);
                      setAnsweredState(selectedAnswers[idx] !== undefined ? 'answered' : 'unanswered');
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all relative cursor-pointer flex items-center justify-center border ${
                      isCurrent
                        ? 'ring-2 ring-orange-500 shadow-sm scale-105'
                        : ''
                    }`}
                    style={{
                      backgroundColor: isCurrent
                        ? 'var(--accent-saffron)'
                        : isAnswered
                        ? isCorrect
                          ? '#10B981'
                          : '#EF4444'
                        : 'var(--bg-card-subtle)',
                      color: isCurrent || isAnswered ? '#FFFFFF' : 'var(--text-secondary)',
                      borderColor: 'var(--border-warm)',
                    }}
                    title={`Question ${idx + 1} (${q.stageName})`}
                  >
                    <span>{idx + 1}</span>
                    {isBookmarked && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Question Card */}
          <main
            className="rounded-3xl border p-6 sm:p-10 shadow-sm space-y-6"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            {/* Header: Question Number, Stage Badge, Lifelines */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-warm)' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: 'var(--accent-saffron-light)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--accent-saffron-text)',
                  }}
                >
                  Question {currentQIndex + 1} of 25
                </span>

                <span
                  className="px-3 py-1 rounded-xl text-xs font-semibold border"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {currentQ.topic || testData.testTitle}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleBookmark(currentQIndex)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer"
                  style={{
                    backgroundColor: bookmarkedQuestions.includes(currentQIndex) ? 'var(--accent-saffron-light)' : 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                    color: bookmarkedQuestions.includes(currentQIndex) ? 'var(--accent-saffron-text)' : 'var(--text-secondary)',
                  }}
                  title="Bookmark question for review"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarkedQuestions.includes(currentQIndex) ? 'fill-current' : ''}`} />
                  <span>{bookmarkedQuestions.includes(currentQIndex) ? 'Saved' : 'Bookmark'}</span>
                </button>
              </div>

              {/* Lifeline Buttons */}
              <div className="flex items-center gap-2">
                {/* 50:50 */}
                <button
                  type="button"
                  onClick={handleUseFiftyFifty}
                  disabled={fiftyFiftyLeft <= 0 || answeredState === 'answered' || Boolean(eliminatedOptions[currentQIndex])}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                  title="Eliminates two incorrect options"
                >
                  50:50 ({fiftyFiftyLeft})
                </button>

                {/* Hint */}
                <button
                  type="button"
                  onClick={handleUseHint}
                  disabled={hintsLeft <= 0 || isCurrentHintRevealed}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                  title="Reveals a helpful textbook hint"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Hint ({hintsLeft})</span>
                </button>

                {/* Double Jeopardy */}
                <button
                  type="button"
                  onClick={handleUseDoubleJeopardy}
                  disabled={doubleJeopardyLeft <= 0 || isCurrentDouble || answeredState === 'answered'}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: isCurrentDouble ? 'var(--accent-saffron)' : 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                    color: isCurrentDouble ? '#FFFFFF' : 'var(--text-primary)',
                  }}
                  title="Double points if answered correctly"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>2X ({doubleJeopardyLeft})</span>
                </button>
              </div>
            </div>

            {/* Hint Callout if revealed */}
            {isCurrentHintRevealed && (
              <div
                className="p-3.5 rounded-2xl border text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 animate-in fade-in"
                style={{
                  backgroundColor: 'var(--accent-saffron-light)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--accent-saffron-text)',
                }}
              >
                <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold">Textbook Hint: </span>
                  <span>{currentQ.hint}</span>
                </div>
              </div>
            )}

            {/* Question Text */}
            <h2
              className="text-lg sm:text-xl md:text-2xl font-bold font-serif-heading leading-snug tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {currentQ.question}
            </h2>

            {/* 4 Answer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {currentQ.options.map((option, optIdx) => {
                const isEliminated = currentEliminated.includes(optIdx);
                const isSelected = selectedCurrentIdx === optIdx;
                const isCorrect = optIdx === currentQ.correctIndex;
                const isAnswered = selectedCurrentIdx !== undefined;

                let btnBg = 'var(--bg-card-subtle)';
                let btnBorder = 'var(--border-warm)';
                let btnColor = 'var(--text-primary)';

                if (isAnswered) {
                  if (isCorrect) {
                    btnBg = 'rgba(16, 185, 129, 0.15)';
                    btnBorder = '#10B981';
                    btnColor = '#065F46';
                  } else if (isSelected) {
                    btnBg = 'rgba(239, 68, 68, 0.15)';
                    btnBorder = '#EF4444';
                    btnColor = '#991B1B';
                  }
                } else if (isSelected) {
                  btnBorder = 'var(--accent-saffron)';
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={isEliminated || isAnswered}
                    onClick={() => handleSelectAnswer(optIdx)}
                    className={`p-4 rounded-2xl border text-left text-sm font-semibold transition-all flex items-start gap-3 select-none ${
                      isEliminated
                        ? 'opacity-30 line-through cursor-not-allowed'
                        : isAnswered
                        ? 'cursor-default'
                        : 'hover:border-orange-400 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                    }`}
                    style={{
                      backgroundColor: btnBg,
                      borderColor: btnBorder,
                      color: btnColor,
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono border"
                      style={{
                        backgroundColor: 'var(--bg-main)',
                        borderColor: 'var(--border-warm)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1 leading-relaxed">{option}</span>
                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation box after answer is selected */}
            {selectedCurrentIdx !== undefined && (
              <div
                className="p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed space-y-1.5 animate-in fade-in"
                style={{
                  backgroundColor: selectedCurrentIdx === currentQ.correctIndex ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  borderColor: selectedCurrentIdx === currentQ.correctIndex ? '#10B981' : '#EF4444',
                }}
              >
                <div className="font-bold flex items-center gap-1.5" style={{ color: selectedCurrentIdx === currentQ.correctIndex ? '#065F46' : '#991B1B' }}>
                  {selectedCurrentIdx === currentQ.correctIndex ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Correct! +{currentQ.points * (isCurrentDouble ? 2 : 1)} Points</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Incorrect — 1 Life Lost</span>
                    </>
                  )}
                </div>
                <p style={{ color: 'var(--text-primary)' }}>
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-warm)' }}>
              <button
                type="button"
                onClick={handlePreviousQuestion}
                disabled={currentQIndex === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-main)',
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                {currentQIndex < testData.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent-saffron)',
                      color: '#FFFFFF',
                    }}
                  >
                    <span>{selectedCurrentIdx !== undefined ? 'Next Question' : 'Skip & Continue'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finishExam}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent-saffron)',
                      color: '#FFFFFF',
                    }}
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Complete Pariksha</span>
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ==============================================================
          STATE 3: RESULTS SCREEN & FULL DIAGNOSTIC REVIEW
          ============================================================== */}
      {viewState === 'results' && testData && (
        <div id="pariksha-results-view" className="space-y-6 animate-in fade-in">
          {/* Top Score Banner */}
          <div
            className="p-6 sm:p-10 rounded-3xl border shadow-sm text-center relative overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border shadow-xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron)',
              }}
            >
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <span>Stage 05 Completed • +50 XP Earned</span>
            </div>

            <h1
              className="text-2xl sm:text-4xl font-extrabold font-serif-heading tracking-tight mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Pariksha Examination Report
            </h1>

            <p className="text-sm sm:text-base max-w-md mx-auto mb-6" style={{ color: 'var(--text-secondary)' }}>
              Source: {testData.sourceFileName}
            </p>

            {/* Key Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-6">
              <div
                className="p-4 rounded-2xl border"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)' }}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Score</div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono" style={{ color: 'var(--accent-saffron-text)' }}>
                  {correctCount}/25
                </div>
              </div>

              <div
                className="p-4 rounded-2xl border"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)' }}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Accuracy</div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono" style={{ color: 'var(--accent-saffron-text)' }}>
                  {accuracyPct}%
                </div>
              </div>

              <div
                className="p-4 rounded-2xl border"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)' }}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Total Pts</div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600">
                  {totalScore.toLocaleString()}
                </div>
              </div>

              <div
                className="p-4 rounded-2xl border"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)' }}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Time</div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {formatTime(elapsedSeconds)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  resetExamState();
                  setViewState('exam');
                  setIsTimerRunning(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Pariksha</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                style={{
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-main)',
                }}
              >
                <Printer className="w-4 h-4" />
                <span>Print Diagnostic Report</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                style={{
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-main)',
                }}
              >
                <UploadCloud className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Upload Another PDF</span>
              </button>

              {onNavigateDashboard && (
                <button
                  type="button"
                  onClick={onNavigateDashboard}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  style={{
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-main)',
                  }}
                >
                  Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Diagnostic View vs Summary Flashcards Tabs */}
          <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--border-warm)' }}>
            <button
              type="button"
              onClick={() => setResultsTab('diagnostic')}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
              style={{
                backgroundColor: resultsTab === 'diagnostic' ? 'var(--accent-saffron)' : 'transparent',
                color: resultsTab === 'diagnostic' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              Full 25-Question Diagnostic Review
            </button>

            <button
              type="button"
              onClick={() => setResultsTab('flashcards')}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
              style={{
                backgroundColor: resultsTab === 'flashcards' ? 'var(--accent-saffron)' : 'transparent',
                color: resultsTab === 'flashcards' ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              High-Yield Summary Flashcards ({testData.summaryFlashcards?.length || 0})
            </button>
          </div>

          {/* TAB 1: DIAGNOSTIC REVIEW */}
          {resultsTab === 'diagnostic' && (
            <div className="space-y-4">
              {/* Filter pills */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {(['all', 'correct', 'incorrect', 'bookmarked'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setDiagnosticFilter(filter)}
                    className="px-3 py-1.5 rounded-lg border font-semibold capitalize transition-all cursor-pointer"
                    style={{
                      backgroundColor: diagnosticFilter === filter ? 'var(--accent-saffron-light)' : 'var(--bg-card)',
                      borderColor: 'var(--border-warm)',
                      color: diagnosticFilter === filter ? 'var(--accent-saffron-text)' : 'var(--text-secondary)',
                    }}
                  >
                    {filter} (
                    {filter === 'all'
                      ? 25
                      : filter === 'correct'
                      ? correctCount
                      : filter === 'incorrect'
                      ? 25 - correctCount
                      : bookmarkedQuestions.length}
                    )
                  </button>
                ))}
              </div>

              {/* Questions list */}
              <div className="space-y-3">
                {testData.questions
                  .map((q, idx) => ({ q, idx }))
                  .filter(({ q, idx }) => {
                    const isAnswered = selectedAnswers[idx] !== undefined;
                    const isCorrect = isAnswered && selectedAnswers[idx] === q.correctIndex;
                    if (diagnosticFilter === 'correct') return isCorrect;
                    if (diagnosticFilter === 'incorrect') return !isCorrect;
                    if (diagnosticFilter === 'bookmarked') return bookmarkedQuestions.includes(idx);
                    return true;
                  })
                  .map(({ q, idx }) => {
                    const userSelected = selectedAnswers[idx];
                    const isCorrect = userSelected === q.correctIndex;

                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl border shadow-xs space-y-3"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-warm)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ backgroundColor: isCorrect ? '#10B981' : '#EF4444' }}
                            >
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                              {q.stageName} • {q.points} Pts
                            </span>
                          </div>

                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-md border"
                            style={{
                              backgroundColor: 'var(--bg-main)',
                              borderColor: 'var(--border-warm)',
                              color: isCorrect ? '#065F46' : '#991B1B',
                            }}
                          >
                            {isCorrect ? 'Correct' : userSelected !== undefined ? 'Incorrect' : 'Unanswered'}
                          </span>
                        </div>

                        <p className="text-sm sm:text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                          {q.question}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, optIdx) => {
                            const isOptionCorrect = optIdx === q.correctIndex;
                            const isOptionUser = userSelected === optIdx;

                            return (
                              <div
                                key={optIdx}
                                className="p-2.5 rounded-xl border flex items-center gap-2"
                                style={{
                                  backgroundColor: isOptionCorrect
                                    ? 'rgba(16, 185, 129, 0.12)'
                                    : isOptionUser
                                    ? 'rgba(239, 68, 68, 0.12)'
                                    : 'var(--bg-main)',
                                  borderColor: isOptionCorrect
                                    ? '#10B981'
                                    : isOptionUser
                                    ? '#EF4444'
                                    : 'var(--border-warm)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                <span className="font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                                <span className="flex-1">{opt}</span>
                                {isOptionCorrect && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                {isOptionUser && !isOptionCorrect && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                              </div>
                            );
                          })}
                        </div>

                        <div
                          className="p-3 rounded-xl border text-xs leading-relaxed"
                          style={{
                            backgroundColor: 'var(--bg-main)',
                            borderColor: 'var(--border-warm)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span className="font-bold text-amber-700 dark:text-amber-400">Explanation: </span>
                          <span>{q.explanation}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 2: FLASHCARDS */}
          {resultsTab === 'flashcards' && (
            <div className="max-w-xl mx-auto space-y-6 text-center">
              {testData.summaryFlashcards && testData.summaryFlashcards.length > 0 ? (
                (() => {
                  const card = testData.summaryFlashcards[activeFlashcardIndex];
                  return (
                    <div className="space-y-4">
                      {/* Interactive 3D Flip Card */}
                      <div
                        onClick={() => setIsFlashcardFlipped((prev) => !prev)}
                        className="w-full min-h-[240px] sm:min-h-[280px] p-8 rounded-3xl border shadow-sm flex flex-col justify-between items-center text-center cursor-pointer transition-transform hover:scale-[1.01] select-none"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-warm)',
                        }}
                      >
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
                          style={{
                            backgroundColor: 'var(--accent-saffron-light)',
                            borderColor: 'var(--border-warm)',
                            color: 'var(--accent-saffron-text)',
                          }}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{card.category || 'High-Yield Concept'}</span>
                        </div>

                        <div className="my-auto py-4">
                          <h3
                            className="text-lg sm:text-xl font-bold font-serif-heading leading-snug"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {isFlashcardFlipped ? (card.takeaway || (card as any).back) : (card.front || (card as any).concept)}
                          </h3>
                        </div>

                        <p className="text-xs font-semibold" style={{ color: 'var(--accent-saffron-text)' }}>
                          {isFlashcardFlipped ? 'Click to view Concept' : 'Click to flip for Key Takeaway'}
                        </p>
                      </div>

                      {/* Card Stepper */}
                      <div className="flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFlashcardIndex((prev) => Math.max(0, prev - 1));
                            setIsFlashcardFlipped(false);
                          }}
                          disabled={activeFlashcardIndex === 0}
                          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          style={{
                            borderColor: 'var(--border-warm)',
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--bg-card)',
                          }}
                        >
                          Previous
                        </button>

                        <span className="text-xs font-semibold font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {activeFlashcardIndex + 1} of {testData.summaryFlashcards.length}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveFlashcardIndex((prev) => Math.min(testData.summaryFlashcards.length - 1, prev + 1));
                            setIsFlashcardFlipped(false);
                          }}
                          disabled={activeFlashcardIndex === testData.summaryFlashcards.length - 1}
                          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          style={{
                            borderColor: 'var(--border-warm)',
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--bg-card)',
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-stone-500">No flashcards available for this test.</p>
              )}
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
};

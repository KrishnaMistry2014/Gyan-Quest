import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardCheck,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Award,
  ChevronRight,
  Flame,
  Zap,
  Target,
  Brain,
  Layers,
  ShieldCheck,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavedChapter, updateChapterPariksha } from '../lib/chapters';
import { ParikshaData, ParikshaQuestion, ParikshaFlashcard } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { playMindfulChime } from '../lib/chime';

interface ParikshaViewProps {
  chapter?: SavedChapter | null;
  onNavigateHome?: () => void;
  onNavigateDashboard?: () => void;
  onNavigateMyChapters?: () => void;
  onNavigateVidya?: (chapter: SavedChapter) => void;
  onNavigateManan?: (chapter: SavedChapter) => void;
  onPdfUpload?: (file: File) => void;
}

const STAGE_CONFIG: Record<
  number,
  { name: string; hindiName: string; points: number; badgeColor: string; textColor: string; borderColor: string }
> = {
  1: {
    name: 'Foundation Warmup',
    hindiName: 'मूलभूत अभ्यास',
    points: 100,
    badgeColor: 'bg-amber-500/10 dark:bg-amber-500/20',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-500/30',
  },
  2: {
    name: 'Conceptual Depth',
    hindiName: 'वैचारिक गहराई',
    points: 150,
    badgeColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-500/30',
  },
  3: {
    name: 'Analytical Arena',
    hindiName: 'विश्लेषणात्मक चिंतन',
    points: 200,
    badgeColor: 'bg-sky-500/10 dark:bg-sky-500/20',
    textColor: 'text-sky-700 dark:text-sky-300',
    borderColor: 'border-sky-500/30',
  },
  4: {
    name: 'Mastery Crucible',
    hindiName: 'निपुणता कसौटी',
    points: 250,
    badgeColor: 'bg-purple-500/10 dark:bg-purple-500/20',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-500/30',
  },
  5: {
    name: 'Grand Boss Round',
    hindiName: 'महानिपुणता चक्र',
    points: 350,
    badgeColor: 'bg-rose-500/10 dark:bg-rose-500/20',
    textColor: 'text-rose-700 dark:text-rose-300',
    borderColor: 'border-rose-500/30',
  },
};

/**
 * Generates an instant local 25-question exam from chapter text in case of offline/network issues
 */
function generateFallbackExam(title: string, summaryText: string): ParikshaData {
  const cleanLines = (summaryText || '')
    .split('\n')
    .map((l) => l.replace(/^[*#\-•\s]+/, '').trim())
    .filter((l) => l.length > 25 && l.length < 240);

  const fallbackQuestions: ParikshaQuestion[] = [];
  const total = 25;

  for (let i = 0; i < total; i++) {
    const stageNum = Math.min(5, Math.floor(i / 5) + 1);
    const stageCfg = STAGE_CONFIG[stageNum];
    const lineIndex = cleanLines.length > 0 ? i % cleanLines.length : 0;
    const keyInsight = cleanLines[lineIndex] || `Core truth of ${title} emphasizes disciplined wisdom and mindful awareness.`;
    const snippetWords = keyInsight.split(/\s+/).filter((w) => w.length > 3);
    const targetTerm = snippetWords[0] || 'Dharma';

    fallbackQuestions.push({
      id: String(i + 1),
      stage: stageNum,
      stageName: stageCfg.name,
      question: `Regarding ${title} in Question ${i + 1}: Which principle best articulates "${keyInsight.slice(0, 90)}..."?`,
      options: [
        keyInsight.slice(0, 80),
        `Passively disregarding the principles of ${title} without introspection`,
        `Adopting temporary enthusiasm without foundational discipline`,
        `Relying on external dogma rather than reflective comprehension of ${targetTerm}`,
      ],
      correctIndex: 0,
      points: stageCfg.points,
      topic: `${title} - Principle ${i + 1}`,
      hint: `Recall the central teaching: "${targetTerm}" forms the foundation of this insight.`,
      explanation: `According to the chapter notes on ${title}: ${keyInsight}`,
      difficulty: stageNum <= 2 ? 'easy' : stageNum <= 4 ? 'medium' : 'hard',
    });
  }

  return {
    testTitle: `${title} Pariksha Examination`,
    sourceFileName: title,
    createdAt: new Date().toISOString(),
    topicsCovered: [title, 'Core Principles', 'Application', 'Mastery'],
    questions: fallbackQuestions,
    summaryFlashcards: [
      {
        concept: `${title} - Foundation`,
        takeaway: cleanLines[0] || 'Steadfast concentration and truth form the root of all lasting achievement.',
      },
      {
        concept: `${title} - Application`,
        takeaway: cleanLines[1] || 'Action performed with dedication and without selfish anxiety yields serene mastery.',
      },
      {
        concept: `${title} - Transcendence`,
        takeaway: cleanLines[2] || 'Continuous self-reflection transforms book knowledge into lived wisdom.',
      },
    ],
  };
}

export const ParikshaView: React.FC<ParikshaViewProps> = ({
  chapter,
  onNavigateHome,
  onNavigateDashboard,
  onNavigateMyChapters,
  onNavigateVidya,
  onNavigateManan,
}) => {
  const { user, profile, updateProfileXp, recordStreakActivity } = useAuth();
  const { showToast } = useToast();
  const { language } = useLanguage();

  const [activeChapter, setActiveChapter] = useState<SavedChapter | null>(chapter || null);
  const [examData, setExamData] = useState<ParikshaData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingStep, setLoadingStep] = useState<string>('Formulating questions across 5 adaptive stages...');

  // Exam flow states
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [accumulatedScore, setAccumulatedScore] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [isExamCompleted, setIsExamCompleted] = useState<boolean>(false);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);

  const hasAwardedRewardRef = useRef<boolean>(false);

  useEffect(() => {
    if (chapter) {
      setActiveChapter(chapter);
    }
  }, [chapter]);

  // Load exam questions from API or cache
  useEffect(() => {
    let isCancelled = false;

    async function loadParikshaExam() {
      setIsLoading(true);
      setLoadingStep(
        language === 'hi'
          ? '५ अनुकूलन चरणों (Stages) में २५ प्रश्न तैयार किए जा रहे हैं...'
          : 'Formulating 25 adaptive questions across 5 progressive stages...'
      );

      const title = activeChapter?.title || 'Chapter';
      const summaryText = activeChapter?.summary || activeChapter?.notes || '';

      try {
        const res = await fetch('/api/generate-pariksha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: title,
            chapterSummary: summaryText,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data: ParikshaData = await res.json();
        if (!isCancelled && data && Array.isArray(data.questions) && data.questions.length >= 10) {
          setExamData(data);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('[ParikshaView] API generation notice, using synthesized chapter exam:', err);
      }

      if (!isCancelled) {
        // Fallback to instantly generated chapter exam
        const fallback = generateFallbackExam(title, summaryText);
        setExamData(fallback);
        setIsLoading(false);
      }
    }

    loadParikshaExam();

    return () => {
      isCancelled = true;
    };
  }, [activeChapter?.id, language]);

  const questions = examData?.questions || [];
  const currentQuestion = questions[currentIndex];
  const currentStageConfig = currentQuestion ? STAGE_CONFIG[currentQuestion.stage] || STAGE_CONFIG[1] : STAGE_CONFIG[1];

  // Option selection
  const handleSelectOption = (optIndex: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(optIndex);
  };

  // Submit answer for current question
  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQuestion || isAnswerSubmitted) return;

    setIsAnswerSubmitted(true);
    const isCorrect = selectedOption === currentQuestion.correctIndex;
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: selectedOption }));

    if (isCorrect) {
      playMindfulChime();
      setAccumulatedScore((prev) => prev + currentQuestion.points);
      setCurrentStreak((prev) => prev + 1);
    } else {
      setCurrentStreak(0);
    }
  };

  // Move to next question or complete exam
  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
    } else {
      handleCompleteExam();
    }
  };

  // Final completion logic
  const handleCompleteExam = () => {
    setIsExamCompleted(true);
    playMindfulChime();

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D97706', '#059669', '#2563EB', '#7C3AED', '#DC2626'],
      });
    } catch {
      // Ignore confetti errors
    }

    if (!hasAwardedRewardRef.current) {
      hasAwardedRewardRef.current = true;

      // Award +50 XP for Stage 05 Pariksha Conquered
      const newXp = (profile?.xp || 0) + 50;
      updateProfileXp(newXp);
      recordStreakActivity('pariksha_mastery');

      if (activeChapter?.id) {
        const maxPoints = questions.reduce((sum, q) => sum + q.points, 0);
        updateChapterPariksha(activeChapter.id, accumulatedScore, maxPoints, user?.uid);
      }

      showToast({
        title: language === 'hi' ? 'परीक्षा उत्तीर्ण! +50 XP' : 'Pariksha Conquered! +50 XP',
        message:
          language === 'hi'
            ? `आपने २५-प्रश्नों की परीक्षा सफलतापूर्वक पूर्ण कर ली है!`
            : `Congratulations! You conquered the Stage 05 Pariksha Examination!`,
        type: 'success',
      });
    }
  };

  // Retake exam
  const handleRetakeExam = () => {
    setCurrentIndex(0);
    setUserAnswers({});
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setShowHint(false);
    setHintsUsed(0);
    setAccumulatedScore(0);
    setCurrentStreak(0);
    setIsExamCompleted(false);
    setIsReviewMode(false);
    hasAwardedRewardRef.current = false;
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <ClipboardCheck className="w-10 h-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            {language === 'hi' ? 'परीक्षा कक्ष तैयार किया जा रहा है...' : 'Preparing Stage 05 Pariksha Exam...'}
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {loadingStep}
          </p>
        </div>
        <div className="w-48 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full animate-pulse"
            style={{ width: '70%', animationDuration: '1.2s' }}
          />
        </div>
      </div>
    );
  }

  // Completed Results Screen
  if (isExamCompleted && !isReviewMode) {
    const totalQuestions = questions.length;
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const accuracyPct = Math.round((correctCount / totalQuestions) * 100);
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
        {/* Results Banner */}
        <div
          className="rounded-3xl border p-6 sm:p-10 text-center space-y-6 shadow-sm relative overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400">
            <Trophy className="w-4 h-4" />
            <span>{language === 'hi' ? 'चरण ०५ पूर्ण · परीक्षा उत्तीर्ण' : 'Stage 05 Conquered · Pariksha Validated'}</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              {activeChapter ? activeChapter.title : 'Pariksha Examination'}
            </h1>
            <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              {language === 'hi'
                ? `शानदार प्रयास! आपने २५ प्रश्नों में से ${correctCount} सही उत्तर दिए। आपका ज्ञान स्थायी और प्रमाणित है।`
                : `Magnificent achievement! You answered ${correctCount} of ${totalQuestions} questions correctly. Your understanding is verified.`}
            </p>
          </div>

          {/* Key Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto pt-2">
            <div
              className="p-4 rounded-2xl border text-center"
              style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-warm)' }}
            >
              <div className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {language === 'hi' ? 'प्राप्त अंक' : 'Total Score'}
              </div>
              <div className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">
                {accumulatedScore.toLocaleString()}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                of {maxScore.toLocaleString()} pts
              </div>
            </div>

            <div
              className="p-4 rounded-2xl border text-center"
              style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-warm)' }}
            >
              <div className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {language === 'hi' ? 'सटीकता' : 'Accuracy'}
              </div>
              <div className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{accuracyPct}%</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {correctCount} / {totalQuestions} Correct
              </div>
            </div>

            <div
              className="p-4 rounded-2xl border text-center"
              style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-warm)' }}
            >
              <div className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {language === 'hi' ? 'ज्ञान पुरस्कार' : 'XP Awarded'}
              </div>
              <div className="text-2xl font-black mt-1 text-amber-500 flex items-center justify-center gap-1">
                <Zap className="w-5 h-5 fill-amber-500" />
                <span>+50 XP</span>
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {language === 'hi' ? 'मील का पत्थर' : 'Stage 05 Milestone'}
              </div>
            </div>

            <div
              className="p-4 rounded-2xl border text-center"
              style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-warm)' }}
            >
              <div className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {language === 'hi' ? 'दैनिक साधना' : 'Daily Streak'}
              </div>
              <div className="text-2xl font-black mt-1 text-orange-500 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 fill-orange-500" />
                <span>Active</span>
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {language === 'hi' ? 'साधना कायम' : 'Maintained'}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsReviewMode(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }}
            >
              <FileText className="w-4 h-4" />
              <span>{language === 'hi' ? 'सभी प्रश्नों की समीक्षा करें' : 'Review All 25 Questions'}</span>
            </button>

            <button
              type="button"
              onClick={handleRetakeExam}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'hi' ? 'पुनः परीक्षा दें' : 'Retake Pariksha'}</span>
            </button>

            {onNavigateMyChapters && (
              <button
                type="button"
                onClick={onNavigateMyChapters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition hover:scale-102 cursor-pointer text-white"
                style={{ backgroundColor: 'var(--accent-saffron)' }}
              >
                <BookOpen className="w-4 h-4" />
                <span>{language === 'hi' ? 'मेरी पुस्तकें' : 'My Chapters'}</span>
              </button>
            )}

            {onNavigateDashboard && (
              <button
                type="button"
                onClick={onNavigateDashboard}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                style={{ borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }}
              >
                <span>{language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
              </button>
            )}
          </div>
        </div>

        {/* High-Yield Flashcards Summary */}
        {examData?.summaryFlashcards && examData.summaryFlashcards.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                {language === 'hi' ? 'मुख्य सूत्र व सार संक्षेप' : 'High-Yield Concept Flashcards'}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {examData.summaryFlashcards.map((fc, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl border space-y-2 shadow-2xs"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {fc.concept}
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {fc.takeaway}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Review Mode Screen
  if (isReviewMode) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              {language === 'hi' ? 'परीक्षा समीक्षा (२५ प्रश्न)' : 'Pariksha Examination Review (25 Questions)'}
            </h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
              {language === 'hi'
                ? 'प्रत्येक प्रश्न का सही उत्तर एवं उसका विस्तृत विश्लेषण देखें।'
                : 'Review all questions, your answers, and in-depth textbook rationales.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsReviewMode(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? 'परिणाम पर लौटें' : 'Back to Results'}</span>
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const userChoice = userAnswers[idx];
            const isCorrect = userChoice === q.correctIndex;
            const stageCfg = STAGE_CONFIG[q.stage] || STAGE_CONFIG[1];

            return (
              <div
                key={q.id || idx}
                className={`p-5 rounded-2xl border space-y-3 transition ${
                  isCorrect
                    ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10'
                    : 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${stageCfg.badgeColor} ${stageCfg.textColor} ${stageCfg.borderColor}`}
                    >
                      Stage {q.stage}: {stageCfg.name}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                      Q{idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>+{q.points} pts</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <XCircle className="w-4 h-4" />
                        <span>0 pts</span>
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-sm sm:text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {q.question}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isChosen = userChoice === optIdx;
                    const isRightAnswer = optIdx === q.correctIndex;

                    let optStyle = 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50';
                    if (isRightAnswer) {
                      optStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-medium';
                    } else if (isChosen && !isRightAnswer) {
                      optStyle = 'border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-200';
                    }

                    return (
                      <div key={optIdx} className={`p-2.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2 ${optStyle}`}>
                        <span className="font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                <div
                  className="p-3 rounded-xl border text-xs space-y-1"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
                >
                  <div className="font-bold text-amber-600 dark:text-amber-400">
                    {language === 'hi' ? 'व्याख्या / विश्लेषण:' : 'Textbook Rationale:'}
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Exam Interface
  const totalQuestions = questions.length || 25;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div
        className="rounded-3xl border p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-brass)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'चरण ०५ • परीक्षा' : 'STAGE 05 • PARIKSHA (परीक्षा)'}</span>
            </span>

            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentStageConfig.badgeColor} ${currentStageConfig.textColor} ${currentStageConfig.borderColor}`}>
              Stage {currentQuestion?.stage || 1}: {language === 'hi' ? currentStageConfig.hindiName : currentStageConfig.name}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            {activeChapter ? activeChapter.title : 'Pariksha Examination'}
          </h1>
        </div>

        {/* Status Ticker: Points & Streak */}
        <div className="flex items-center gap-3">
          <div
            className="px-3.5 py-1.5 rounded-xl border flex items-center gap-2"
            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)' }}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <div className="text-xs">
              <span className="font-bold text-amber-600 dark:text-amber-400">{accumulatedScore}</span>
              <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>
                pts
              </span>
            </div>
          </div>

          {currentStreak > 1 && (
            <div className="px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center gap-1.5 text-xs font-bold animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-orange-500" />
              <span>{currentStreak} Streak</span>
            </div>
          )}

          {activeChapter && onNavigateManan && (
            <button
              type="button"
              onClick={() => onNavigateManan(activeChapter)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'मनन' : 'Manan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Question Progress Tracker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
          <span>
            {language === 'hi' ? 'प्रश्न' : 'Question'} {currentIndex + 1} of {totalQuestions}
          </span>
          <span>
            {currentQuestion?.points} {language === 'hi' ? 'अंक' : 'pts'} · {currentQuestion?.difficulty?.toUpperCase()}
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-warm)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%`, backgroundColor: 'var(--accent-saffron)' }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <div
          className="rounded-3xl border p-6 sm:p-8 space-y-6 shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
        >
          {/* Question meta badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span
              className="text-xs font-medium px-3 py-1 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-secondary)',
              }}
            >
              {currentQuestion.topic || activeChapter?.title}
            </span>

            {/* Hint Lifeline Button */}
            {!showHint && !isAnswerSubmitted && (
              <button
                type="button"
                onClick={() => {
                  setShowHint(true);
                  setHintsUsed((prev) => prev + 1);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border border-amber-500/30 hover:border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 transition cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'संकेत देखें (Hint)' : 'Ask for Guru Hint'}</span>
              </button>
            )}
          </div>

          {/* Hint Card if activated */}
          {showHint && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs sm:text-sm text-amber-800 dark:text-amber-200 animate-in fade-in">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold mr-1">{language === 'hi' ? 'गुरु संकेत:' : 'Guru Hint:'}</span>
                <span>{currentQuestion.hint}</span>
              </div>
            </div>
          )}

          {/* Question Text */}
          <h2 className="text-lg sm:text-xl font-bold font-serif-heading leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {currentQuestion.question}
          </h2>

          {/* 4 Options Grid */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === currentQuestion.correctIndex;

              let cardStyle = 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 hover:border-amber-500/60 hover:bg-amber-500/5';
              let badgeLetter = 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300';

              if (isSelected && !isAnswerSubmitted) {
                cardStyle = 'border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500';
                badgeLetter = 'bg-amber-500 text-white';
              }

              if (isAnswerSubmitted) {
                if (isCorrectAnswer) {
                  cardStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 shadow-xs ring-1 ring-emerald-500';
                  badgeLetter = 'bg-emerald-500 text-white';
                } else if (isSelected && !isCorrectAnswer) {
                  cardStyle = 'border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500';
                  badgeLetter = 'bg-rose-500 text-white';
                } else {
                  cardStyle = 'opacity-40 border-stone-200 dark:border-stone-800';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerSubmitted}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${cardStyle}`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${badgeLetter}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm sm:text-base font-medium flex-1 pt-0.5 leading-snug">
                    {opt}
                  </span>
                  {isAnswerSubmitted && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation after submission */}
          {isAnswerSubmitted && (
            <div
              className={`p-4 rounded-2xl border space-y-1.5 animate-in fade-in duration-200 ${
                selectedOption === currentQuestion.correctIndex
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-amber-500/30 bg-amber-500/10'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <Brain className="w-4 h-4" />
                <span>{language === 'hi' ? 'पाठ्यपुस्तक व्याख्या' : 'Textbook Mastery Rationale'}</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-warm)' }}>
            {!isAnswerSubmitted ? (
              <button
                type="button"
                id="btn-pariksha-submit-answer"
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-102 active:scale-98 disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-white"
                style={{ backgroundColor: 'var(--accent-saffron)' }}
              >
                <span>{language === 'hi' ? 'उत्तर जमा करें' : 'Submit Answer'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-pariksha-next-question"
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer text-white"
                style={{ backgroundColor: 'var(--accent-saffron)' }}
              >
                <span>
                  {currentIndex + 1 < totalQuestions
                    ? language === 'hi'
                      ? 'अगला प्रश्न →'
                      : 'Next Question →'
                    : language === 'hi'
                    ? 'परीक्षा परिणाम देखें'
                    : 'View Examination Results'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

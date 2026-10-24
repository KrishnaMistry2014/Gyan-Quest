import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Award,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavedChapter, generateUniqueChapterCode } from '../lib/chapters';
import {
  generateParikshaMcqsForChapter,
  ParikshaMcqQuestion,
  sanitizeLogMessage,
} from '../lib/geminiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { claimChapterStageReward, addUserXp } from '../lib/firebase';
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
  const [questions, setQuestions] = useState<ParikshaMcqQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({});
  const [isExamCompleted, setIsExamCompleted] = useState<boolean>(false);
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(false);

  useEffect(() => {
    if (chapter) {
      setActiveChapter(chapter);
    }
  }, [chapter]);

  // Load unique questions generated with Gemini 3.5 Flash Lite
  useEffect(() => {
    let isCancelled = false;

    async function loadQuestions() {
      setIsLoading(true);
      setSelectedAnswers({});
      setSubmittedAnswers({});
      setIsExamCompleted(false);
      setRewardClaimed(false);

      try {
        const mcqs = await generateParikshaMcqsForChapter({
          chapter: activeChapter,
          count: 5,
        });
        if (!isCancelled) {
          setQuestions(mcqs);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('[Model Failure Log] Pariksha questions error:', sanitizeLogMessage(err?.message || String(err)));
          setIsLoading(false);
        }
      }
    }

    loadQuestions();

    return () => {
      isCancelled = true;
    };
  }, [activeChapter]);

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (submittedAnswers[questionIdx]) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
    }));
  };

  const handleConfirmQuestion = (questionIdx: number) => {
    if (selectedAnswers[questionIdx] === undefined) return;
    setSubmittedAnswers((prev) => ({
      ...prev,
      [questionIdx]: true,
    }));

    const isCorrect = selectedAnswers[questionIdx] === questions[questionIdx]?.correctIndex;
    if (isCorrect) {
      try {
        playMindfulChime();
      } catch (_) {}
    }
  };

  const handleCompleteExam = async () => {
    setIsExamCompleted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    if (rewardClaimed) return;
    setRewardClaimed(true);

    const earnedXp = 50;
    let ch = activeChapter ? { ...activeChapter } : null;
    if (ch) {
      if (!ch.uniqueCode || ch.uniqueCode.length !== 10) {
        ch.uniqueCode = generateUniqueChapterCode();
      }
      try {
        const reward = await claimChapterStageReward(ch, 'pariksha', user, earnedXp);
        if (reward.awarded) {
          updateProfileXp(reward.newTotal);
          recordStreakActivity('pariksha_mastery');
          showToast({
            title: language === 'hi' ? `परीक्षा उत्तीर्ण! +${earnedXp} XP` : `Pariksha Conquered! +${earnedXp} XP`,
            message: language === 'hi'
              ? `आपने ${ch.title || 'अध्याय'} की परीक्षा सफलतापूर्वक पूर्ण कर ली है!`
              : `Congratulations! You mastered the final exam for ${ch.title || 'your chapter'}!`,
            type: 'xp',
            xpAmount: earnedXp,
          });
          return;
        }
      } catch (err) {
        console.warn('Error claiming Pariksha reward:', sanitizeLogMessage(String(err)));
      }
    }

    try {
      const updatedProfile = await addUserXp(user, earnedXp);
      if (typeof updatedProfile?.xp === 'number' && Number.isFinite(updatedProfile.xp)) {
        updateProfileXp(updatedProfile.xp);
      }
    } catch (err) {
      console.warn('Error adding Pariksha XP:', sanitizeLogMessage(String(err)));
    }

    recordStreakActivity('pariksha_mastery');
    showToast({
      title: language === 'hi' ? `परीक्षा उत्तीर्ण! +${earnedXp} XP` : `Pariksha Conquered! +${earnedXp} XP`,
      message: language === 'hi'
        ? `आपने परीक्षा सफलतापूर्वक पूर्ण कर ली है!`
        : `Congratulations! You completed the Pariksha assessment and earned +${earnedXp} XP!`,
      type: 'xp',
      xpAmount: earnedXp,
    });
  };

  const correctCount = questions.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.correctIndex ? acc + 1 : acc;
  }, 0);

  const answeredCount = Object.keys(submittedAnswers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
      {/* Stage Header Banner */}
      <div
        className="rounded-3xl border p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="space-y-1.5">
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
              <span>{language === 'hi' ? 'चरण ०४ • परीक्षा' : 'STAGE 04 • PARIKSHA (परीक्षा)'}</span>
            </span>

            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-muted)',
              }}
            >
              {language === 'hi' ? 'बहुविकल्पीय प्रश्नोत्तरी • +५० XP' : 'Mastery MCQ Assessment • +50 XP'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-heading tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {activeChapter ? activeChapter.title : (language === 'hi' ? 'परीक्षा मूल्यांकन' : 'Pariksha Chapter Assessment')}
          </h1>

          <p className="text-xs sm:text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            {language === 'hi'
              ? 'अध्याय के बहुविकल्पीय प्रश्नों के उत्तर दें। संपूर्ण परीक्षा उत्तीर्ण करने पर ५० XP प्राप्त होंगे।'
              : 'Test your understanding with unique multiple-choice questions synthesized with Gemini 3.5 Flash Lite. Score 100% to cement your mastery and earn +50 XP.'}
          </p>
        </div>

        {/* Quick Nav Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {activeChapter && onNavigateManan && (
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
              <span>{language === 'hi' ? 'मनन पर लौटें' : 'Back to Manan'}</span>
            </button>
          )}

          {onNavigateMyChapters && (
            <button
              type="button"
              onClick={onNavigateMyChapters}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <BookOpen className="w-4 h-4" />
              <span>{language === 'hi' ? 'अध्याय सूची' : 'My Chapters'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div
          className="rounded-3xl border p-10 text-center space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
        >
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center animate-spin" style={{ backgroundColor: 'var(--accent-saffron-light)', color: 'var(--accent-saffron)' }}>
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            Synthesizing Assessment with Gemini 3.5 Flash Lite...
          </h3>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            Crafting curriculum-aligned multiple choice questions directly from your chapter.
          </p>
        </div>
      ) : isExamCompleted ? (
        /* Results Card */
        <div
          className="rounded-3xl border p-6 sm:p-10 text-center space-y-6 shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
        >
          <div
            className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border shadow-md"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--border-brass)',
              color: 'var(--accent-saffron)',
            }}
          >
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
              style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
              <span>STAGE COMPLETE • +50 XP AWARDED</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Pariksha Conquered!
            </h2>
            <p className="text-sm sm:text-base max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
              You correctly solved {correctCount} out of {questions.length} questions on{' '}
              <span className="font-semibold text-amber-600 dark:text-amber-400">{activeChapter?.title || 'your chapter'}</span>.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedAnswers({});
                setSubmittedAnswers({});
                setIsExamCompleted(false);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shadow-2xs"
              style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Pariksha</span>
            </button>

            {onNavigateDashboard && (
              <button
                type="button"
                onClick={onNavigateDashboard}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-saffron)' }}
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Questions List */
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-semibold px-2" style={{ color: 'var(--text-secondary)' }}>
            <span>Answered: {answeredCount} / {questions.length} Questions</span>
            <span>Total Weightage: +50 XP</span>
          </div>

          {questions.map((q, qIdx) => {
            const isConfirmed = submittedAnswers[qIdx];
            const chosen = selectedAnswers[qIdx];
            const isCorrect = isConfirmed && chosen === q.correctIndex;
            const isWrong = isConfirmed && chosen !== q.correctIndex;

            return (
              <div
                key={q.id || `q_${qIdx}`}
                className="rounded-3xl border p-5 sm:p-7 space-y-4 shadow-xs transition-all"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: isConfirmed
                    ? isCorrect
                      ? 'rgba(16, 185, 129, 0.5)'
                      : 'rgba(239, 68, 68, 0.4)'
                    : 'var(--border-warm)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider block text-amber-600 dark:text-amber-400">
                      Question {qIdx + 1} of {questions.length}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {q.question}
                    </h3>
                  </div>

                  {isConfirmed && (
                    <div className="shrink-0">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrect</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 4 Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosen === optIdx;
                    const isTheCorrectAnswer = isConfirmed && optIdx === q.correctIndex;
                    const isTheWrongAnswer = isConfirmed && isSelected && !isCorrect;

                    let bg = 'var(--bg-main)';
                    let border = 'var(--border-warm)';
                    let text = 'var(--text-primary)';

                    if (isConfirmed) {
                      if (isTheCorrectAnswer) {
                        bg = 'rgba(16, 185, 129, 0.15)';
                        border = 'rgba(16, 185, 129, 0.6)';
                        text = 'var(--text-primary)';
                      } else if (isTheWrongAnswer) {
                        bg = 'rgba(239, 68, 68, 0.15)';
                        border = 'rgba(239, 68, 68, 0.5)';
                        text = 'var(--text-primary)';
                      }
                    } else if (isSelected) {
                      bg = 'var(--accent-saffron-light)';
                      border = 'var(--accent-saffron)';
                      text = 'var(--accent-saffron-text)';
                    }

                    return (
                      <button
                        key={`opt_${optIdx}`}
                        type="button"
                        disabled={isConfirmed}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${
                          isConfirmed ? 'cursor-default' : 'hover:scale-[1.01] active:scale-[0.99]'
                        }`}
                        style={{
                          backgroundColor: bg,
                          borderColor: border,
                          color: text,
                        }}
                      >
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border"
                          style={{
                            backgroundColor: isSelected ? 'var(--accent-saffron)' : 'var(--bg-card)',
                            color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                            borderColor: 'var(--border-warm)',
                          }}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1 leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Confirm or Explanation */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                  {!isConfirmed ? (
                    <button
                      type="button"
                      disabled={chosen === undefined}
                      onClick={() => handleConfirmQuestion(qIdx)}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                        chosen === undefined
                          ? 'opacity-40 cursor-not-allowed'
                          : 'cursor-pointer hover:opacity-90 active:scale-95'
                      }`}
                      style={{
                        backgroundColor: 'var(--accent-saffron)',
                        color: '#FFFFFF',
                      }}
                    >
                      Confirm Answer
                    </button>
                  ) : (
                    <div className="w-full rounded-2xl p-3 text-xs leading-relaxed border bg-amber-500/5" style={{ borderColor: 'var(--border-warm)', color: 'var(--text-secondary)' }}>
                      <span className="font-bold text-amber-600 dark:text-amber-400 mr-1.5">Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Complete Exam CTA */}
          {allAnswered && (
            <div
              className="p-6 rounded-3xl border text-center space-y-4 shadow-sm"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-warm)' }}
            >
              <div className="space-y-1">
                <h4 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                  All Questions Answered!
                </h4>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Submit your exam to finalize your score and claim your +50 XP completion reward.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCompleteExam}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-extrabold shadow-md text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer animate-pulse"
                style={{ backgroundColor: 'var(--accent-saffron)' }}
              >
                <Award className="w-5 h-5" />
                <span>Submit &amp; Claim +50 XP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

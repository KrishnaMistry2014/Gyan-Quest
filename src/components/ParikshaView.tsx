import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Trophy,
  UploadCloud,
  CheckCircle2,
  Brain
} from 'lucide-react';
import { SavedChapter, generateUniqueChapterCode } from '../lib/chapters';
import { GyanQuestCrossword } from './GyanQuestCrossword';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { claimChapterStageReward } from '../lib/firebase';

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
  const { user, profile, updateProfileXp, recordStreakActivity } = useAuth();
  const { showToast } = useToast();
  const { language, t } = useLanguage();

  const [activeChapter, setActiveChapter] = useState<SavedChapter | null>(chapter || null);

  useEffect(() => {
    if (chapter) {
      setActiveChapter(chapter);
    }
  }, [chapter]);

  // When chapter test is completed
  const handleParikshaCompleted = async (solvedCount = 25) => {
    let ch = activeChapter ? { ...activeChapter } : null;
    const earnedXp = Math.min(50, Math.max(2, solvedCount * 2));
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
              : `Congratulations! You mastered the chapter exam for ${ch.title || 'your chapter'}!`,
            type: 'xp',
            xpAmount: earnedXp,
          });
          return;
        }
      } catch (err) {
        console.warn('Error claiming Pariksha reward:', err);
      }
    }
    // Fallback or already claimed
    recordStreakActivity('pariksha_mastery');
    showToast({
      title: language === 'hi' ? 'परीक्षा पूर्ण!' : 'Pariksha Completed!',
      message: language === 'hi'
        ? `आपने परीक्षा सफलतापूर्वक पूर्ण कर ली है!`
        : `Congratulations! You completed the Pariksha assessment.`,
      type: 'success',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
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
              {language === 'hi' ? '६ शब्द • प्रति शब्द ८ XP (कुल ५० XP)' : '6 Words • 8 XP per Word (50 XP Total)'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-heading tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {activeChapter ? activeChapter.title : (language === 'hi' ? 'परीक्षा क्रॉसवर्ड परीक्षण' : 'Pariksha Chapter Exam')}
          </h1>

          <p className="text-xs sm:text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            {language === 'hi'
              ? 'अध्याय के ६ प्रश्नों के उत्तर क्रॉसवर्ड में लिखें। प्रत्येक सही शब्द पर ८ XP प्राप्त होंगे।'
              : 'Conquer the 6-word chapter assessment crossword. Each solved word carries a weightage of 8 XP, awarding up to 50 XP upon completion.'}
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

      {/* Main Pariksha Crossword Exam Component */}
      <div className="w-full">
        <GyanQuestCrossword
          initialChapter={activeChapter || undefined}
          onExit={onNavigateDashboard || onNavigateHome}
          onComplete={handleParikshaCompleted}
          isPariksha={true}
        />
      </div>
    </div>
  );
};

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
import { SavedChapter } from '../lib/chapters';
import { GyanQuestCrossword } from './GyanQuestCrossword';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

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
  const handleParikshaCompleted = () => {
    // Stage 05 Pariksha awards 50 XP (allowed per requirement 8: "Do not give Xp rewards over 15Xp in anything other than Pariksha and manan")
    const newXp = (profile?.xp || 0) + 50;
    updateProfileXp(newXp);
    recordStreakActivity('pariksha_mastery');
    showToast({
      title: language === 'hi' ? 'परीक्षा उत्तीर्ण! +50 XP' : 'Pariksha Conquered! +50 XP',
      message: language === 'hi'
        ? `आपने ${activeChapter?.title || 'अध्याय'} की परीक्षा सफलतापूर्वक पूर्ण कर ली है!`
        : `Congratulations! You mastered the chapter exam for ${activeChapter?.title || 'your chapter'}!`,
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
              <span>{language === 'hi' ? 'चरण ०५ • परीक्षा' : 'STAGE 05 • PARIKSHA (परीक्षा)'}</span>
            </span>

            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-muted)',
              }}
            >
              {language === 'hi' ? 'क्रॉसवर्ड प्रश्न परीक्षण' : 'Crossword Question Exam'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-heading tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {activeChapter ? activeChapter.title : (language === 'hi' ? 'परीक्षा क्रॉसवर्ड परीक्षण' : 'Pariksha Chapter Exam')}
          </h1>

          <p className="text-xs sm:text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            {language === 'hi'
              ? 'प्रश्नों के उत्तर दाएं फलक (Right Pane) में दिए गए संकेतों से पढ़ें और बिना विकल्प के क्रॉसवर्ड में सही उत्तर लिखें।'
              : 'Answer the chapter assessment questions given as clue prompts on the right pane by filling answers directly into the crossword puzzle grid.'}
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
        />
      </div>
    </div>
  );
};

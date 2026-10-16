import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  BookOpen,
  ArrowLeft,
  Upload,
  CheckCircle2,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { GyanQuestCrossword } from './GyanQuestCrossword';
import { SavedChapter, getLocalChapters } from '../lib/chapters';
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeChapter, setActiveChapter] = useState<SavedChapter | null>(chapter || null);
  const [availableChapters, setAvailableChapters] = useState<SavedChapter[]>([]);
  const [showChapterSelector, setShowChapterSelector] = useState<boolean>(false);

  useEffect(() => {
    if (chapter) {
      setActiveChapter(chapter);
    }
  }, [chapter]);

  useEffect(() => {
    const list = getLocalChapters(user?.uid);
    setAvailableChapters(list);
    if (!activeChapter && list.length > 0) {
      setActiveChapter(list[0]);
    }
  }, [user?.uid, activeChapter]);

  const handleExit = () => {
    if (onNavigateDashboard) {
      onNavigateDashboard();
    } else if (onNavigateHome) {
      onNavigateHome();
    }
  };

  const currentChapter = activeChapter || chapter || undefined;

  return (
    <div className="min-h-screen pb-16 transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Banner / Stage Header */}
      <div
        className="border-b px-4 sm:px-8 py-4 backdrop-blur-md sticky top-0 z-10 transition-colors"
        style={{
          backgroundColor: 'var(--bg-nav)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-pariksha-back"
              onClick={handleExit}
              className="p-2 rounded-xl border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer"
              style={{
                borderColor: 'var(--border-warm)',
                color: 'var(--text-secondary)',
              }}
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: 'var(--accent-saffron)' }}
                >
                  Stage 05 • परीक्षा
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t.parikshaTitle}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                {currentChapter ? currentChapter.title : 'Chapter Crossword Exam'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {availableChapters.length > 1 && (
              <button
                type="button"
                id="btn-switch-pariksha-chapter"
                onClick={() => setShowChapterSelector(!showChapterSelector)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer"
                style={{
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                <FolderOpen className="w-4 h-4 text-amber-500" />
                <span>Switch Chapter</span>
              </button>
            )}

            {onNavigateMyChapters && (
              <button
                type="button"
                onClick={onNavigateMyChapters}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer"
                style={{
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>My Chapters</span>
              </button>
            )}
          </div>
        </div>

        {/* Chapter Selector Dropdown */}
        {showChapterSelector && availableChapters.length > 0 && (
          <div
            className="max-w-7xl mx-auto mt-3 p-3 rounded-2xl border shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div className="text-xs font-bold uppercase tracking-wider mb-2 px-1 text-amber-700 dark:text-amber-400">
              Select Chapter for Stage 05 Pariksha
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {availableChapters.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setActiveChapter(ch);
                    setShowChapterSelector(false);
                  }}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2 cursor-pointer ${
                    activeChapter?.id === ch.id
                      ? 'border-amber-500 bg-amber-500/10 font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    borderColor: activeChapter?.id === ch.id ? 'var(--accent-saffron)' : 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <BookOpen className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{ch.title}</p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {ch.fileName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Examination Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <GyanQuestCrossword
          initialChapter={currentChapter}
          onExit={handleExit}
        />
      </main>
    </div>
  );
};

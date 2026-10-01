import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  FileText,
  Search,
  UploadCloud,
  Trash2,
  ArrowRight,
  Clock,
  Sparkles,
  ArrowLeft,
  Calendar,
  Layers,
  CloudCheck
} from 'lucide-react';
import {
  SavedChapter,
  getLocalChapters,
  subscribeUserChapters,
  fetchUserChaptersFromFirestore,
  deleteChapter,
  syncGuestChaptersToUser
} from '../lib/chapters';
import { useAuth } from '../context/AuthContext';

interface MyChaptersProps {
  onOpenChapter: (chapter: SavedChapter) => void;
  onUploadPdf: (file: File) => void;
  onNavigateDashboard?: () => void;
  onNavigateHome?: () => void;
}

export const MyChapters: React.FC<MyChaptersProps> = ({
  onOpenChapter,
  onUploadPdf,
  onNavigateDashboard,
  onNavigateHome,
}) => {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<SavedChapter[]>(getLocalChapters());
  const [searchQuery, setSearchQuery] = useState('');
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync chapters with Firestore when user is authenticated
  useEffect(() => {
    if (user && user.uid) {
      // Immediate cloud query so chapters persist across login/out sessions
      fetchUserChaptersFromFirestore(user.uid).then((remoteList) => {
        setChapters(remoteList);
      });

      // Sync any local guest chapters to their account
      syncGuestChaptersToUser(user.uid);

      // Subscribe to real-time updates from Firestore
      const unsubscribe = subscribeUserChapters(user.uid, (remoteChapters) => {
        setChapters(remoteChapters);
      });

      return () => unsubscribe();
    } else {
      setChapters(getLocalChapters('guest'));
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        onUploadPdf(file);
      }
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await deleteChapter(id);
    setChapters(updated);
    setChapterToDelete(null);
  };

  const filteredChapters = chapters.filter((chapter) => {
    const q = searchQuery.toLowerCase();
    return (
      chapter.title.toLowerCase().includes(q) ||
      chapter.fileName.toLowerCase().includes(q) ||
      chapter.summary.toLowerCase().includes(q)
    );
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const calculateReadTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 180);
    return `${minutes} min read`;
  };

  return (
    <div
      id="my-chapters-page"
      className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
        id="my-chapters-upload-input"
      />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Chapter Library</span>
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              • {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'} Saved
            </span>
          </div>

          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            My Chapters
          </h1>

          <p className="text-sm sm:text-base mt-1" style={{ color: 'var(--text-secondary)' }}>
            Access all your uploaded PDF chapters, extracted notes, and study guides in one place.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {onNavigateDashboard && (
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              style={{
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              Dashboard
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-saffron)',
              color: '#FFFFFF',
            }}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Chapter</span>
          </button>
        </div>
      </div>

      {/* Search Bar (if chapters exist) */}
      {chapters.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapters or topics..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
              outlineColor: 'var(--accent-saffron)',
            }}
          />
        </div>
      )}

      {/* Chapters Grid or Empty State */}
      {chapters.length === 0 ? (
        /* Empty State */
        <div
          id="empty-chapters-view"
          className="rounded-3xl border p-8 sm:p-14 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-sm"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mb-5 border shadow-xs"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--border-warm)',
              color: 'var(--accent-saffron)',
            }}
          >
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            No Chapters Saved Yet
          </h2>

          <p className="text-sm sm:text-base leading-relaxed max-w-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Upload a textbook chapter or study notes PDF to generate your first study guide. All your chapters will be saved here automatically.
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-saffron)',
              color: '#FFFFFF',
            }}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Your First PDF Chapter</span>
          </button>
        </div>
      ) : filteredChapters.length === 0 ? (
        /* No Search Results */
        <div
          className="rounded-3xl border p-10 text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            No chapters match &quot;{searchQuery}&quot;
          </p>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Try searching with a different keyword or chapter title.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
            style={{ borderColor: 'var(--border-warm)', color: 'var(--text-primary)' }}
          >
            Clear Search
          </button>
        </div>
      ) : (
        /* Chapter Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map((chapter) => (
            <div
              key={chapter.id}
              onClick={() => onOpenChapter(chapter)}
              className="rounded-3xl border p-6 shadow-sm transition-all hover:shadow-md hover:border-orange-400 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group relative"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
              }}
            >
              <div>
                {/* Header row: badge & delete */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border"
                    style={{
                      backgroundColor: 'var(--bg-main)',
                      borderColor: 'var(--border-warm)',
                      color: 'var(--accent-saffron-text)',
                    }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF Chapter</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(chapter.id, e)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Delete chapter notes"
                    aria-label={`Delete ${chapter.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Chapter Title */}
                <h3
                  className="text-lg font-bold tracking-tight mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {chapter.title}
                </h3>

                {/* File name subtitle */}
                <p className="text-xs mb-3 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {chapter.fileName}
                </p>

                {/* Snippet preview */}
                <p className="text-xs sm:text-sm line-clamp-3 leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {chapter.summary.replace(/[#*`_>-]/g, '').trim()}
                </p>
              </div>

              {/* Bottom Card Footer */}
              <div
                className="pt-4 border-t flex items-center justify-between text-xs"
                style={{ borderColor: 'var(--border-warm)' }}
              >
                <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(chapter.createdAt)}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{calculateReadTime(chapter.summary)}</span>
                  </span>
                </div>

                <div
                  className="inline-flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform"
                  style={{ color: 'var(--accent-saffron-text)' }}
                >
                  <span>Open Notes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

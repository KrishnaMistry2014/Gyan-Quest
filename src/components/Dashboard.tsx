import React, { useRef, useState, useEffect } from 'react';
import { BookOpen, Zap, Flame, UploadCloud, CheckCircle2, ArrowRight, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onResumeLearning?: () => void;
  onPdfUpload?: (file: File) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onResumeLearning, onPdfUpload }) => {
  const { streak, isStreakActiveToday, openStreakModal } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-dismiss error toaster after 5 seconds
  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const processSelectedFile = (file: File) => {
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setErrorMessage('Please upload a PDF file. Other file types are not supported.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setErrorMessage(null);
    setUploadedFileName(file.name);
    onPdfUpload?.(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div id="gyan-dashboard" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8 relative">
      {/* Error Message Toaster for non-PDF uploads */}
      {errorMessage && (
        <div
          id="dashboard-error-toast"
          role="alert"
          aria-live="assertive"
          className="fixed top-20 right-4 sm:right-8 z-50 max-w-md w-[calc(100%-2rem)] sm:w-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-top-4 duration-300"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: '#EF4444',
            color: 'var(--text-primary)',
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
          </div>

          <div className="flex-1 pr-2">
            <div className="text-sm font-bold text-red-600 dark:text-red-400 mb-0.5">
              Unsupported File Type
            </div>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {errorMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Three responsive rounded-square cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card 1: Start Learning / Resume Learning */}
        <div
          id="card-start-learning"
          className="aspect-square rounded-3xl border p-6 sm:p-8 shadow-sm flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron)',
              }}
            >
              <BookOpen className="w-6 h-6" />
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-secondary)',
              }}
            >
              Active Quest
            </span>
          </div>

          <div className="space-y-3 pt-4">
            <button
              type="button"
              id="btn-card-start-learning"
              onClick={onResumeLearning}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 hover:scale-[1.02] hover:shadow-md active:scale-[0.99] cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-card-resume-learning"
              onClick={onResumeLearning}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 hover:scale-[1.02] hover:shadow-md active:scale-[0.99] cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <span>Resume Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: XP */}
        <div
          id="card-xp"
          className="aspect-square rounded-3xl border p-6 sm:p-8 shadow-sm flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron)',
              }}
            >
              <Zap className="w-6 h-6 fill-current text-amber-500" />
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-secondary)',
              }}
            >
              Mastery Score
            </span>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>
              XP
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              0 XP
            </div>
            <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              Vidya (10), Shravan (5), Manan (15), Pariksha (50)
            </p>
          </div>

          <div className="text-xs font-medium" style={{ color: 'var(--accent-saffron-text)' }}>
            Earn up to 80 XP per completed chapter
          </div>
        </div>

        {/* Card 3: Daily Streak */}
        <div
          id="card-daily-streak"
          onClick={openStreakModal}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openStreakModal();
            }
          }}
          aria-label={`Daily Streak: ${streak} days. Click to view streak details or claim daily check-in.`}
          className="aspect-square rounded-3xl border p-6 sm:p-8 shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:border-orange-400 hover:shadow-md group focus:outline-none focus:ring-2 focus:ring-orange-400"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 ${
                isStreakActiveToday ? '' : 'animate-pulse'
              }`}
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron)',
              }}
            >
              <Flame className="w-6 h-6 fill-current text-orange-500" />
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border transition-colors group-hover:border-orange-400"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-secondary)',
              }}
            >
              {isStreakActiveToday ? 'Protected' : 'Daily Habit'}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Daily Streak
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-baseline gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>{streak}</span>
              <span className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                {streak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <p className="text-xs sm:text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              {isStreakActiveToday
                ? 'Active today • Your momentum is safe!'
                : 'Action required • Tap to check in today'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs font-semibold" style={{ color: 'var(--accent-saffron-text)' }}>
              {isStreakActiveToday ? 'Streak Safe' : 'Tap to Claim'}
            </div>
            <div
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all group-hover:scale-105 shadow-xs"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <span>{isStreakActiveToday ? 'View Details' : 'Check In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Large rounded rectangle spanning their combined width for Upload Textbooks */}
      {/* In portrait mode, becomes a rounded square (portrait:aspect-square) */}
      <div
        id="card-upload-textbooks"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full rounded-3xl border p-8 sm:p-12 shadow-sm transition-all cursor-pointer group flex flex-col justify-center items-center text-center aspect-auto portrait:aspect-square ${
          isDragging ? 'border-orange-500 scale-[1.01] ring-4 ring-orange-500/20' : 'hover:border-orange-400'
        }`}
        style={{
          backgroundColor: isDragging ? 'var(--accent-saffron-light)' : 'var(--bg-card)',
          borderColor: isDragging ? 'var(--accent-saffron)' : 'var(--border-warm)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="dashboard-textbook-upload-input"
        />

        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mb-4 sm:mb-6 border shadow-xs transition-transform group-hover:scale-105"
          style={{
            backgroundColor: 'var(--accent-saffron-light)',
            borderColor: 'var(--border-warm)',
            color: 'var(--accent-saffron)',
          }}
        >
          <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
          Upload Textbooks
        </h3>

        <p className="text-sm sm:text-base max-w-lg mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Upload your CBSE chapter or notes PDF to transform it into a personalized 5-stage quest with 80 XP.
        </p>

        {uploadedFileName ? (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold border"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--accent-saffron)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate max-w-xs">{uploadedFileName}</span>
          </div>
        ) : (
          <button
            type="button"
            className="px-6 py-3 rounded-2xl text-sm font-bold shadow-xs transition-all hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent-saffron)',
              color: '#FFFFFF',
            }}
          >
            Select PDF Textbook
          </button>
        )}
      </div>
    </div>
  );
};

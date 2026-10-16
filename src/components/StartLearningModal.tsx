import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface StartLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGita?: () => void;
  onSelectRamayana?: () => void;
  onUploadCustomPdf?: () => void;
}

export const StartLearningModal: React.FC<StartLearningModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border shadow-2xl relative p-6 sm:p-8 space-y-6 transition-all overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-warm)' }}>
          <h3 className="text-xl sm:text-2xl font-extrabold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
            Start Learning
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            style={{ backgroundColor: 'var(--bg-icon)', color: 'var(--text-primary)' }}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Learning Options */}
        <div className="space-y-3.5">
          {/* Option 1: Learn Bhagavad Gita */}
          <button
            type="button"
            className="w-full p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center gap-4 shadow-2xs group"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                Learn Bhagavad Gita
              </h4>
            </div>
          </button>

          {/* Option 2: Learn Ramayana */}
          <button
            type="button"
            className="w-full p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center gap-4 shadow-2xs group"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                Learn Ramayana
              </h4>
            </div>
          </button>

          {/* Option 3: Learn Mahabharata (Defunct with matching theme styling) */}
          <button
            type="button"
            className="w-full p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center gap-4 shadow-2xs group"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                Learn Mahabharata
              </h4>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

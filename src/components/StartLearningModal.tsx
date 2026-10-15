import React from 'react';
import {
  X,
  Scroll,
  BookOpen,
  UploadCloud,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface StartLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGita: () => void;
  onSelectRamayana: () => void;
  onUploadCustomPdf: () => void;
}

export const StartLearningModal: React.FC<StartLearningModalProps> = ({
  isOpen,
  onClose,
  onSelectGita,
  onSelectRamayana,
  onUploadCustomPdf,
}) => {
  const { language, t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border shadow-2xl relative p-6 sm:p-8 space-y-6 transition-all overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border-warm)' }}>
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'अध्ययन विकल्प' : 'Learning Options'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              {t.startLearningModalTitle}
            </h3>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t.startLearningModalSubtitle}
            </p>
          </div>

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

        {/* Learning Paths */}
        <div className="space-y-3.5">
          {/* Option 1: Learn Bhagavad Gita */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectGita();
            }}
            className="w-full p-4 rounded-2xl border text-left transition-all hover:scale-101 active:scale-98 cursor-pointer flex items-start gap-4 shadow-2xs group"
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
              <Scroll className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                  {t.learnBhagavadGita}
                </h4>
                <ArrowRight className="w-4 h-4 text-amber-600 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t.learnBhagavadGitaDesc}
              </p>
            </div>
          </button>

          {/* Option 2: Learn Ramayana */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectRamayana();
            }}
            className="w-full p-4 rounded-2xl border text-left transition-all hover:scale-101 active:scale-98 cursor-pointer flex items-start gap-4 shadow-2xs group"
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
              <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                  {t.learnRamayana}
                </h4>
                <ArrowRight className="w-4 h-4 text-amber-600 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t.learnRamayanaDesc}
              </p>
            </div>
          </button>
        </div>

        {/* Aren't finding what you want? Link */}
        <div className="pt-2 border-t text-center space-y-1.5" style={{ borderColor: 'var(--border-warm)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            {t.cantFindQuestion}
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onUploadCustomPdf();
            }}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all hover:underline cursor-pointer"
            style={{ color: 'var(--accent-saffron-text)' }}
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t.uploadCustomPrompt}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

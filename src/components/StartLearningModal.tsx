import React from 'react';
import { X, BookOpen, Scroll } from 'lucide-react';
import { SavedChapter } from '../lib/chapters';

interface StartLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGita?: () => void;
  onSelectRamayana?: () => void;
  onSelectMahabharata?: () => void;
  onUploadCustomPdf?: () => void;
}

const MAHABHARATA_CHAPTER: SavedChapter = {
  id: 'epic_mahabharata_dharma',
  uniqueCode: '9028374156',
  title: 'Mahabharata: The Epic of Duty, Wisdom, and Righteous Choices',
  fileName: 'Mahabharata_Vyasa_Epic_Wisdom.pdf',
  summary: `# Mahabharata: The Epic of Duty, Wisdom, and Righteous Choices

The Mahabharata, composed by Sage Vedavyasa, is the monumental epic chronicling the Kurukshetra War and the eternal victory of Dharma over adharma.

## Core Pillars for Young Scholars (Grades 4–8):
1. **Dharma-Sankat (Moral Courage)**: Making righteous choices when faced with complex ethical dilemmas.
2. **Nishkama Karma (Action without Attachment)**: Giving your 100% to your studies and duties without anxiety over exam scores or rewards.
3. **Friendship & Loyalty (Karna & Duryodhana / Krishna & Arjuna)**: The power of steadfast loyalty, truth, and righteous counsel.
4. **Mindfulness & Self-Mastery**: Controlling the senses and mastering the inner chariot of the mind.

## Student Wisdom:
True victory belongs to those who stand by truth and integrity in every situation.`,
  createdAt: new Date().toISOString(),
};

export const StartLearningModal: React.FC<StartLearningModalProps> = ({
  isOpen,
  onClose,
  onSelectGita,
  onSelectRamayana,
  onSelectMahabharata,
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
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Start Learning
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Choose a sacred text or epic to begin your quest
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

        {/* Learning Options */}
        <div className="space-y-3.5">
          {/* Option 1: Learn Bhagavad Gita */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectGita?.();
            }}
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
              <Scroll className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                Bhagavad Gita
              </h4>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Dhyana Yoga, duty, and mental mastery
              </p>
            </div>
          </button>

          {/* Option 2: Learn Ramayana */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectRamayana?.();
            }}
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
              <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                Ramayana
              </h4>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Truth, courage, and righteous duty
              </p>
            </div>
          </button>

          {/* Option 3: Learn Mahabharata */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectMahabharata?.();
            }}
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
              <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                Mahabharata
              </h4>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Epic wisdom and moral choices
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

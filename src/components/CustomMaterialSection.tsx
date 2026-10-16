import React, { useRef } from 'react';
import {
  BookOpen,
  UploadCloud,
  Sparkles,
  Award
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CustomMaterialSectionProps {
  onPdfUpload?: (file: File) => void;
}

export const CustomMaterialSection: React.FC<CustomMaterialSectionProps> = ({ onPdfUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language, t } = useLanguage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        onPdfUpload?.(file);
      }
      e.target.value = '';
    }
  };

  return (
    <section id="custom-material" className="py-8 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Minimalist Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-3">
        <div className="text-xs font-serif tracking-widest uppercase font-semibold" style={{ color: 'var(--accent-saffron-text)' }}>
          स्वाध्याय · Self-Directed Learning
        </div>

        <h2
          id="custom-material-title"
          className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight font-serif-heading"
          style={{ color: 'var(--text-primary)' }}
        >
          {t.customMaterialTitle}
        </h2>

        <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal" style={{ color: 'var(--text-secondary)' }}>
          {t.customMaterialSubtitle}
        </p>
      </div>

      {/* 3 Pipeline Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Step 1: Upload */}
        <div
          className="rounded-2xl border p-6 text-center shadow-xs flex flex-col items-center justify-between space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-3 flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>

            <div className="text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
              प्रवेश · Step 01
            </div>

            <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Upload Chapter PDF
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed max-w-xs font-normal" style={{ color: 'var(--text-secondary)' }}>
              Select any school textbook chapter, syllabus handout, or coaching PDF document.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="landing-pdf-upload-input"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-2xs"
            style={{
              backgroundColor: 'var(--accent-saffron)',
              borderColor: 'var(--accent-saffron)',
              color: '#FFFFFF',
            }}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF File</span>
          </button>
        </div>

        {/* Step 2: Synthesis */}
        <div
          className="rounded-2xl border p-6 text-center shadow-xs flex flex-col items-center justify-between space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-3 flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>

            <div className="text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
              मंथन · Step 02
            </div>

            <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Intelligent Synthesis
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed max-w-xs font-normal" style={{ color: 'var(--text-secondary)' }}>
              The engine automatically extracts bite-sized concept notes, spoken narration, and reflection exercises.
            </p>
          </div>

          <div className="pt-2 text-xs font-mono font-medium" style={{ color: 'var(--accent-saffron-text)' }}>
            Automated Structuring
          </div>
        </div>

        {/* Step 3: Quest */}
        <div
          className="rounded-2xl border p-6 text-center shadow-xs flex flex-col items-center justify-between space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-3 flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Award className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>

            <div className="text-xs font-serif uppercase tracking-widest text-amber-700 dark:text-amber-400 font-semibold">
              विजय · Step 03
            </div>

            <h3 className="text-lg font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Master the Chapter
            </h3>

            <p className="text-xs sm:text-sm leading-relaxed max-w-xs font-normal" style={{ color: 'var(--text-secondary)' }}>
              Step through the 5 stages at your own pace and earn up to 80 XP on your personal learning journey.
            </p>
          </div>

          <div className="pt-2 text-xs font-mono font-medium" style={{ color: 'var(--accent-saffron-text)' }}>
            80 XP Milestone
          </div>
        </div>
      </div>
    </section>
  );
};

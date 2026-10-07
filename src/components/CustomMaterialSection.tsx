import React, { useRef } from 'react';
import {
  BookOpen,
  FileText,
  Sparkles,
  ShieldCheck,
  UploadCloud,
  Layers,
  Award,
  BookMarked
} from 'lucide-react';

interface CustomMaterialSectionProps {
  onPdfUpload?: (file: File) => void;
}

export const CustomMaterialSection: React.FC<CustomMaterialSectionProps> = ({ onPdfUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <section id="custom-material" className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-2.5">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs"
          style={{
            backgroundColor: 'var(--accent-saffron-light)',
            borderColor: 'var(--border-warm)',
            color: 'var(--accent-saffron-text)',
          }}
        >
          <BookMarked className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          <span>CUSTOM PDF LEARNING</span>
        </div>

        <h2
          id="custom-material-title"
          className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight font-serif-heading"
          style={{ color: 'var(--text-primary)' }}
        >
          Master Any Chapter — Upload Your PDF
        </h2>

        <p className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Have a specific chapter handout, coaching module, textbook chapter, or school PDF you want to master? Upload it to generate a full 5-stage quest with 80 XP.
        </p>
      </div>

      {/* Center Badge */}
      <div className="flex justify-center mb-4">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs"
          style={{
            backgroundColor: 'var(--accent-saffron)',
            borderColor: 'var(--accent-saffron)',
            color: '#FFFFFF',
          }}
        >
          THE TRANSFORMATION PIPELINE
        </span>
      </div>

      {/* 3 Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div
          className="rounded-2xl border p-6 text-center shadow-2xs flex flex-col items-center justify-between space-y-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-2 flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border mb-1"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              STEP 01
            </div>

            <h3 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Upload Any PDF
            </h3>

            <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              Your school handouts, chapter notes, or coaching PDFs.
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer shadow-2xs mt-2"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>Upload PDF</span>
          </button>
        </div>

        {/* Step 2 */}
        <div
          className="rounded-2xl border p-6 text-center shadow-2xs flex flex-col items-center justify-between space-y-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-2 flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border mb-1"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                borderColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              STEP 02
            </div>

            <h3 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              Gyan Quest Engine
            </h3>

            <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              Extracts Vidya (10 XP), Shravan (5 XP), Manan (15 XP), Prashna (0 XP), and Pariksha (50 XP).
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div
          className="rounded-2xl border p-6 text-center shadow-2xs flex flex-col items-center justify-between space-y-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-warm)',
          }}
        >
          <div className="space-y-2 flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border mb-1"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Award className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              STEP 03
            </div>

            <h3 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
              5-Stage Journey
            </h3>

            <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--text-secondary)' }}>
              Sequential progression with 80 total XP per completed chapter.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { X, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { STUDENT_ARTICLE_DATA } from '../../data/gitaQuestData';

interface StudentWisdomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageChariot: string;
}

export const StudentWisdomModal: React.FC<StudentWisdomModalProps> = ({
  isOpen,
  onClose,
  imageChariot,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-3xl max-h-[90vh] border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#78350F] to-[#451A03] dark:from-[#381A07] dark:to-[#1F0C02] text-white p-5 sm:p-6 overflow-hidden shrink-0 border-b border-amber-800/40">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img
              src={imageChariot}
              alt="Krishna and Arjuna"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FDE68A] uppercase tracking-wider mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{STUDENT_ARTICLE_DATA.chapter} • {STUDENT_ARTICLE_DATA.verse}</span>
              </div>
              <h2 className="font-serif-heading text-xl sm:text-2xl font-bold text-white">
                {STUDENT_ARTICLE_DATA.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#FDF8EE] opacity-90 mt-1 max-w-xl">
                {STUDENT_ARTICLE_DATA.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Sanskrit Verse & Word Breakdown */}
          <div
            className="border rounded-xl p-5 text-center"
            style={{
              backgroundColor: 'var(--bg-main)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <div
              className="font-serif text-xl sm:text-2xl font-bold leading-relaxed whitespace-pre-line mb-3"
              style={{
                fontFamily: "'Noto Serif Devanagari', 'Rozha One', serif",
                color: 'var(--accent-saffron-text)',
              }}
            >
              {STUDENT_ARTICLE_DATA.shloka}
            </div>
            <p className="font-serif text-base sm:text-lg italic font-medium leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-primary)' }}>
              "{STUDENT_ARTICLE_DATA.translation}"
            </p>
          </div>

          {/* Word Meanings Breakdown */}
          <div>
            <h3 className="font-serif-heading text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: 'var(--accent-saffron-bright)' }}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Word-by-Word Breakdown</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {STUDENT_ARTICLE_DATA.wordMeanings.map((wm, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    borderColor: 'var(--border-warm)',
                  }}
                >
                  <span className="font-bold block font-serif-heading" style={{ color: 'var(--accent-saffron-bright)' }}>
                    {wm.sanskrit}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{wm.english}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Core Student Life Pillars */}
          <div>
            <h3 className="font-serif-heading text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--accent-saffron-bright)' }}>
              The Six Pillars of Student Success
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STUDENT_ARTICLE_DATA.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="border rounded-xl p-4 flex flex-col justify-between shadow-xs"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                  }}
                >
                  <div>
                    <h4 className="font-bold text-sm mb-1.5 flex items-center gap-2" style={{ color: 'var(--accent-saffron-text)' }}>
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                        style={{
                          backgroundColor: 'var(--accent-saffron-light)',
                          color: 'var(--accent-saffron-text)',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span>{sec.title}</span>
                    </h4>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {sec.description}
                    </p>
                  </div>
                  <div
                    className="p-2.5 rounded-lg border text-[11px] font-medium"
                    style={{
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderColor: 'var(--border-warm)',
                      color: 'var(--accent-saffron-text)',
                    }}
                  >
                    <strong>Student Practice:</strong> {sec.takeaway}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cognitive Traits Benefited */}
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              borderColor: 'var(--accent-saffron)',
            }}
          >
            <h4 className="font-serif-heading text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--accent-saffron-text)' }}>
              Cognitive Traits Strengthened by this Practice:
            </h4>
            <div className="flex flex-wrap gap-2">
              {STUDENT_ARTICLE_DATA.studentTraits.map((trait, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-xs border"
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{trait}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

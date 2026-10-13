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
        className="w-full max-w-3xl max-h-[90vh] bg-[#FFFDF9] border border-[#E7DECF] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#78350F] to-[#451A03] text-white p-5 sm:p-6 overflow-hidden shrink-0">
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
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 text-[#29221C]">
          {/* Sanskrit Verse & Word Breakdown */}
          <div className="bg-[#FAF5ED] border border-[#EBE2D4] rounded-xl p-5 text-center">
            <div className="font-serif text-xl sm:text-2xl font-bold text-[#78350F] leading-relaxed whitespace-pre-line mb-3">
              {STUDENT_ARTICLE_DATA.shloka}
            </div>
            <p className="font-serif text-base sm:text-lg italic text-[#451A03] font-medium leading-relaxed max-w-2xl mx-auto">
              "{STUDENT_ARTICLE_DATA.translation}"
            </p>
          </div>

          {/* Word Meanings Breakdown */}
          <div>
            <h3 className="font-serif-heading text-sm font-bold text-[#B45309] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#EA580C]" />
              <span>Word-by-Word Breakdown</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {STUDENT_ARTICLE_DATA.wordMeanings.map((wm, i) => (
                <div key={i} className="p-2.5 bg-[#FFFDF8] rounded-lg border border-[#E7DECF]">
                  <span className="font-bold text-[#C2410C] block font-serif-heading">{wm.sanskrit}</span>
                  <span className="text-[#574D43] text-[11px]">{wm.english}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Core Student Life Pillars */}
          <div>
            <h3 className="font-serif-heading text-sm font-bold text-[#B45309] uppercase tracking-wider mb-3">
              The Six Pillars of Student Success
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STUDENT_ARTICLE_DATA.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="bg-[#FFFDF9] border border-[#E7DECF] rounded-xl p-4 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <h4 className="font-bold text-sm text-[#9A3412] mb-1.5 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center text-xs font-mono">
                        {idx + 1}
                      </span>
                      <span>{sec.title}</span>
                    </h4>
                    <p className="text-xs text-[#574D43] leading-relaxed mb-3">
                      {sec.description}
                    </p>
                  </div>
                  <div className="bg-[#FAF5ED] p-2.5 rounded-lg border border-[#EFE7DA] text-[11px] text-[#78350F] font-medium">
                    <strong>Student Practice:</strong> {sec.takeaway}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cognitive Traits Benefited */}
          <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FFEDD5] rounded-xl p-4 border border-[#FDE68A]">
            <h4 className="font-serif-heading text-xs font-bold text-[#92400E] uppercase tracking-wider mb-2">
              Cognitive Traits Strengthened by this Practice:
            </h4>
            <div className="flex flex-wrap gap-2">
              {STUDENT_ARTICLE_DATA.studentTraits.map((trait, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-semibold text-[#78350F] shadow-xs border border-[#FDE68A]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>{trait}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF5ED] border-t border-[#E7DECF] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

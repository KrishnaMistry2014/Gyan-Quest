import React from 'react';
import { X, HelpCircle } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-lg bg-[#FFFDF9] border border-[#E7DECF] rounded-2xl shadow-2xl p-5 sm:p-6 text-[#29221C]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E7DECF] mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#EA580C]" />
            <h2 className="font-serif-heading text-lg font-bold text-[#C2410C]">
              How to Play GyanQuest
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#78716C] hover:text-[#29221C] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-[#451A03] leading-relaxed">
          <p>
            Welcome to <strong>GyanQuest WordGame</strong>! Explore timeless Sanskrit verses and wisdom for students from the <strong>Bhagavad Gita</strong>.
          </p>

          <div className="space-y-2 bg-[#FAF5ED] p-3.5 rounded-xl border border-[#EBE2D4]">
            <h4 className="font-bold text-[#9A3412]">Quest Mechanics:</h4>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[#574D43]">
              <li>Read the verse sentence clue with the blank <span className="font-mono text-[#C2410C]">_____</span>.</li>
              <li>You have <strong>6 attempts</strong> to guess the secret 5-letter word.</li>
              <li>Type using your physical keyboard or the on-screen Vedic keyboard.</li>
              <li>Press <strong>Enter / Submit</strong> to check your guess.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-[#9A3412]">Tile Color Hints:</h4>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-6 h-6 rounded bg-[#15803D] text-white flex items-center justify-center font-bold font-serif-heading">Y</span>
              <span><strong>Green:</strong> Letter is correct and in the right spot.</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-6 h-6 rounded bg-[#D97706] text-white flex items-center justify-center font-bold font-serif-heading">A</span>
              <span><strong>Gold:</strong> Letter is in the word but in a different spot.</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-6 h-6 rounded bg-[#78716C] text-white flex items-center justify-center font-bold font-serif-heading">Z</span>
              <span><strong>Stone Gray:</strong> Letter is not in the target word.</span>
            </div>
          </div>

          <div className="bg-[#FEF3C7] p-3 rounded-lg border border-[#FDE68A] text-xs text-[#78350F]">
            <strong>Automatic Persistence:</strong> Your quest progress is saved in your browser's localStorage. Feel free to refresh anytime without losing your spot!
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-lg transition-colors cursor-pointer"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};

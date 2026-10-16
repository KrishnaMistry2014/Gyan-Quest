import React from 'react';
import { Compass, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer
      id="main-footer"
      className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all"
    >
      <div
        className="rounded-[32px] border p-8 sm:p-10 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Philosophy */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border"
                style={{ backgroundColor: 'var(--accent-saffron)', borderColor: 'var(--accent-saffron)', color: '#FFFFFF' }}
              >
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Gyan Quest
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm">
              Gyan Quest is an educational platform uniting timeless Indian learning traditions with thoughtful gamification and AI-guided study assistance.
            </p>
            <div className="text-xs font-semibold px-3 py-1 rounded-full border inline-block" style={{ backgroundColor: 'var(--accent-saffron-light)', borderColor: 'var(--border-warm)', color: 'var(--accent-saffron-text)' }}>
              विद्या • श्रवण • मनन • परीक्षा
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

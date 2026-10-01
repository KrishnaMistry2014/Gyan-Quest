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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
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
              विद्या • श्रवण • मनन • प्रश्न • परीक्षा
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Platform Modules
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('journey')} className="hover:text-orange-600 transition-colors text-left cursor-pointer">
                  The 5-Stage Journey
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('gamification')} className="hover:text-orange-600 transition-colors text-left cursor-pointer">
                  Quest & XP System
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('custom-material')} className="hover:text-orange-600 transition-colors text-left cursor-pointer">
                  Study Your Material
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('guru')} className="hover:text-orange-600 transition-colors text-left cursor-pointer">
                  Meet Guru AI
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('focus-mode')} className="hover:text-orange-600 transition-colors text-left cursor-pointer">
                  Focus Mode & Digital Wellness
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Architecture & Firebase */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Technology & Cloud
            </div>
            <div className="p-4 rounded-2xl border text-xs space-y-1.5" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)' }}>
              <div className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <ShieldCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>Firebase Cloud Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ borderColor: 'var(--border-warm)' }}>
          <div>
            © {new Date().getFullYear()} Gyan Quest. Built for meaningful education.
          </div>
        </div>
      </div>
    </footer>
  );
};

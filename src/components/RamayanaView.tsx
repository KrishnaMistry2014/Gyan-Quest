import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { RAMAYANA_CONTENT } from '../data/ramayanaData';

interface RamayanaViewProps {
  onBack: () => void;
}

export const RamayanaView: React.FC<RamayanaViewProps> = ({ onBack }) => {
  return (
    <div className="p-6 sm:p-8 space-y-8" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-black/5 cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold font-serif-heading">The Complete Ramayana</h1>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {RAMAYANA_CONTENT.map((section) => (
          <div
            key={section.id}
            className="p-6 rounded-2xl border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            <h2 className="text-xl font-bold font-serif-heading mb-3" style={{ color: 'var(--accent-saffron-text)' }}>
              {section.id}. {section.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

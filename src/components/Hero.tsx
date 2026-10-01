import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Brain,
  MessageCircleQuestion,
  ClipboardCheck,
  ShieldCheck,
  Award,
  Sparkles,
  Compass,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeroProps {
  onStartQuest: () => void;
  onExplore: () => void;
  onPdfUpload?: (file: File) => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartQuest, onExplore, onPdfUpload }) => {
  const { openAuthModal, user } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const stagesList = [
    { step: '01', label: 'Vidya (विद्या)', xp: '10 XP' },
    { step: '02', label: 'Shravan (श्रवण)', xp: '5 XP' },
    { step: '03', label: 'Manan (मनन)', xp: '15 XP' },
    { step: '04', label: 'Prashna (प्रश्न)', xp: '0 XP' },
    { step: '05', label: 'Pariksha (परीक्षा)', xp: '50 XP' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');
      if (isPdf && onPdfUpload) {
        onPdfUpload(file);
      }
      e.target.value = '';
    }
  };

  return (
    <section id="home" className="pt-4 sm:pt-6 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Bento Hero Container */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[32px] border p-6 sm:p-10 lg:p-12 shadow-xs transition-all relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero Value Proposition */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Pedagogical Label Badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-2xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>INDIAN PEDAGOGY • 5-STAGE PROGRESSION</span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-title"
              className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight leading-[1.12] font-serif-heading"
              style={{ color: 'var(--text-primary)' }}
            >
              Transform Any Chapter Into a{' '}
              <span className="underline decoration-amber-600/60 dark:decoration-amber-400/60 underline-offset-4 decoration-2">
                5-Stage Quest
              </span>
            </h1>

            {/* Concise Subtitle */}
            <p
              id="hero-subtitle"
              className="text-base sm:text-lg leading-relaxed max-w-2xl text-[15px] sm:text-[16px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Gyan Quest blends ancient Indian inquiry — <strong>Vidya (विद्या), Shravan (श्रवण), Manan (मनन), Prashna (प्रश्न)</strong>, and <strong>Pariksha (परीक्षा)</strong> — with modern CBSE standards. Study any chapter with guided notes, audio narration, deep reflection, doubt-clearing, and adaptive assessments.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                id="hero-start-quest-btn"
                onClick={user ? onStartQuest : openAuthModal}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-xs transition-all hover:opacity-95 active:scale-98 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <span>Start Your First Quest</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-explore-pedagogy-btn"
                onClick={onExplore}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-98 cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--accent-saffron-text)',
                }}
              >
                <Compass className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>Explore Pedagogy</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="hero-pdf-file-input"
              />
            </div>

            {/* Feature Highlights Grid */}
            <div
              className="pt-4 border-t flex flex-wrap gap-4 sm:gap-6 text-xs font-semibold"
              style={{
                borderColor: 'var(--border-warm)',
                color: 'var(--text-secondary)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>CBSE Syllabus & NCERT Bound</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>Socratic AI Study Guidance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>80 XP Chapter Mastery</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Visual Architecture (Matching Screen.png) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <div
              id="hero-progression-card"
              className="rounded-[24px] border p-5 sm:p-6 shadow-xs transition-all relative space-y-4"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-warm)' }}>
                <div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider block"
                    style={{ color: 'var(--accent-saffron-text)' }}
                  >
                    CURRICULUM PROGRESSION ARCHITECTURE
                  </span>
                  <h3 className="text-base font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                    The 5-Stage Mastery Journey
                  </h3>
                </div>

                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--accent-saffron-text)',
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>80 Total XP</span>
                </div>
              </div>

              {/* 5-Stage Chips Grid (Matching screenshot: 5 small bordered boxes) */}
              <div className="grid grid-cols-5 gap-1.5">
                {stagesList.map((stage) => (
                  <div
                    key={stage.step}
                    className="p-1.5 sm:p-2 rounded-xl border text-center transition-all shadow-2xs"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-warm)',
                    }}
                  >
                    <div
                      className="text-[9px] sm:text-[10px] font-semibold leading-tight truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {stage.step} {stage.label.split(' ')[0]}
                    </div>
                    <div
                      className="text-[8px] sm:text-[9px] opacity-75 font-normal truncate"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {stage.label.split(' ')[1] || ''}
                    </div>
                    <div
                      className="text-[8px] font-bold mt-0.5 text-amber-700 dark:text-amber-400"
                    >
                      {stage.xp}
                    </div>
                  </div>
                ))}
              </div>

              {/* 3 Key Educational Rows with Icons */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-2.5 text-xs">
                  <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[12px]" style={{ color: 'var(--text-primary)' }}>
                      NCERT & Custom Material Transformation
                    </div>
                    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Any textbook chapter or uploaded PDF is automatically structured into bite-sized study notes and audio summaries.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  <Brain className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[12px]" style={{ color: 'var(--text-primary)' }}>
                      Deep Contemplation & Socratic Inquiry
                    </div>
                    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Students articulate ideas through reflective synthesis and explore questions with context-bound Socratic AI guidance.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  <Award className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[12px]" style={{ color: 'var(--text-primary)' }}>
                      Mastery Validation & Gamified Streaks
                    </div>
                    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Adaptive assessments verify retention, awarding up to 80 XP and fostering an unbroken daily learning habit.
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-warm)' }}>
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  Ready to begin learning?
                </span>
                <button
                  type="button"
                  onClick={user ? onStartQuest : openAuthModal}
                  className="inline-flex items-center gap-1 font-bold text-[11px] hover:underline cursor-pointer"
                  style={{ color: 'var(--accent-saffron-text)' }}
                >
                  <span>Start Chapter Quest</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

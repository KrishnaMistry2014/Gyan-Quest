import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Timer, Clock, ShieldCheck, Moon, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FocusModeSection: React.FC = () => {
  const { user, streak, openStreakModal } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState<number>(25);

  const durationOptions = [
    { minutes: 15, label: 'Quick Sprint', desc: 'Ideal for 1 Shravan summary + reflection' },
    { minutes: 25, label: 'Standard Quest', desc: 'Full Vidya absorption & Pariksha test' },
    { minutes: 40, label: 'Deep Session', desc: 'Complex chapter with multiple formula derivations' },
  ];

  return (
    <section id="focus-mode" className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Bento Signature Dark Card */}
      <motion.div
        id="focus-mode-card"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[32px] border border-[#3E2723] p-6 sm:p-10 shadow-md transition-all text-white relative overflow-hidden"
        style={{
          backgroundColor: '#3E2723',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Focus Mode Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-7 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: 'var(--accent-saffron)', color: '#FFFFFF' }}
                >
                  <Timer className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-300 block">
                    Digital Wellness By Design
                  </span>
                  <h2
                    id="focus-mode-title"
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
                  >
                    Focus Mode
                  </h2>
                </div>
              </div>

              {/* Streak Badge - only visible once student signs in */}
              {user && (
                <button
                  type="button"
                  onClick={openStreakModal}
                  className="text-right hidden sm:block p-2 rounded-xl transition-all hover:bg-white/10 active:scale-95 cursor-pointer text-left focus:outline-none"
                  title={`Current streak: ${streak} day(s) • Click for streak details`}
                >
                  <div className="text-xs text-white/60 font-medium">Learning Streak</div>
                  <div className="text-xl font-bold text-white flex items-center gap-1.5 justify-end">
                    <span className="text-orange-400">🔥</span>
                    <span>{streak} {streak === 1 ? 'Day' : 'Days'}</span>
                  </div>
                </button>
              )}
            </div>

            <p className="text-sm leading-relaxed text-white/80">
              Focus Mode limits the amount of time a student spends inside Gyan Quest, encouraging focused, uninterrupted study sessions instead of endless screen usage and passive browsing.
            </p>

            <div className="space-y-2 pt-1 text-xs text-white/75">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Encourages deliberate practice in concentrated 15–40 minute windows.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Gentle session completion prompts guide students to rest their eyes and reflect offline.</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Clean Interactive Timer Panel in Bento aesthetic */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-5"
          >
            <div className="rounded-2xl border border-white/15 bg-white/5 p-6 space-y-4 text-center backdrop-blur-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-white/80">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span>Target Study Session Interval</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-orange-300">
                  Sprint
                </span>
              </div>

              {/* Timer Display */}
              <div className="py-4 px-6 rounded-2xl border border-white/15 bg-white/10 mx-auto max-w-xs shadow-xs">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-orange-400">
                  {selectedDuration}:00
                </div>
                <div className="text-[11px] font-medium mt-1 text-white/70">
                  Continuous Study Timer
                </div>
              </div>

              {/* Interval Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {durationOptions.map((opt) => (
                  <button
                    key={opt.minutes}
                    onClick={() => setSelectedDuration(opt.minutes)}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                      selectedDuration === opt.minutes
                        ? 'bg-orange-500 border-orange-400 text-white shadow-xs'
                        : 'bg-white/10 border-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {opt.minutes} min
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-medium text-white/70">
                {durationOptions.find(d => d.minutes === selectedDuration)?.desc}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

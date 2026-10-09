import React, { useState, useEffect } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Volume2,
  BookOpen,
  User,
  Bell,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Flame,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    closeSettingsModal,
    openProfileModal,
    user,
    profile,
    streak
  } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();

  // Settings State with LocalStorage Persistence
  const [audioSpeed, setAudioSpeed] = useState<string>(() => {
    return localStorage.getItem('gyanquest_audio_speed') || '1.0';
  });
  const [autoplayAudio, setAutoplayAudio] = useState<boolean>(() => {
    return localStorage.getItem('gyanquest_autoplay_audio') === 'true';
  });
  const [ambientChant, setAmbientChant] = useState<boolean>(() => {
    const val = localStorage.getItem('gyanquest_ambient_chant');
    return val === null ? true : val === 'true';
  });
  const [scriptPreference, setScriptPreference] = useState<string>(() => {
    return localStorage.getItem('gyanquest_sanskrit_script') || 'bilingual';
  });
  const [studyGoal, setStudyGoal] = useState<string>(() => {
    return localStorage.getItem('gyanquest_study_goal') || '30';
  });
  const [streakAlerts, setStreakAlerts] = useState<boolean>(() => {
    const val = localStorage.getItem('gyanquest_streak_alerts');
    return val === null ? true : val === 'true';
  });

  const [activeTab, setActiveTab] = useState<'preferences' | 'audio' | 'account'>('preferences');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsModalOpen) {
        closeSettingsModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsModalOpen, closeSettingsModal]);

  if (!isSettingsModalOpen) return null;

  const handleSaveAudioSpeed = (speed: string) => {
    setAudioSpeed(speed);
    localStorage.setItem('gyanquest_audio_speed', speed);
    showToast(`Default narration speed set to ${speed}x`, 'success');
  };

  const handleToggleAutoplay = () => {
    const nextVal = !autoplayAudio;
    setAutoplayAudio(nextVal);
    localStorage.setItem('gyanquest_autoplay_audio', String(nextVal));
    showToast(nextVal ? 'Auto-play narration enabled' : 'Auto-play narration disabled', 'info');
  };

  const handleToggleAmbient = () => {
    const nextVal = !ambientChant;
    setAmbientChant(nextVal);
    localStorage.setItem('gyanquest_ambient_chant', String(nextVal));
    showToast(nextVal ? 'Ambient Vedic Chants turned on' : 'Ambient Vedic Chants muted', 'info');
  };

  const handleScriptChange = (script: string) => {
    setScriptPreference(script);
    localStorage.setItem('gyanquest_sanskrit_script', script);
    showToast('Vedic script display preference saved', 'success');
  };

  const handleStudyGoalChange = (minutes: string) => {
    setStudyGoal(minutes);
    localStorage.setItem('gyanquest_study_goal', minutes);
    showToast(`Daily study goal updated to ${minutes} mins`, 'success');
  };

  const handleToggleStreakAlerts = () => {
    const nextVal = !streakAlerts;
    setStreakAlerts(nextVal);
    localStorage.setItem('gyanquest_streak_alerts', String(nextVal));
    showToast(nextVal ? 'Streak reminders enabled' : 'Streak reminders muted', 'info');
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('gyanquest_cached_chapters');
      showToast('Offline learning cache cleared successfully', 'success');
    } catch {
      showToast('Cache cleared', 'info');
    }
  };

  const handleResetDefaults = () => {
    setAudioSpeed('1.0');
    setAutoplayAudio(false);
    setAmbientChant(true);
    setScriptPreference('bilingual');
    setStudyGoal('30');
    setStreakAlerts(true);

    localStorage.setItem('gyanquest_audio_speed', '1.0');
    localStorage.setItem('gyanquest_autoplay_audio', 'false');
    localStorage.setItem('gyanquest_ambient_chant', 'true');
    localStorage.setItem('gyanquest_sanskrit_script', 'bilingual');
    localStorage.setItem('gyanquest_study_goal', '30');
    localStorage.setItem('gyanquest_streak_alerts', 'true');

    showToast('All settings restored to defaults', 'info');
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSettingsModal();
      }}
    >
      <div
        id="settings-modal-card"
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-[28px] sm:rounded-[32px] border shadow-2xl relative transition-all overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Modal Header */}
        <div
          className="p-5 sm:p-6 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-warm)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <SettingsIcon className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                Settings
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Customize your Vedic study environment & preferences
              </p>
            </div>
          </div>

          <button
            id="settings-modal-close"
            type="button"
            onClick={closeSettingsModal}
            className="p-2 rounded-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            style={{ backgroundColor: 'var(--bg-icon)', color: 'var(--text-primary)' }}
            aria-label="Close settings modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex border-b px-5 sm:px-6 gap-2 sm:gap-4 overflow-x-auto text-xs sm:text-sm font-semibold"
          style={{ borderColor: 'var(--border-warm)' }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`py-3 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'border-amber-600 font-bold'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'preferences' ? 'var(--accent-saffron-text)' : 'var(--text-secondary)',
              borderColor: activeTab === 'preferences' ? 'var(--accent-saffron)' : 'transparent',
            }}
          >
            <Sun className="w-4 h-4" />
            <span>Appearance & Study</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`py-3 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'audio'
                ? 'border-amber-600 font-bold'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'audio' ? 'var(--accent-saffron-text)' : 'var(--text-secondary)',
              borderColor: activeTab === 'audio' ? 'var(--accent-saffron)' : 'transparent',
            }}
          >
            <Volume2 className="w-4 h-4" />
            <span>Shravan (Audio)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`py-3 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'account'
                ? 'border-amber-600 font-bold'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'account' ? 'var(--accent-saffron-text)' : 'var(--text-secondary)',
              borderColor: activeTab === 'account' ? 'var(--accent-saffron)' : 'transparent',
            }}
          >
            <User className="w-4 h-4" />
            <span>Student Profile</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: Preferences & Appearance */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Theme Preference */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  Theme Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isDark) toggleTheme();
                    }}
                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border text-sm font-bold transition-all cursor-pointer ${
                      !isDark ? 'ring-2 ring-amber-500 shadow-sm' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: !isDark ? 'var(--bg-main)' : 'var(--bg-card-subtle)',
                      borderColor: 'var(--border-warm)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Surya (Light)</span>
                    {!isDark && <Check className="w-4 h-4 text-amber-600 ml-auto" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isDark) toggleTheme();
                    }}
                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border text-sm font-bold transition-all cursor-pointer ${
                      isDark ? 'ring-2 ring-amber-500 shadow-sm' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: isDark ? 'var(--bg-main)' : 'var(--bg-card-subtle)',
                      borderColor: 'var(--border-warm)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span>Chandra (Dark)</span>
                    {isDark && <Check className="w-4 h-4 text-amber-400 ml-auto" />}
                  </button>
                </div>
              </div>

              {/* Sanskrit / Shloka Script Preference */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  Sanskrit Shloka Display
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { id: 'bilingual', label: 'Bilingual (देवनागरी + Eng)' },
                    { id: 'devanagari', label: 'देवनागरी (Devanagari Only)' },
                    { id: 'iast', label: 'IAST Roman Transliteration' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleScriptChange(item.id)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                        scriptPreference === item.id ? 'ring-2 ring-amber-500 font-bold' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: scriptPreference === item.id ? 'var(--accent-saffron-light)' : 'var(--bg-card-subtle)',
                        borderColor: 'var(--border-warm)',
                        color: scriptPreference === item.id ? 'var(--accent-saffron-text)' : 'var(--text-primary)',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Study Goal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  Daily Study Goal
                </label>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {['15', '30', '45', '60'].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleStudyGoalChange(mins)}
                      className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold text-center transition-all cursor-pointer ${
                        studyGoal === mins ? 'ring-2 ring-amber-500' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: studyGoal === mins ? 'var(--accent-saffron)' : 'var(--bg-card-subtle)',
                        borderColor: 'var(--border-warm)',
                        color: studyGoal === mins ? '#FFFFFF' : 'var(--text-primary)',
                      }}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Streak Alerts */}
              <div
                className="flex items-center justify-between p-3.5 rounded-2xl border"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>
                      Daily Streak Notifications
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Gentle reminders to preserve your study streak
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleStreakAlerts}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    streakAlerts ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                  }`}
                  aria-label="Toggle streak alerts"
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Audio & Shravan Settings */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              {/* Narration Playback Speed */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  Default Shravan Narration Speed
                </label>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {['0.75', '1.0', '1.25', '1.5'].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => handleSaveAudioSpeed(spd)}
                      className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold text-center transition-all cursor-pointer ${
                        audioSpeed === spd ? 'ring-2 ring-amber-500' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: audioSpeed === spd ? 'var(--accent-saffron)' : 'var(--bg-card-subtle)',
                        borderColor: 'var(--border-warm)',
                        color: audioSpeed === spd ? '#FFFFFF' : 'var(--text-primary)',
                      }}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Autoplay Narration */}
              <div
                className="flex items-center justify-between p-3.5 rounded-2xl border"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>
                      Auto-play Shravan Narration
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Start audio narration automatically when opening chapter
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutoplay}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    autoplayAudio ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                  }`}
                  aria-label="Toggle autoplay narration"
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>

              {/* Ambient Tanpura / Chants */}
              <div
                className="flex items-center justify-between p-3.5 rounded-2xl border"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>
                      Ambient Tanpura Drone / Chants
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Calming Vedic background harmonics during deep focus
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAmbient}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    ambientChant ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                  }`}
                  aria-label="Toggle ambient chant"
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Account & Student Profile */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div
                className="p-4 sm:p-5 rounded-2xl border space-y-4"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs"
                      style={{
                        backgroundColor: 'var(--accent-saffron-light)',
                        color: 'var(--accent-saffron-text)',
                      }}
                    >
                      {profile?.name?.slice(0, 2).toUpperCase() || 'GQ'}
                    </div>
                    <div>
                      <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                        {profile?.name || 'Vedic Learner'}
                      </h4>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {user?.email || 'Student Account'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      closeSettingsModal();
                      openProfileModal();
                    }}
                    className="px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-102 active:scale-98 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-warm)',
                      color: 'var(--accent-saffron-text)',
                    }}
                  >
                    Edit Name
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: 'var(--border-warm)' }}>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-current" />
                    <div>
                      <span className="text-xs text-muted block" style={{ color: 'var(--text-muted)' }}>Total XP</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--accent-saffron-text)' }}>
                        {profile?.xp || 0} XP
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500 fill-current" />
                    <div>
                      <span className="text-xs text-muted block" style={{ color: 'var(--text-muted)' }}>Active Streak</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--accent-saffron-text)' }}>
                        {streak} Days
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data & Cache management */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Storage & Data
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:opacity-90 active:scale-98 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderColor: 'var(--border-warm)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>Clear Offline Cache</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:opacity-90 active:scale-98 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderColor: 'var(--border-warm)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="p-4 sm:p-5 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border-warm)', backgroundColor: 'var(--bg-card)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Gyan Quest Vedic Study Platform v2.0
          </span>

          <button
            type="button"
            id="settings-done-btn"
            onClick={() => {
              closeSettingsModal();
              showToast('Settings saved', 'success');
            }}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:opacity-95 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-saffron)',
              color: '#FFFFFF',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

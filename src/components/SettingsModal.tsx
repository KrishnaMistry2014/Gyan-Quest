import React, { useState, useEffect } from 'react';
import {
  X,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Volume2,
  Clock,
  User,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Flame,
  Zap,
  Sliders,
  ChevronRight,
  EyeOff,
  Footprints
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
    streak,
    settings,
    updateSettings
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

  // Focus Mode configuration: '15' | '30' | '45' | '60' | 'custom' | 'none'
  const [focusModeOption, setFocusModeOption] = useState<string>(() => {
    const raw = localStorage.getItem('gyanquest_focus_mode_minutes') || 'none';
    if (['15', '30', '45', '60', 'none'].includes(raw)) return raw;
    return 'custom';
  });

  const [customMinutes, setCustomMinutes] = useState<number>(() => {
    const raw = localStorage.getItem('gyanquest_focus_mode_minutes') || 'none';
    if (!['15', '30', '45', '60', 'none'].includes(raw)) {
      const parsed = parseInt(raw, 10);
      return !isNaN(parsed) && parsed > 0 ? parsed : 25;
    }
    return 25;
  });

  const [activeTab, setActiveTab] = useState<'appearance' | 'focus' | 'account'>('appearance');

  // Sync state with user profile settings whenever modal opens
  useEffect(() => {
    if (isSettingsModalOpen && settings) {
      if (settings.audioSpeed) setAudioSpeed(settings.audioSpeed);
      if (typeof settings.autoplayAudio === 'boolean') setAutoplayAudio(settings.autoplayAudio);
      if (settings.focusModeMinutes) {
        if (['15', '30', '45', '60', 'none'].includes(settings.focusModeMinutes)) {
          setFocusModeOption(settings.focusModeMinutes);
        } else {
          setFocusModeOption('custom');
          const parsed = parseInt(settings.focusModeMinutes, 10);
          if (!isNaN(parsed) && parsed > 0) setCustomMinutes(parsed);
        }
      }
      if (settings.customMinutes) setCustomMinutes(settings.customMinutes);
    }
  }, [isSettingsModalOpen, settings]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsModalOpen) {
        handleDone();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsModalOpen, audioSpeed, autoplayAudio, focusModeOption, customMinutes, isDark]);

  // Settings are strictly available to signed-in users
  if (!isSettingsModalOpen || !user) return null;

  const handleSaveAudioSpeed = (speed: string) => {
    setAudioSpeed(speed);
    localStorage.setItem('gyanquest_audio_speed', speed);
  };

  const handleToggleAutoplay = () => {
    const nextVal = !autoplayAudio;
    setAutoplayAudio(nextVal);
    localStorage.setItem('gyanquest_autoplay_audio', String(nextVal));
  };

  const notifyFocusModeChanged = () => {
    window.dispatchEvent(new Event('gyanquest_focus_mode_changed'));
  };

  const handleFocusOptionChange = (option: string) => {
    setFocusModeOption(option);
    if (option === 'custom') {
      localStorage.setItem('gyanquest_focus_mode_minutes', String(customMinutes));
    } else {
      localStorage.setItem('gyanquest_focus_mode_minutes', option);
    }
    notifyFocusModeChanged();
  };

  const handleCustomMinutesChange = (valStr: string) => {
    const num = parseInt(valStr, 10);
    const safeNum = isNaN(num) || num < 1 ? 1 : Math.min(num, 480);
    setCustomMinutes(safeNum);
    if (focusModeOption === 'custom') {
      localStorage.setItem('gyanquest_focus_mode_minutes', String(safeNum));
      notifyFocusModeChanged();
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('gyanquest_cached_chapters');
      showToast({
        title: 'Cache Cleared',
        message: 'Offline chapter cache has been emptied.',
        type: 'info',
      });
    } catch (_) {}
  };

  const handleResetDefaults = async () => {
    setAudioSpeed('1.0');
    setAutoplayAudio(false);
    setFocusModeOption('none');
    setCustomMinutes(25);

    localStorage.setItem('gyanquest_audio_speed', '1.0');
    localStorage.setItem('gyanquest_autoplay_audio', 'false');
    localStorage.setItem('gyanquest_focus_mode_minutes', 'none');
    localStorage.setItem('gyanquest_streak_alerts', 'true');

    // Immediately reset audio playback rate on DOM elements
    try {
      document.querySelectorAll('audio').forEach((el) => {
        try {
          el.playbackRate = 1.0;
          el.defaultPlaybackRate = 1.0;
        } catch (_) {}
      });
    } catch (_) {}

    window.dispatchEvent(new CustomEvent('gyanquest_audio_speed_applied', { detail: { speed: 1.0 } }));
    window.dispatchEvent(new CustomEvent('gyanquest_settings_applied', {
      detail: {
        audioSpeed: '1.0',
        autoplayAudio: false,
        focusModeMinutes: 'none',
        customMinutes: 25,
        streakAlerts: true,
      }
    }));
    notifyFocusModeChanged();

    if (user) {
      try {
        await updateSettings({
          audioSpeed: '1.0',
          autoplayAudio: false,
          focusModeMinutes: 'none',
          customMinutes: 25,
          streakAlerts: true,
        });
      } catch (_) {}
    }

    showToast({
      title: 'Defaults Restored',
      message: 'All settings have been reset to default values.',
      type: 'info',
    });
  };

  /**
   * Applies all settings, immediately updates any currently playing audio speed,
   * saves preferences in Firestore, and closes the modal.
   */
  const handleDone = async () => {
    const speedNum = parseFloat(audioSpeed) || 1.0;

    // 1. Immediately apply audio speed to all active <audio> elements in the DOM
    try {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((el) => {
        try {
          el.playbackRate = speedNum;
          el.defaultPlaybackRate = speedNum;
        } catch (err) {
          console.debug('Error adjusting audio playback rate on DOM element:', err);
        }
      });
    } catch (err) {
      console.debug('Error querying audio elements:', err);
    }

    // 2. Broadcast events for audio speed and full settings
    const effFocus = focusModeOption === 'custom' ? String(customMinutes) : focusModeOption;
    const currentSettingsPayload = {
      audioSpeed,
      autoplayAudio,
      focusModeMinutes: effFocus,
      customMinutes,
      theme: (isDark ? 'dark' : 'light') as 'light' | 'dark',
      streakAlerts: true, // Always on
    };

    try {
      window.dispatchEvent(new CustomEvent('gyanquest_audio_speed_applied', { detail: { speed: speedNum } }));
      window.dispatchEvent(new CustomEvent('gyanquest_settings_applied', { detail: currentSettingsPayload }));
      window.dispatchEvent(new Event('gyanquest_focus_mode_changed'));
    } catch (_) {}

    // 3. Save settings in Firestore and local storage
    if (user) {
      try {
        await updateSettings(currentSettingsPayload);
      } catch (err) {
        console.warn('Error saving settings to Firestore:', err);
      }
    }

    closeSettingsModal();
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDone();
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
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <SettingsIcon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                Settings
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Manage Focus Mode, narration audio, themes, and goals
              </p>
            </div>
          </div>

          <button
            id="settings-modal-close"
            type="button"
            onClick={handleDone}
            className="p-2 rounded-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            style={{ backgroundColor: 'var(--bg-icon)', color: 'var(--text-primary)' }}
            aria-label="Close settings modal and apply"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex border-b px-4 sm:px-6 gap-2 overflow-x-auto text-xs sm:text-sm font-semibold"
          style={{ borderColor: 'var(--border-warm)' }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'appearance'
                ? 'font-bold'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'appearance' ? 'var(--accent-saffron-text)' : 'var(--text-secondary)',
              borderColor: activeTab === 'appearance' ? 'var(--accent-saffron)' : 'transparent',
            }}
          >
            <Sun className="w-4 h-4" />
            <span>Theme & Narration</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('focus')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'focus'
                ? 'font-bold'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'focus' ? 'var(--accent-saffron-text)' : 'var(--text-secondary)',
              borderColor: activeTab === 'focus' ? 'var(--accent-saffron)' : 'transparent',
            }}
          >
            <Clock className="w-4 h-4" />
            <span>Focus Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'account'
                ? 'font-bold'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'account' ? 'var(--accent-saffron-text)' : 'var(--text-secondary)',
              borderColor: activeTab === 'account' ? 'var(--accent-saffron)' : 'transparent',
            }}
          >
            <User className="w-4 h-4" />
            <span>Profile & Account</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: Theme & Narration */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Preference */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  Visual Theme
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (isDark) toggleTheme();
                    }}
                    className={`flex flex-col gap-2 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      !isDark
                        ? 'ring-2 ring-amber-500 shadow-sm border-amber-500'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: !isDark ? 'var(--bg-main)' : 'var(--bg-card-subtle)',
                      borderColor: !isDark ? 'var(--accent-saffron)' : 'var(--border-warm)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>Surya (Light)</span>
                      </div>
                      {!isDark && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                      Warm parchment palette with saffron accents
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isDark) toggleTheme();
                    }}
                    className={`flex flex-col gap-2 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isDark
                        ? 'ring-2 ring-amber-500 shadow-sm border-amber-500'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: isDark ? 'var(--bg-main)' : 'var(--bg-card-subtle)',
                      borderColor: isDark ? 'var(--accent-saffron)' : 'var(--border-warm)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Moon className="w-4 h-4 text-amber-400" />
                        <span>Chandra (Dark)</span>
                      </div>
                      {isDark && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                      Restful bronze and charcoal tones for night study
                    </p>
                  </button>
                </div>
              </div>

              {/* Narration Playback Speed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Shravan Recitation Speed
                  </label>
                  <span className="text-xs font-bold" style={{ color: 'var(--accent-saffron-text)' }}>
                    {audioSpeed}x ({audioSpeed === '1.0' ? 'Normal' : audioSpeed === '0.75' ? 'Relaxed' : audioSpeed === '1.25' ? 'Focused' : 'Brisk'})
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { spd: '0.75', label: '0.75x', desc: 'Relaxed' },
                    { spd: '1.0', label: '1.0x', desc: 'Normal' },
                    { spd: '1.25', label: '1.25x', desc: 'Focused' },
                    { spd: '1.5', label: '1.5x', desc: 'Brisk' },
                  ].map((item) => (
                    <button
                      key={item.spd}
                      type="button"
                      onClick={() => handleSaveAudioSpeed(item.spd)}
                      className={`py-2.5 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                        audioSpeed === item.spd
                          ? 'ring-2 ring-amber-500 font-bold border-amber-500 shadow-xs'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: audioSpeed === item.spd ? 'var(--accent-saffron)' : 'var(--bg-card-subtle)',
                        borderColor: 'var(--border-warm)',
                        color: audioSpeed === item.spd ? '#FFFFFF' : 'var(--text-primary)',
                      }}
                    >
                      <span className="block text-xs sm:text-sm font-bold">{item.label}</span>
                      <span className="block text-[10px] opacity-80">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Autoplay Narration Toggle */}
              <div
                className="flex items-center justify-between p-4 rounded-2xl border transition-all"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <div className="flex items-start gap-3 pr-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'var(--bg-icon)' }}>
                    <Volume2 className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold block leading-tight" style={{ color: 'var(--text-primary)' }}>
                      Auto-play Shravan Narration
                    </span>
                    <span className="text-xs leading-relaxed block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Automatically begin voice playback when opening the Shravan audio stage
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleAutoplay}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                    autoplayAudio ? 'bg-amber-600 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                  }`}
                  aria-label="Toggle autoplay narration"
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Focus Mode */}
          {activeTab === 'focus' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Focus Mode Duration
                  </label>
                  <span className="text-xs font-bold" style={{ color: 'var(--accent-saffron-text)' }}>
                    {focusModeOption === 'none'
                      ? 'No time limit'
                      : focusModeOption === 'custom'
                      ? `${customMinutes} mins (Custom)`
                      : `${focusModeOption} mins`}
                  </span>
                </div>

                <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                  When your study duration elapses after signing in, an audible chime will sound, your screen will be blurred for <strong>mandatory 3 minutes</strong>, and ongoing learning activities will pause to ensure you rest your eyes and move.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3.5">
                  {[
                    { id: '15', label: '15 mins', sub: 'Quick Burst' },
                    { id: '30', label: '30 mins', sub: 'Standard Pace' },
                    { id: '45', label: '45 mins', sub: 'Deep Study' },
                    { id: '60', label: '60 mins', sub: 'Scholar Quest' },
                    { id: 'custom', label: 'Custom mins', sub: 'Specify Time' },
                    { id: 'none', label: 'No time limit', sub: 'Continuous' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleFocusOptionChange(item.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        focusModeOption === item.id
                          ? 'ring-2 ring-amber-500 font-bold border-amber-500 shadow-xs'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: focusModeOption === item.id ? 'var(--accent-saffron-light)' : 'var(--bg-card-subtle)',
                        borderColor: focusModeOption === item.id ? 'var(--accent-saffron)' : 'var(--border-warm)',
                        color: focusModeOption === item.id ? 'var(--accent-saffron-text)' : 'var(--text-primary)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold">{item.label}</span>
                        {focusModeOption === item.id && (
                          <Check className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        )}
                      </div>
                      <span className="text-[10px] block opacity-80 mt-0.5">{item.sub}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Minutes Input when 'custom' is selected */}
                {focusModeOption === 'custom' && (
                  <div
                    className="p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-warm)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                          Set Custom Minutes:
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          Between 1 and 480 minutes
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="480"
                        value={customMinutes}
                        onChange={(e) => handleCustomMinutesChange(e.target.value)}
                        className="w-20 px-3 py-1.5 rounded-xl border text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-warm)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                        mins
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Informational banner about the mandatory 5-min walk pause */}
              <div
                className="p-4 rounded-2xl border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <div className="flex items-center gap-2 font-bold text-xs" style={{ color: 'var(--accent-saffron-text)' }}>
                  <Footprints className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Mandatory 3-Minute Walking Pause & Screen Blur</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  When your timer ends, you will be required to take the full 3-minute break. Physical movement and resting your eyes from digital screens prevents cognitive fatigue and improves recall by up to 25%.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Profile & Account */}
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
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs"
                      style={{
                        backgroundColor: 'var(--accent-saffron-light)',
                        color: 'var(--accent-saffron-text)',
                      }}
                    >
                      {profile?.name?.slice(0, 2).toUpperCase() || 'GQ'}
                    </div>
                    <div>
                      <h4 className="font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
                        {profile?.name || 'Vedic Learner'}
                      </h4>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {user.email || 'Student Account'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      closeSettingsModal();
                      openProfileModal();
                    }}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-warm)',
                      color: 'var(--accent-saffron-text)',
                    }}
                  >
                    <span>Edit Name</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-warm)' }}>
                  <div className="flex items-center gap-2.5 p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-main)' }}>
                    <Zap className="w-4 h-4 text-amber-500 fill-current shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>Total XP</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--accent-saffron-text)' }}>
                        {profile?.xp || 0} XP
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-main)' }}>
                    <Flame className="w-4 h-4 text-amber-500 fill-current shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>Active Streak</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--accent-saffron-text)' }}>
                        {streak} Days
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Storage & Data management */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Browser Storage & Cache
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
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
                    <span>Restore Defaults</span>
                  </button>
                </div>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Clearing offline cache will not remove your completed chapters, XP, or streak records.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="p-4 sm:p-5 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border-warm)', backgroundColor: 'var(--bg-card)' }}
        >
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs font-semibold underline underline-offset-4 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            Reset to defaults
          </button>

          <button
            type="button"
            id="settings-done-btn"
            onClick={handleDone}
            className="px-6 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
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

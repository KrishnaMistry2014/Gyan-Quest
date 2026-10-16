import React, { useState } from 'react';
import { X, Sliders, User, Sun, Moon, Volume2, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    closeSettingsModal,
    openProfileModal,
    user,
    profile,
    signOutUser,
  } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'appearance' | 'account'>('appearance');
  const [narrationSpeed, setNarrationSpeed] = useState<string>(() => {
    try {
      return localStorage.getItem('gyanquest_audio_speed') || '1.0x';
    } catch {
      return '1.0x';
    }
  });

  if (!isSettingsModalOpen) return null;

  const handleSpeedChange = (speed: string) => {
    setNarrationSpeed(speed);
    try {
      localStorage.setItem('gyanquest_audio_speed', speed);
      window.dispatchEvent(new CustomEvent('gyanquest_settings_applied', { detail: { audioSpeed: speed } }));
    } catch (_) {}
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeSettingsModal}
    >
      <div
        className="w-full max-w-lg rounded-3xl border shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-warm)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-2xs"
              style={{
                backgroundColor: 'var(--accent-saffron-light)',
                borderColor: 'var(--border-warm)',
                color: 'var(--accent-saffron-text)',
              }}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 id="settings-modal-title" className="text-xl font-bold font-serif-heading" style={{ color: 'var(--text-primary)' }}>
                {t.navSettings}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Customize your appearance, narration, and account
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSettingsModal}
            className="w-8 h-8 rounded-xl border flex items-center justify-center transition-colors hover:opacity-80 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
            }}
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b px-6 pt-3 gap-6" style={{ borderColor: 'var(--border-warm)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'appearance' ? 'border-amber-600 dark:border-amber-400' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            style={{ color: activeTab === 'appearance' ? 'var(--accent-saffron-text)' : 'var(--text-primary)' }}
          >
            {t.tabAppearance || 'Appearance & Narration'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'account' ? 'border-amber-600 dark:border-amber-400' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            style={{ color: activeTab === 'account' ? 'var(--accent-saffron-text)' : 'var(--text-primary)' }}
          >
            {t.tabAccount || 'Profile & Account'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'appearance' ? (
            <div className="space-y-6">
              {/* Theme Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Appearance Theme</h4>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Switch between Surya (Light) and Chandra (Dark) mode</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:opacity-90 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-stone-700" />}
                  <span>{isDark ? 'Chandra (Dark)' : 'Surya (Light)'}</span>
                </button>
              </div>

              {/* Narration Speed */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Narration Speed</h4>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Adjust audio reader speed for shlokas and summaries</p>
                <div className="flex items-center gap-2">
                  {['0.75x', '1.0x', '1.25x', '1.5x'].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleSpeedChange(speed)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        narrationSpeed === speed ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: narrationSpeed === speed ? 'var(--accent-saffron-light)' : 'var(--bg-card-subtle)',
                        borderColor: narrationSpeed === speed ? 'var(--accent-saffron)' : 'var(--border-warm)',
                        color: narrationSpeed === speed ? 'var(--accent-saffron-text)' : 'var(--text-primary)',
                      }}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Account Info */}
              <div className="p-4 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-warm)' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-xs"
                    style={{
                      backgroundColor: 'var(--accent-saffron-light)',
                      color: 'var(--accent-saffron-text)',
                    }}
                  >
                    {profile?.name?.slice(0, 2).toUpperCase() || 'GQ'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {profile?.name || 'Vedic Scholar'}
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {user?.email || 'Guest Student Account'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeSettingsModal();
                      openProfileModal();
                    }}
                    className="flex-1 py-2 rounded-xl border text-xs font-bold transition-all hover:opacity-90 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent-saffron)',
                      borderColor: 'var(--accent-saffron)',
                      color: '#FFFFFF',
                    }}
                  >
                    Edit Profile & Name
                  </button>

                  {user && (
                    <button
                      type="button"
                      onClick={async () => {
                        closeSettingsModal();
                        await signOutUser();
                      }}
                      className="px-4 py-2 rounded-xl border text-xs font-bold transition-colors hover:bg-red-500/10 text-red-600 cursor-pointer"
                      style={{ borderColor: 'var(--border-warm)' }}
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border-warm)' }}
        >
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Gyan Quest Settings v1.0
          </span>
          <button
            type="button"
            onClick={closeSettingsModal}
            className="px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer text-white"
            style={{ backgroundColor: 'var(--accent-saffron)' }}
          >
            {t.done || 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

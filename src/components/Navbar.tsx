import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpenText,
  Home,
  BookOpen,
  Sparkles,
  Info,
  Sun,
  Moon,
  LogIn,
  Menu,
  X,
  Flame,
  LayoutDashboard,
  User as UserIcon,
  Settings,
  ChevronDown,
  LogOut,
  Layers,
  Zap
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'blank' | 'my-chapters' | 'shravan' | 'manan';
  onNavigateView: (view: 'landing' | 'dashboard' | 'blank' | 'my-chapters') => void;
  activeSection?: string;
  onNavigateSection?: (sectionId: string) => void;
  onOpenGuruModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateView,
  activeSection = 'home',
  onNavigateSection = (_id?: string) => {},
  onOpenGuruModal,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const {
    user,
    profile,
    isEmailUnverified,
    openAuthModal,
    openProfileModal,
    openSettingsModal,
    signOutUser,
    streak,
    isStreakActiveToday,
    openStreakModal,
  } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isUserActive = Boolean(user && !isEmailUnverified);

  const landingNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'journey', label: 'Learning', icon: BookOpen },
    { id: 'gamification', label: 'Quest System', icon: Sparkles },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleLandingItemClick = (id: string) => {
    onNavigateView('landing');
    onNavigateSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-3 sm:top-4 z-40 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all">
      <nav
        id="main-floating-navbar"
        aria-label="Main Navigation"
        className="w-full rounded-2xl border px-3 sm:px-5 py-2.5 sm:py-3 shadow-xs flex items-center justify-between transition-all backdrop-blur-md relative"
        style={{
          backgroundColor: 'var(--bg-nav)',
          borderColor: 'var(--border-warm)',
        }}
      >
        {isUserActive ? (
          /* ==========================================================
             LOGGED-IN NAVBAR
             ========================================================== */
          <>
            {/* Left Controls: Logo & Dashboard button */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Logo -> landing page */}
              <button
                id="logged-in-logo-btn"
                onClick={() => onNavigateView('landing')}
                className="flex items-center gap-2.5 group text-left focus:outline-none focus:ring-2 rounded-xl transition-all"
                style={{ outlineColor: 'var(--accent-saffron)' }}
                aria-label="Navigate to Landing Page"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs"
                  style={{
                    backgroundColor: 'var(--accent-saffron)',
                    color: '#FFFFFF',
                  }}
                >
                  <BookOpenText className="w-5 h-5" />
                </div>
                <div className="hidden xs:flex flex-col text-left">
                  <span
                    className="text-base sm:text-lg font-bold tracking-tight block leading-tight font-serif-heading"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    GYAN QUEST
                  </span>
                </div>
              </button>

              {/* Dashboard button -> dashboard */}
              <button
                id="nav-dashboard-btn"
                onClick={() => onNavigateView('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  currentView === 'dashboard' ? 'shadow-xs border' : 'hover:opacity-90'
                }`}
                style={{
                  backgroundColor: currentView === 'dashboard' ? 'var(--bg-card)' : 'transparent',
                  borderColor: currentView === 'dashboard' ? 'var(--border-warm)' : 'transparent',
                  color: currentView === 'dashboard' ? 'var(--accent-saffron-text)' : 'var(--text-primary)',
                }}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              {/* My Chapters button -> my-chapters */}
              <button
                id="nav-my-chapters-btn"
                onClick={() => onNavigateView('my-chapters')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  currentView === 'my-chapters' ? 'shadow-xs border' : 'hover:opacity-90'
                }`}
                style={{
                  backgroundColor: currentView === 'my-chapters' ? 'var(--bg-card)' : 'transparent',
                  borderColor: currentView === 'my-chapters' ? 'var(--border-warm)' : 'transparent',
                  color: currentView === 'my-chapters' ? 'var(--accent-saffron-text)' : 'var(--text-primary)',
                }}
              >
                <Layers className="w-4 h-4" />
                <span>My Chapters</span>
              </button>
            </div>

            {/* Empty space */}
            <div className="flex-1" />

            {/* Right Controls: Guru AI, Streak Counter, Theme Toggle, Profile Dropdown */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Guru AI Chatbot Button */}
              {onOpenGuruModal && (
                <button
                  type="button"
                  id="nav-guru-ai-btn"
                  onClick={onOpenGuruModal}
                  aria-label="Open Guru AI chat"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border shadow-2xs transition-all hover:scale-102 active:scale-98 cursor-pointer group"
                  style={{
                    backgroundColor: 'var(--accent-saffron)',
                    borderColor: 'var(--accent-saffron)',
                    color: '#FFFFFF',
                  }}
                  title="Ask Guru AI"
                >
                  <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
                  <span>Guru AI</span>
                </button>
              )}

              {/* XP Counter */}
              <div
                id="nav-xp-counter"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border shadow-2xs"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--accent-saffron-text)',
                }}
                title={`Your student XP balance: ${profile?.xp || 0} XP`}
              >
                <Zap className="w-4 h-4 fill-current text-amber-500" />
                <span>{profile?.xp || 0} XP</span>
              </div>

              {/* Streak Counter */}
              <button
                type="button"
                id="nav-streak-counter"
                onClick={openStreakModal}
                aria-label={`Current streak: ${streak} day(s).`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border shadow-2xs transition-all hover:scale-102 active:scale-98 cursor-pointer relative group"
                style={{
                  backgroundColor: 'var(--accent-saffron-light)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--accent-saffron-text)',
                }}
                title={`Current streak: ${streak} day(s) • Click for streak details`}
              >
                <Flame
                  className={`w-4 h-4 fill-current transition-transform group-hover:scale-110 ${
                    isStreakActiveToday ? 'text-amber-600 dark:text-amber-400' : 'text-amber-500 animate-pulse'
                  }`}
                />
                <span>{streak} Day Streak</span>
                {!isStreakActiveToday && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-stone-900 animate-ping"
                  />
                )}
                {!isStreakActiveToday && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-stone-900"
                  />
                )}
              </button>

              {/* Theme Toggle */}
              <button
                id="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-600" />
                )}
              </button>

              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  id="profile-dropdown-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all hover:opacity-90 shadow-2xs cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                  aria-label="Open profile menu"
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: 'var(--accent-saffron-light)',
                      color: 'var(--accent-saffron-text)',
                    }}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div
                    id="profile-dropdown-menu"
                    className="absolute right-0 mt-2 w-52 rounded-2xl border p-2 shadow-xl z-50 transition-all backdrop-blur-md"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-warm)',
                    }}
                  >
                    <button
                      type="button"
                      id="dropdown-settings-link"
                      onClick={() => {
                        setDropdownOpen(false);
                        openSettingsModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:bg-amber-500/10 text-left cursor-pointer group"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors group-hover:bg-amber-500/20"
                        style={{ backgroundColor: 'var(--bg-icon)' }}
                      >
                        <Settings className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 group-hover:rotate-45 transition-transform" />
                      </div>
                      <div className="flex-1">
                        <span className="block font-semibold">Settings</span>
                        <span className="block text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          Preferences & Audio
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="dropdown-profile-btn"
                      onClick={() => {
                        setDropdownOpen(false);
                        openProfileModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-left"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <UserIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                      <span>Profile</span>
                    </button>

                    <div className="my-1 border-t" style={{ borderColor: 'var(--border-warm)' }} />

                    <button
                      type="button"
                      id="dropdown-signout-btn"
                      onClick={async () => {
                        setDropdownOpen(false);
                        onNavigateView('landing');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        await signOutUser();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors hover:bg-red-500/10 text-red-600 dark:text-red-400 text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ==========================================================
             NON-LOGGED IN NAVBAR (Matching Vedic Gurukul Screenshot)
             ========================================================== */
          <>
            {/* Brand Logo & Name */}
            <button
              onClick={() => handleLandingItemClick('home')}
              className="flex items-center gap-2.5 sm:gap-3 group text-left focus:outline-none focus:ring-2 rounded-xl"
              style={{ outlineColor: 'var(--accent-saffron)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <BookOpenText className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span
                  className="text-lg sm:text-xl font-bold tracking-tight block leading-tight font-serif-heading"
                  style={{ color: 'var(--text-primary)' }}
                >
                  GYAN QUEST
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                {landingNavItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-link-${item.id}`}
                      onClick={() => handleLandingItemClick(item.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        isActive ? 'shadow-2xs' : 'hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                        color: isActive ? 'var(--accent-saffron-text)' : 'var(--text-secondary)',
                        border: isActive ? '1px solid var(--border-warm)' : '1px solid transparent',
                      }}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Controls: Theme Toggle & Sign In */}
              <div className="flex items-center gap-2.5">
                <button
                  id="theme-toggle-btn"
                  onClick={toggleTheme}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-stone-600" />
                  )}
                </button>

                <button
                  id="nav-signin-btn"
                  onClick={openAuthModal}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs hover:opacity-95 active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-saffron)',
                    color: '#FFFFFF',
                  }}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </div>
            </div>

            {/* Mobile controls for non-logged in */}
            <div className="flex md:hidden items-center gap-2">
              <button
                id="theme-toggle-mobile-btn"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
              </button>

              <button
                id="nav-signin-mobile-btn"
                onClick={openAuthModal}
                className="px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--accent-saffron)' }}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                id="mobile-menu-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="w-9 h-9 rounded-xl flex items-center justify-center border transition-colors"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </>
        )}
      </nav>

      {/* Mobile Drawer for non-logged in */}
      {!isUserActive && mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="md:hidden mt-2 p-3 rounded-2xl border shadow-lg space-y-1 transition-all backdrop-blur-md"
          style={{
            backgroundColor: 'var(--bg-nav)',
            borderColor: 'var(--border-warm)',
          }}
        >
          {landingNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleLandingItemClick(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
                style={{
                  backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                  color: isActive ? 'var(--accent-saffron-text)' : 'var(--text-primary)',
                  border: isActive ? '1px solid var(--border-warm)' : '1px solid transparent',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: isActive ? 'var(--accent-saffron-light)' : 'var(--bg-icon)',
                    color: isActive ? 'var(--accent-saffron-text)' : 'var(--text-secondary)',
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

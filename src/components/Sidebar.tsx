import React, { useState, useEffect } from 'react';
import {
  BookOpenText,
  Home,
  BookOpen,
  Scroll,
  Sparkles,
  Clock,
  Flame,
  ShoppingBag,
  User as UserIcon,
  Info,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  Zap,
  X,
  Sliders,
  Volume2,
  Puzzle,
  Settings,
  UploadCloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export type AppView =
  | 'landing'
  | 'dashboard'
  | 'vidya'
  | 'my-chapters'
  | 'shravan'
  | 'manan'
  | 'pariksha'
  | 'bhagavad-gita'
  | 'focus-mode'
  | 'store';

interface SidebarProps {
  currentView: AppView;
  onNavigateView: (view: AppView) => void;
  activeSection?: string;
  onNavigateSection?: (sectionId: string) => void;
  onOpenGuruModal: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigateView,
  activeSection = 'home',
  onNavigateSection = (_sectionId?: string) => {},
  onOpenGuruModal,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { language, t } = useLanguage();
  const {
    user,
    profile,
    isEmailUnverified,
    openAuthModal,
    openProfileModal,
    openSettingsModal,
    openStreakModal,
    signOutUser,
    streak,
    isStreakActiveToday,
    isProfileModalOpen,
    isStreakModalOpen,
    isSettingsModalOpen,
  } = useAuth();

  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, setIsMobileOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const isUserActive = Boolean(user && !isEmailUnverified);

  // Determine active item based on currentView and active modal/section state
  const isHomeActive =
    (currentView === 'landing' && (activeSection === 'home' || !activeSection)) ||
    currentView === 'dashboard';

  const isMyBooksActive =
    currentView === 'my-chapters' ||
    currentView === 'vidya' ||
    currentView === 'shravan' ||
    currentView === 'manan' ||
    currentView === 'pariksha';

  const isGitaActive = currentView === 'bhagavad-gita';
  const isFocusActive = currentView === 'focus-mode';
  const isStoreActive = currentView === 'store';
  const isAboutActive = currentView === 'landing' && activeSection === 'about';
  const isStreakActive = isStreakModalOpen;
  const isProfileActive = isProfileModalOpen;
  const isThemeActive = isSettingsModalOpen;

  // Navigation handlers
  const handleItemClick = (id: string) => {
    // Automatically close mobile drawer
    setIsMobileOpen(false);

    if (!user && id !== 'home' && id !== 'about') {
      openAuthModal();
      return;
    }

    switch (id) {
      case 'home':
        if (isUserActive) {
          onNavigateView('dashboard');
        } else {
          onNavigateView('landing');
          onNavigateSection('home');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case 'my-books':
        if (!user) {
          openAuthModal();
        } else {
          onNavigateView('my-chapters');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        break;

      case 'my-chapters':
        if (!user) {
          openAuthModal();
        } else {
          onNavigateView('my-chapters');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        break;

      case 'upload-pdf':
        onNavigateView('vidya');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case 'guru-ai':
        onOpenGuruModal();
        break;

      case 'bhagavad-gita':
        onNavigateView('bhagavad-gita');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case 'focus-mode':
        onNavigateView('focus-mode');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case 'streaks':
        openStreakModal();
        break;

      case 'store':
        if (!user) {
          openAuthModal();
        } else {
          onNavigateView('store');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        break;

      case 'profile':
        if (!user) {
          openAuthModal();
        } else {
          openProfileModal();
        }
        break;

      case 'about':
        if (currentView !== 'landing') {
          onNavigateView('landing');
          setTimeout(() => onNavigateSection('about'), 100);
        } else {
          onNavigateSection('about');
        }
        break;

      case 'theme-narration':
      case 'settings':
        openSettingsModal();
        break;

      default:
        break;
    }
  };

  // Nav item renderer
  const renderNavItem = (
    id: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    isActive: boolean,
    badge?: React.ReactNode,
    quickAction?: React.ReactNode
  ) => {
    return (
      <div
        key={id}
        className={`relative group w-full flex items-center rounded-xl transition-all font-semibold text-xs sm:text-sm select-none ${
          isCollapsed
            ? 'justify-center p-2.5'
            : 'justify-between px-3.5 py-2.5 gap-3'
        } ${
          isActive
            ? 'shadow-2xs border font-bold'
            : 'hover:bg-amber-500/10'
        }`}
        style={{
          backgroundColor: isActive
            ? 'var(--accent-saffron-light)'
            : 'transparent',
          borderColor: isActive
            ? 'var(--accent-saffron)'
            : 'transparent',
          color: isActive
            ? 'var(--accent-saffron-text)'
            : 'var(--text-primary)',
        }}
        onMouseEnter={() => setHoveredItemId(id)}
        onMouseLeave={() => setHoveredItemId(null)}
      >
        <button
          type="button"
          id={`sidebar-item-${id}`}
          onClick={() => handleItemClick(id)}
          aria-current={isActive ? 'page' : undefined}
          aria-label={label}
          className={`flex items-center min-w-0 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded-lg active:scale-98 transition-transform ${
            isCollapsed ? 'justify-center w-full' : 'gap-3 flex-1'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isActive
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-stone-600 dark:text-stone-300 group-hover:text-amber-600'
            }`}
            style={{
              backgroundColor: isActive ? 'var(--bg-main)' : 'var(--bg-icon)',
            }}
          >
            <Icon className="w-4 h-4" />
          </div>

          {!isCollapsed && (
            <span className="truncate leading-tight block">
              {label}
            </span>
          )}
        </button>

        {!isCollapsed && (badge || quickAction) && (
          <div className="flex items-center gap-1.5 shrink-0">
            {badge}
            {quickAction}
          </div>
        )}

        {/* Floating Tooltip in Collapsed Desktop Mode */}
        {isCollapsed && hoveredItemId === id && (
          <div
            role="tooltip"
            className="hidden lg:flex fixed left-20 z-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg border pointer-events-none whitespace-nowrap animate-in fade-in duration-150 items-center gap-1.5"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
              color: 'var(--text-primary)',
              transform: 'translateY(-2px)',
            }}
          >
            <span>{label}</span>
            {badge}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* 1. Header with Logo & Brand Name & Collapse Toggle */}
      <div
        className={`flex items-center border-b transition-all ${
          isCollapsed
            ? 'justify-center p-3.5'
            : 'justify-between px-4 py-4'
        }`}
        style={{ borderColor: 'var(--border-warm)' }}
      >
        {/* Brand Logo & Name */}
        <button
          type="button"
          onClick={() => handleItemClick('home')}
          className="flex items-center gap-3 text-left focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl group cursor-pointer"
          aria-label="Gyan Quest Home"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-xs"
            style={{
              backgroundColor: 'var(--accent-saffron)',
              color: '#FFFFFF',
            }}
          >
            <BookOpenText className="w-5 h-5" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col">
              <span
                className="text-base font-bold tracking-tight leading-tight font-serif-heading"
                style={{ color: 'var(--text-primary)' }}
              >
                GYAN QUEST
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Vedic Learning Quest
              </span>
            </div>
          )}
        </button>

        {/* Desktop Collapse Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg border transition-all hover:opacity-80 active:scale-95 cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-card-subtle)',
            borderColor: 'var(--border-warm)',
            color: 'var(--text-primary)',
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg border transition-colors cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-card-subtle)',
            borderColor: 'var(--border-warm)',
            color: 'var(--text-primary)',
          }}
          aria-label="Close navigation drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Scrollable Navigation Menu Items */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
        {renderNavItem('home', t.navHome, Home, isHomeActive)}
        {renderNavItem('bhagavad-gita', t.navLearnScriptures, Scroll, isGitaActive)}
        {renderNavItem(
          'guru-ai',
          t.navGuruAi,
          Sparkles,
          false,
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
            style={{
              backgroundColor: 'var(--accent-saffron)',
              color: '#FFFFFF',
            }}
          >
            AI
          </span>
        )}
        {renderNavItem('focus-mode', t.navFocusMode, Clock, isFocusActive)}
        {renderNavItem(
          'my-books',
          t.navMyBooks,
          BookOpen,
          isMyBooksActive
        )}
        {renderNavItem(
          'streaks',
          t.navStreaks,
          Flame,
          isStreakActive,
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums flex items-center gap-0.5"
            style={{
              backgroundColor: 'var(--accent-saffron-light)',
              color: 'var(--accent-saffron-text)',
            }}
          >
            <Flame className="w-3 h-3 text-amber-500 fill-current" />
            <span>{streak}d</span>
          </span>
        )}
        {renderNavItem('settings', t.navSettings, Settings, isSettingsModalOpen)}
        {renderNavItem('about', t.navAbout, Info, isAboutActive)}
      </div>

      {/* 3. Account / Status Footer */}
      <div
        className="p-3 border-t transition-all mt-auto"
        style={{
          borderColor: 'var(--border-warm)',
          backgroundColor: 'var(--bg-card-subtle)',
        }}
      >
        {isUserActive ? (
          <div className="space-y-2">
            {/* User Profile Card */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-2.5'}`}>
              <button
                type="button"
                onClick={() => handleItemClick('profile')}
                className="flex items-center gap-2.5 text-left truncate flex-1 hover:opacity-90 cursor-pointer"
                title="Open Profile"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs"
                  style={{
                    backgroundColor: 'var(--accent-saffron-light)',
                    color: 'var(--accent-saffron-text)',
                  }}
                >
                  {profile?.name?.slice(0, 2).toUpperCase() || 'GQ'}
                </div>

                {!isCollapsed && (
                  <div className="truncate flex-1 min-w-0">
                    <span className="block text-xs font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                      {profile?.name || 'Vedic Learner'}
                    </span>
                    <span className="block text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {user?.email || 'Student Account'}
                    </span>
                  </div>
                )}
              </button>

              {!isCollapsed && (
                <button
                  type="button"
                  onClick={async () => {
                    onNavigateView('landing');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    await signOutUser();
                  }}
                  className="p-1.5 rounded-lg border transition-colors hover:bg-red-500/10 text-stone-500 hover:text-red-600 cursor-pointer shrink-0"
                  style={{ borderColor: 'var(--border-warm)' }}
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* XP & Streak Pills in Expanded Mode */}
            {!isCollapsed && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-bold font-mono tabular-nums"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--accent-saffron-text)',
                  }}
                  title={`Your XP: ${profile?.xp || 0}`}
                >
                  <Zap className="w-3 h-3 text-amber-500 fill-current shrink-0" />
                  <span className="truncate">{profile?.xp || 0} XP</span>
                </div>

                <button
                  type="button"
                  onClick={openStreakModal}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-bold font-mono tabular-nums hover:opacity-90 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--accent-saffron-text)',
                  }}
                  title="View Streak Details"
                >
                  <Flame className="w-3 h-3 text-amber-500 fill-current shrink-0" />
                  <span className="truncate">{streak}d Streak</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Non-logged in Call-to-action */
          <div className="space-y-2">
            <button
              type="button"
              id="sidebar-signin-btn"
              onClick={openAuthModal}
              className={`w-full flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all shadow-xs hover:opacity-95 active:scale-98 cursor-pointer ${
                isCollapsed ? 'p-2' : 'px-3 py-2.5'
              }`}
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
              title="Sign In to Gyan Quest"
              aria-label="Sign In to Gyan Quest"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Sign In</span>}
            </button>

            {!isCollapsed && (
              <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                Sign in to save books & track streaks
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ==========================================================
          1. PERSISTENT DESKTOP SIDEBAR
          ========================================================== */}
      <aside
        id="gyanquest-desktop-sidebar"
        aria-label="Main Navigation Sidebar"
        className={`hidden lg:flex flex-col sticky top-0 h-screen shrink-0 border-r z-30 transition-[width] duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64 xl:w-72'
        }`}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* ==========================================================
          2. MOBILE SLIDE-OUT DRAWER
          ========================================================== */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            id="mobile-sidebar-backdrop"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <aside
            id="gyanquest-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Drawer"
            className="relative w-72 max-w-[85vw] h-full shadow-2xl z-50 flex flex-col border-r animate-in slide-in-from-left duration-250 ease-out"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-warm)',
            }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { Sidebar, AppView } from './components/Sidebar';
import { Hero } from './components/Hero';
import { LearningJourney } from './components/LearningJourney';
import { GamificationSection } from './components/GamificationSection';
import { CustomMaterialSection } from './components/CustomMaterialSection';
import { GuruSection } from './components/GuruSection';
import { FocusModeSection } from './components/FocusModeSection';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { StartLearningModal } from './components/StartLearningModal';
import { FocusBreakOverlay } from './components/FocusBreakOverlay';
import { ProfileModal } from './components/ProfileModal';
import { StreakModal } from './components/StreakModal';
import { GuruModal } from './components/GuruModal';
import { SettingsModal } from './components/SettingsModal';
import { Dashboard } from './components/Dashboard';
import { VerificationScreen } from './components/VerificationScreen';
import { VidyaPage } from './components/VidyaPage';
import { MyChapters } from './components/MyChapters';
import { ShravanPage } from './components/ShravanPage';
import { MananPage } from './components/MananPage';
import { ParikshaView } from './components/ParikshaView';
import { StoreView } from './components/StoreView';
import { FocusModeView } from './components/FocusModeView';
import { SavedChapter } from './lib/chapters';
import { SCRIPTURES } from './lib/scriptureData';
import { Menu, BookOpenText, Sun, Moon, Flame, Zap } from 'lucide-react';

const RAMAYANA_CHAPTER: SavedChapter = SCRIPTURES.ramayana;
const GITA_CHAPTER: SavedChapter = SCRIPTURES.gita;
const MAHABHARATA_CHAPTER: SavedChapter = SCRIPTURES.mahabharata;

const pathToView = (path: string): AppView => {
  const cleanPath = path.replace(/\/$/, '');
  switch (cleanPath) {
    case '/dashboard': return 'dashboard';
    case '/my-chapters': return 'my-chapters';
    case '/focus-mode': return 'focus-mode';
    case '/store': return 'store';
    case '/vidya': return 'vidya';
    case '/shravan': return 'shravan';
    case '/manan': return 'manan';
    case '/pariksha': return 'pariksha';
    default: return 'landing';
  }
};

const viewToPath = (view: AppView): string => {
  switch (view) {
    case 'dashboard': return '/dashboard';
    case 'my-chapters': return '/my-chapters';
    case 'focus-mode': return '/focus-mode';
    case 'store': return '/store';
    case 'vidya': return '/vidya';
    case 'shravan': return '/shravan';
    case 'manan': return '/manan';
    case 'pariksha': return '/pariksha';
    default: return '/';
  }
};

const MainAppContent: React.FC = () => {
  const { openAuthModal, user, isEmailUnverified, loading, streak, openStreakModal, profile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState<AppView>(() => pathToView(window.location.pathname));

  // Sync currentView with browser URL history
  useEffect(() => {
    const targetPath = viewToPath(currentView);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, [currentView]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(pathToView(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<SavedChapter | null>(null);
  const [activeShravanChapter, setActiveShravanChapter] = useState<SavedChapter | null>(null);
  const [activeMananChapter, setActiveMananChapter] = useState<SavedChapter | null>(null);
  const [activeParikshaChapter, setActiveParikshaChapter] = useState<SavedChapter | null>(null);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isGuruModalOpen, setIsGuruModalOpen] = useState<boolean>(false);
  const [isStartLearningModalOpen, setIsStartLearningModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gyanquest_sidebar_collapsed') === 'true';
    } catch (_) {
      return false;
    }
  });

  const handleSetSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    try {
      localStorage.setItem('gyanquest_sidebar_collapsed', String(collapsed));
    } catch (_) {}
  };

  const prevUserRef = useRef(user);

  // When user logs in and is verified, automatically navigate to dashboard if on landing
  // When user signs out, immediately redirect back to landing page and clear active session states
  useEffect(() => {
    if (loading) return;
    if (user && !isEmailUnverified) {
      setCurrentView((prev) => (prev === 'landing' ? 'dashboard' : prev));
    } else if (prevUserRef.current && !user) {
      setIsGuruModalOpen(false);
      setCurrentView('landing');
      setSelectedChapter(null);
      setActiveShravanChapter(null);
      setActiveMananChapter(null);
      setActiveParikshaChapter(null);
      setUploadedPdf(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevUserRef.current = user;
  }, [user, isEmailUnverified, loading]);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scrollspy to highlight navigation items when on landing page
  useEffect(() => {
    if (currentView !== 'landing') return;

    const handleScroll = () => {
      const sections = ['home', 'journey', 'gamification', 'custom-material', 'guru', 'focus-mode', 'about'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section === 'custom-material' || section === 'guru' ? 'journey' : section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const handleStartQuest = () => {
    if (!user) {
      openAuthModal();
    } else {
      setCurrentView('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleResumeLearning = () => {
    // Resume learning leads to My Chapters
    setCurrentView('my-chapters');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartLearning = () => {
    // Start learning opens the modal with options for Bhagavad Gita, Ramayana, and Custom PDF
    setIsStartLearningModalOpen(true);
  };

  const handlePdfUploaded = (file: File) => {
    setSelectedChapter(null);
    setUploadedPdf(file);
    setCurrentView('vidya');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChapter = (chapter: SavedChapter) => {
    setSelectedChapter(chapter);
    setUploadedPdf(null);
    setCurrentView('vidya');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigatePariksha = (chapter?: SavedChapter | null) => {
    if (chapter) {
      setSelectedChapter(chapter);
      setActiveParikshaChapter(chapter);
    }
    setCurrentView('pariksha');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative selection:bg-orange-500 selection:text-white bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Modern, Persistent & Collapsible Sidebar (Replaces former floating Navbar) */}
      <Sidebar
        currentView={currentView}
        onNavigateView={(view) => {
          if (view === 'bhagavad-gita') {
            setIsStartLearningModalOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        activeSection={activeSection}
        onNavigateSection={scrollToSection}
        onOpenGuruModal={() => setIsGuruModalOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={handleSetSidebarCollapsed}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative overflow-x-hidden">
        {/* Mobile Top Header (< lg screens) */}
        <header
          id="mobile-top-header"
          className="lg:hidden sticky top-0 z-20 w-full border-b px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between backdrop-blur-md transition-colors"
          style={{
            backgroundColor: 'var(--bg-nav)',
            borderColor: 'var(--border-warm)',
          }}
        >
          {/* Left: Mobile Drawer Hamburger Toggle & GyanQuest Brand */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="mobile-menu-trigger-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation sidebar"
              className="p-2 rounded-xl border transition-colors cursor-pointer hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (user && !isEmailUnverified) {
                  setCurrentView('dashboard');
                } else {
                  setCurrentView('landing');
                  scrollToSection('home');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 group cursor-pointer text-left"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-xs"
                style={{
                  backgroundColor: 'var(--accent-saffron)',
                  color: '#FFFFFF',
                }}
              >
                <BookOpenText className="w-4 h-4" />
              </div>
              <span className="text-base font-bold font-serif-heading tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
                GYAN QUEST
              </span>
            </button>
          </div>

          {/* Right: Quick Streak/XP Pill, Theme Toggle, Auth CTA */}
          <div className="flex items-center gap-2">
            {user && !isEmailUnverified ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={openStreakModal}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold font-mono tabular-nums shadow-2xs hover:opacity-90 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-saffron-light)',
                    borderColor: 'var(--border-warm)',
                    color: 'var(--accent-saffron-text)',
                  }}
                  title={`Current streak: ${streak} day(s)`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  <span>{streak}d</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-2xs cursor-pointer hover:opacity-95"
                style={{ backgroundColor: 'var(--accent-saffron)' }}
              >
                Sign In
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all hover:opacity-90 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>
          </div>
        </header>

        {/* Main App Content */}
        <main className="flex-1 w-full">
          {/* If user is logged in with email/password and unverified, gate dashboard behind verification screen */}
          {user && isEmailUnverified ? (
            <VerificationScreen />
          ) : currentView === 'vidya' ? (
            /* Vidya Page loaded on PDF Upload or opening a chapter */
            <VidyaPage
              uploadedFile={uploadedPdf}
              selectedChapter={selectedChapter}
              onNavigateHome={() => {
                setCurrentView('landing');
                setTimeout(() => scrollToSection('journey'), 50);
              }}
              onNavigateDashboard={() => {
                if (!user) {
                  setCurrentView('landing');
                } else {
                  setCurrentView('dashboard');
                }
              }}
              onNavigateMyChapters={() => {
                if (!user) {
                  openAuthModal();
                } else {
                  setCurrentView('my-chapters');
                }
              }}
              onNavigateShravan={(ch) => {
                setSelectedChapter(ch);
                setActiveShravanChapter(ch);
                setCurrentView('shravan');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateManan={(ch) => {
                setSelectedChapter(ch);
                setActiveShravanChapter(ch);
                setActiveMananChapter(ch);
                setCurrentView('manan');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onPdfUpload={handlePdfUploaded}
              onClearUploadedPdf={() => setUploadedPdf(null)}
            />
          ) : currentView === 'shravan' && activeShravanChapter ? (
            /* Shravan Audio Narration View */
            <ShravanPage
              chapter={activeShravanChapter}
              onBackToVidya={() => {
                setCurrentView('vidya');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateDashboard={() => {
                if (!user) {
                  setCurrentView('landing');
                } else {
                  setCurrentView('dashboard');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateManan={(ch) => {
                setSelectedChapter(ch);
                setActiveShravanChapter(ch);
                setActiveMananChapter(ch);
                setCurrentView('manan');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : currentView === 'manan' && (activeMananChapter || activeShravanChapter || selectedChapter) ? (
            /* Manan Reflection Jigsaw Puzzle View */
            <MananPage
              chapter={(activeMananChapter || activeShravanChapter || selectedChapter)!}
              onBackToShravan={() => {
                setCurrentView('shravan');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBackToVidya={() => {
                setCurrentView('vidya');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateDashboard={() => {
                if (!user) {
                  setCurrentView('landing');
                } else {
                  setCurrentView('dashboard');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateMyChapters={() => {
                if (!user) {
                  openAuthModal();
                } else {
                  setCurrentView('my-chapters');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onNavigatePariksha={handleNavigatePariksha}
            />
          ) : currentView === 'pariksha' ? (
            /* Stage 04: Pariksha Crossword Examination View */
            <ParikshaView
              chapter={activeParikshaChapter || activeMananChapter || activeShravanChapter || selectedChapter}
              onNavigateHome={() => {
                if (user) {
                  setCurrentView('dashboard');
                } else {
                  setCurrentView('landing');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateDashboard={() => {
                if (!user) {
                  setCurrentView('landing');
                } else {
                  setCurrentView('dashboard');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateMyChapters={() => {
                if (!user) {
                  openAuthModal();
                } else {
                  setCurrentView('my-chapters');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onNavigateVidya={(ch) => {
                setSelectedChapter(ch);
                setCurrentView('vidya');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateManan={(ch) => {
                setSelectedChapter(ch);
                setActiveMananChapter(ch);
                setCurrentView('manan');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onPdfUpload={handlePdfUploaded}
            />
          ) : currentView === 'my-chapters' && user ? (
            /* My Chapters Library View */
            <MyChapters
              onOpenChapter={handleOpenChapter}
              onUploadPdf={handlePdfUploaded}
              onNavigateDashboard={() => setCurrentView('dashboard')}
              onNavigateHome={() => setCurrentView('landing')}
              onNavigatePariksha={handleNavigatePariksha}
            />
          ) : currentView === 'dashboard' && user ? (
            /* Dashboard View - Only accessible when authenticated */
            <Dashboard
              onResumeLearning={handleResumeLearning}
              onStartLearning={handleStartLearning}
              onPdfUpload={handlePdfUploaded}
              onNavigatePariksha={() => handleNavigatePariksha(selectedChapter)}
            />

          ) : currentView === 'focus-mode' ? (
            /* Focus Mode Dedicated Dashboard View */
            <FocusModeView
              onNavigateMyBooks={() => {
                if (user) {
                  setCurrentView('my-chapters');
                } else {
                  openAuthModal();
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : currentView === 'store' ? (
            /* Gyan Quest Scholar Store View */
            <StoreView
              onNavigateMyBooks={() => {
                if (user) {
                  setCurrentView('my-chapters');
                } else {
                  openAuthModal();
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateDashboard={() => {
                if (user) {
                  setCurrentView('dashboard');
                } else {
                  setCurrentView('landing');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            /* Landing Page View */
            <div className="space-y-4 sm:space-y-8">
              <Hero
                onStartQuest={handleStartQuest}
                onExplore={() => scrollToSection('card-upload-textbooks')}
                onPdfUpload={handlePdfUploaded}
              />

              <LearningJourney
                onNavigatePariksha={() => handleNavigatePariksha(selectedChapter)}
                onStartLearning={handleStartLearning}
              />

              <CustomMaterialSection 
                onPdfUpload={handlePdfUploaded} 
                onStartLearning={handleStartLearning}
              />
            </div>
          )}
        </main>

        {/* Footer (hidden on vidya and pariksha exam views) */}
        {currentView !== 'vidya' && currentView !== 'pariksha' && (
          <Footer onNavigate={(id) => {
            setCurrentView('landing');
            setTimeout(() => scrollToSection(id), 50);
          }} />
        )}
      </div>

      {/* Firebase Authentication Modal */}
      <AuthModal />

      {/* Start Learning Modal (Bhagavad Gita & Ramayana Options) */}
      <StartLearningModal
        isOpen={isStartLearningModalOpen}
        onClose={() => setIsStartLearningModalOpen(false)}
        onSelectGita={() => {
          setSelectedChapter(GITA_CHAPTER);
          setUploadedPdf(null);
          setCurrentView('vidya');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectRamayana={() => {
          setSelectedChapter(RAMAYANA_CHAPTER);
          setUploadedPdf(null);
          setCurrentView('vidya');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectMahabharata={() => {
          setSelectedChapter(MAHABHARATA_CHAPTER);
          setUploadedPdf(null);
          setCurrentView('vidya');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onUploadCustomPdf={() => {
          setSelectedChapter(null);
          setUploadedPdf(null);
          setCurrentView('vidya');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Focus Mode 3-min Walking Break Blur Overlay */}
      <FocusBreakOverlay />

      {/* Profile Modal (Contains name textbox and Submit button, saving to Firestore) */}
      <ProfileModal />

      {/* Settings Modal */}
      <SettingsModal />

      {/* Guru AI Chatbot Modal */}
      <GuruModal
        isOpen={isGuruModalOpen}
        onClose={() => setIsGuruModalOpen(false)}
      />

      {/* Interactive Streak Modal */}
      <StreakModal
        onStartLearning={() => {
          if (user) {
            setCurrentView('my-chapters');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <MainAppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

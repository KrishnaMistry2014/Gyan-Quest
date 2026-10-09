import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { LearningJourney } from './components/LearningJourney';
import { GamificationSection } from './components/GamificationSection';
import { CustomMaterialSection } from './components/CustomMaterialSection';
import { GuruSection } from './components/GuruSection';
import { FocusModeSection } from './components/FocusModeSection';
import { AboutSection } from './components/AboutSection';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { FocusBreakOverlay } from './components/FocusBreakOverlay';
import { ProfileModal } from './components/ProfileModal';
import { StreakModal } from './components/StreakModal';
import { GuruModal } from './components/GuruModal';
import { Dashboard } from './components/Dashboard';
import { VerificationScreen } from './components/VerificationScreen';
import { BlankPage } from './components/BlankPage';
import { MyChapters } from './components/MyChapters';
import { ShravanPage } from './components/ShravanPage';
import { SavedChapter } from './lib/chapters';

const MainAppContent: React.FC = () => {
  const { openAuthModal, user, isEmailUnverified, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'blank' | 'my-chapters' | 'shravan'>('landing');
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<SavedChapter | null>(null);
  const [activeShravanChapter, setActiveShravanChapter] = useState<SavedChapter | null>(null);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isGuruModalOpen, setIsGuruModalOpen] = useState<boolean>(false);

  // When user logs in and is verified, automatically navigate to dashboard if on landing
  // When user signs out, immediately redirect back to landing page and clear active session states
  useEffect(() => {
    if (loading) return;
    if (user && !isEmailUnverified) {
      setCurrentView((prev) => (prev === 'landing' ? 'dashboard' : prev));
    } else if (!user) {
      setIsGuruModalOpen(false);
      setCurrentView('landing');
      setSelectedChapter(null);
      setActiveShravanChapter(null);
      setUploadedPdf(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    // Resume learning leads to My Chapters (for now)
    setCurrentView('my-chapters');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartLearning = () => {
    // Start learning must not redirect to anywhere - stays on current dashboard
    const uploadEl = document.getElementById('card-upload-textbooks');
    if (uploadEl) {
      uploadEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePdfUploaded = (file: File) => {
    setSelectedChapter(null);
    setUploadedPdf(file);
    setCurrentView('blank');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChapter = (chapter: SavedChapter) => {
    setSelectedChapter(chapter);
    setUploadedPdf(null);
    setCurrentView('blank');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-orange-500 selection:text-white">
      {/* Floating Navigation (adapts to Logged-in vs Non-logged-in) */}
      <Navbar
        currentView={currentView}
        onNavigateView={(view) => setCurrentView(view)}
        activeSection={activeSection}
        onNavigateSection={scrollToSection}
        onOpenGuruModal={user ? () => setIsGuruModalOpen(true) : undefined}
      />

      {/* Main App Content */}
      <main className="flex-1 w-full">
        {/* If user is logged in with email/password and unverified, gate dashboard behind verification screen */}
        {user && isEmailUnverified ? (
          <VerificationScreen />
        ) : currentView === 'blank' ? (
          /* Blank Page loaded on PDF Upload or opening a chapter */
          <BlankPage
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
            onPdfUpload={handlePdfUploaded}
            onClearUploadedPdf={() => setUploadedPdf(null)}
          />
        ) : currentView === 'shravan' && activeShravanChapter ? (
          /* Shravan Audio Narration View */
          <ShravanPage
            chapter={activeShravanChapter}
            onBackToVidya={() => {
              setCurrentView('blank');
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
          />
        ) : currentView === 'my-chapters' && user ? (
          /* My Chapters Library View */
          <MyChapters
            onOpenChapter={handleOpenChapter}
            onUploadPdf={handlePdfUploaded}
            onNavigateDashboard={() => setCurrentView('dashboard')}
            onNavigateHome={() => setCurrentView('landing')}
          />
        ) : currentView === 'dashboard' && user ? (
          /* Dashboard View - Only accessible when authenticated */
          <Dashboard
            onResumeLearning={handleResumeLearning}
            onStartLearning={handleStartLearning}
            onPdfUpload={handlePdfUploaded}
          />
        ) : (
          /* Landing Page View */
          <div className="space-y-4 sm:space-y-8">
            <Hero
              onStartQuest={handleStartQuest}
              onExplore={() => scrollToSection('journey')}
              onPdfUpload={handlePdfUploaded}
            />

            <LearningJourney />

            <GamificationSection />

            <CustomMaterialSection onPdfUpload={handlePdfUploaded} />

            <GuruSection />

            <FocusModeSection />

            <AboutSection />

            <FinalCTA onStartQuest={handleStartQuest} />
          </div>
        )}
      </main>

      {/* Footer (hidden on blank page view so page is blank below navbar) */}
      {currentView !== 'blank' && (
        <Footer onNavigate={(id) => {
          setCurrentView('landing');
          setTimeout(() => scrollToSection(id), 50);
        }} />
      )}

      {/* Firebase Authentication Modal */}
      <AuthModal />

      {/* Settings Modal */}
      <SettingsModal />

      {/* Focus Mode 5-min Walking Break Blur Overlay */}
      <FocusBreakOverlay />

      {/* Profile Modal (Contains name textbox and Submit button, saving to Firestore) */}
      <ProfileModal />

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
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <MainAppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

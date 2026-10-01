import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { ProfileModal } from './components/ProfileModal';
import { StreakModal } from './components/StreakModal';
import { Dashboard } from './components/Dashboard';
import { VerificationScreen } from './components/VerificationScreen';
import { BlankPage } from './components/BlankPage';
import { MyChapters } from './components/MyChapters';
import { SavedChapter } from './lib/chapters';

const MainAppContent: React.FC = () => {
  const { openAuthModal, user, isEmailUnverified } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'blank' | 'my-chapters'>('landing');
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<SavedChapter | null>(null);
  const [activeSection, setActiveSection] = useState<string>('home');

  // When user logs in and is verified, automatically navigate to dashboard
  useEffect(() => {
    if (user && !isEmailUnverified) {
      setCurrentView((prev) => (prev === 'blank' || prev === 'my-chapters' ? prev : 'dashboard'));
    } else {
      // If user signs out, ensure 'my-chapters' view is closed and reverted to 'landing'
      setCurrentView((prev) => (prev === 'my-chapters' ? 'landing' : (prev === 'blank' ? 'blank' : 'landing')));
    }
  }, [user, isEmailUnverified]);

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
    setCurrentView('landing');
    setTimeout(() => scrollToSection('journey'), 50);
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
            onNavigateDashboard={() => setCurrentView('dashboard')}
            onNavigateMyChapters={() => {
              if (!user) {
                openAuthModal();
              } else {
                setCurrentView('my-chapters');
              }
            }}
            onPdfUpload={handlePdfUploaded}
            onClearUploadedPdf={() => setUploadedPdf(null)}
          />
        ) : currentView === 'my-chapters' ? (
          /* My Chapters Library View - only for signed-in users */
          user ? (
            <MyChapters
              onOpenChapter={handleOpenChapter}
              onUploadPdf={handlePdfUploaded}
              onNavigateDashboard={() => setCurrentView('dashboard')}
              onNavigateHome={() => setCurrentView('landing')}
            />
          ) : (
            (() => {
              setCurrentView('landing');
              return null;
            })()
          )
        ) : currentView === 'dashboard' ? (
          /* Dashboard View */
          <Dashboard
            onResumeLearning={handleResumeLearning}
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

      {/* Profile Modal (Contains name textbox and Submit button, saving to Firestore) */}
      <ProfileModal />

      {/* Interactive Streak Modal */}
      <StreakModal
        onStartLearning={() => {
          setCurrentView('landing');
          setTimeout(() => scrollToSection('journey'), 50);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

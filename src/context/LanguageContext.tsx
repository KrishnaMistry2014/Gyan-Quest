import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TRANSLATIONS } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof TRANSLATIONS.en;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: TRANSLATIONS.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('gyanquest_language');
      if (saved === 'hi' || saved === 'en') return saved;
      return 'en';
    } catch (_) {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('gyanquest_language', lang);
      window.dispatchEvent(new CustomEvent('gyanquest_language_changed', { detail: { language: lang } }));
    } catch (_) {}
  };

  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const custom = e as CustomEvent<{ language?: Language }>;
      if (custom.detail?.language && (custom.detail.language === 'en' || custom.detail.language === 'hi')) {
        setLanguageState(custom.detail.language);
      }
    };
    window.addEventListener('gyanquest_language_changed', handleCustomChange as EventListener);
    return () => window.removeEventListener('gyanquest_language_changed', handleCustomChange as EventListener);
  }, []);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

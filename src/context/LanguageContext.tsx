import React, { createContext, useContext } from 'react';
import { TRANSLATIONS } from '../lib/translations';

interface LanguageContextType {
  language: 'en';
  setLanguage: (lang: 'en') => void;
  t: typeof TRANSLATIONS.en;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: TRANSLATIONS.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LanguageContext.Provider value={{ language: 'en', setLanguage: () => {}, t: TRANSLATIONS.en }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

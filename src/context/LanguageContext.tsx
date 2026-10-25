import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupportedLanguage, LANGUAGES, TRANSLATIONS, LanguageOption } from '../i18n/translations';

// Exact 25 language fonts mapping as requested by user
export const LANGUAGE_FONTS: Record<string, string> = {
  en: "'Inter', sans-serif",
  es: "'Roboto', sans-serif",
  fr: "'Lato', sans-serif",
  de: "'Inter', sans-serif",
  it: "'Lato', sans-serif",
  pt: "'Roboto', sans-serif",
  ja: "'Noto Sans JP', sans-serif",
  ru: "'Roboto', sans-serif",
  ko: "'Noto Sans KR', sans-serif",
  'zh-CN': "'Noto Sans SC', sans-serif",
  'zh-TW': "'Noto Sans TC', sans-serif",
  ar: "'Cairo', sans-serif",
  bg: "'Roboto', sans-serif",
  ca: "'Lato', sans-serif",
  nl: "'Inter', sans-serif",
  el: "'Roboto', sans-serif",
  hi: "'Hind', sans-serif",
  id: "'Inter', sans-serif",
  ms: "'Inter', sans-serif",
  pl: "'Lato', sans-serif",
  sv: "'Inter', sans-serif",
  th: "'Sarabun', sans-serif",
  tr: "'Inter', sans-serif",
  uk: "'Roboto', sans-serif",
  bn: "'SolaimanLipi', 'Noto Sans Bengali', sans-serif",
  vi: "'Roboto', sans-serif",
  sw: "'Inter', sans-serif",
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultText?: string) => string;
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
  currentFont: string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (k, d) => d || k,
  languages: LANGUAGES,
  currentLanguageOption: LANGUAGES[0],
  currentFont: LANGUAGE_FONTS.en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ulikepdf_lang') as SupportedLanguage;
      if (saved && TRANSLATIONS[saved]) return saved;
      
      // Auto-detect browser language if available
      const navLang = navigator.language.slice(0, 2).toLowerCase();
      if (navLang === 'bn') return 'bn';
      if (navLang === 'es') return 'es';
      if (navLang === 'fr') return 'fr';
      if (navLang === 'de') return 'de';
      if (navLang === 'ar') return 'ar';
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    if (TRANSLATIONS[lang]) {
      setLanguageState(lang);
      localStorage.setItem('ulikepdf_lang', lang);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', language);
    
    // RTL for Arabic
    if (language === 'ar') {
      root.setAttribute('dir', 'rtl');
    } else {
      root.setAttribute('dir', 'ltr');
    }

    // Dynamic Font Conversion across the entire site
    const font = LANGUAGE_FONTS[language] || LANGUAGE_FONTS.en;
    root.style.setProperty('--app-font', font);
    document.body.style.fontFamily = font;
  }, [language]);

  const t = (key: string, defaultText?: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to English
    if (TRANSLATIONS.en && TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    return defaultText || key;
  };

  const currentFont = LANGUAGE_FONTS[language] || LANGUAGE_FONTS.en;
  const currentLanguageOption = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES, currentLanguageOption, currentFont }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

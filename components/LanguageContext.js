import { createContext, useContext, useEffect, useState } from 'react';
import translations from '../lib/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('nl');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('lang');
      if (stored && translations[stored]) {
        setLang(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.document.documentElement.lang = lang;
    }
  }, [lang]);

  const switchLang = (newLang) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', newLang);
    }
  };

  const t = (key, vars = {}) => {
    const str = translations[lang][key] || key;
    return str.replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? '');
  };

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}


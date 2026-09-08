import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { SupportedLocale, TranslationSchema, SUPPORTED_LOCALES, LocaleMeta } from './types';
import { en } from './translations/en';
import { ptBR } from './translations/ptBR';
import { es } from './translations/es';
import { ru } from './translations/ru';
import { uk } from './translations/uk';
import { zh } from './translations/zh';
import { ko } from './translations/ko';
import { ja } from './translations/ja';

const TRANSLATIONS: Record<SupportedLocale, TranslationSchema> = {
  en,
  'pt-BR': ptBR,
  es,
  ru,
  uk,
  zh,
  ko,
  ja,
};

const STORAGE_KEY = 'snappaste_lang';

interface LanguageContextValue {
  currentLocale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  strings: TranslationSchema;
  t: (path: string, params?: Record<string, string | number>) => string;
  locales: LocaleMeta[];
  currentMeta: LocaleMeta;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocale, setCurrentLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
    if (saved && TRANSLATIONS[saved]) {
      return saved;
    }
    // Strict default is 'en' as requested by user
    return 'en';
  });

  const setLocale = useCallback((locale: SupportedLocale) => {
    if (TRANSLATIONS[locale]) {
      setCurrentLocaleState(locale);
      try {
        localStorage.setItem(STORAGE_KEY, locale);
        document.documentElement.lang = locale;
      } catch {
        // Ignore storage errors in private browsing
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLocale;
    }
  }, [currentLocale]);

  const strings = useMemo(() => {
    return TRANSLATIONS[currentLocale] || en;
  }, [currentLocale]);

  const currentMeta = useMemo(() => {
    return SUPPORTED_LOCALES.find(m => m.code === currentLocale) || SUPPORTED_LOCALES[0];
  }, [currentLocale]);

  // Dot-notation resolver with fallback to English
  const t = useCallback((path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let result: any = strings;
    let fallback: any = en;

    for (const key of keys) {
      result = result?.[key];
      fallback = fallback?.[key];
      if (result === undefined && fallback === undefined) break;
    }

    let text = typeof result === 'string' ? result : (typeof fallback === 'string' ? fallback : path);

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }

    return text;
  }, [strings]);

  const value = useMemo(() => ({
    currentLocale,
    setLocale,
    strings,
    t,
    locales: SUPPORTED_LOCALES,
    currentMeta,
  }), [currentLocale, setLocale, strings, t, currentMeta]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useI18n(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useI18n must be used within a LanguageProvider');
  }
  return ctx;
}

export function useTranslation() {
  return useI18n();
}

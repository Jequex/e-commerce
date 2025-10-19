'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLocale, TranslationKeys } from '@/lib/types/translations';

// Import translation files
import enTranslations from '@/locales/en.json';
import esTranslations from '@/locales/es.json';
import frTranslations from '@/locales/fr.json';

interface TranslationContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: TranslationKeys;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

const translations: Record<SupportedLocale, TranslationKeys> = {
  en: enTranslations as TranslationKeys,
  es: esTranslations as TranslationKeys,
  fr: frTranslations as TranslationKeys,
};

interface TranslationProviderProps {
  children: React.ReactNode;
  defaultLocale?: SupportedLocale;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ 
  children, 
  defaultLocale = 'en' 
}) => {
  const [locale, setLocale] = useState<SupportedLocale>(defaultLocale);
  const [isLoading, setIsLoading] = useState(true);

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as SupportedLocale;
    if (savedLocale && translations[savedLocale]) {
      setLocale(savedLocale);
    }
    setIsLoading(false);
  }, []);

  // Save locale to localStorage when it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('locale', locale);
      // Update document language attribute
      document.documentElement.lang = locale;
    }
  }, [locale, isLoading]);

  const handleSetLocale = (newLocale: SupportedLocale) => {
    setLocale(newLocale);
  };

  const contextValue: TranslationContextType = {
    locale,
    setLocale: handleSetLocale,
    t: translations[locale],
    isLoading,
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

// Helper function to get supported locales
export const getSupportedLocales = (): SupportedLocale[] => {
  return Object.keys(translations) as SupportedLocale[];
};

// Helper function to get locale display names
export const getLocaleDisplayName = (locale: SupportedLocale): string => {
  const displayNames: Record<SupportedLocale, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
  };
  return displayNames[locale];
};
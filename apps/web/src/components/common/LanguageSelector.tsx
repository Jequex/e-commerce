'use client';

import React, { useState } from 'react';
import { useTranslation, getSupportedLocales, getLocaleDisplayName } from '@/contexts/TranslationContext';
import { SupportedLocale } from '@/lib/types/translations';

interface LanguageSelectorProps {
  className?: string;
}

export default function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const supportedLocales = getSupportedLocales();

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('LanguageSelector clicked', { isOpen, locale });
    setIsOpen(!isOpen);
  };

  const handleLocaleChange = (newLocale: SupportedLocale) => {
    console.log('Changing locale to:', newLocale);
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} style={{ pointerEvents: 'auto' }}>
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors cursor-pointer relative z-50 bg-transparent border-0"
        aria-label="Select language"
        type="button"
        style={{ pointerEvents: 'auto' }}
      >
        <span className="text-lg">🌐</span>
        <span>{getLocaleDisplayName(locale)}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[100]">
            <div className="py-1">
              {supportedLocales.map((supportedLocale) => (
                <button
                  key={supportedLocale}
                  onClick={() => handleLocaleChange(supportedLocale)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    locale === supportedLocale
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {supportedLocale === 'en' && '🇺🇸'}
                      {supportedLocale === 'es' && '🇪🇸'}
                      {supportedLocale === 'fr' && '🇫🇷'}
                    </span>
                    <span>{getLocaleDisplayName(supportedLocale)}</span>
                    {locale === supportedLocale && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
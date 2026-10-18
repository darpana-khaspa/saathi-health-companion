import React from 'react';
import { SupportedLanguage } from '../types';
import { translations } from '../translations';

interface HeaderProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  activeTab: 'ask' | 'visits';
  onTabChange: (tab: 'ask' | 'visits') => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  activeTab,
  onTabChange,
}) => {
  const t = translations[language];

  return (
    <header className="bg-primary-900 text-white shadow-sm border-b border-primary-800 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo and App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-teal-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight flex items-center gap-2">
                {t.appTitle}
                <span className="text-[10px] uppercase font-semibold bg-teal-700/60 text-teal-200 px-1.5 py-0.5 rounded border border-teal-500/30">
                  ASHA/ANM
                </span>
              </h1>
              <p className="text-xs text-teal-100/80 hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Right actions: Emergency dialer & Language selector */}
          <div className="flex items-center gap-2">
            <a
              href="tel:108"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-700 hover:bg-red-800 text-white border border-red-500/50 shadow-sm transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400"
              title="Emergency Ambulance Hotline"
            >
              <svg className="w-3.5 h-3.5 animate-pulse text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
              </svg>
              <span>108 / 102</span>
            </a>

            {/* Language toggle: English / Telugu */}
            <div className="flex rounded-lg bg-primary-800 p-0.5 border border-primary-700 text-xs">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  language === 'en'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-teal-200 hover:text-white'
                }`}
                aria-label="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('te')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  language === 'te'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-teal-200 hover:text-white'
                }`}
                aria-label="Switch to Telugu"
              >
                తెలుగు
              </button>
            </div>
          </div>
        </div>

        {/* Minimal 2-Tab Navigation */}
        <nav className="mt-3 flex gap-2 border-t border-primary-800/80 pt-2" aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => onTabChange('ask')}
            className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
              activeTab === 'ask'
                ? 'bg-white text-primary-900 shadow-sm'
                : 'text-teal-100 hover:bg-primary-800'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>{t.navAsk}</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('visits')}
            className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
              activeTab === 'visits'
                ? 'bg-white text-primary-900 shadow-sm'
                : 'text-teal-100 hover:bg-primary-800'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>{t.navVisits}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

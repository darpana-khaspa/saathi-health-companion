import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { translations } from '../translations';

interface DisclaimerBannerProps {
  language: SupportedLanguage;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ language }) => {
  const t = translations[language];
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-slate-800 text-slate-200 text-xs py-2 px-4 border-t border-slate-700">
      <div className="max-w-4xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2">
          <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="leading-tight text-slate-300">
            <strong>{t.disclaimerBanner}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-white shrink-0 text-[11px] underline ml-2"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};

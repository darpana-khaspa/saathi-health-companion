import React, { useState, useEffect } from 'react';
import { ProtocolStatus, SupportedLanguage } from '../types';
import { translations } from '../translations';

interface StatusStripProps {
  language: SupportedLanguage;
  protocolStatus: ProtocolStatus | null;
  isLoadingStatus: boolean;
}

export const StatusStrip: React.FC<StatusStripProps> = ({
  language,
  protocolStatus,
  isLoadingStatus,
}) => {
  const t = translations[language];
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isPackReady = protocolStatus && protocolStatus.pack_status === 'ready';

  return (
    <div className="bg-slate-100/90 border-b border-slate-200/80 px-4 py-2">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Network State indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className={isOnline ? 'text-emerald-800' : 'text-amber-800'}>
              {isOnline ? t.statusOnline : t.statusOffline}
            </span>
          </div>

          <span className="text-slate-300">|</span>

          {/* Local Protocol Pack Readiness */}
          <div className="flex items-center gap-1.5 text-slate-700">
            <svg
              className={`w-3.5 h-3.5 ${
                isPackReady ? 'text-teal-600' : 'text-slate-400'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="font-medium">
              {isLoadingStatus
                ? t.protocolPackLoading
                : isPackReady
                ? `${t.protocolPackReady} (${protocolStatus.total_chunks} passages indexed)`
                : 'Protocol Pack: Offline fallback ready'}
            </span>
          </div>
        </div>

        {/* Local Storage / Offline notice */}
        <div className="text-[11px] text-slate-500 hidden sm:block">
          Offline SQLite storage active • 100% On-Device
        </div>
      </div>
    </div>
  );
};

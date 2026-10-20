import React, { useState, useEffect } from 'react';
import { ProtocolStatus, SupportedLanguage } from '../types';
import { translations } from '../translations';

interface StatusStripProps {
  language: SupportedLanguage;
  protocolStatus: ProtocolStatus | null;
  isLoadingStatus: boolean;
  onOpenOfflineModal: () => void;
  isPrepared: boolean;
}

export const StatusStrip: React.FC<StatusStripProps> = ({
  language,
  protocolStatus,
  isLoadingStatus,
  onOpenOfflineModal,
  isPrepared,
}) => {
  const t = translations[language];
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

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
    <div className="bg-slate-100/95 border-b border-slate-200/90 px-3 sm:px-4 py-2">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Network State & Offline Readiness Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* 1. Online / Offline network pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${
              isOnline
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isOnline ? t.statusOnline : t.statusOffline}</span>
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* 2. Offline Readiness Indicator: Offline Ready vs Offline Not Prepared */}
          <div className="flex items-center gap-1.5">
            {isPrepared ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-100 text-teal-800 border border-teal-300">
                <svg className="w-3.5 h-3.5 text-teal-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{t.statusOfflineReady} (IndexedDB)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{t.statusOfflineNotPrepared}</span>
              </span>
            )}
          </div>

          <span className="text-slate-300 hidden md:inline">|</span>

          {/* 3. Protocol Corpus Summary */}
          <div className="hidden md:flex items-center gap-1.5 text-slate-700 text-[11px]">
            <svg
              className={`w-3.5 h-3.5 ${isPackReady ? 'text-teal-600' : 'text-slate-400'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="font-medium">
              {isLoadingStatus
                ? t.protocolPackLoading
                : isPackReady
                ? `${protocolStatus.total_chunks} passages indexed`
                : '10 Seed Protocols Ready'}
            </span>
          </div>
        </div>

        {/* Action Button: "Prepare for Offline Use" */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenOfflineModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition active:scale-95 shadow-xs ${
              isPrepared
                ? 'bg-white hover:bg-slate-50 text-teal-800 border border-teal-300'
                : 'bg-teal-700 hover:bg-teal-800 text-white animate-pulse'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{isPrepared ? 'Offline Pack Verified' : t.btnPrepareOffline}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

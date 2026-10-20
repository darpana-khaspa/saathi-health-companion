import React, { useState } from 'react';
import { SupportedLanguage } from '../types';
import { translations } from '../translations';
import { apiService } from '../services/api';

interface OfflineModalProps {
  language: SupportedLanguage;
  isOpen: boolean;
  onClose: () => void;
  onPrepared: () => void;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({
  language,
  isOpen,
  onClose,
  onPrepared,
}) => {
  const t = translations[language];
  const [isPreparing, setIsPreparing] = useState(false);
  const [steps, setSteps] = useState<{ id: string; label: string; done: boolean }[]>([
    { id: 'idb', label: 'Initialize Browser Database (IndexedDB)', done: false },
    { id: 'protocols', label: 'Index 10 Official Frontline Protocols (Client TF-IDF)', done: false },
    { id: 'households', label: 'Cache 12 Household Register Records in IndexedDB', done: false },
    { id: 'assets', label: 'Cache App Shell & Assets via Service Worker', done: false },
    { id: 'verify', label: 'Verify Complete Offline Readiness', done: false },
  ]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [prepComplete, setPrepComplete] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunPreparation = async () => {
    setIsPreparing(true);
    setErrorMsg(null);
    setCurrentMessage('Starting offline preparation...');

    try {
      // Step 1: IDB
      setSteps((prev) => prev.map((s) => (s.id === 'idb' ? { ...s, done: true } : s)));

      await apiService.prepareOffline((msg) => {
        setCurrentMessage(msg);
        if (msg.includes('protocols')) {
          setSteps((prev) => prev.map((s) => (s.id === 'protocols' ? { ...s, done: true } : s)));
        } else if (msg.includes('household')) {
          setSteps((prev) => prev.map((s) => (s.id === 'households' ? { ...s, done: true } : s)));
        } else if (msg.includes('App Shell')) {
          setSteps((prev) => prev.map((s) => (s.id === 'assets' ? { ...s, done: true } : s)));
        }
      });

      setSteps((prev) => prev.map((s) => ({ ...s, done: true })));
      setPrepComplete(true);
      setCurrentMessage('✅ Offline pack successfully verified and ready for zero-network use!');
      onPrepared();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Preparation encountered an issue';
      setErrorMsg(msg);
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-teal-700 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 border border-teal-500/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">{t.offlineModalTitle}</h2>
              <p className="text-xs text-teal-100/90">Genuinely Local Frontline Decision Support</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-teal-200 hover:text-white p-1 rounded-lg transition"
            aria-label={t.close}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-sm text-slate-700">
          <p className="text-slate-600 text-xs leading-relaxed">
            {t.offlineModalDesc}
          </p>

          {/* Checklist */}
          <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            {steps.map((st) => (
              <div key={st.id} className="flex items-center gap-2.5 text-xs font-medium">
                {st.done ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-300 bg-white flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </span>
                )}
                <span className={st.done ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>

          {/* Live Progress Output */}
          {currentMessage && (
            <div className="text-xs font-mono bg-teal-50 text-teal-900 border border-teal-200 rounded-lg p-2.5">
              {currentMessage}
            </div>
          )}

          {errorMsg && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Important Architecture & Sync Notice */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Device-Local Persistence Notice</span>
            </div>
            <p className="text-amber-800 leading-normal">
              {t.deviceSyncNotice}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            {prepComplete ? 'Done' : t.close}
          </button>
          {!prepComplete && (
            <button
              type="button"
              onClick={handleRunPreparation}
              disabled={isPreparing}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition shadow-sm flex items-center gap-2 ${
                isPreparing
                  ? 'bg-teal-400 cursor-not-allowed'
                  : 'bg-teal-700 hover:bg-teal-800 active:scale-95'
              }`}
            >
              {isPreparing ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{t.preparing}</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>{t.btnPrepareOffline}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

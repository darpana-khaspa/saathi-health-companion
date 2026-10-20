import React from 'react';
import { HouseholdStats, ProtocolStatus, SupportedLanguage } from '../types';
import { translations } from '../translations';

interface DashboardCardsProps {
  language: SupportedLanguage;
  stats: HouseholdStats | null;
  protocolStatus: ProtocolStatus | null;
  onFilterDueStatus?: (status: string) => void;
  isPrepared: boolean;
  onOpenOfflineModal: () => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  language,
  stats,
  protocolStatus,
  onFilterDueStatus,
  isPrepared,
  onOpenOfflineModal,
}) => {
  const t = translations[language];

  return (
    <div className="space-y-4 mb-5">
      {/* ------------------------------------------------------------- */}
      {/* PROMINENT MAIN DASHBOARD OFFLINE READINESS & PREPARATION CARD */}
      {/* ------------------------------------------------------------- */}
      <section
        aria-label="Offline Field Readiness Status"
        className={`rounded-2xl border-2 p-4 md:p-5 transition shadow-sm ${
          isPrepared
            ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950'
            : 'bg-amber-50 border-amber-400 text-amber-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isPrepared
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 text-white animate-pulse'
              }`}
            >
              {isPrepared ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                  {isPrepared ? 'Offline Field Mode: Ready' : 'Offline Field Mode: Action Required'}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                    isPrepared
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                  }`}
                >
                  {isPrepared ? t.statusOfflineReady : t.statusOfflineNotPrepared}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                {isPrepared
                  ? 'Official protocols (10 passages), household records (12 visits), and client-side TF-IDF search are verified in device-local IndexedDB. Safe to disconnect Wi-Fi and work offline.'
                  : 'Download and verify protocols and household registers onto this device so the companion works with zero Wi-Fi or cellular connectivity.'}
              </p>
            </div>
          </div>

          {/* Accessible, visible "Prepare for Offline Use" Action Button */}
          <button
            type="button"
            data-testid="dashboard-prepare-offline-btn"
            onClick={onOpenOfflineModal}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer min-h-[46px] shrink-0 ${
              isPrepared
                ? 'bg-white hover:bg-emerald-100/60 text-emerald-900 border border-emerald-300'
                : 'bg-teal-700 hover:bg-teal-800 text-white border border-teal-800 shadow-md ring-2 ring-teal-500/40 animate-pulse sm:animate-none'
            }`}
            aria-label={isPrepared ? 'Offline Pack Verified' : t.btnPrepareOffline}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{isPrepared ? 'Offline Pack Verified' : t.btnPrepareOffline}</span>
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4 SUMMARY STAT CARDS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Overdue visits card */}
        <button
          type="button"
          onClick={() => onFilterDueStatus && onFilterDueStatus('overdue')}
          className="bg-white border border-red-200/90 rounded-xl p-3.5 shadow-xs text-left hover:border-red-400 hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-red-700 mb-1">
            <span>{t.statsOverdue}</span>
            <span className="w-2 h-2 rounded-full bg-red-600 group-hover:scale-125 transition"></span>
          </div>
          <div className="text-2xl font-bold text-red-900 tracking-tight">
            {stats ? stats.overdue_count : '--'}
          </div>
          <div className="text-[11px] text-red-600/90 mt-1 font-medium">
            Priority follow-up needed
          </div>
        </button>

        {/* Due soon / Today card */}
        <button
          type="button"
          onClick={() => onFilterDueStatus && onFilterDueStatus('due_soon')}
          className="bg-white border border-amber-200/90 rounded-xl p-3.5 shadow-xs text-left hover:border-amber-400 hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-800 mb-1">
            <span>{t.statsDueSoon}</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 group-hover:scale-125 transition"></span>
          </div>
          <div className="text-2xl font-bold text-amber-900 tracking-tight">
            {stats ? stats.due_soon_count + stats.due_today_count : '--'}
          </div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">
            {stats ? `${stats.due_today_count} due today` : 'Upcoming visits'}
          </div>
        </button>

        {/* Total households card */}
        <button
          type="button"
          onClick={() => onFilterDueStatus && onFilterDueStatus('all')}
          className="bg-white border border-teal-200/80 rounded-xl p-3.5 shadow-xs text-left hover:border-teal-400 hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-teal-800 mb-1">
            <span>{t.statsTotalHouseholds}</span>
            <span className="w-2 h-2 rounded-full bg-teal-600 group-hover:scale-125 transition"></span>
          </div>
          <div className="text-2xl font-bold text-teal-950 tracking-tight">
            {stats ? stats.total_registered : '--'}
          </div>
          <div className="text-[11px] text-teal-700 mt-1 font-medium">
            {stats ? `${stats.completed_count} completed` : 'Synthetic register'}
          </div>
        </button>

        {/* Local protocol pack status card (Interactive) */}
        <button
          type="button"
          onClick={onOpenOfflineModal}
          className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs text-left hover:border-teal-400 hover:shadow-sm transition group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>{t.statsPackStatus}</span>
            <span className={`w-2 h-2 rounded-full ${isPrepared ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </div>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">
            {protocolStatus ? `${protocolStatus.total_chunks}` : '10'}
          </div>
          <div className="text-[11px] text-teal-700 mt-1 truncate font-medium">
            {isPrepared ? 'Verified in IndexedDB ↗' : 'Tap to prepare offline ↗'}
          </div>
        </button>
      </div>
    </div>
  );
};

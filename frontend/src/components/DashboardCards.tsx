import React from 'react';
import { HouseholdStats, ProtocolStatus, SupportedLanguage } from '../types';
import { translations } from '../translations';

interface DashboardCardsProps {
  language: SupportedLanguage;
  stats: HouseholdStats | null;
  protocolStatus: ProtocolStatus | null;
  onFilterDueStatus?: (status: string) => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  language,
  stats,
  protocolStatus,
  onFilterDueStatus,
}) => {
  const t = translations[language];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
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

      {/* Local protocol pack status card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs text-left">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
          <span>{t.statsPackStatus}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <div className="text-2xl font-bold text-slate-800 tracking-tight">
          {protocolStatus ? `${protocolStatus.total_chunks}` : '--'}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 truncate font-medium">
          {protocolStatus ? `${protocolStatus.indexed_documents_count} official manuals` : 'Indexed locally'}
        </div>
      </div>
    </div>
  );
};

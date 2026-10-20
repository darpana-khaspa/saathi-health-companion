import React, { useState, useEffect } from 'react';
import { HouseholdVisit, SupportedLanguage } from '../types';
import { translations } from '../translations';
import { apiService } from '../services/api';

interface VisitListProps {
  language: SupportedLanguage;
  initialDueFilter?: string;
  onVisitUpdated?: () => void;
}

export const VisitList: React.FC<VisitListProps> = ({
  language,
  initialDueFilter = 'all',
  onVisitUpdated,
}) => {
  const t = translations[language];
  const [visits, setVisits] = useState<HouseholdVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Filters
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWorker, setSelectedWorker] = useState<string>('all');
  const [selectedDueStatus, setSelectedDueStatus] = useState<string>(initialDueFilter);

  useEffect(() => {
    setSelectedDueStatus(initialDueFilter);
  }, [initialDueFilter]);

  const loadVisits = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getVisits({
        village: selectedVillage,
        category: selectedCategory,
        assigned_worker: selectedWorker,
        due_status: selectedDueStatus,
      });
      setVisits(data);
    } catch (err) {
      console.error('Failed to load visits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, [selectedVillage, selectedCategory, selectedWorker, selectedDueStatus]);

  const handleMarkComplete = async (householdId: string) => {
    setCompletingId(householdId);
    try {
      const updated = await apiService.completeVisit(householdId);
      setVisits((prev) =>
        prev.map((v) => (v.household_id === householdId ? updated : v))
      );
      if (onVisitUpdated) {
        onVisitUpdated();
      }
    } catch (err) {
      console.error('Error completing visit:', err);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Device Storage & Multi-Device Sync Explanation Banner */}
      <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3 text-xs text-teal-900 space-y-1">
        <div className="flex items-center justify-between font-semibold">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-4" />
              <rect x="2" y="10" width="12" height="12" rx="2" />
            </svg>
            <span>{t.syntheticDemoNotice}</span>
          </span>
          <span className="text-[11px] font-mono text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded border border-teal-200">
            Local IndexedDB
          </span>
        </div>
        <p className="text-[11px] text-teal-800 leading-relaxed">
          {t.deviceSyncNotice}
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Status Tab Pills */}
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
          {[
            { id: 'all', label: t.statusAll },
            { id: 'overdue', label: t.statusOverdue },
            { id: 'due_soon', label: t.statusDueSoon },
            { id: 'completed', label: t.statusCompleted },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedDueStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                selectedDueStatus === tab.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Village Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {t.filterVillage}
            </label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">{t.allOption}</option>
              <option value="Rampur">Rampur</option>
              <option value="Kalyanpur">Kalyanpur</option>
              <option value="Shivpur">Shivpur</option>
              <option value="Ganeshpur">Ganeshpur</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {t.filterCategory}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">{t.allOption}</option>
              <option value="Antenatal Care (ANC)">Antenatal Care (ANC)</option>
              <option value="High-Risk Pregnancy">High-Risk Pregnancy</option>
              <option value="Postnatal Care (PNC)">Postnatal Care (PNC)</option>
              <option value="Newborn Care">Newborn Care</option>
              <option value="Infant Immunization">Infant Immunization</option>
              <option value="Child Nutrition (SAM/MAM)">Child Nutrition (SAM/MAM)</option>
            </select>
          </div>

          {/* Assigned Worker Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              {t.filterWorker}
            </label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">{t.allOption}</option>
              <option value="ASHA Sunita">ASHA Sunita</option>
              <option value="ASHA Geeta">ASHA Geeta</option>
              <option value="ANM Rekha">ANM Rekha</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visit List Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
          <svg className="w-5 h-5 animate-spin text-teal-700" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading prioritized household visits...</span>
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          {t.emptyVisits}
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => {
            const isCompleted = visit.visit_status === 'completed';
            const isOverdue = visit.days_due_diff > 0 && !isCompleted;
            const isDueToday = visit.days_due_diff === 0 && !isCompleted;

            return (
              <div
                key={visit.household_id}
                className={`bg-white border rounded-2xl p-4 shadow-xs transition hover:shadow-sm ${
                  isOverdue
                    ? 'border-red-300 bg-red-50/20'
                    : isDueToday
                    ? 'border-amber-300 bg-amber-50/20'
                    : isCompleted
                    ? 'border-slate-200 opacity-80'
                    : 'border-slate-200'
                }`}
              >
                {/* Header row: Beneficiary name, risk tag, urgency badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">
                      {visit.beneficiary_name}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      ({visit.beneficiary_age}y)
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {visit.village}
                    </span>
                  </div>

                  {/* Urgency Badge */}
                  <div>
                    {isCompleted ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        Completed ✓
                      </span>
                    ) : isOverdue ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800 animate-pulse">
                        {visit.urgency_label}
                      </span>
                    ) : isDueToday ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
                        Due Today
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {visit.urgency_label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subheader: Category and Risk Tag */}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    {visit.category}
                  </span>

                  {visit.risk_flag === 'High' && (
                    <span className="text-[11px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                      High Risk
                    </span>
                  )}
                  {visit.risk_flag === 'Medium' && (
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Medium Risk
                    </span>
                  )}

                  <span className="text-xs text-slate-500">
                    ID: <code className="font-mono">{visit.household_id}</code>
                  </span>
                </div>

                {/* Concise Visit Note */}
                {visit.concise_visit_note && (
                  <p className="mt-2.5 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    <strong className="text-slate-900">Follow-up Note: </strong>
                    {visit.concise_visit_note}
                  </p>
                )}

                {/* Footer details & Action */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-500 space-y-0.5">
                    <div>
                      <span className="font-medium text-slate-700">Assigned: </span>
                      {visit.assigned_worker}
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Next Due: </span>
                      <span className={isOverdue ? 'font-semibold text-red-700' : ''}>
                        {visit.next_visit_due}
                      </span>
                      {visit.last_visit_date && (
                        <span className="text-slate-400 ml-2">
                          (Last: {visit.last_visit_date})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mark complete button */}
                  <div>
                    {isCompleted ? (
                      <span className="text-xs text-slate-400 italic">
                        Recorded in SQLite {visit.completed_at ? `(${visit.completed_at})` : ''}
                      </span>
                    ) : (
                      <button
                        type="button"
                        data-testid={`complete-btn-${visit.household_id}`}
                        onClick={() => handleMarkComplete(visit.household_id)}
                        disabled={completingId === visit.household_id}
                        className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-semibold text-xs transition active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {completingId === visit.household_id ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <span>✓</span>
                            <span>{t.btnMarkComplete}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

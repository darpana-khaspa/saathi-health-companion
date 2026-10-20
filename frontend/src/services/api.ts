import { AskResponse, HouseholdVisit, HouseholdStats, ProtocolStatus, SupportedLanguage } from '../types';
import { evaluateClientDangerSigns } from '../offline/escalation';
import { clientProtocolRetriever } from '../offline/retriever';
import {
  loadHouseholdsFromDB,
  saveHouseholdsToDB,
  completeHouseholdVisitInDB,
  loadStatsFromDB,
  loadProtocolsFromDB,
  prepareForOfflineUse,
  isOfflinePrepared,
  getOfflineMetadata
} from '../offline/db';

const API_BASE_URL = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout before offline fallback

  try {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData && errorData.detail) {
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // ignore json parse error
      }
      throw new Error(errorMsg);
    }

    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const apiService = {
  getHealth: async (): Promise<{ status: string; offline_ready: boolean; version: string }> => {
    try {
      return await fetchJson<{ status: string; offline_ready: boolean; version: string }>('/api/health');
    } catch {
      return { status: 'offline_mode', offline_ready: true, version: '1.0.0-client' };
    }
  },

  getProtocolStatus: async (): Promise<ProtocolStatus> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return clientProtocolRetriever.getStatus();
    }

    try {
      return await fetchJson<ProtocolStatus>('/api/protocols/status');
    } catch {
      return clientProtocolRetriever.getStatus();
    }
  },

  askQuestion: async (question: string, language: SupportedLanguage = 'en'): Promise<AskResponse> => {
    // 1. DETERMINISTIC HARD-CODED DANGER SIGN ESCALATION:
    // Evaluates client-side before any network request or model retrieval
    const escalation = evaluateClientDangerSigns(question);
    if (escalation) {
      return escalation;
    }

    // 2. If browser is offline, search using local on-device TF-IDF engine
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return clientProtocolRetriever.search(question);
    }

    // 3. If online, attempt backend protocol search
    try {
      return await fetchJson<AskResponse>('/api/ask', {
        method: 'POST',
        body: JSON.stringify({ question, language }),
      });
    } catch {
      // 4. Fallback transparently to on-device retriever if network or backend fails
      return clientProtocolRetriever.search(question);
    }
  },

  getVisits: async (params?: {
    village?: string;
    assigned_worker?: string;
    category?: string;
    due_status?: string;
  }): Promise<HouseholdVisit[]> => {
    // If offline, read from IndexedDB
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return loadHouseholdsFromDB(params);
    }

    try {
      const query = new URLSearchParams();
      if (params?.village && params.village !== 'all') query.set('village', params.village);
      if (params?.assigned_worker && params.assigned_worker !== 'all') query.set('assigned_worker', params.assigned_worker);
      if (params?.category && params.category !== 'all') query.set('category', params.category);
      if (params?.due_status && params.due_status !== 'all') query.set('due_status', params.due_status);

      const qs = query.toString();
      const remoteVisits = await fetchJson<HouseholdVisit[]>(`/api/visits${qs ? `?${qs}` : ''}`);

      // Sync fresh records to IndexedDB in background
      saveHouseholdsToDB(remoteVisits).catch(() => {});

      return remoteVisits;
    } catch {
      // Offline fallback: load from IndexedDB
      return loadHouseholdsFromDB(params);
    }
  },

  getStats: async (): Promise<HouseholdStats> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return loadStatsFromDB();
    }

    try {
      return await fetchJson<HouseholdStats>('/api/visits/stats');
    } catch {
      return loadStatsFromDB();
    }
  },

  completeVisit: async (householdId: string): Promise<HouseholdVisit> => {
    // 1. Immediately persist locally in IndexedDB
    const updatedLocal = await completeHouseholdVisitInDB(householdId);

    // 2. If online, notify backend
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      fetchJson<HouseholdVisit>(`/api/visits/${encodeURIComponent(householdId)}/complete`, {
        method: 'PATCH',
      }).catch((err) => {
        console.warn('Backend sync deferred (will remain saved locally in IndexedDB):', err);
      });
    }

    return updatedLocal;
  },

  // Offline Management APIs
  isPrepared: isOfflinePrepared,
  getOfflineMetadata: getOfflineMetadata,
  prepareOffline: prepareForOfflineUse,
  loadLocalProtocols: loadProtocolsFromDB,
};

import { AskResponse, HouseholdVisit, HouseholdStats, ProtocolStatus, SupportedLanguage } from '../types';

const API_BASE_URL = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

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

  return res.json() as Promise<T>;
}

export const apiService = {
  getHealth: () => fetchJson<{ status: string; offline_ready: boolean; version: string }>('/api/health'),
  
  getProtocolStatus: () => fetchJson<ProtocolStatus>('/api/protocols/status'),

  askQuestion: (question: string, language: SupportedLanguage = 'en'): Promise<AskResponse> => {
    return fetchJson<AskResponse>('/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question, language }),
    });
  },

  getVisits: (params?: {
    village?: string;
    assigned_worker?: string;
    category?: string;
    due_status?: string;
  }): Promise<HouseholdVisit[]> => {
    const query = new URLSearchParams();
    if (params?.village && params.village !== 'all') query.set('village', params.village);
    if (params?.assigned_worker && params.assigned_worker !== 'all') query.set('assigned_worker', params.assigned_worker);
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.due_status && params.due_status !== 'all') query.set('due_status', params.due_status);

    const qs = query.toString();
    return fetchJson<HouseholdVisit[]>(`/api/visits${qs ? `?${qs}` : ''}`);
  },

  getStats: (): Promise<HouseholdStats> => fetchJson<HouseholdStats>('/api/visits/stats'),

  completeVisit: (householdId: string): Promise<HouseholdVisit> => {
    return fetchJson<HouseholdVisit>(`/api/visits/${encodeURIComponent(householdId)}/complete`, {
      method: 'PATCH',
    });
  },
};

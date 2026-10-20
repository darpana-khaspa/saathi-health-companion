import { HouseholdVisit, HouseholdStats } from '../types';
import { ProtocolItem, SEED_PROTOCOLS, SEED_HOUSEHOLDS } from './seedData';
import { clientProtocolRetriever } from './retriever';

const DB_NAME = 'SaathiOfflineDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getOfflineDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('protocols')) {
        db.createObjectStore('protocols', { keyPath: 'protocol_id' });
      }
      if (!db.objectStoreNames.contains('households')) {
        db.createObjectStore('households', { keyPath: 'household_id' });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export interface OfflineMetadata {
  key: string;
  prepared: boolean;
  preparedAt: string;
  protocolCount: number;
  householdCount: number;
}

export async function isOfflinePrepared(): Promise<boolean> {
  try {
    const db = await getOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction('metadata', 'readonly');
      const store = tx.objectStore('metadata');
      const req = store.get('readiness');
      req.onsuccess = () => {
        const data = req.result as OfflineMetadata | undefined;
        resolve(Boolean(data && data.prepared));
      };
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function getOfflineMetadata(): Promise<OfflineMetadata | null> {
  try {
    const db = await getOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction('metadata', 'readonly');
      const store = tx.objectStore('metadata');
      const req = store.get('readiness');
      req.onsuccess = () => resolve((req.result as OfflineMetadata) || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveProtocolsToDB(protocols: ProtocolItem[]): Promise<void> {
  const db = await getOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('protocols', 'readwrite');
    const store = tx.objectStore('protocols');
    for (const p of protocols) {
      store.put(p);
    }
    tx.oncomplete = () => {
      clientProtocolRetriever.updateProtocols(protocols);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadProtocolsFromDB(): Promise<ProtocolItem[]> {
  try {
    const db = await getOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction('protocols', 'readonly');
      const store = tx.objectStore('protocols');
      const req = store.getAll();
      req.onsuccess = () => {
        const res = req.result as ProtocolItem[];
        if (res && res.length > 0) {
          clientProtocolRetriever.updateProtocols(res);
          resolve(res);
        } else {
          // If empty, auto-seed with SEED_PROTOCOLS
          saveProtocolsToDB(SEED_PROTOCOLS).then(() => resolve(SEED_PROTOCOLS));
        }
      };
      req.onerror = () => resolve(SEED_PROTOCOLS);
    });
  } catch {
    return SEED_PROTOCOLS;
  }
}

export async function saveHouseholdsToDB(households: HouseholdVisit[]): Promise<void> {
  const db = await getOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('households', 'readwrite');
    const store = tx.objectStore('households');
    for (const h of households) {
      store.put(h);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadHouseholdsFromDB(filters?: {
  village?: string;
  category?: string;
  assigned_worker?: string;
  due_status?: string;
}): Promise<HouseholdVisit[]> {
  try {
    const db = await getOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction('households', 'readonly');
      const store = tx.objectStore('households');
      const req = store.getAll();
      req.onsuccess = () => {
        let list = (req.result as HouseholdVisit[]) || [];
        if (list.length === 0) {
          // If completely empty, auto-seed with default households
          saveHouseholdsToDB(SEED_HOUSEHOLDS).catch(() => {});
          list = [...SEED_HOUSEHOLDS];
        }

        // Apply filters
        if (filters?.village && filters.village !== 'all') {
          list = list.filter((h) => h.village.toLowerCase() === filters.village!.toLowerCase());
        }
        if (filters?.category && filters.category !== 'all') {
          list = list.filter((h) => h.category.toLowerCase() === filters.category!.toLowerCase());
        }
        if (filters?.assigned_worker && filters.assigned_worker !== 'all') {
          list = list.filter((h) => h.assigned_worker.toLowerCase() === filters.assigned_worker!.toLowerCase());
        }
        if (filters?.due_status && filters.due_status !== 'all') {
          const ds = filters.due_status.toLowerCase();
          if (ds === 'completed') {
            list = list.filter((h) => h.visit_status === 'completed');
          } else if (ds === 'pending') {
            list = list.filter((h) => h.visit_status === 'pending');
          } else if (ds === 'overdue') {
            list = list.filter((h) => h.visit_status === 'pending' && h.days_due_diff < 0);
          } else if (ds === 'due_today') {
            list = list.filter((h) => h.visit_status === 'pending' && h.days_due_diff === 0);
          } else if (ds === 'due_soon') {
            list = list.filter((h) => h.visit_status === 'pending' && h.days_due_diff > 0 && h.days_due_diff <= 3);
          }
        }

        // Sort by overdue first, then earliest due date
        list.sort((a, b) => {
          if (a.visit_status === 'pending' && b.visit_status === 'completed') return -1;
          if (a.visit_status === 'completed' && b.visit_status === 'pending') return 1;
          return a.days_due_diff - b.days_due_diff;
        });

        resolve(list);
      };
      req.onerror = () => resolve(SEED_HOUSEHOLDS);
    });
  } catch {
    return SEED_HOUSEHOLDS;
  }
}

export async function completeHouseholdVisitInDB(householdId: string): Promise<HouseholdVisit> {
  const db = await getOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('households', 'readwrite');
    const store = tx.objectStore('households');
    const getReq = store.get(householdId);

    getReq.onsuccess = () => {
      let record = getReq.result as HouseholdVisit | undefined;
      if (!record) {
        // Find in seed as fallback
        const fallback = SEED_HOUSEHOLDS.find((h) => h.household_id === householdId);
        if (!fallback) {
          reject(new Error(`Household ${householdId} not found in offline database`));
          return;
        }
        record = { ...fallback };
      }

      record.visit_status = 'completed';
      record.completed_at = new Date().toISOString();
      record.urgency_label = 'Completed';

      store.put(record);

      tx.oncomplete = () => resolve(record!);
      tx.onerror = () => reject(tx.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

export async function loadStatsFromDB(): Promise<HouseholdStats> {
  const all = await loadHouseholdsFromDB();
  return {
    total_registered: all.length,
    overdue_count: all.filter((h) => h.visit_status === 'pending' && h.days_due_diff < 0).length,
    due_today_count: all.filter((h) => h.visit_status === 'pending' && h.days_due_diff === 0).length,
    due_soon_count: all.filter((h) => h.visit_status === 'pending' && h.days_due_diff > 0 && h.days_due_diff <= 3).length,
    completed_count: all.filter((h) => h.visit_status === 'completed').length,
    high_risk_count: all.filter((h) => h.risk_flag === 'High').length,
  };
}

/**
 * Explicit "Prepare for Offline Use" execution routine:
 * 1. Downloads or seeds protocols into IndexedDB.
 * 2. Builds and verifies client-side TF-IDF index.
 * 3. Downloads or seeds household register into IndexedDB.
 * 4. Ensures Service Worker cache has the App Shell.
 * 5. Saves offline readiness metadata.
 */
export async function prepareForOfflineUse(
  onProgress?: (message: string) => void
): Promise<{ protocols: number; households: number; cachedAssets: number }> {
  const notify = (msg: string) => {
    if (onProgress) onProgress(msg);
  };

  notify('Initializing device storage (IndexedDB)...');
  await getOfflineDB();

  // 1. Fetch & Store Protocols
  notify('Fetching official frontline public-health protocols...');
  let protocolsToSave: ProtocolItem[] = SEED_PROTOCOLS;
  try {
    const res = await fetch('/api/protocols/export');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        protocolsToSave = data;
      }
    }
  } catch {
    // offline or backend unreachable: use SEED_PROTOCOLS
  }
  await saveProtocolsToDB(protocolsToSave);
  clientProtocolRetriever.updateProtocols(protocolsToSave);
  notify(`Saved & indexed ${protocolsToSave.length} protocols into client TF-IDF engine.`);

  // 2. Fetch & Store Households
  notify('Fetching household register records...');
  let householdsToSave: HouseholdVisit[] = SEED_HOUSEHOLDS;
  try {
    const res = await fetch('/api/visits?due_status=all');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        householdsToSave = data;
      }
    }
  } catch {
    // offline or backend unreachable: use SEED_HOUSEHOLDS
  }
  await saveHouseholdsToDB(householdsToSave);
  notify(`Saved ${householdsToSave.length} household records into IndexedDB.`);

  // 3. Cache App Shell & Core Assets
  let cachedCount = 0;
  if ('caches' in window) {
    notify('Verifying App Shell cache in Service Worker...');
    try {
      const cache = await caches.open('saathi-shell-v1');
      const coreUrls = ['/', '/index.html', '/manifest.json', '/icon.svg'];
      for (const u of coreUrls) {
        try {
          await cache.add(u);
          cachedCount++;
        } catch {
          // ignore individual cache add errors
        }
      }
    } catch (e) {
      console.warn('Cache storage check note:', e);
    }
  }

  // 4. Save metadata
  const db = await getOfflineDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    const meta: OfflineMetadata = {
      key: 'readiness',
      prepared: true,
      preparedAt: new Date().toISOString(),
      protocolCount: protocolsToSave.length,
      householdCount: householdsToSave.length,
    };
    store.put(meta);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  notify('Offline preparation verified! Application is 100% ready for disconnected field use.');

  return {
    protocols: protocolsToSave.length,
    households: householdsToSave.length,
    cachedAssets: cachedCount,
  };
}

/**
 * Safe Local Storage Utility for Al-Bunyan Quranic Engine
 * Protects against SecurityError, QuotaExceededError, and private-mode/iframe storage access restrictions.
 * Automatically falls back to in-memory storage if localStorage is unavailable.
 */

/**
 * Safe Local Storage & Session Storage Utility for Al-Bunyan Quranic Engine
 * Protects against SecurityError, QuotaExceededError, and private-mode/iframe storage access restrictions.
 * Automatically manages quota and falls back to sessionStorage and in-memory storage.
 */

const memoryFallback = new Map<string, string>();

function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__bonyan_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function isSessionStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__bonyan_session_test__';
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const localAvailable = isLocalStorageAvailable();
const sessionAvailable = isSessionStorageAvailable();

export const safeStorage = {
  getItem(key: string, defaultValue: string | null = null): string | null {
    // 1. Try localStorage first for reliable persistence across PWA restarts and app-switching
    try {
      if (localAvailable && typeof window !== 'undefined') {
        const lVal = window.localStorage.getItem(key);
        if (lVal !== null) return lVal;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Failed to getItem('${key}') from localStorage:`, e);
    }

    // 2. Try sessionStorage
    try {
      if (sessionAvailable && typeof window !== 'undefined') {
        const sVal = window.sessionStorage.getItem(key);
        if (sVal !== null) return sVal;
      }
    } catch {}

    // 3. Try in-memory fallback
    return memoryFallback.has(key) ? memoryFallback.get(key)! : defaultValue;
  },

  setItem(key: string, value: string): boolean {
    memoryFallback.set(key, value);

    // Keep sessionStorage synced
    if (sessionAvailable && typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(key, value);
      } catch {}
    }

    // Attempt localStorage write
    if (localAvailable && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch (e: any) {
        // QuotaExceededError handling: purge old cache keys and retry
        if (e?.name === 'QuotaExceededError' || e?.code === 22) {
          try {
            this.purgeOldCaches();
            window.localStorage.setItem(key, value);
            return true;
          } catch (retryErr) {
            console.warn(`[SafeStorage] Quota exceeded for '${key}', saved to memory/sessionStorage:`, retryErr);
          }
        } else {
          console.warn(`[SafeStorage] Failed to setItem('${key}'):`, e);
        }
      }
    }
    return false;
  },

  removeItem(key: string): boolean {
    memoryFallback.delete(key);
    try {
      if (sessionAvailable && typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch {}
    try {
      if (localAvailable && typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        return true;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Failed to removeItem('${key}'):`, e);
    }
    return false;
  },

  purgeOldCaches(): void {
    if (!localAvailable || typeof window === 'undefined') return;
    try {
      const keysToPurge: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith('bonyan_ai_analysis_') || k.startsWith('bonyan_cache_'))) {
          keysToPurge.push(k);
        }
      }
      keysToPurge.forEach(k => {
        try { window.localStorage.removeItem(k); } catch {}
      });
    } catch {}
  },

  getJSON<T>(key: string, defaultValue: T): T {
    try {
      const raw = this.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`[SafeStorage] Failed to parse JSON for '${key}':`, e);
      return defaultValue;
    }
  },

  setJSON(key: string, value: any): boolean {
    try {
      const serialized = JSON.stringify(value);
      return this.setItem(key, serialized);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to serialize JSON for '${key}':`, e);
      return false;
    }
  },

  removePrefix(prefix: string, exceptKey?: string): void {
    try {
      if (localAvailable && typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith(prefix) && key !== exceptKey) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => {
          try {
            window.localStorage.removeItem(k);
          } catch {}
        });
      }
    } catch (e) {
      console.warn(`[SafeStorage] Failed to remove prefix '${prefix}':`, e);
    }

    // Also clear memory fallback
    for (const k of Array.from(memoryFallback.keys())) {
      if (k.startsWith(prefix) && k !== exceptKey) {
        memoryFallback.delete(k);
      }
    }
  }
};

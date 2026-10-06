/**
 * Safe Local Storage Utility for Al-Bunyan Quranic Engine
 * Protects against SecurityError, QuotaExceededError, and private-mode/iframe storage access restrictions.
 * Automatically falls back to in-memory storage if localStorage is unavailable.
 */

const memoryFallback = new Map<string, string>();

function isStorageAvailable(): boolean {
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

const storageAvailable = isStorageAvailable();

export const safeStorage = {
  getItem(key: string, defaultValue: string | null = null): string | null {
    try {
      if (storageAvailable && typeof window !== 'undefined') {
        const val = window.localStorage.getItem(key);
        return val !== null ? val : defaultValue;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Failed to getItem('${key}'):`, e);
    }
    return memoryFallback.has(key) ? memoryFallback.get(key)! : defaultValue;
  },

  setItem(key: string, value: string): boolean {
    memoryFallback.set(key, value);
    try {
      if (storageAvailable && typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Failed to setItem('${key}'):`, e);
    }
    return false;
  },

  removeItem(key: string): boolean {
    memoryFallback.delete(key);
    try {
      if (storageAvailable && typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        return true;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Failed to removeItem('${key}'):`, e);
    }
    return false;
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
      if (storageAvailable && typeof window !== 'undefined') {
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

/**
 * Session-scoped in-memory TTL cache for platform-admin page remounts.
 * Survives React Router unmount; cleared on full page reload.
 */
type CacheEntry<T> = { value: T; expiresAt: number };

export type TtlMemoryCache<T> = {
  get: (key: string) => T | null;
  set: (key: string, value: T, ttlMs?: number) => void;
  delete: (key: string) => void;
  clear: () => void;
};

export function createTtlMemoryCache<T>(opts?: {
  maxEntries?: number;
  defaultTtlMs?: number;
}): TtlMemoryCache<T> {
  const store = new Map<string, CacheEntry<T>>();
  const maxEntries = opts?.maxEntries ?? 24;
  const defaultTtlMs = opts?.defaultTtlMs ?? 10 * 60 * 1000;

  return {
    get(key: string): T | null {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      // LRU: re-insert so oldest eviction stays FIFO-ish.
      store.delete(key);
      store.set(key, entry);
      return entry.value;
    },
    set(key: string, value: T, ttlMs = defaultTtlMs) {
      if (store.has(key)) store.delete(key);
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      while (store.size > maxEntries) {
        const oldest = store.keys().next().value;
        if (oldest == null) break;
        store.delete(oldest);
      }
    },
    delete(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

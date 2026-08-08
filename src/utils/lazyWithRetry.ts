import React from 'react';

const RELOAD_KEY = 'argus:chunk_reload';

/**
 * Like React.lazy, but reloads once when a code-split chunk fails to load
 * (common after a deploy leaves the tab on an old index.html).
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const mod = await factory();
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        /* ignore */
      }
      return mod;
    } catch (err) {
      let alreadyReloaded = false;
      try {
        alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === '1';
      } catch {
        /* ignore */
      }

      if (!alreadyReloaded && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(RELOAD_KEY, '1');
        } catch {
          /* ignore */
        }
        window.location.reload();
        // Keep Suspense pending while the reload starts.
        return new Promise(() => {});
      }

      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        /* ignore */
      }
      throw err;
    }
  });
}

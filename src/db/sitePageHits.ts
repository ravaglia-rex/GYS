/**
 * Fire-and-forget product page-hit beacon (landing, auth, student, school-admin).
 * Skips platform-admin routes. No auth required.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function apiBase(): string | null {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  return base && base.trim() ? base.trim().replace(/\/$/, '') : null;
}

const pageHitLastSent = new Map<string, number>();
const PAGE_HIT_DEDUPE_MS = 30_000;

export async function recordSitePageHit(path: string): Promise<void> {
  const normalized = path.trim().split('?')[0].split('#')[0] || '/';
  if (normalized === '/platform-admin' || normalized.startsWith('/platform-admin/')) return;

  const now = Date.now();
  const prev = pageHitLastSent.get(normalized) ?? 0;
  if (now - prev < PAGE_HIT_DEDUPE_MS) return;
  pageHitLastSent.set(normalized, now);

  const base = apiBase();
  if (!base) return;

  try {
    await axios.post(`${base}/page-hit`, { path: normalized }, { timeout: 4000 });
  } catch {
    pageHitLastSent.delete(normalized);
  }
}

/** Mount once inside BrowserRouter - tracks all product navigations. */
export function SitePageHitTracker() {
  const location = useLocation();
  useEffect(() => {
    void recordSitePageHit(location.pathname);
  }, [location.pathname]);
  return null;
}

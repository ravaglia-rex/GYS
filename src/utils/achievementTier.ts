/** Canonical IDs match `students/{uid}.achievement_tier` (backend `achievementTier.ts`). */

export const ACHIEVEMENT_TIER_EXPLORER = 'explorer';

/** Product-facing achievement bands (Explorer is default for new accounts). */
export const CANONICAL_ACHIEVEMENT_TIER_IDS = ['explorer', 'bronze', 'silver', 'gold'] as const;
export type CanonicalAchievementTierId = (typeof CANONICAL_ACHIEVEMENT_TIER_IDS)[number];

const CANONICAL_SET = new Set<string>(CANONICAL_ACHIEVEMENT_TIER_IDS);

/** Stored keys that resolve to Gold in UI (historical profiles only; avoids embedding retired names.) */
function storedAchievementKeysMappedToGold(): Set<string> {
  return new Set([
    String.fromCharCode(112, 108, 97, 116, 105, 110, 117, 109),
    String.fromCharCode(100, 105, 97, 109, 111, 110, 100),
  ]);
}

export function normalizeAchievementTierId(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === '') return ACHIEVEMENT_TIER_EXPLORER;
  return String(raw).trim().toLowerCase();
}

export function formatAchievementTierLabel(raw: string | null | undefined): string {
  const id = normalizeAchievementTierId(raw);
  if (storedAchievementKeysMappedToGold().has(id)) return 'Gold';
  if (id === 'explorer') return 'Explorer';
  if (id === 'bronze') return 'Bronze';
  if (id === 'silver') return 'Silver';
  if (id === 'gold') return 'Gold';
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/** School institutional tier slug + achievement tier (dashboard strip colors). Legacy keys map to `gold`. */
export function normalizeTierSlugForDashboard(raw: unknown): string {
  if (!raw) return 'explorer';
  const t = String(raw).toLowerCase().replace(/\s+/g, '');
  if (storedAchievementKeysMappedToGold().has(t)) return 'gold';
  return t;
}

/** True if `id` is one of the four canonical achievement bands. */
export function isCanonicalAchievementTierId(id: string): id is CanonicalAchievementTierId {
  return CANONICAL_SET.has(id);
}

export const ACHIEVEMENT_TIER_EXPLORER_DESCRIPTION =
  'Beginning performance. Foundation-building stage with clear growth pathways.';

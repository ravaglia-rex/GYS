/** Canonical IDs match `students/{uid}.achievement_tier` (backend `achievementTier.ts`). */

export const ACHIEVEMENT_TIER_EXPLORER = 'explorer';

/** Nationwide GYS performance tiers (Explorer is default for new accounts). */
export const CANONICAL_ACHIEVEMENT_TIER_IDS = [
  'explorer',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
] as const;
export type CanonicalAchievementTierId = (typeof CANONICAL_ACHIEVEMENT_TIER_IDS)[number];

const CANONICAL_SET = new Set<string>(CANONICAL_ACHIEVEMENT_TIER_IDS);

export function normalizeAchievementTierId(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === '') return ACHIEVEMENT_TIER_EXPLORER;
  const s = String(raw).trim().toLowerCase();
  if (CANONICAL_SET.has(s)) return s;
  return ACHIEVEMENT_TIER_EXPLORER;
}

export function formatAchievementTierLabel(raw: string | null | undefined): string {
  const id = normalizeAchievementTierId(raw);
  if (id === 'explorer') return 'Explorer';
  if (id === 'bronze') return 'Bronze';
  if (id === 'silver') return 'Silver';
  if (id === 'gold') return 'Gold';
  if (id === 'platinum') return 'Platinum';
  if (id === 'diamond') return 'Diamond';
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/** School institutional performance tier slug (dashboard hero strip colors). */
export function normalizeTierSlugForDashboard(raw: unknown): string {
  if (!raw) return 'explorer';
  const t = String(raw).toLowerCase().replace(/\s+/g, '');
  const known = CANONICAL_ACHIEVEMENT_TIER_IDS as readonly string[];
  if (known.includes(t)) return t;
  return 'explorer';
}

/** True if `id` is one of the four canonical achievement bands. */
export function isCanonicalAchievementTierId(id: string): id is CanonicalAchievementTierId {
  return CANONICAL_SET.has(id);
}

export const ACHIEVEMENT_TIER_EXPLORER_DESCRIPTION =
  'Beginning performance. Foundation-building stage with clear growth pathways.';

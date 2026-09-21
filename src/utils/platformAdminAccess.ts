/** Head admin — sole access to Admin Management. */
export const PLATFORM_ADMIN_HEAD_EMAIL = 'srishti@argus.ai';

/** Full operational super access (pipelines, billing, deletes). Not Admin Management. */
export const PLATFORM_ADMIN_SUPER_EMAILS = new Set([
  PLATFORM_ADMIN_HEAD_EMAIL,
  'michael@argus.ai',
]);

export function normalizePlatformAdminEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function isPlatformAdminHeadEmail(email: unknown): boolean {
  return normalizePlatformAdminEmail(email) === PLATFORM_ADMIN_HEAD_EMAIL;
}

export function isPlatformAdminSuperEmail(email: unknown): boolean {
  const normalized = normalizePlatformAdminEmail(email);
  return Boolean(normalized) && PLATFORM_ADMIN_SUPER_EMAILS.has(normalized);
}

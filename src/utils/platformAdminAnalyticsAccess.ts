/** Platform usage Analytics — only these platform admins (not all members). */
export const PLATFORM_ADMIN_ANALYTICS_EMAILS = new Set([
  'srishti@argus.ai',
  'michael@argus.ai',
]);

export function canAccessPlatformAdminAnalytics(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return Boolean(normalized) && PLATFORM_ADMIN_ANALYTICS_EMAILS.has(normalized);
}

/**
 * Canonical Standard-tier copy is ₹3 lakh/yr. Older school documents may still store "3.5 lakh".
 * Use this anywhere subscription_plan / plan is shown in the school admin UI.
 */
export function displaySubscriptionPlan(raw: unknown): string {
  if (raw == null) return 'Standard Subscription';
  let s = String(raw).trim();
  if (!s) return 'Standard Subscription';
  s = s.replace(/₹\s*3\.5\s+lakh/gi, '₹3 lakh');
  s = s.replace(/\b3\.5\s+lakh\b/gi, '3 lakh');
  return s;
}

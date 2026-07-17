/** Location state when redirecting from an expired/invalid Firebase password link. */
export type AuthLinkExpiredFlow = "resetPassword" | "setupPassword";

export type AuthLinkExpiredLocationState = {
  authLinkExpired: true;
  flow: AuthLinkExpiredFlow;
};

export function isAuthLinkExpiredState(state: unknown): state is AuthLinkExpiredLocationState {
  if (!state || typeof state !== "object") return false;
  const s = state as Record<string, unknown>;
  return (
    s.authLinkExpired === true &&
    (s.flow === "resetPassword" || s.flow === "setupPassword")
  );
}

/**
 * Firebase may append mode + oobCode to the query string, or (in some redirects) to the hash.
 * Argus custom password links use `token=` instead of Firebase `oobCode`.
 * Parse both so /auth/action never flashes "Invalid Action" before useEffect runs.
 */
export function parseFirebaseAuthActionParams(search: string, hash: string) {
  const fromParams = (params: URLSearchParams) => ({
    mode: params.get("mode"),
    oobCode: params.get("oobCode"),
    token: params.get("token"),
  });

  let { mode, oobCode, token } = fromParams(new URLSearchParams(search));

  if (!mode || (!oobCode && !token)) {
    const raw = (hash.startsWith("#") ? hash.slice(1) : hash).trim();
    if (raw) {
      const queryPart = raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : raw;
      const fromHash = fromParams(new URLSearchParams(queryPart));
      mode = mode || fromHash.mode;
      oobCode = oobCode || fromHash.oobCode;
      token = token || fromHash.token;
    }
  }

  return { mode, oobCode, token };
}

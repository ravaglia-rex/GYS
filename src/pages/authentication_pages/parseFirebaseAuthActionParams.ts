/**
 * Firebase may append mode + oobCode to the query string, or (in some redirects) to the hash.
 * Parse both so /auth/action never flashes "Invalid Action" before useEffect runs.
 */
export function parseFirebaseAuthActionParams(search: string, hash: string) {
  const fromParams = (params: URLSearchParams) => ({
    mode: params.get("mode"),
    oobCode: params.get("oobCode"),
  });

  let { mode, oobCode } = fromParams(new URLSearchParams(search));

  if (!mode || !oobCode) {
    const raw = (hash.startsWith("#") ? hash.slice(1) : hash).trim();
    if (raw) {
      const queryPart = raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : raw;
      const fromHash = fromParams(new URLSearchParams(queryPart));
      mode = mode || fromHash.mode;
      oobCode = oobCode || fromHash.oobCode;
    }
  }

  return { mode, oobCode };
}

/** Firestore school IDs used for demos / internal testing  -  shown in admin with a Test label. */
export const PLATFORM_ADMIN_TEST_SCHOOL_IDS = new Set([
  'g2TwMLddS4LzfHtC1v1Y', // Sri Sri Academy
  'cglhIXdBBB5UCv4ebIxO', // DPS Delhi
  'EbEOKpiWouoPP8JhyPxO',
]);

export function isPlatformAdminTestSchool(schoolId: string | null | undefined): boolean {
  if (!schoolId) return false;
  return PLATFORM_ADMIN_TEST_SCHOOL_IDS.has(schoolId);
}

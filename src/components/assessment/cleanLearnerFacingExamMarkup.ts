/**
 * Bank items sometimes ship accessibility HTML (`<details>` / `<summary>`) inside
 * markdown/prompt strings. ReactMarkdown does not render raw HTML by default, so
 * tags appear as literal text. Clean that up for learners.
 */
export function cleanLearnerFacingExamMarkup(raw: string): string {
  if (!raw) return raw;

  const detailsBlock =
    /<details\b[^>]*>\s*<summary\b[^>]*>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/gi;

  const withoutDetails = raw.replace(detailsBlock, '').trim();
  const hasVisual =
    /<img\b|<svg\b|!\[[^\]]*]\(/i.test(withoutDetails) ||
    /<img\b|<svg\b|!\[[^\]]*]\(/i.test(raw);

  // When figures/images are present, drop the screen-reader block entirely.
  // When they are not, keep the inner description so options are still readable.
  let out = hasVisual && withoutDetails.length > 0
    ? withoutDetails
    : raw
        .replace(detailsBlock, (_m, body: string) => String(body ?? '').trim())
        .replace(/<\/?details\b[^>]*>/gi, '')
        .replace(/<\/?summary\b[^>]*>/gi, '');

  // Strip any leftover orphan accessibility tags.
  out = out
    .replace(/<\/?details\b[^>]*>/gi, '')
    .replace(/<\/?summary\b[^>]*>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return out.length > 0 ? out : raw.trim();
}

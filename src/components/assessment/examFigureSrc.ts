/**
 * Bank markdown ships relative `assets/….svg` paths (item_/cal_/vw2_/nssw1_/…).
 * Those resolve against the current page URL, so item bank
 * (`/platform-admin/item-bank`) and search completions
 * (`/platform-admin/analytics/official`) fetch different - usually 404 - files.
 * Slice parsing then fails and option crops blow up.
 *
 * Map those onto the same-origin public copies under /question-assets/.
 */
const QUESTION_ASSETS_PREFIX = '/question-assets/';
const AR_L1_DIR = `${QUESTION_ASSETS_PREFIX}analytical_reasoning_l1/`;
const AR_L1_ASSET_EXT = '(?:apng|avif|bmp|gif|jpe?g|png|svg|webp)';
const AR_L1_RELATIVE_ASSET = new RegExp(`^assets\\/[^/]+\\.${AR_L1_ASSET_EXT}$`, 'i');
const AR_L1_PUBLIC_FILE = new RegExp(
  `^(?:item_|cal_|vw[23]_|nssw1_|ssw[12]_|AR-L1-)[^/]+\\.${AR_L1_ASSET_EXT}$`,
  'i'
);

function pathOnly(src: string): string {
  return src.trim().split('#')[0].split('?')[0];
}

function fileName(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || '';
}

export function resolveExamFigureSrc(src: string | undefined | null): string {
  if (!src) return '';
  const raw = src.trim();
  if (!raw) return '';
  const path = pathOnly(raw).replace(/\\/g, '/');
  const qIdx = path.indexOf(QUESTION_ASSETS_PREFIX);
  if (qIdx >= 0) return path.slice(qIdx);

  const file = fileName(path);
  if (AR_L1_RELATIVE_ASSET.test(path) || AR_L1_PUBLIC_FILE.test(file)) {
    return `${AR_L1_DIR}${file}`;
  }
  return raw;
}

export function rewriteExamMarkdownFigureUrls(markdown: string): string {
  if (!markdown) return markdown;
  return markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_all, alt: string, url: string) => {
    return `![${alt}](${resolveExamFigureSrc(url)})`;
  });
}

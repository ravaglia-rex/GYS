/**
 * Bank items sometimes ship accessibility HTML (`<details>` / `<summary>`) inside
 * markdown/prompt strings. ReactMarkdown does not render raw HTML by default, so
 * tags appear as literal text. Clean that up for learners.
 */
import { rewriteExamMarkdownFigureUrls } from './examFigureSrc';

const DETAILS_BLOCK = /<details\b[^>]*>[\s\S]*?<\/details>/gi;
const DETAILS_OR_SUMMARY_TAG = /<\/?(?:details|summary)\b[^>]*>/gi;
/** Leftover chrome after a screen-reader options block (e.g. "Which row…?" / "OPTIONS"). */
const ORPHAN_OPTION_CAPTION =
  /^(?:OPTIONS|Which\s+(?:row|option|choice|figure|diagram)\b[^?\n]*\??)\s*$/i;

/**
 * Drop a trailing option-intro line when the stem already asked a question and a
 * `<details>` accessibility block was removed (IF-07 style: real Q + orphan "Which row…?").
 */
function stripOrphanOptionCaptionAfterDetails(text: string, removedDetails: boolean): string {
  if (!removedDetails) return text;
  const parts = text
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .split(/\n\n+/);
  if (parts.length < 2) return text;
  const last = (parts[parts.length - 1] || '').trim();
  if (!ORPHAN_OPTION_CAPTION.test(last)) return text;
  const before = parts.slice(0, -1).join('\n\n');
  if (!/[?？]\s*$/.test(before.trim()) && !/[?？]/.test(before)) return text;
  return before.trim();
}

export function cleanLearnerFacingExamMarkup(raw: string): string {
  if (!raw) return raw;

  const hadDetails = DETAILS_BLOCK.test(raw) || /<details\b/i.test(raw);
  DETAILS_BLOCK.lastIndex = 0;

  let withoutDetails = raw.replace(DETAILS_BLOCK, '');
  if (/<details\b/i.test(withoutDetails)) {
    withoutDetails = withoutDetails.replace(/<details\b[\s\S]*$/i, '');
  }
  if (/<summary\b/i.test(withoutDetails)) {
    withoutDetails = withoutDetails.replace(/<summary\b[\s\S]*$/i, '');
  }
  withoutDetails = withoutDetails.replace(DETAILS_OR_SUMMARY_TAG, '').trim();

  // If the item already has visible content, drop the screen-reader block.
  // Only inline the inner description when the entire string *was* that block.
  let out = withoutDetails;
  if (!out) {
    out = raw
      .replace(DETAILS_BLOCK, (block) =>
        block
          .replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, '')
          .replace(DETAILS_OR_SUMMARY_TAG, '')
          .trim()
      )
      .replace(DETAILS_OR_SUMMARY_TAG, '');
  }

  out = stripOrphanOptionCaptionAfterDetails(out, hadDetails);
  out = rewriteExamMarkdownFigureUrls(out.replace(/\n{3,}/g, '\n\n').trim());
  return out.length > 0 ? out : rewriteExamMarkdownFigureUrls(raw.trim());
}

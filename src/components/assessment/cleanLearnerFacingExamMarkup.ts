/**
 * Bank items sometimes ship accessibility HTML (`<details>` / `<summary>`) inside
 * markdown/prompt strings. ReactMarkdown does not render raw HTML by default, so
 * tags appear as literal text. Clean that up for learners.
 */
import { rewriteExamMarkdownFigureUrls } from './examFigureSrc';

const DETAILS_BLOCK = /<details\b[^>]*>[\s\S]*?<\/details>/gi;
const DETAILS_OR_SUMMARY_TAG = /<\/?(?:details|summary)\b[^>]*>/gi;

export function cleanLearnerFacingExamMarkup(raw: string): string {
  if (!raw) return raw;

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

  out = rewriteExamMarkdownFigureUrls(out.replace(/\n{3,}/g, '\n\n').trim());
  return out.length > 0 ? out : rewriteExamMarkdownFigureUrls(raw.trim());
}

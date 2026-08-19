import { cleanLearnerFacingExamMarkup } from './cleanLearnerFacingExamMarkup';
import { resolveExamFigureSrc } from './examFigureSrc';
import { mergeExamPromptMarkdown } from './ExamMarkdown';
import {
  allLetterKeyOptions,
  isPlaceholderOptionText,
  optionChoicesFromStimulus,
  optionFigureFromAssets,
  splitArImageBySrc,
  splitArOptionFigure,
  splitLastArImageAsOptionFigure,
  splitLearnerExamChoices,
  type ArOptionFigureRef,
} from './arOptionFigureModel';

function stripOptionLetterPrefix(option: string): string {
  return String(option ?? '').replace(/^[A-D][.)]\s+/i, '').trim();
}

function hasRealChoiceText(texts: Array<string | undefined> | null | undefined): boolean {
  return Boolean(texts?.some((t, i) => t && !isPlaceholderOptionText(t, i)));
}

function looksLikeStoredOptionFigure(fig: { src: string; alt?: string } | null): boolean {
  if (!fig) return false;
  const haystack = `${fig.src} ${fig.alt ?? ''}`;
  if (/(?:composite|cycle)_matrix/i.test(haystack) || /followed by\s+.+answer cards/i.test(haystack)) {
    return false;
  }
  return /\b(option|options|choice|choices|answer|answers|possible)\b/i.test(
    haystack
  );
}

function assetAlreadyReferenced(markdown: string, path: string): boolean {
  const normalized = path.trim();
  if (!normalized) return true;
  const file = normalized.replace(/\\/g, '/').split('/').pop() ?? '';
  return markdown.includes(normalized) || Boolean(file && markdown.includes(file));
}

function stemAssetMarkdown(
  assets: Array<{ path?: string; alt?: string }> | null | undefined,
  existingMarkdown: string
): string {
  if (!assets?.length) return '';
  return assets
    .filter((asset) => {
      const path = asset.path?.trim();
      if (!path || assetAlreadyReferenced(existingMarkdown, path)) return false;
      return !looksLikeStoredOptionFigure({ src: path, alt: asset.alt ?? '' });
    })
    .map((asset) => `![${asset.alt ?? 'Question figure'}](${asset.path})`)
    .join('\n\n');
}

export type ResolvedLearnerExamOptions = {
  stemMarkdown: string;
  optionFigure: ArOptionFigureRef | null;
  optionTexts: string[];
  pickOnFigure: boolean;
  hasRealOptionText: boolean;
};

/**
 * Shared option/stem resolution for student exams, item bank, analytics, and reports.
 * New bank items that use A–D lists, option figures, or option tables go through this path.
 */
export function resolveLearnerExamOptions(input: {
  markdown?: string | null;
  stimulus?: unknown;
  stimulusType?: string | null;
  bankOptions?: string[] | null;
  assets?: Array<{ path?: string; alt?: string }> | null;
  optionFigure?: { src: string; alt?: string } | null;
}): ResolvedLearnerExamOptions {
  const rawPrompt = input.markdown ?? '';
  const merged = mergeExamPromptMarkdown(rawPrompt, input.stimulus, input.stimulusType);
  const assetMarkdown = stemAssetMarkdown(input.assets, merged);
  const combined = cleanLearnerFacingExamMarkup(
    assetMarkdown ? `${merged}\n\n${assetMarkdown}` : merged
  );
  const splitFig = splitArOptionFigure(combined);
  const fromAssets = optionFigureFromAssets(input.assets);
  const storedFig = input.optionFigure?.src
    ? { src: input.optionFigure.src, alt: input.optionFigure.alt ?? '' }
    : null;
  const trustedStoredFig = looksLikeStoredOptionFigure(storedFig) ? storedFig : null;
  const splitStoredFig = trustedStoredFig ? splitArImageBySrc(combined, trustedStoredFig.src) : null;
  let optionFigureRaw = trustedStoredFig ?? splitFig.optionFigure ?? fromAssets;
  let withoutFigure =
    trustedStoredFig && splitStoredFig?.optionFigure
      ? splitStoredFig.stemMarkdown
      : optionFigureRaw && splitFig.optionFigure
        ? splitFig.stemMarkdown
        : combined;
  const splitChoices = splitLearnerExamChoices(withoutFigure);
  const fromStimulus = optionChoicesFromStimulus(input.stimulus);
  const bank = (input.bankOptions ?? []).map((t, i) => {
    const cleaned = stripOptionLetterPrefix(cleanLearnerFacingExamMarkup(t));
    return cleaned && !isPlaceholderOptionText(cleaned, i) ? cleaned : '';
  });
  const embedded = hasRealChoiceText(splitChoices.choices)
    ? splitChoices.choices
    : fromStimulus;
  const count = Math.max(bank.length, embedded?.length ?? 0, 2);
  const optionTexts = Array.from({ length: count }, (_, i) => {
    if (bank[i]) return bank[i];
    return stripOptionLetterPrefix(cleanLearnerFacingExamMarkup(embedded?.[i] || ''));
  });
  const realText = hasRealChoiceText(optionTexts);
  const bankKeysOnly = allLetterKeyOptions(
    (input.bankOptions?.length ? input.bankOptions : optionTexts).map(
      (t, i) => t || String.fromCharCode(65 + i)
    )
  );
  if (!optionFigureRaw && !realText && bankKeysOnly) {
    const fallbackFig = splitLastArImageAsOptionFigure(combined);
    if (fallbackFig.optionFigure) {
      optionFigureRaw = fallbackFig.optionFigure;
      withoutFigure = fallbackFig.stemMarkdown;
    }
  }
  const optionFigure = optionFigureRaw
    ? { ...optionFigureRaw, src: resolveExamFigureSrc(optionFigureRaw.src) }
    : null;
  const pickOnFigure = Boolean(optionFigure && !realText && bankKeysOnly);
  const stemMarkdown = realText || pickOnFigure ? splitChoices.stemMarkdown : withoutFigure;

  return {
    stemMarkdown,
    optionFigure,
    optionTexts,
    pickOnFigure,
    hasRealOptionText: realText,
  };
}

export function resolvedOptionTextsForItem(q: {
  prompt?: string;
  prompt_preview?: string;
  stimulus?: unknown;
  stimulus_type?: string | null;
  options?: Array<{ text?: string } | string> | null;
}): string[] {
  const bank = (q.options || []).map((o) => (typeof o === 'string' ? o : o.text || ''));
  const resolved = resolveLearnerExamOptions({
    markdown: q.prompt || q.prompt_preview || '',
    stimulus: q.stimulus,
    stimulusType: q.stimulus_type,
    bankOptions: bank,
  });
  return Array.from({ length: Math.max(bank.length, resolved.optionTexts.length) }, (_, i) => {
    return resolved.optionTexts[i] || bank[i] || '';
  });
}

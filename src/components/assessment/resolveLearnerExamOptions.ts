import { cleanLearnerFacingExamMarkup } from './cleanLearnerFacingExamMarkup';
import { resolveExamFigureSrc } from './examFigureSrc';
import { mergeExamPromptMarkdown } from './ExamMarkdown';
import {
  isPlaceholderOptionText,
  optionChoicesFromStimulus,
  splitArImageBySrc,
  splitLearnerExamChoices,
  type ArOptionFigureRef,
} from './arOptionFigureModel';

function stripOptionLetterPrefix(option: string): string {
  return String(option ?? '').replace(/^[A-D][.)]\s+/i, '').trim();
}

/** Drop markdown code spans bank authors wrap around symbol rows (`▲ △ …`). */
function stripWrappingCodeFence(option: string): string {
  const t = String(option ?? '').trim();
  const m = t.match(/^`([^`]+)`$/);
  return m ? m[1].trim() : t;
}

function cleanOptionText(option: string): string {
  return stripWrappingCodeFence(
    stripOptionLetterPrefix(cleanLearnerFacingExamMarkup(option))
  );
}

function hasRealChoiceText(texts: Array<string | undefined> | null | undefined): boolean {
  return Boolean(texts?.some((t, i) => t && !isPlaceholderOptionText(t, i)));
}

function sameAssetPath(a: string, b: string): boolean {
  const fileOf = (p: string) =>
    p.trim().split('?')[0].split('#')[0].replace(/\\/g, '/').split('/').pop() || '';
  const na = a.trim();
  const nb = b.trim();
  if (!na || !nb) return false;
  return na === nb || fileOf(na) === fileOf(nb);
}

function assetAlreadyReferenced(markdown: string, path: string): boolean {
  const normalized = path.trim();
  if (!normalized) return true;
  const file = normalized.replace(/\\/g, '/').split('/').pop() ?? '';
  return markdown.includes(normalized) || Boolean(file && markdown.includes(file));
}

function stemAssetMarkdown(
  assets: Array<{ path?: string; alt?: string }> | null | undefined,
  existingMarkdown: string,
  optionFigureSrc: string | null
): string {
  if (!assets?.length) return '';
  return assets
    .filter((asset) => {
      const path = asset.path?.trim();
      if (!path || assetAlreadyReferenced(existingMarkdown, path)) return false;
      // Skip the bank's explicit option figure — do not re-inject it into the stem.
      if (optionFigureSrc && sameAssetPath(path, optionFigureSrc)) return false;
      return true;
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
  displayMode: 'figure_tiles' | 'letter_buttons' | 'text_options' | null;
};

/**
 * Shared option/stem resolution for student exams, item bank, analytics, and reports.
 * Bank fields are the source of truth: `display_mode` + `option_figure` (no filename heuristics).
 */
export function resolveLearnerExamOptions(input: {
  markdown?: string | null;
  stimulus?: unknown;
  stimulusType?: string | null;
  bankOptions?: string[] | null;
  assets?: Array<{ path?: string; alt?: string }> | null;
  optionFigure?: { src: string; alt?: string } | null;
  displayMode?: 'figure_tiles' | 'letter_buttons' | 'text_options' | null;
}): ResolvedLearnerExamOptions {
  const rawPrompt = input.markdown ?? '';
  const merged = mergeExamPromptMarkdown(rawPrompt, input.stimulus, input.stimulusType);
  const storedFig = input.optionFigure?.src
    ? { src: input.optionFigure.src, alt: input.optionFigure.alt ?? '' }
    : null;
  const assetMarkdown = stemAssetMarkdown(input.assets, merged, storedFig?.src ?? null);
  const combined = cleanLearnerFacingExamMarkup(
    assetMarkdown ? `${merged}\n\n${assetMarkdown}` : merged
  );
  const displayMode = input.displayMode ?? null;
  // text_options: keep the full markdown figure in the stem. figure_tiles: peel
  // the bank's option_figure out of the stem. Never invent an option figure.
  const peelOptionFigure = displayMode === 'figure_tiles' && Boolean(storedFig?.src);
  let withoutFigure = combined;
  if (peelOptionFigure && storedFig?.src) {
    const splitBySrc = splitArImageBySrc(combined, storedFig.src);
    if (splitBySrc.optionFigure) {
      withoutFigure = splitBySrc.stemMarkdown;
    }
  }
  const splitChoices = splitLearnerExamChoices(withoutFigure);
  const fromStimulus = optionChoicesFromStimulus(input.stimulus);
  const bank = (input.bankOptions ?? []).map((t, i) => {
    const cleaned = cleanOptionText(t);
    return cleaned && !isPlaceholderOptionText(cleaned, i) ? cleaned : '';
  });
  const embedded = hasRealChoiceText(splitChoices.choices)
    ? splitChoices.choices
    : fromStimulus;
  const count = Math.max(bank.length, embedded?.length ?? 0, 2);
  const optionTexts = Array.from({ length: count }, (_, i) => {
    if (bank[i]) return bank[i];
    return cleanOptionText(embedded?.[i] || '');
  });
  const realText = hasRealChoiceText(optionTexts);
  const optionFigure =
    displayMode === 'figure_tiles' && storedFig
      ? { ...storedFig, src: resolveExamFigureSrc(storedFig.src) }
      : null;
  const pickOnFigure = displayMode === 'figure_tiles' && Boolean(optionFigure);

  // Always drop an extracted A–D list from the stem — including placeholder-only
  // labels like "Cover A" / "Diagram B". Leaving them in shows a redundant
  // bullet list under figures or ascii option panels (IF10 tray covers, etc.).
  const stemMarkdown = splitChoices.choices ? splitChoices.stemMarkdown : withoutFigure;

  return {
    stemMarkdown,
    optionFigure,
    optionTexts,
    pickOnFigure,
    hasRealOptionText: realText,
    displayMode,
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

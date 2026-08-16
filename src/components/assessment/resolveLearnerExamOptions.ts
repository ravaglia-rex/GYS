import { cleanLearnerFacingExamMarkup } from './cleanLearnerFacingExamMarkup';
import { markdownFromStimulus } from './ExamMarkdown';
import {
  allLetterKeyOptions,
  isPlaceholderOptionText,
  optionChoicesFromStimulus,
  optionFigureFromAssets,
  splitArOptionFigure,
  splitLearnerExamChoices,
  type ArOptionFigureRef,
} from './arOptionFigureModel';

function stripOptionLetterPrefix(option: string): string {
  return String(option ?? '').replace(/^[A-D][.)]\s+/i, '').trim();
}

function hasRealChoiceText(texts: Array<string | undefined> | null | undefined): boolean {
  return Boolean(texts?.some((t, i) => t && !isPlaceholderOptionText(t, i)));
}

export type ResolvedLearnerExamOptions = {
  stemMarkdown: string;
  optionFigure: ArOptionFigureRef | null;
  optionTexts: string[];
  pickOnFigure: boolean;
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
}): ResolvedLearnerExamOptions {
  const rawPrompt = input.markdown ?? '';
  const stimMd = markdownFromStimulus(input.stimulus, input.stimulusType);
  const combined = cleanLearnerFacingExamMarkup(
    stimMd.length > rawPrompt.length ? stimMd : rawPrompt
  );
  const splitFig = splitArOptionFigure(combined);
  const optionFigure = splitFig.optionFigure ?? optionFigureFromAssets(input.assets);
  const withoutFigure = optionFigure ? splitFig.stemMarkdown : combined;
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
  const pickOnFigure = Boolean(optionFigure && !realText && bankKeysOnly);
  const stemMarkdown = realText && !pickOnFigure ? splitChoices.stemMarkdown : withoutFigure;

  return {
    stemMarkdown,
    optionFigure,
    optionTexts,
    pickOnFigure,
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

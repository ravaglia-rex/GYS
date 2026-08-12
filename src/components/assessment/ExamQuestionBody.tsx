import React, { useRef, useState, useCallback } from 'react';
import { Box, Typography, FormControl, FormControlLabel, RadioGroup, Radio, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import type { ExamQuestion } from '../../db/assessmentCollection';
import { resolvePracticeItemId } from '../practice/practiceModeConfig';
import { ExamMathBlock, ExamMathText } from './ExamMathText';
import { QuestionProblemReport, type QuestionReportFrame } from './QuestionProblemReport';
import { inferQuestionInteraction } from './inferQuestionInteraction';

export { inferQuestionInteraction } from './inferQuestionInteraction';

const LIKERT_LEFT = 'Strongly disagree';
const LIKERT_MID = 'Neutral';
const LIKERT_RIGHT = 'Strongly agree';

/** Secondary stem line (canonical `presentation.instruction`). */
const InstructionLine: React.FC<{ text: string }> = ({ text }) => (
  <Typography variant="body2" sx={{ color: '#475569', mb: 2, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
    {text}
  </Typography>
);

function plainSetupTextBeforePrompt(q: ExamQuestion): string | null {
  const stimulus = q.stimulus;
  if (typeof stimulus !== 'object' || stimulus === null || Array.isArray(stimulus)) return null;
  const setup = (stimulus as Record<string, unknown>).setup;
  if (typeof setup !== 'string') return null;
  const text = setup.trim();
  if (!text) return null;

  const prompt = (q.prompt ?? '').trim();
  if (prompt) {
    const setupNorm = normalizeStemCompare(text);
    const promptNorm = normalizeStemCompare(prompt);
    if (setupNorm === promptNorm || promptNorm.includes(setupNorm)) return null;
  }

  return text;
}

const QuestionPromptBlock: React.FC<{
  question: ExamQuestion;
  renderMath?: boolean;
  mathSx: React.ComponentProps<typeof Box>['sx'];
  typographySx: React.ComponentProps<typeof Typography>['sx'];
  typographyVariant?: React.ComponentProps<typeof Typography>['variant'];
}> = ({ question, renderMath = false, mathSx, typographySx, typographyVariant = 'body1' }) => {
  const setupText = plainSetupTextBeforePrompt(question);
  const promptText = examPromptWithoutRedundantRuleBlock(question);
  const setupSx = {
    color: '#334155',
    fontSize: { xs: '0.95rem', sm: '1rem' },
    lineHeight: 1.6,
    mb: 1.25,
    whiteSpace: 'pre-line',
  };

  return (
    <>
      {setupText ? (
        renderMath ? (
          <Box sx={setupSx}>
            <ExamMathText inline={false} sx={{ whiteSpace: 'pre-line' }}>{setupText}</ExamMathText>
          </Box>
        ) : (
          <Typography sx={setupSx}>{setupText}</Typography>
        )
      ) : null}
      {renderMath ? (
        <Box sx={mathSx}>
          <ExamMathText inline={false} sx={{ whiteSpace: 'pre-line' }}>{promptText}</ExamMathText>
        </Box>
      ) : (
        <Typography variant={typographyVariant} sx={typographySx}>
          {promptText}
        </Typography>
      )}
    </>
  );
};

function humanizeFieldKey(key: string): string {
  const spaced = key.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Bank options sometimes keep authored "A. "/"B) " keys; UI badges are display-order A–D. */
function stripEmbeddedOptionLetterPrefix(option: string): string {
  return String(option ?? '').replace(/^[A-D][.)]\s+/i, '').trim();
}

function isBareOptionLetterCell(cell: string): boolean {
  return /^[A-D]\.?$/i.test(cell.trim());
}

function formatStimulusLeafValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) {
    return value.map((x) => (typeof x === 'object' && x !== null ? JSON.stringify(x) : String(x))).join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function normalizeStemCompare(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** `X→Y` edges for logic items; skips plain ASCII letter pairs (e.g. stray “word→word”). */
function extractLogicTransitionSet(text: string): Set<string> {
  const out = new Set<string>();
  const re = /(\S)\s*→\s*(\S)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const a = m[1];
    const b = m[2];
    const asciiLetter = (c: string) => /^[a-zA-Z]$/.test(c);
    if (asciiLetter(a) || asciiLetter(b)) continue;
    out.add(`${a}→${b}`);
  }
  return out;
}

/** Internal delimiter after normalizing `\rightarrow`, `->`, etc. (not expected in authored math). */
const ARROW_TOKEN = '\u2192';

function unifyArrowSyntax(text: string): string {
  return text
    .replace(/\\rightarrow\b/gi, ARROW_TOKEN)
    .replace(/\\Rightarrow\b/gi, ARROW_TOKEN)
    .replace(/\\to\b/gi, ARROW_TOKEN)
    .replace(/⇒/g, ARROW_TOKEN)
    .replace(/->/g, ARROW_TOKEN)
    .replace(/→/g, ARROW_TOKEN);
}

/**
 * TeX fragments so prose around “Rule:” does not break arrow-token splits.
 * Banks use `$...$`, `\\(...\\)`, or `\\[...\\]` (see {@link ExamMathText}).
 */
function texMathFragmentsOrFullText(text: string): string {
  const inner: string[] = [];
  let m: RegExpExecArray | null;
  const dollar = /\$([^$]+)\$/g;
  while ((m = dollar.exec(text)) !== null) {
    if (m[1]?.trim()) inner.push(m[1].trim());
  }
  const paren = /\\\(([\s\S]*?)\\\)/g;
  while ((m = paren.exec(text)) !== null) {
    if (m[1]?.trim()) inner.push(m[1].trim());
  }
  const brack = /\\\[([\s\S]*?)\\\]/g;
  while ((m = brack.exec(text)) !== null) {
    if (m[1]?.trim()) inner.push(m[1].trim());
  }
  return inner.length > 0 ? inner.join('\n') : text;
}

function cleanRuleEdgeToken(p: string): string {
  return normalizeStemCompare(
    p
      .replace(/\$/g, '')
      .replace(/\\\(/g, '')
      .replace(/\\\)/g, '')
      .replace(/\\\[/g, '')
      .replace(/\\\]/g, '')
      .trim()
  );
}

/**
 * One endpoint of `… → …` after splitting a chain. Prose like “Rule: … forward: ■” must resolve to `■`, not the whole prefix.
 */
function arrowEdgeTokenFromPiece(piece: string): string {
  let s = piece.replace(/^rule\s*\d*\s*:\s*/i, '').trim();
  s = s.replace(/^\$|\$$/g, '').trim();
  if (!s) return '';
  const flat = cleanRuleEdgeToken(s);
  if (flat && flat.length <= 40 && !flat.includes(':') && !flat.includes(' ')) {
    return flat;
  }
  const words = s.split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  let last = words[words.length - 1];
  last = last.replace(/^[('"($]+/, '').replace(/[.,;:)+?'"`]+$/g, '');
  return normalizeStemCompare(last);
}

/**
 * Directed edges from `A → B` chains and comma-separated pairs (LaTeX-safe: `\Delta \rightarrow \Box`).
 * Used to detect when `presentation.instruction` repeats `stimulus.rules` under “Apply these rules”.
 */
function tokenSequenceEdges(text: string): Set<string> {
  const edges = new Set<string>();
  const core = unifyArrowSyntax(texMathFragmentsOrFullText(text));
  const segments = core.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
  for (const segRaw of segments) {
    const seg = segRaw.replace(/^rule\s*\d*\s*:\s*/i, '').replace(/^\$|\$$/g, '').trim();
    if (!seg.includes(ARROW_TOKEN)) continue;
    const rawParts = seg.split(ARROW_TOKEN).map((p) => p.trim()).filter(Boolean);
    if (rawParts.length < 2) continue;
    const parts = rawParts.map((p) => arrowEdgeTokenFromPiece(p)).filter(Boolean);
    if (parts.length < 2) continue;
    for (let i = 0; i < parts.length - 1; i++) {
      edges.add(`${parts[i]}→${parts[i + 1]}`);
    }
  }
  return edges;
}

function sameStringSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  const keys = Array.from(a);
  for (let i = 0; i < keys.length; i++) {
    if (!b.has(keys[i])) return false;
  }
  return true;
}

type StimulusRulesCtx = { joined: string; rulesArr: string[] };

function gatherStimulusRulesContext(q: ExamQuestion): StimulusRulesCtx | null {
  const stimulus = q.stimulus;
  if (typeof stimulus !== 'object' || stimulus === null || Array.isArray(stimulus)) return null;
  const obj = stimulus as Record<string, unknown>;
  if (shouldHideSharedLearnerRule(q.stimulus_type, obj, q.prompt, q.instruction)) return null;
  const rulesRaw = obj.rules;
  const rulesArr = Array.isArray(rulesRaw)
    ? rulesRaw.map((r) => String(r ?? '').trim()).filter(Boolean)
    : [];
  if (!rulesArr.length) return null;
  return { joined: rulesArr.join('\n'), rulesArr };
}

function bankRuleBodyNormalized(raw: string): string {
  return normalizeStemCompare(
    raw.replace(/^Rule\s*\d*\s*:\s*/i, '').replace(/^Rule:\s*/i, '').trim()
  );
}

/** True when `text` repeats the same rule mapping already listed under “Apply these rules”. */
function textDuplicatesStimulusRules(text: string, ctx: StimulusRulesCtx): boolean {
  const inst = text.trim();
  if (!inst) return false;
  const { joined, rulesArr } = ctx;

  const instNorm = normalizeStemCompare(inst);
  const instBodyNorm = normalizeStemCompare(inst.replace(/^\s*rule\s*[:\-–]\s*/i, ''));

  for (const r of rulesArr) {
    const ruleNorm = bankRuleBodyNormalized(String(r ?? '').trim());
    if (!ruleNorm) continue;
    if (instNorm === ruleNorm || instBodyNorm === ruleNorm) return true;
    if (instBodyNorm.length >= 12 && (instBodyNorm.includes(ruleNorm) || ruleNorm.includes(instBodyNorm))) return true;
  }

  const instChainEdges = tokenSequenceEdges(inst);
  const ruleChainEdges = tokenSequenceEdges(joined);
  if (
    instChainEdges.size >= 2 &&
    ruleChainEdges.size >= 2 &&
    sameStringSet(instChainEdges, ruleChainEdges)
  ) {
    return true;
  }

  if (!/^\s*rule\s*[:\-–]/i.test(inst)) return false;

  const instEdges =
    instChainEdges.size >= 2 ? instChainEdges : extractLogicTransitionSet(inst);
  const ruleEdges =
    ruleChainEdges.size >= 2 ? ruleChainEdges : extractLogicTransitionSet(joined);
  if (instEdges.size === 0 || ruleEdges.size === 0) return false;
  return sameStringSet(instEdges, ruleEdges);
}

/**
 * Omit `presentation.instruction` when it repeats rule text already shown under “Apply these rules”
 * (exact overlap, long substring overlap, or same directed-symbol cycle).
 */
function shouldSuppressInstructionAsDuplicateRule(q: ExamQuestion): boolean {
  const inst = (q.instruction ?? '').trim();
  if (!inst) return false;
  const ctx = gatherStimulusRulesContext(q);
  if (!ctx) return false;
  return textDuplicatesStimulusRules(inst, ctx);
}

/** Split prompt so a trailing “Rule: …” line/paragraph can be dropped when it duplicates `stimulus.rules`. */
function splitPromptSegmentsForRuleDedup(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  const byNlRule = t.split(/\n(?=\s*Rule\s*[:\-–])/i).map((s) => s.trim()).filter(Boolean);
  if (byNlRule.length > 1) return byNlRule;
  const bySpRule = t.split(/\s+(?=Rule\s*[:\-–])/i).map((s) => s.trim()).filter(Boolean);
  if (bySpRule.length > 1) return bySpRule;
  const byPara = t.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  if (byPara.length > 1) return byPara;
  return [t];
}

/** Prompt shown above the grey stimulus box - omits example/test copy, rule dedup, then dual-pattern narrative (shown in box). */
function examPromptWithoutRedundantRuleBlock(q: ExamQuestion): string {
  let raw = (q.prompt ?? '').trim();
  if (!raw) return q.prompt ?? '';
  raw = stripDuplicateExampleProseFromPrompt(raw, q);
  const ctx = gatherStimulusRulesContext(q);
  if (ctx) {
    const parts = splitPromptSegmentsForRuleDedup(raw);
    const kept = parts.filter((p) => !textDuplicatesStimulusRules(p, ctx));
    raw = kept.join('\n\n').trim() || raw;
  }
  const dual = dualPatternNarrativeSplit(raw);
  if (dual && patternTransferStimulusPresent(q)) {
    raw = dual.remainder.trim() || raw;
  }
  const comparisonQuantities = gatherComparisonQuantitiesFromQuestion(q);
  if (comparisonQuantities) {
    raw = stripDuplicateComparisonQuantitiesFromPrompt(raw, comparisonQuantities);
  }
  const out = raw.length > 0 ? raw : (q.prompt ?? '').trim();
  return formatDualPatternPromptLinebreaks(out);
}

/**
 * Item banks often repeat `question` / `setup` inside `stimulus` for authoring pipelines while the same
 * text is already shown as {@link ExamQuestion.prompt} above this block - skip those duplicates.
 */
function stimulusFieldDuplicatesPrompt(fieldKey: string, value: unknown, prompt: string | undefined): boolean {
  const stemTrim = (prompt ?? '').trim();
  /* Short task line (e.g. "Which box is green?") is almost never substring of the long stem - hide whenever we already show a stem. */
  if (fieldKey === 'question' && stemTrim.length > 0) {
    return true;
  }
  if (!['setup'].includes(fieldKey) || typeof value !== 'string') return false;
  const stem = normalizeStemCompare(prompt ?? '');
  const vs = normalizeStemCompare(value);
  if (!stem || !vs) return false;
  return vs === stem || stem.includes(vs) || vs.includes(stem);
}

/**
 * Bank authoring keys - omit from the generic key/value dump.
 * `items` is still used by {@link parseStimulusGridMatrix} to render the puzzle grid (not raw JSON).
 */
const STIMULUS_KEYS_HIDDEN_FROM_LEARNER = new Set([
  'answer',
  'answer_explanation',
  'answer_key',
  'answer_rationale',
  'answer_support',
  'comparison',
  'correct_answer',
  'correct_answer_explanation',
  'correct_answer_rationale',
  'correct_answer_support',
  'constraints_structured',
  'constraints_text',
  'context',
  'context_after',
  'context_before',
  'cultural_specificity',
  'domain',
  'evidence_explanation',
  'evidence_span',
  'evidence_spans',
  'expected_answer',
  'external_knowledge_required',
  'groups',
  'incomplete_sentence',
  'items',
  'known_quantity',
  'label',
  'note',
  'raw',
  'rationale',
  'solution',
  'solution_steps',
  'structured_solution',
  'type',
  'uniqueness_check',
  'problem',
  'quantity_a',
  'quantity_b',
  'quantityA',
  'quantityB',
  'ratio',
  'ratios',
  'relationship_type',
  'semantic_target',
  'purpose_type',
  'sentences',
  'target',
  'target_skill',
  'target_label',
  'target_rule',
  'target_stem',
  'variables',
  'source_rule',
  'source_sequence',
]);

function shouldHideStimulusTextSummary(value: unknown, obj: Record<string, unknown>): boolean {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (!text) return true;
  if (text.includes('\n') || text.includes(':')) return false;

  return (
    obj.expected_answer != null ||
    obj.structured_solution != null ||
    obj.uniqueness_check != null ||
    obj.solution != null ||
    obj.solution_steps != null
  );
}

/** Learner-facing label for `quantity_a` / `quantity_b` comparison items. */
function formatComparisonQuantity(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const t = raw.trim();
    return t || null;
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    const display = typeof o.display === 'string' ? o.display.trim() : '';
    if (display) return display;
    if (o.value !== undefined && o.value !== null) return String(o.value);
  }
  return null;
}

function gatherComparisonQuantities(obj: Record<string, unknown>): { a: string; b: string } | null {
  const a = formatComparisonQuantity(obj.quantity_a ?? obj.quantityA);
  const b = formatComparisonQuantity(obj.quantity_b ?? obj.quantityB);
  if (!a || !b) return null;
  return { a, b };
}

function gatherComparisonQuantitiesFromQuestion(q: ExamQuestion): { a: string; b: string } | null {
  const stimulus = q.stimulus;
  if (typeof stimulus !== 'object' || stimulus === null || Array.isArray(stimulus)) return null;
  return gatherComparisonQuantities(stimulus as Record<string, unknown>);
}

/** Drop Quantity A/B lines from the stem when the grey comparison tiles already show them. */
function stripDuplicateComparisonQuantitiesFromPrompt(
  raw: string,
  quantities: { a: string; b: string }
): string {
  const aNorm = normalizeStemCompare(quantities.a);
  const bNorm = normalizeStemCompare(quantities.b);
  const labeledQuantityBodyMatches = (line: string, qtyNorm: string): boolean => {
    const labeled = line.match(/^quantity\s*[ab]\s*[:\-–]\s*(.+)$/i);
    if (!labeled) return false;
    const body = normalizeStemCompare(labeled[1]);
    if (!body || !qtyNorm) return false;
    return body === qtyNorm || qtyNorm.includes(body) || body.includes(qtyNorm);
  };

  const kept = raw
    .split(/\n/)
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^quantity\s*a\s*[:\-–]/i.test(t) && labeledQuantityBodyMatches(t, aNorm)) return false;
      if (/^quantity\s*b\s*[:\-–]/i.test(t) && labeledQuantityBodyMatches(t, bNorm)) return false;
      const norm = normalizeStemCompare(t);
      if (norm === aNorm || norm === bNorm) return false;
      return true;
    });

  const cleaned = kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const lines = cleaned.split(/\n/);
  const compareLineIndex = lines.findIndex((line) =>
    /^compare\s+quantit(?:y|ies)\s+a\s+and\s+(?:quantity\s+)?b\.?$/i.test(line.trim())
  );

  if (compareLineIndex > 0) {
    const compareLine = lines[compareLineIndex].trim();
    const rest = lines
      .filter((_, i) => i !== compareLineIndex)
      .join('\n')
      .trim();
    return rest ? `${compareLine}\n\n${rest}` : compareLine;
  }

  return cleaned;
}

function stimulusStringField(obj: Record<string, unknown>, key: string): string {
  return typeof obj[key] === 'string' ? obj[key].trim() : '';
}

function stimulusObjectField(obj: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = obj[key];
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function gatherPassagePairStimulus(obj: Record<string, unknown>): string | null {
  const passageA = stimulusStringField(obj, 'passage_a') || stimulusStringField(obj, 'sentences_a');
  const passageB = stimulusStringField(obj, 'passage_b') || stimulusStringField(obj, 'sentences_b');
  if (!passageA || !passageB) return null;
  return `Passage A: ${passageA}\n\nPassage B: ${passageB}`;
}

/** Cloze, author-purpose, paired-passage, and other reading items: show passage prose only (no bank metadata). */
function gatherPassageOnlyStimulus(obj: Record<string, unknown>): string | null {
  const passagePair = gatherPassagePairStimulus(obj);
  if (passagePair) return passagePair;

  const nestedText = stimulusObjectField(obj, 'text');
  const nestedPassagePair = nestedText ? gatherPassagePairStimulus(nestedText) : null;
  if (nestedPassagePair) return nestedPassagePair;

  const hasPassageOnlyLayout =
    'semantic_target' in obj ||
    'incomplete_sentence' in obj ||
    'evidence_explanation' in obj ||
    'context_before' in obj ||
    'target_skill' in obj ||
    'purpose_type' in obj;
  if (!hasPassageOnlyLayout) return null;
  const passage = typeof obj.passage === 'string' ? obj.passage.trim() : '';
  if (passage) return passage;
  const incompleteSentence = typeof obj.incomplete_sentence === 'string' ? obj.incomplete_sentence.trim() : '';
  return incompleteSentence || null;
}

/** With a `grid` stimulus or a parsed `items` matrix, row/column counts are redundant for learners. */
function hideGridDimensionStimulusKeys(key: string, obj: Record<string, unknown>, hasParsedItemGrid: boolean): boolean {
  if (key !== 'rows' && key !== 'cols') return false;
  const g = obj.grid;
  if (g !== undefined && g !== null) return true;
  return hasParsedItemGrid;
}

/** Odd-one-out stems often ship with `stimulus_type` left as default (e.g. `symbol_sequence`); infer from wording. */
function promptIndicatesOddOneOut(prompt: string | undefined): boolean {
  const p = (prompt ?? '').trim().toLowerCase();
  if (!p) return false;
  if (p.includes('odd one out')) return true;
  if (p.includes('not belong') || p.includes("doesn't belong") || p.includes('does not belong')) return true;
  if (p.includes('not fit') || p.includes("doesn't fit") || p.includes('does not fit')) return true;
  if (/\bwhich (one )?(is )?different\b/.test(p)) return true;
  if (p.includes('unlike the other')) return true;
  /* “Which one does NOT follow the same rule as the other three?” - same intent as odd-one-out. */
  if (p.includes('not follow the same rule') || p.includes("doesn't follow the same rule")) return true;
  if (p.includes('not follow the same structural rule') || p.includes("doesn't follow the same structural rule")) return true;
  if (p.includes('same rule as the other')) return true;
  if (p.includes('same structural rule as the other')) return true;
  if (/\bother three\b/.test(p) && /\bsame rule\b/.test(p)) return true;
  if (/\bother three\b/.test(p) && /\bsame structural rule\b/.test(p)) return true;
  /* “Three share a hidden structural rule - which does NOT follow that rule?” */
  if (p.includes('hidden structural rule')) return true;
  if (p.includes('not follow that rule') || p.includes("doesn't follow that rule")) return true;
  if (/\bthree of the following\b/.test(p) && /\bshare\b/.test(p) && /\brule\b/.test(p)) return true;
  if (/\bwhich one does not follow\b/.test(p) && /\brule\b/.test(p)) return true;
  return false;
}

/** Pattern A → Pattern B / “same rule connects both” items - learner must infer `source_rule` (e.g. `double_each_step`). */
function promptIndicatesPatternTransferInferRule(prose: string | undefined): boolean {
  const p = (prose ?? '').trim().toLowerCase();
  if (!p) return false;
  if (p.includes('same structural rule')) return true;
  if (p.includes('connects both patterns')) return true;
  if (p.includes('structural rule') && (p.includes('both patterns') || p.includes('pattern b'))) return true;
  if (/\bpattern a\b/.test(p) && /\bpattern b\b/.test(p) && /\bwhat comes next\b/.test(p)) return true;
  return false;
}

function learnerRuleHintProse(prompt?: string, instruction?: string): string {
  return [prompt, instruction].filter(Boolean).join('\n');
}

/** Prompt + instruction ask the student to infer the authoring rule (hide `source_rule` / shared rules). */
function promptSaysInferAuthoringRule(prompt?: string, instruction?: string): boolean {
  const p = learnerRuleHintProse(prompt, instruction).trim().toLowerCase();
  if (!p) return false;
  if (p.includes('find the rule')) return true;
  if (p.includes('figure out the rule')) return true;
  if (p.includes('discover the rule')) return true;
  if (/\bfind\s+the\s+.{0,40}\brule\b/.test(p)) return true;
  return false;
}

/** Stem points learners at listed constraints in the stimulus - do not infer-hide those payloads. */
function promptExpectsListedConstraintsInStimulus(prose: string): boolean {
  const p = prose.trim().toLowerCase();
  if (!p) return false;
  if (/\bthe\s+constraints\s+below\b/.test(p)) return true;
  if (/\busing\s+the\s+constraints\b/.test(p)) return true;
  if (/\bconstraints\s+below\b/.test(p)) return true;
  if (/\bgiven\s+the\s+constraints\b/.test(p)) return true;
  if (/\bfrom\s+the\s+constraints\b/.test(p)) return true;
  return false;
}

/**
 * When true, do not surface authoring rules (students infer them - e.g. odd-one-out, pattern transfer).
 * Toggle via `stimulus.hide_shared_rule` / `stimulus.show_rule`, `stimulus_type` naming, or prompt wording.
 */
function shouldHideSharedLearnerRule(
  stimulusType: string | undefined,
  obj: Record<string, unknown>,
  prompt?: string,
  instruction?: string
): boolean {
  const prose = learnerRuleHintProse(prompt, instruction);
  if (obj.hide_shared_rule === true) return true;
  if (obj.show_rule === false) return true;
  if (promptExpectsListedConstraintsInStimulus(prose)) return false;
  if (promptIndicatesOddOneOut(prose)) return true;
  if (promptIndicatesPatternTransferInferRule(prose)) return true;
  if (promptSaysInferAuthoringRule(prompt, instruction)) return true;
  const t = typeof stimulusType === 'string' ? stimulusType.trim().toLowerCase().replace(/-/g, '_') : '';
  if (!t) return false;
  if (
    t === 'odd_one_out' ||
    t === 'pick_odd' ||
    t === 'outlier' ||
    t === 'visual_odd_one_out' ||
    t === 'odd_one'
  ) {
    return true;
  }
  if (t.includes('odd') && (t.includes('out') || t.endsWith('_one') || t.includes('one_out'))) return true;
  return false;
}

/** Stimulus keys treated as “the rule” for learners - omitted when {@link shouldHideSharedLearnerRule} applies. */
function hiddenRuleKeysWhenConcealed(): Set<string> {
  return new Set([
    'rules',
    'rule',
    'shared_rule',
    'source_rule',
    'target_rule',
    'correct_rule',
    'classification_rule',
    'domain_rule',
    'answer_rule',
    'logic_rule',
  ]);
}

function coerceStimulusSequence(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  if (typeof raw === 'string') {
    return raw
      .split(/,\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** Number-pattern + shape `target_stem` layout for “first pattern / second pattern” items. */
function patternTransferStimulusPresent(q: ExamQuestion): boolean {
  const stimulus = q.stimulus;
  if (typeof stimulus !== 'object' || stimulus === null || Array.isArray(stimulus)) return false;
  const obj = stimulus as Record<string, unknown>;
  const sourceSeq = coerceStimulusSequence(obj.source_sequence);
  const targetStemRaw = typeof obj.target_stem === 'string' ? obj.target_stem.trim() : '';
  const shapeTokens =
    targetStemRaw.length === 0
      ? []
      : targetStemRaw.includes(',')
        ? targetStemRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [targetStemRaw];
  return sourceSeq.length > 0 && shapeTokens.length > 0;
}

/**
 * Skip the pattern-transfer grey box when the stem already carries the patterns, or when the
 * stimulus only has authoring metadata (`source_sequence` / `source_rule`) with no `target_stem`.
 */
function shouldSuppressPatternTransferStimulusBox(
  q: ExamQuestion,
  sourceSeq: string[],
  shapeTokens: string[]
): boolean {
  const prose = learnerRuleHintProse(q.prompt, q.instruction).trim().toLowerCase();
  if (prose && /\bsequence\s+a\b/.test(prose) && /\bsequence\s+b\b/.test(prose)) return true;
  if (sourceSeq.length > 0 && shapeTokens.length === 0) return true;
  return false;
}

/** Split “Look at the first pattern … second pattern …” from the trailing “What comes next …” question line. */
function dualPatternNarrativeSplit(prompt: string): { narrative: string; remainder: string } | null {
  const p = prompt.trim();
  const low = p.toLowerCase();
  if (!/\bfirst pattern\b/.test(low) || !/\bsecond pattern\b/.test(low)) return null;
  const kw = /\bwhat comes next\b/i;
  const m = kw.exec(p);
  if (!m || m.index < 30) return null;
  const narrative = p.slice(0, m.index).trim();
  const remainder = p.slice(m.index).trim();
  if (narrative.length < 20 || remainder.length < 10) return null;
  return { narrative, remainder };
}

/** Insert blank lines between the usual three sentences (first pattern / second pattern / what comes next). */
function formatDualPatternPromptLinebreaks(text: string): string {
  const s = text.trim();
  if (!s) return s;
  const low = s.toLowerCase();
  if (!/\bfirst pattern\b/.test(low) || !/\bsecond pattern\b/.test(low)) return s;
  return s
    .replace(/\s+(?=Now\s+look\s+at(?:\s+the)?\s+second\s+pattern)/gi, '\n\n')
    .replace(/\s+(?=What\s+comes\s+next\b)/gi, '\n\n');
}

function isIoExamplePair(x: unknown): x is { input: unknown; output: unknown } {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return 'input' in o && 'output' in o;
}

type ParsedExampleRule = { pairs: Array<{ input: string; output: string }>; newInput: string };

/**
 * Legacy rule-induction stems often look like:
 *   △ → ◇
 *       ■ → ▲
 *     Target: ○ -> ?
 * Import left `examples` empty and only stored `raw`, so parse here for the tile UI.
 */
function parseExampleRuleProse(raw: string): ParsedExampleRule | null {
  const text = String(raw ?? '').trim();
  if (!text) return null;

  const pairs: Array<{ input: string; output: string }> = [];
  let newInput = '';

  const arrowRe = /^(.+?)\s*(?:->|→)\s*(.+)$/;
  const pushPair = (left: string, right: string) => {
    const input = left.trim();
    const output = right.trim().replace(/\.$/, '');
    if (!input || !output) return;
    if (output === '?' || output === '??' || output === '…') return;
    pairs.push({ input, output });
  };

  // Semicolon form: "■→◆; ○→△; ▲→● ;; new: ◆" or "Examples: a -> b; c -> d. New input: x"
  const semiSplit = text.split(/\s*;;\s*new\s*:\s*/i);
  const head = semiSplit[0].replace(/^Examples?:\s*/i, '').trim();
  if (semiSplit[1]) {
    newInput = semiSplit[1].trim().replace(/\.$/, '');
  }
  if (head.includes(';')) {
    for (const part of head.split(';').map((s) => s.trim()).filter(Boolean)) {
      const m = part.match(arrowRe);
      if (m) pushPair(m[1], m[2]);
    }
  }

  // Line form (incl. indented Target lines)
  for (const line of text.split(/\n+/)) {
    const t = line.trim();
    if (!t) continue;
    const target = t.match(/^Target\s*:\s*(.+)$/i);
    if (target) {
      const body = target[1].trim();
      const m = body.match(arrowRe);
      if (m) {
        newInput = m[1].trim();
      } else {
        newInput = body.replace(/\s*(?:->|→)\s*\?\.?$/, '').trim();
      }
      continue;
    }
    const ni = t.match(/^New input\s*:\s*(.+)$/i);
    if (ni) {
      newInput = ni[1].trim().replace(/\.$/, '');
      continue;
    }
    if (pairs.length === 0 || !head.includes(';')) {
      const m = t.match(arrowRe);
      if (m) pushPair(m[1], m[2]);
    }
  }

  if (!newInput) {
    const ni = text.match(/New input\s*:\s*(.+)$/im);
    if (ni) newInput = ni[1].trim().replace(/\.$/, '');
  }

  if (pairs.length === 0 && !newInput) return null;
  return { pairs, newInput };
}

function renderExampleRuleTiles(
  pairs: Array<{ input: string; output: string }>,
  newInput: string,
  theme: StimulusVisualTheme,
  capSx: Record<string, unknown>
): React.ReactNode {
  if (pairs.length === 0 && !newInput) return null;
  const symTileSx = stimulusSymbolTileSx(theme);
  return (
    <Box sx={stimulusPanelSx(theme)}>
      {pairs.map((row, i) => (
        <Box key={i} sx={{ mb: 2 }}>
          <Typography variant="caption" sx={capSx}>
            Example {i + 1}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
            <Box sx={symTileSx}>{row.input}</Box>
            <Typography sx={{ color: theme.caption, fontWeight: 700, fontSize: '1.1rem' }} aria-hidden>
              →
            </Typography>
            <Box sx={symTileSx}>{row.output}</Box>
          </Box>
        </Box>
      ))}
      {newInput ? (
        <Box sx={{ pt: pairs.length ? 2 : 0, borderTop: pairs.length ? `1px solid ${theme.border}` : 'none' }}>
          <Typography variant="caption" sx={capSx}>
            New input
          </Typography>
          <Box sx={symTileSx}>{newInput}</Box>
        </Box>
      ) : null}
    </Box>
  );
}

type ExamplesIoCtx = { pairs: Array<{ input: string; output: string }>; test: string };

/** When non-null, {@link HumanFriendlyStimulus} renders the examples + “Test input” grey box. */
function gatherExamplesIoContext(q: ExamQuestion): ExamplesIoCtx | null {
  const stimulus = q.stimulus;
  if (typeof stimulus !== 'object' || stimulus === null || Array.isArray(stimulus)) return null;
  const obj = stimulus as Record<string, unknown>;
  const examplesRaw = obj.examples;
  if (!Array.isArray(examplesRaw) || examplesRaw.length === 0) return null;
  const pairs = examplesRaw.filter(isIoExamplePair).map((row) => {
    const r = row as Record<string, unknown>;
    return { input: String(r.input ?? '').trim(), output: String(r.output ?? '').trim() };
  });
  if (!pairs.length) return null;
  const testRaw =
    obj.test_input ?? obj.test_query ?? obj.query_input ?? obj.test_case ?? obj.query;
  const test =
    testRaw !== null && testRaw !== undefined && String(testRaw).trim() !== ''
      ? String(testRaw).trim()
      : '';
  return { pairs, test };
}

/** Collapse whitespace and arrow spellings for “does prompt repeat this row?” checks. */
function glyphKey(s: string): string {
  return normalizeStemCompare(s)
    .replace(/\s+/g, '')
    .replace(/\\rightarrow|\\to|->|⇒/gi, '')
    .replace(/→/g, '')
    .replace(/\$/g, '');
}

function lineLooksLikeNumberedExampleLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^\*{0,3}\s*example\s*\d+/i.test(t)) return true;
  if (/\bexample\s*\d+\s*:/i.test(t) && (/→/.test(t) || /\\rightarrow/i.test(t))) return true;
  return false;
}

function lineDuplicatesIoPairRow(line: string, pairs: ExamplesIoCtx['pairs']): boolean {
  const g = glyphKey(line);
  if (g.length < 4) return false;
  for (const { input, output } of pairs) {
    const a = glyphKey(input);
    const b = glyphKey(output);
    if (a.length < 1 || b.length < 1) continue;
    if (g.includes(a) && g.includes(b) && (/→/.test(line) || /\\rightarrow/i.test(line))) return true;
  }
  return false;
}

function stripTrailingTestGlyphsFromPromptLine(line: string, test: string): string {
  const t = test.trim();
  if (!t) return line;
  let out = line.trimEnd();
  if (out.endsWith(t)) {
    return out
      .slice(0, out.length - t.length)
      .replace(/[:\s*]+$/, '')
      .trim();
  }
  const gT = glyphKey(t);
  if (gT.length < 2) return line;
  for (let i = out.length; i >= 1; i--) {
    const suf = out.slice(i);
    if (glyphKey(suf) === gT) {
      return out.slice(0, i).replace(/[:\s*]+$/, '').trim();
    }
  }
  return line;
}

/** Remove prose lines that repeat what the examples / test-input grey box already shows. */
function stripDuplicateExampleProseFromPrompt(raw: string, q: ExamQuestion): string {
  const ctx = gatherExamplesIoContext(q);
  if (!ctx) return raw;
  const broken = raw
    .replace(/\s+(?=\*{0,3}\s*Example\s*\d)/gi, '\n')
    .replace(/\s+(?=\*{0,3}\s*What is the output for)/gi, '\n')
    .replace(/\s+(?=\*{0,3}\s*What's the output for)/gi, '\n');
  const lines = broken.split(/\r?\n/);
  const kept: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (lineLooksLikeNumberedExampleLine(trimmed)) continue;
    if (lineDuplicatesIoPairRow(trimmed, ctx.pairs)) continue;
    if (ctx.test && glyphKey(trimmed) === glyphKey(ctx.test) && trimmed.length < 80) continue;
    if (
      ctx.test &&
      /what is the output for|what's the output for|output for\s*\?/i.test(trimmed) &&
      glyphKey(trimmed).endsWith(glyphKey(ctx.test))
    ) {
      kept.push(stripTrailingTestGlyphsFromPromptLine(trimmed, ctx.test));
      continue;
    }
    kept.push(line);
  }
  const out = kept.join('\n').trim();
  return out.length > 0 ? out : raw;
}

export type StimulusVariant = 'light' | 'dark';

export interface StimulusVisualTheme {
  border: string;
  panelBg: string;
  text: string;
  textMuted: string;
  caption: string;
  heading: string;
  tileBg: string;
  tileColor: string;
  tileShadow: string;
  blankBg: string;
  blankColor: string;
  tableHeaderBg: string;
  tableCellBg: string;
  qtyTileBg: string;
}

const LIGHT_STIMULUS_THEME = (border: string): StimulusVisualTheme => ({
  border: border || '#e2e8f0',
  panelBg: '#f8fafc',
  text: '#334155',
  textMuted: '#475569',
  caption: '#64748b',
  heading: '#0f172a',
  tileBg: '#fff',
  tileColor: '#0f172a',
  tileShadow: '0 1px 2px rgba(15,23,42,0.06)',
  blankBg: '#f1f5f9',
  blankColor: '#64748b',
  tableHeaderBg: '#f1f5f9',
  tableCellBg: '#fff',
  qtyTileBg: '#fff',
});

const DARK_STIMULUS_THEME = (border: string): StimulusVisualTheme => ({
  border: border || 'rgba(168, 85, 247, 0.25)',
  panelBg: 'rgba(168, 85, 247, 0.08)',
  text: 'rgba(255, 255, 255, 0.85)',
  textMuted: 'rgba(255, 255, 255, 0.65)',
  caption: 'rgba(255, 255, 255, 0.55)',
  heading: 'rgba(255, 255, 255, 0.92)',
  tileBg: 'rgba(15, 23, 42, 0.55)',
  tileColor: '#ffffff',
  tileShadow: 'none',
  blankBg: 'rgba(168, 85, 247, 0.12)',
  blankColor: '#c4b5fd',
  tableHeaderBg: 'rgba(15, 23, 42, 0.55)',
  tableCellBg: 'rgba(30, 41, 59, 0.65)',
  qtyTileBg: 'rgba(30, 41, 59, 0.65)',
});

function resolveStimulusTheme(variant: StimulusVariant, border: string): StimulusVisualTheme {
  return variant === 'dark' ? DARK_STIMULUS_THEME(border) : LIGHT_STIMULUS_THEME(border);
}

function stimulusPanelSx(theme: StimulusVisualTheme, extra?: Record<string, unknown>) {
  return {
    mb: 2.5,
    p: 2.5,
    bgcolor: theme.panelBg,
    borderRadius: 2,
    border: `1px solid ${theme.border}`,
    ...extra,
  };
}

/** Shared tile style for symbol / shape stimuli (sequence, examples, pattern transfer). */
function stimulusSymbolTileSx(theme: StimulusVisualTheme) {
  return {
    fontSize: '1.65rem',
    lineHeight: 1,
    minWidth: 44,
    textAlign: 'center' as const,
    px: 1.25,
    py: 1,
    color: theme.tileColor,
    bgcolor: theme.tileBg,
    borderRadius: 1.5,
    border: `1px solid ${theme.border}`,
    boxShadow: theme.tileShadow,
  };
}

/**
 * Resolves a row-major symbol grid from practice-bank stimuli.
 * Firestore upload may stringify inner rows as JSON strings (nested arrays are not allowed).
 */
function parseStimulusGridMatrix(obj: Record<string, unknown>): string[][] | null {
  const rowsHint = Number(obj.rows);
  const colsHint = Number(obj.cols);

  const stringifyCell = (cell: unknown): string => {
    if (cell == null) return '';
    if (typeof cell !== 'object' || Array.isArray(cell)) return String(cell).trim();
    const o = cell as Record<string, unknown>;
    const display = o.symbol ?? o.value ?? o.text ?? o.label ?? o.cell;
    return display == null ? '' : String(display).trim();
  };

  const normalizeRow = (row: unknown): string[] | null => {
    if (Array.isArray(row)) return row.map(stringifyCell);
    if (typeof row === 'string') {
      const t = row.trim();
      if (!t) return [];
      if (t.startsWith('[')) {
        try {
          const p = JSON.parse(t) as unknown;
          if (Array.isArray(p)) return p.map(stringifyCell);
        } catch {
          return null;
        }
      }
      if (t.includes(',')) return t.split(/,\s*/).map((x) => x.trim());
      return [t];
    }
    if (row && typeof row === 'object') {
      const r = row as Record<string, unknown>;
      const cells = r.cells ?? r.items ?? r.values ?? r.row;
      if (Array.isArray(cells)) return cells.map(stringifyCell);
      const ordered = Object.entries(r)
        .filter(([key]) => /^(?:c|col|cell)?\d+$/i.test(key))
        .sort(([a], [b]) => {
          const na = Number(a.match(/\d+/)?.[0] ?? 0);
          const nb = Number(b.match(/\d+/)?.[0] ?? 0);
          return na - nb;
        })
        .map(([, value]) => stringifyCell(value));
      if (ordered.length) return ordered;
    }
    return null;
  };

  const fromRowsArray = (raw: unknown[]): string[][] | null => {
    const rows: string[][] = [];
    for (const r of raw) {
      const nr = normalizeRow(r);
      if (nr === null) return null;
      rows.push(nr);
    }
    if (!rows.length) return null;
    const w = Math.max(1, ...rows.map((r) => r.length));
    return rows.map((r) => {
      const copy = [...r];
      while (copy.length < w) copy.push('');
      return copy;
    });
  };

  const fromFlatCells = (raw: unknown[]): string[][] | null => {
    if (!raw.length) return null;
    const allScalarsOrCells = raw.every(
      (x) =>
        x !== null &&
        (typeof x === 'string' ||
          typeof x === 'number' ||
          typeof x === 'boolean' ||
          (typeof x === 'object' && !Array.isArray(x)))
    );
    if (!allScalarsOrCells) return null;
    let rows = Number.isFinite(rowsHint) && rowsHint > 0 ? rowsHint : 0;
    let cols = Number.isFinite(colsHint) && colsHint > 0 ? colsHint : 0;
    if ((!rows || !cols) && raw.length === 9) {
      rows = 3;
      cols = 3;
    }
    if (!rows || !cols || raw.length !== rows * cols) return null;
    const cells = raw.map(stringifyCell);
    const matrix: string[][] = [];
    for (let r = 0; r < rows; r++) matrix.push(cells.slice(r * cols, (r + 1) * cols));
    return matrix;
  };

  const fromDelimitedString = (raw: string): string[][] | null => {
    const text = raw.trim();
    if (!text) return null;
    if (text.startsWith('[') || text.startsWith('{')) {
      try {
        return fromUnknown(JSON.parse(text) as unknown);
      } catch {
        // Fall through to delimiter parsing.
      }
    }
    const extracted = extractSymbolGridFromText(text);
    if (extracted) return extracted;
    const rowTexts = text
      .split(/\n+|;\s*/)
      .map((row) => row.trim())
      .filter(Boolean);
    if (rowTexts.length < 2) return null;
    const rows = rowTexts.map((row) => (row.includes(',') ? row.split(/,\s*/) : row.split(/\s+/)));
    if (rows.length < 2 || Math.max(...rows.map((r) => r.length)) < 2) return null;
    return fromRowsArray(rows);
  };

  const symbolishCell = (token: string): boolean =>
    token.length > 0 && !/[A-Za-z0-9\s,;:(){}[\]<>]/.test(token);

  const normalizeGridToken = (token: string): string => {
    const t = token.trim();
    if (!t) return '';
    if (t === '[?]' || t === '[??]' || t.toLowerCase() === '[blank]') return '?';
    return t;
  };

  const isGridSymbolToken = (token: string): boolean => {
    const t = normalizeGridToken(token);
    return t === '?' || t === '??' || t === '…' || t === '...' || symbolishCell(t);
  };

  function extractSymbolGridFromText(text: string): string[][] | null {
    const bracketRows: string[][] = [];
    const bracketRe = /\[([^\]]+)\]/g;
    let bracketMatch: RegExpExecArray | null;
    while ((bracketMatch = bracketRe.exec(text)) !== null) {
      const tokens = bracketMatch[1]
        .split(/[\s,]+/)
        .map(normalizeGridToken)
        .filter(Boolean)
        .filter(isGridSymbolToken);
      if (tokens.length >= 2 && tokens.length <= 5) bracketRows.push(tokens);
    }
    if (bracketRows.length >= 2) {
      const width = bracketRows[0].length;
      if (width >= 2 && bracketRows.every((row) => row.length === width)) return bracketRows;
    }

    // Relational-order / matrix stems: "[?] ★ / ● ◆ – / – ▲ ●" (rows may be ragged)
    if (text.includes('/')) {
      const slashRows = text
        .split('/')
        .map((line) =>
          line
            .trim()
            .split(/[\s,]+/)
            .map(normalizeGridToken)
            .filter(Boolean)
            .filter(isGridSymbolToken)
        )
        .filter((row) => row.length > 0);
      const maxWidth = slashRows.length ? Math.max(...slashRows.map((row) => row.length)) : 0;
      if (slashRows.length >= 2 && maxWidth >= 2) {
        return slashRows;
      }
    }

    const rows = text
      .split(/\n+|(?:^|\s)row\s*\d+\s*[:-]\s*/i)
      .map((line) => {
        const tokens = line
          .replace(/[|]/g, ' ')
          .split(/[\s,]+/)
          .map(normalizeGridToken)
          .filter(Boolean)
          .filter(isGridSymbolToken);
        return tokens.length >= 2 && tokens.length <= 5 ? tokens : [];
      })
      .filter((row) => row.length > 0);
    if (rows.length < 2) return null;

    const widthCounts = new Map<number, number>();
    for (const row of rows) widthCounts.set(row.length, (widthCounts.get(row.length) ?? 0) + 1);
    const [width, count] = Array.from(widthCounts.entries()).sort((a, b) => b[1] - a[1])[0] ?? [0, 0];
    const candidate = rows.filter((row) => row.length === width).slice(0, count);
    if (candidate.length < 2 || width < 2) return null;
    if (candidate.length === 3 && width === 3) return candidate;
    if (candidate.length * width === 9) return candidate;
    // Non-3×3 symbol grids (e.g. 3×2 relational-order clues) still render as a matrix.
    if (candidate.every((row) => row.length === width)) return candidate;
    return null;
  }

  const fromObjectRows = (raw: Record<string, unknown>): string[][] | null => {
    const rowEntries = Object.entries(raw)
      .filter(([key]) => /^row[_\s-]?\d+$/i.test(key))
      .sort(([a], [b]) => {
        const na = Number(a.match(/\d+/)?.[0] ?? 0);
        const nb = Number(b.match(/\d+/)?.[0] ?? 0);
        return na - nb;
      })
      .map(([, value]) => value);
    return rowEntries.length ? fromRowsArray(rowEntries) : null;
  };

  const gridLabeledText = (raw: unknown): unknown =>
    typeof raw === 'string' && /\b(?:grid|matrix|board)\s*:/i.test(raw) ? raw : undefined;

  function fromUnknown(raw: unknown): string[][] | null {
    if (Array.isArray(raw)) {
      const flat = fromFlatCells(raw);
      if (flat) return flat;
      if (raw.every((row) => Array.isArray(row) || typeof row === 'string')) {
        const m = fromRowsArray(raw);
        if (m) return m;
      }
      return fromRowsArray(raw);
    }
    if (typeof raw === 'string') return fromDelimitedString(raw);
    if (raw && typeof raw === 'object') {
      const g = raw as Record<string, unknown>;
      const nested =
        g.grid ??
        g.matrix ??
        g.board ??
        g.cells ??
        g.items ??
        g.values ??
        g.rows ??
        g.puzzle ??
        g.puzzle_grid ??
        g.input_grid ??
        g.given_grid ??
        g.display ??
        g.diagram ??
        g.table;
      if (nested !== undefined) {
        const m = fromUnknown(nested);
        if (m) return m;
      }
      return fromObjectRows(g);
    }
    return null;
  }

  const candidates = [
    obj.grid,
    obj.matrix,
    obj.board,
    obj.cells,
    obj.items,
    obj.values,
    obj.rows_data,
    obj.puzzle,
    obj.puzzle_grid,
    obj.input_grid,
    obj.given_grid,
    obj.display,
    obj.diagram,
    obj.table,
    gridLabeledText(obj.text),
    obj.context,
    obj.given,
    obj.problem,
  ];
  for (const candidate of candidates) {
    const m = fromUnknown(candidate);
    if (m) return m;
  }

  return null;
}

function stimulusFieldRenderedAsGrid(key: string, value: unknown, hasGrid: boolean): boolean {
  if (!hasGrid) return false;
  if (!['text', 'display', 'diagram', 'table', 'context', 'given', 'problem'].includes(key)) return false;
  if (key === 'text' && typeof value === 'string' && !/\b(?:grid|matrix|board)\s*:/i.test(value)) return false;
  return parseStimulusGridMatrix({ grid: value }) !== null;
}

function parseStimulusSequence(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const seq = raw.map((x) => String(x ?? '').trim()).filter(Boolean);
    return seq.length > 0 ? seq : null;
  }
  if (typeof raw !== 'string') return null;

  const text = raw.trim();
  if (!text) return null;
  if (text.startsWith('[')) {
    try {
      return parseStimulusSequence(JSON.parse(text) as unknown);
    } catch {
      // Fall through to labeled/delimited parsing.
    }
  }

  const bracketMatches = Array.from(text.matchAll(/\[([^\]]+)\]/g));
  if (bracketMatches.length === 1) {
    const full = bracketMatches[0][0];
    const inner = bracketMatches[0][1].trim();
    const remainder = text.replace(full, '').trim();
    // Only treat "[★ ● ?]" as the sequence when the bracket IS the whole string.
    // Stems like "[?] ★ / ● ◆ – / – ▲ ●" must not collapse to a lone "?" tile.
    if (!remainder) {
      return parseStimulusSequence(inner.split(/[\s,]+/));
    }
    return null;
  }
  if (bracketMatches.length > 1) return null;

  const labeled = text.match(/\b(?:input\s+)?sequence\s*:\s*(.+)$/i);
  if (!labeled) return null;
  return parseStimulusSequence(labeled[1].split(/[\s,]+/));
}

function parseRuleFromStimulusText(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text) return null;

  const rulesBlock = text.match(
    /\b(?:transformation\s+)?rules\s*:\s*([\s\S]*?)(?=\binput\s+(?:string|sequence)\s*:|$)/i
  );
  if (rulesBlock) {
    const cleaned = rulesBlock[1]
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');
    return cleaned || null;
  }

  const rule = text.match(/\brule\s*:\s*([\s\S]*?)(?=\b(?:input\s+)?(?:string|sequence)\s*:|$)/i);
  if (!rule) return null;
  const cleaned = rule[1].replace(/\s+/g, ' ').trim();
  return cleaned || null;
}

function StimulusGridMatrixView(props: {
  matrix: string[][];
  border: string;
  renderMath: boolean;
  theme?: StimulusVisualTheme;
}): React.ReactNode {
  const { matrix, border, renderMath, theme: themeProp } = props;
  const theme = themeProp ?? LIGHT_STIMULUS_THEME(border);
  if (!matrix.length) return null;
  const clueLines = clueLinesFromMatrix(matrix);
  if (clueLines) return <StimulusClueListView lines={clueLines} theme={theme} />;
  const cols = Math.max(1, ...matrix.map((r) => r.length));
  const symTileSx = stimulusSymbolTileSx(theme);
  // Row-by-row (not a flat cell stream) so ragged slash-grids keep each clue on its own line.
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.1,
        maxWidth: `min(100%, ${cols * 5.5}rem)`,
        mb: 2.25,
        mt: 0.5,
      }}
      role="img"
      aria-label="Puzzle grid"
    >
      {matrix.map((row, ri) => (
        <Box
          key={`row-${ri}`}
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(1, row.length)}, minmax(2.75rem, 1fr))`,
            gap: 1.1,
            justifyContent: 'start',
          }}
        >
          {row.map((cell, ci) => {
            const display = String(cell ?? '').trim();
            const isBlank =
              !display ||
              display === '?' ||
              display === '??' ||
              display === '…' ||
              display === '...' ||
              display === '[?]' ||
              display.toLowerCase() === '[blank]';
            const key = `g-${ri}-${ci}`;
            const show = isBlank ? '?' : display;
            return (
              <Box
                key={key}
                sx={{
                  ...symTileSx,
                  minHeight: 50,
                  minWidth: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...(isBlank
                    ? { borderStyle: 'dashed', bgcolor: theme.blankBg, color: theme.blankColor, fontWeight: 800 }
                    : {}),
                }}
              >
                {renderMath && !isBlank ? (
                  <ExamMathText inline sx={{ fontSize: '1.35rem', fontWeight: 600 }}>
                    {show}
                  </ExamMathText>
                ) : (
                  <Typography sx={{ fontSize: '1.35rem', fontWeight: isBlank ? 800 : 600, lineHeight: 1 }}>
                    {show}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

function matrixCellIsBlankish(cell: string): boolean {
  const t = String(cell ?? '').trim();
  return !t || t === '?' || t === '??' || t === '…';
}

function formatClueTokenText(tokens: string[]): string {
  return tokens
    .join(' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+/g, ' ')
    .trim();
}

function clueLinesFromMatrix(matrix: string[][]): string[] | null {
  const rows = matrix.map((row) => row.map((cell) => String(cell ?? '').trim()));
  const hasCluesLabel = rows.some((row) => row.some((cell) => cell.toLowerCase() === 'clues'));
  const clueLines = rows
    .map((row) => row.filter((cell) => !matrixCellIsBlankish(cell)))
    .filter((row) => row.length > 0)
    .map((row) => {
      const [first, ...rest] = row;
      if (first.toLowerCase() === 'clues') return null;
      if (!/^\d+\.?$/.test(first)) return null;
      const clueText = formatClueTokenText(rest);
      return clueText ? `${first.replace(/\.$/, '')}. ${clueText}` : null;
    })
    .filter((line): line is string => line !== null);

  if (!hasCluesLabel && clueLines.length < 2) return null;
  return clueLines.length > 0 ? clueLines : null;
}

function StimulusClueListView(props: { lines: string[]; theme?: StimulusVisualTheme }): React.ReactNode {
  const { lines, theme: themeProp } = props;
  const theme = themeProp ?? LIGHT_STIMULUS_THEME('#e2e8f0');
  return (
    <Box sx={{ mb: 0 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: theme.caption, display: 'block', mb: 1.25, letterSpacing: 0.02 }}
      >
        Clues
      </Typography>
      <Box component="ol" sx={{ m: 0, pl: 2.25, color: theme.text, '& li': { mb: 0.65 } }}>
        {lines.map((line, i) => (
          <Typography component="li" key={i} sx={{ fontSize: '0.95rem', lineHeight: 1.55 }}>
            {line.replace(/^\d+\.\s*/, '')}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

function StimulusSequenceView(props: {
  sequence: string[];
  border: string;
  blankMeta: BlankSlot;
  blankHelp: string | null;
  mb?: number;
  theme?: StimulusVisualTheme;
}): React.ReactNode {
  const { sequence, border, blankMeta, blankHelp, mb = 0, theme: themeProp } = props;
  const theme = themeProp ?? LIGHT_STIMULUS_THEME(border);
  const symTileSx = stimulusSymbolTileSx(theme);
  const interleaved = interleaveBlankSlot(stripEmbeddedBlankPlaceholder(sequence, blankMeta), blankMeta);
  return (
    <Box sx={{ mb }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: theme.caption, display: 'block', mb: 1.25, letterSpacing: 0.02 }}
      >
        Input sequence
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
        {interleaved.map((cell, i) =>
          cell.kind === 'blank' ? (
            <Box
              key={`blank-${i}`}
              sx={{
                ...symTileSx,
                borderStyle: 'dashed',
                bgcolor: theme.blankBg,
                color: theme.blankColor,
                fontWeight: 800,
                fontSize: '1.35rem',
              }}
              aria-label="Missing item"
            >
              ?
            </Box>
          ) : (
            <Box key={`sym-${i}`} sx={symTileSx}>
              {cell.v}
            </Box>
          )
        )}
      </Box>
      {blankHelp && (
        <Typography variant="body2" sx={{ mt: 1.35, color: theme.textMuted, lineHeight: 1.55, maxWidth: 520 }}>
          {blankHelp}
        </Typography>
      )}
    </Box>
  );
}

type StimulusDataTable = {
  title?: string;
  headers: string[];
  rows: string[][];
};

function parseMarkdownDataTableText(raw: string): StimulusDataTable | null {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstTableLine = lines.findIndex((line) => line.includes('|'));
  if (firstTableLine < 0 || firstTableLine + 1 >= lines.length) return null;

  const tableLines = lines.slice(firstTableLine).filter((line) => line.includes('|'));
  if (tableLines.length < 3) return null;

  const splitRow = (line: string): string[] =>
    line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());

  const separator = splitRow(tableLines[1]);
  if (!separator.every((cell) => /^:?-{2,}:?$/.test(cell))) return null;

  const headers = splitRow(tableLines[0]).filter(Boolean);
  const rows = tableLines
    .slice(2)
    .map(splitRow)
    .filter((row) => row.some((cell) => cell.trim()));

  if (!headers.length || !rows.length) return null;

  const width = Math.max(headers.length, ...rows.map((row) => row.length));
  const title = lines
    .slice(0, firstTableLine)
    .join(' ')
    .replace(/:$/, '')
    .trim();

  return {
    title: title || undefined,
    headers: Array.from({ length: width }, (_, i) => headers[i] ?? ''),
    rows: rows.map((row) => Array.from({ length: width }, (_, i) => row[i] ?? '')),
  };
}

function normalizeDataTableRow(raw: unknown, headers: string[]): string[] | null {
  const stringifyCell = (cell: unknown): string => {
    if (cell == null) return '';
    if (typeof cell === 'object') return JSON.stringify(cell);
    return String(cell).trim();
  };

  if (Array.isArray(raw)) return raw.map(stringifyCell);

  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    if (t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t) as unknown;
        if (Array.isArray(parsed)) return parsed.map(stringifyCell);
      } catch {
        return null;
      }
    }
    return t.split(/,\s*/).map((cell) => cell.trim());
  }

  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return headers.map((header) => {
      const direct = obj[header];
      const snake = obj[header.toLowerCase().replace(/\s+/g, '_')];
      const camel = obj[header.toLowerCase().replace(/\s+([a-z])/g, (_, letter: string) => letter.toUpperCase())];
      return stringifyCell(direct ?? snake ?? camel);
    });
  }

  return null;
}

function parseStimulusDataTable(obj: Record<string, unknown>): StimulusDataTable | null {
  if (typeof obj.text === 'string') {
    const markdownTable = parseMarkdownDataTableText(obj.text);
    if (markdownTable) return markdownTable;
  }

  const rawHeaders = obj.headers ?? obj.columns;
  const rawRows = obj.rows ?? obj.data;
  const headers =
    Array.isArray(rawHeaders)
      ? rawHeaders.map((header) => String(header ?? '').trim()).filter(Boolean)
      : typeof rawHeaders === 'string'
        ? rawHeaders.split(/,\s*/).map((header) => header.trim()).filter(Boolean)
        : [];

  if (!headers.length || rawRows == null) return null;

  let rowSource: unknown = rawRows;
  if (typeof rawRows === 'string') {
    const trimmed = rawRows.trim();
    if (trimmed.startsWith('[')) {
      try {
        rowSource = JSON.parse(trimmed) as unknown;
      } catch {
        rowSource = rawRows;
      }
    }
  }

  const rowItems = Array.isArray(rowSource) ? rowSource : [rowSource];
  const rows = rowItems
    .map((row) => normalizeDataTableRow(row, headers))
    .filter((row): row is string[] => row !== null)
    .filter((row) => row.some((cell) => cell.trim()));

  if (!rows.length) return null;

  const width = Math.max(headers.length, ...rows.map((row) => row.length));
  return {
    headers: Array.from({ length: width }, (_, i) => headers[i] ?? ''),
    rows: rows.map((row) => Array.from({ length: width }, (_, i) => row[i] ?? '')),
  };
}

function StimulusDataTableView(props: {
  table: StimulusDataTable;
  border: string;
  theme?: StimulusVisualTheme;
}): React.ReactNode {
  const { table, border, theme: themeProp } = props;
  const theme = themeProp ?? LIGHT_STIMULUS_THEME(border);
  return (
    <Box sx={{ overflowX: 'auto', mb: 2.25 }}>
      {table.title ? (
        <Typography
          variant="caption"
          sx={{ fontWeight: 800, color: theme.caption, display: 'block', mb: 1, letterSpacing: 0.04 }}
        >
          {table.title}
        </Typography>
      ) : null}
      <Box
        component="table"
        sx={{
          width: '100%',
          minWidth: 420,
          borderCollapse: 'separate',
          borderSpacing: 0,
          color: theme.text,
          fontSize: '0.95rem',
        }}
      >
        <Box component="thead">
          <Box component="tr">
            {table.headers.map((header, i) => (
              <Box
                component="th"
                key={`h-${i}`}
                sx={{
                  p: 1.25,
                  textAlign: 'left',
                  bgcolor: theme.tableHeaderBg,
                  borderTop: `1px solid ${theme.border}`,
                  borderBottom: `1px solid ${theme.border}`,
                  borderLeft: i === 0 ? `1px solid ${theme.border}` : 0,
                  borderRight: `1px solid ${theme.border}`,
                  fontWeight: 800,
                  color: theme.textMuted,
                  whiteSpace: 'nowrap',
                }}
              >
                {header}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {table.rows.map((row, ri) => (
            <Box component="tr" key={`r-${ri}`}>
              {row.map((cell, ci) => (
                <Box
                  component="td"
                  key={`c-${ri}-${ci}`}
                  sx={{
                    p: 1.25,
                    bgcolor: theme.tableCellBg,
                    borderBottom: `1px solid ${theme.border}`,
                    borderLeft: ci === 0 ? `1px solid ${theme.border}` : 0,
                    borderRight: `1px solid ${theme.border}`,
                    fontWeight: ci === 0 ? 650 : 500,
                    color: ci === 0 ? theme.heading : theme.text,
                  }}
                >
                  {cell}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

type VisualChoiceMatrix = string[][];

function normalizeVisualChoiceRows(rows: string[][]): VisualChoiceMatrix | null {
  const cleaned = rows
    .map((row) => {
      const cells = row.map((cell) => String(cell ?? '').trim()).filter(Boolean);
      // Drop a leading "A." / "B" cell left over from authored option labels.
      if (cells.length > 1 && isBareOptionLetterCell(cells[0])) {
        return cells.slice(1);
      }
      return cells;
    })
    .filter((row) => row.length > 0);
  return cleaned.length > 0 ? cleaned : null;
}

function parseVisualChoice(raw: unknown): VisualChoiceMatrix | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    if (raw.every((row) => Array.isArray(row))) {
      return normalizeVisualChoiceRows(
        raw.map((row) => (row as unknown[]).map((cell) => String(cell ?? '').trim()))
      );
    }
    return normalizeVisualChoiceRows([raw.map((cell) => String(cell ?? '').trim())]);
  }
  if (typeof raw !== 'string') {
    if (typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      return parseVisualChoice(obj.grid ?? obj.rows ?? obj.items ?? obj.cells);
    }
    return null;
  }

  const text = stripEmbeddedOptionLetterPrefix(raw.trim());
  if (!text) return null;
  if (text.startsWith('[')) {
    try {
      return parseVisualChoice(JSON.parse(text) as unknown);
    } catch {
      // Fall through to delimiter parsing.
    }
  }
  const rowTexts = text
    .split(/\n+|;\s*/)
    .map((row) => row.trim())
    .filter(Boolean);
  const rows = rowTexts.map((row) => {
    const pieces = row.includes(',') ? row.split(/,\s*/) : row.split(/\s+/);
    return pieces.map((piece) => piece.trim()).filter(Boolean);
  });
  return normalizeVisualChoiceRows(rows);
}

function visualChoicesFromQuestion(question: ExamQuestion): VisualChoiceMatrix[] | null {
  const optionLayout = (question.option_layout ?? '').toLowerCase();
  const visualPrompt = promptIndicatesOddOneOut(question.prompt) || optionLayout.includes('visual');
  const stimulus = question.stimulus;

  if (visualPrompt && stimulus && typeof stimulus === 'object' && !Array.isArray(stimulus)) {
    const obj = stimulus as Record<string, unknown>;
    const rawChoices = obj.choices ?? obj.options ?? obj.figures ?? obj.items;
    if (Array.isArray(rawChoices) && rawChoices.length >= 2) {
      const parsed = rawChoices.map(parseVisualChoice);
      if (parsed.every((choice): choice is VisualChoiceMatrix => choice !== null)) {
        return parsed.slice(0, 4);
      }
    }
  }

  if (!visualPrompt && !optionLayout.includes('grid')) return null;
  const parsedOptions = (question.options ?? []).map(parseVisualChoice);
  if (parsedOptions.length >= 2 && parsedOptions.every((choice): choice is VisualChoiceMatrix => choice !== null)) {
    return parsedOptions;
  }
  return null;
}

/** Turn constraints string (often "a., b., c.") or array into separate lines for display. */
function splitConstraintLines(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof raw !== 'string') return [];
  const s = raw.trim();
  if (!s) return [];
  const byPeriodComma = s
    .split(/\.\s*,\s*/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (byPeriodComma.length > 1) {
    return byPeriodComma.map((t) => (/\.$/.test(t) ? t : `${t}.`));
  }
  if (s.includes(';')) return s.split(/\s*;\s*/).map((t) => t.trim()).filter(Boolean);
  if (s.includes('\n')) return s.split(/\n+/).map((t) => t.trim()).filter(Boolean);
  return [s];
}

/**
 * Pattern-transfer layout returns before the generic stimulus map, so `constraints` / `rules`
 * (e.g. C2–C6) never rendered. Append them when present (and allow `rules` through when the stem
 * references “constraints below” even if infer-hide is on).
 */
function stimulusConstraintsAppendixForPatternTransferBox(
  obj: Record<string, unknown>,
  theme: StimulusVisualTheme,
  hideSharedRule: boolean,
  q: ExamQuestion
): React.ReactNode {
  const prose = learnerRuleHintProse(q.prompt, q.instruction);
  const forceConstraints = promptExpectsListedConstraintsInStimulus(prose);
  const authorHide = obj.hide_shared_rule === true;

  const rulesRaw = obj.rules;
  const rulesArr = Array.isArray(rulesRaw) ? rulesRaw : [];
  const hasRules = rulesArr.some((r) => String(r ?? '').trim());
  const rawCons = obj.constraints;
  const hasCons =
    (typeof rawCons === 'string' && rawCons.trim()) ||
    (Array.isArray(rawCons) && rawCons.some((x) => String(x ?? '').trim()));

  const showRules = hasRules && !authorHide && (!hideSharedRule || forceConstraints);
  if (!hasCons && !showRules) return null;

  const capSx = {
    fontWeight: 700,
    color: theme.caption,
    display: 'block',
    mb: 1,
    letterSpacing: 0.02,
  } as const;

  return (
    <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${theme.border}` }}>
      {hasCons ? (
        <Box sx={{ mb: showRules ? 2.25 : 0 }}>
          <Typography variant="caption" sx={capSx}>
            Constraints
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.25, color: theme.text, '& li': { mb: 0.65 } }}>
            {splitConstraintLines(rawCons).map((line, i) => (
              <Typography component="li" key={`pt-cons-${i}`} sx={{ fontSize: '0.92rem', lineHeight: 1.55 }}>
                {line}
              </Typography>
            ))}
          </Box>
        </Box>
      ) : null}
      {showRules ? (
        <Box sx={{ mt: hasCons ? 2 : 0 }}>
          <Typography variant="caption" sx={{ ...capSx, mb: 1 }}>
            {forceConstraints ? 'Constraints' : 'Apply these rules'}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.25, color: theme.text, '& li': { mb: 0.5 } }}>
            {rulesArr.map((r, i) => (
              <Typography component="li" key={`pt-rule-${i}`} sx={{ fontSize: '0.95rem', lineHeight: 1.55 }}>
                {String(r ?? '')
                  .replace(/^Rule:\s*/i, '')
                  .trim()}
              </Typography>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

type BlankSlot =
  | { kind: 'none' }
  | { kind: 'start'; caption: string }
  | { kind: 'end'; caption: string }
  | { kind: 'beforeIndex'; zeroBased: number; caption: string }
  | { kind: 'unknown'; caption: string };

function isSequencePlaceholder(s: string): boolean {
  const t = s.trim();
  return (
    !t ||
    t === '?' ||
    t === '??' ||
    t === '…' ||
    t === '...' ||
    t === '[?]' ||
    t.toLowerCase() === 'blank' ||
    t.toLowerCase() === '[blank]'
  );
}

function sequenceLooksNumeric(values: string[]): boolean {
  const terms = values.filter((v) => !isSequencePlaceholder(v));
  if (terms.length === 0) return false;
  return terms.every((v) => /^-?\d+(\.\d+)?$/.test(v.trim()));
}

/**
 * Banks often encode the missing slot as `?` inside `sequence` *and* set `blank_position: end`.
 * Strip the embedded placeholder so we render one dashed "?" tile, not two.
 */
function stripEmbeddedBlankPlaceholder(syms: unknown[], blank: BlankSlot): string[] {
  const list = syms.map((x) => String(x));
  if (blank.kind === 'start' && list.length > 0 && isSequencePlaceholder(list[0])) {
    list.shift();
  } else if (blank.kind === 'end' && list.length > 0 && isSequencePlaceholder(list[list.length - 1])) {
    list.pop();
  } else if (blank.kind === 'beforeIndex') {
    const z = blank.zeroBased;
    if (z >= 0 && z < list.length && isSequencePlaceholder(list[z])) {
      list.splice(z, 1);
    }
  }
  return list;
}

/** Where the missing term sits - item banks often use `end`; show plain language + a "?" tile. */
function blankSlotFromStimulus(raw: unknown, numericSequence = false): BlankSlot {
  if (raw === null || raw === undefined) return { kind: 'none' };
  const s = String(raw).trim().toLowerCase();
  if (s === 'end' || s === 'last' || s === 'after_last') {
    return {
      kind: 'end',
      caption: numericSequence
        ? 'Choose the number that comes next in the sequence.'
        : 'Choose the shape that comes next - right after the last symbol in the row.',
    };
  }
  if (s === 'start' || s === 'first' || s === 'before_first') {
    return {
      kind: 'start',
      caption: numericSequence
        ? 'Choose the number that belongs at the beginning of the sequence.'
        : 'Choose the shape that belongs at the beginning, before the first symbol.',
    };
  }
  const n = parseInt(s, 10);
  if (Number.isFinite(n) && n >= 1) {
    return {
      kind: 'beforeIndex',
      zeroBased: n - 1,
      caption: numericSequence
        ? `Choose the number that belongs at position ${n} in the sequence (counting from the left).`
        : `Choose the shape that belongs at position ${n} in the sequence (counting from the left).`,
    };
  }
  return { kind: 'unknown', caption: `Missing item placement: ${String(raw)}.` };
}

function interleaveBlankSlot(syms: unknown[], blank: BlankSlot): Array<{ kind: 'sym'; v: string } | { kind: 'blank' }> {
  const out: Array<{ kind: 'sym'; v: string } | { kind: 'blank' }> = [];
  const list = syms.map((x) => String(x));
  if (blank.kind === 'none' || blank.kind === 'unknown') {
    for (const v of list) out.push(isSequencePlaceholder(v) ? { kind: 'blank' } : { kind: 'sym', v });
    return out;
  }
  if (blank.kind === 'start') {
    out.push({ kind: 'blank' });
    for (const v of list) out.push({ kind: 'sym', v });
    return out;
  }
  if (blank.kind === 'end') {
    for (const v of list) out.push({ kind: 'sym', v });
    out.push({ kind: 'blank' });
    return out;
  }
  const z = blank.zeroBased;
  for (let i = 0; i < list.length; i++) {
    if (i === z) out.push({ kind: 'blank' });
    out.push({ kind: 'sym', v: list[i] });
  }
  if (z === list.length) out.push({ kind: 'blank' });
  return out;
}

/** Pattern-logic and generic structured stimuli - readable layout instead of raw JSON. */
const HumanFriendlyStimulusInner: React.FC<{
  q: ExamQuestion;
  border: string;
  renderMath?: boolean;
  variant?: StimulusVariant;
}> = ({
  q,
  border,
  renderMath = false,
  variant = 'light',
}) => {
  const theme = resolveStimulusTheme(variant, border);
  const capSx = {
    fontWeight: 700,
    color: theme.caption,
    display: 'block',
    mb: 1,
    letterSpacing: 0.02,
  } as const;
  const stimulus = q.stimulus;
  const stimulusType = q.stimulus_type;

  if (stimulus == null) return null;

  // ─── Symbolic section inventory v2 stimulus types ─────────────────────────
  if (typeof stimulus === 'object' && !Array.isArray(stimulus)) {
    const v2 = stimulus as Record<string, unknown>;
    const v2Type = typeof v2.type === 'string' ? v2.type : stimulusType;

    if (v2Type === 'grid_v2') {
      const cells = Array.isArray(v2.cells) ? v2.cells.map(String) : [];
      const rows = Number(v2.row_count) || 0;
      const cols = Number(v2.col_count) || 0;
      if (cells.length > 0 && rows > 0 && cols > 0) {
        const matrix: string[][] = [];
        for (let r = 0; r < rows; r++) {
          matrix.push(cells.slice(r * cols, (r + 1) * cols));
        }
        return (
          <Box sx={stimulusPanelSx(theme)}>
            <StimulusGridMatrixView matrix={matrix} border={border} renderMath={renderMath} theme={theme} />
          </Box>
        );
      }
    }

    if (v2Type === 'sequence_v2') {
      const tokens = Array.isArray(v2.tokens) ? v2.tokens.map(String) : [];
      if (tokens.length > 0) {
        return (
          <Box sx={stimulusPanelSx(theme)}>
            <StimulusSequenceView
              sequence={tokens}
              border={border}
              blankMeta={{ kind: 'none' }}
              blankHelp={null}
              theme={theme}
            />
          </Box>
        );
      }
    }

    if (v2Type === 'example_rule_v2') {
      const examplesRaw = Array.isArray(v2.examples) ? v2.examples : [];
      let pairs = examplesRaw.filter(isIoExamplePair).map((row) => ({
        input: String(row.input ?? '').trim(),
        output: String(row.output ?? '').trim(),
      })).filter((row) => row.input && row.output);
      let newInput = typeof v2.new_input === 'string' ? v2.new_input.trim() : '';
      if (pairs.length === 0 || !newInput) {
        const rawFallback =
          (typeof v2.raw === 'string' && v2.raw.trim()) ||
          (typeof v2.text === 'string' && v2.text.trim()) ||
          '';
        const recovered = rawFallback ? parseExampleRuleProse(rawFallback) : null;
        if (recovered) {
          if (pairs.length === 0) pairs = recovered.pairs;
          if (!newInput) newInput = recovered.newInput;
        }
      }
      const tiles = renderExampleRuleTiles(pairs, newInput, theme, capSx);
      if (tiles) return tiles;
      return null;
    }

    if (v2Type === 'partition_groups_v2') {
      // Options already show the four groups; no extra stimulus panel needed.
      return null;
    }

    if (v2Type === 'raw_text_v2' || v2Type === 'raw') {
      const prose =
        (typeof v2.text === 'string' && v2.text.trim()) ||
        (typeof v2.raw === 'string' && v2.raw.trim()) ||
        (typeof v2.setup === 'string' && v2.setup.trim()) ||
        (typeof v2.passage === 'string' && v2.passage.trim()) ||
        '';
      if (!prose) return null;
      return (
        <Box sx={stimulusPanelSx(theme, { p: 2 })}>
          <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, color: theme.text, fontSize: '0.95rem' }}>
            {prose}
          </Typography>
        </Box>
      );
    }
  }

  if (typeof stimulus === 'string') {
    const text = stimulus.trim();
    if (!text) return null;
    const gridMatrix = parseStimulusGridMatrix({ grid: text });
    if (gridMatrix) {
      return (
        <Box sx={stimulusPanelSx(theme)}>
          <StimulusGridMatrixView matrix={gridMatrix} border={border} renderMath={renderMath} theme={theme} />
        </Box>
      );
    }
    const ruleFromProse = parseExampleRuleProse(text);
    if (ruleFromProse && ruleFromProse.pairs.length > 0) {
      const tiles = renderExampleRuleTiles(ruleFromProse.pairs, ruleFromProse.newInput, theme, capSx);
      if (tiles) return tiles;
    }
    const seq = parseStimulusSequence(text);
    if (seq) {
      const seqStrings = seq.map((x) => String(x));
      const blankMeta = blankSlotFromStimulus(undefined, sequenceLooksNumeric(seqStrings));
      return (
        <Box sx={stimulusPanelSx(theme)}>
          <StimulusSequenceView
            sequence={seqStrings}
            border={border}
            blankMeta={blankMeta}
            blankHelp={null}
            theme={theme}
          />
        </Box>
      );
    }
    // Dedent so uneven bank indentation (e.g. "  ■ → ▲") does not show as a formatting bug.
    const dedented = text
      .split('\n')
      .map((line) => line.trimEnd())
      .map((line) => line.replace(/^\s+/, ''))
      .join('\n')
      .trim();
    return (
      <Box sx={stimulusPanelSx(theme, { p: 2 })}>
        <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, color: theme.text, fontSize: '0.95rem' }}>
          {dedented}
        </Typography>
      </Box>
    );
  }

  if (typeof stimulus !== 'object' || Array.isArray(stimulus)) return null;

  const obj = stimulus as Record<string, unknown>;
  const hideSharedRule = shouldHideSharedLearnerRule(stimulusType, obj, q.prompt, q.instruction);

  /** Transformation drills: paired inputs/outputs + optional test row (not raw JSON). */
  const examplesRaw = obj.examples;
  if (Array.isArray(examplesRaw) && examplesRaw.length > 0) {
    const pairs = examplesRaw.filter(isIoExamplePair);
    if (pairs.length > 0) {
      const symTileSx = stimulusSymbolTileSx(theme);
      const testRaw =
        obj.test_input ?? obj.test_query ?? obj.query_input ?? obj.test_case ?? obj.query;
      const testStr =
        testRaw !== null && testRaw !== undefined && String(testRaw).trim() !== ''
          ? String(testRaw).trim()
          : '';

      return (
        <Box sx={stimulusPanelSx(theme)}>
          {pairs.map((row, i) => (
            <Box key={i} sx={{ mb: i < pairs.length - 1 || testStr ? 2 : 0 }}>
              <Typography variant="caption" sx={capSx}>
                Example {i + 1}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
                <Box sx={symTileSx}>{String(row.input)}</Box>
                <Typography sx={{ color: theme.caption, fontWeight: 700, fontSize: '1.1rem' }} aria-hidden>
                  →
                </Typography>
                <Box sx={symTileSx}>{String(row.output)}</Box>
              </Box>
            </Box>
          ))}
          {testStr ? (
            <Box
              sx={{
                pt: pairs.length ? 2 : 0,
                mt: pairs.length ? 0 : 0,
                borderTop: pairs.length ? `1px solid ${theme.border}` : 'none',
              }}
            >
              <Typography variant="caption" sx={capSx}>
                Test input
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
                <Box sx={symTileSx}>{testStr}</Box>
                <Typography sx={{ color: theme.caption, fontWeight: 700, fontSize: '1.1rem' }} aria-hidden>
                  →
                </Typography>
                <Box
                  sx={{
                    ...symTileSx,
                    borderStyle: 'dashed',
                    bgcolor: theme.blankBg,
                    color: theme.blankColor,
                    fontWeight: 800,
                    fontSize: '1.35rem',
                  }}
                  aria-label="Missing output"
                >
                  ?
                </Box>
              </Box>
            </Box>
          ) : null}
        </Box>
      );
    }
  }

  /** Number rule → shape pattern (bank `source_*` / `target_stem`); hides raw `items` via dedicated layout. */
  const sourceRule = typeof obj.source_rule === 'string' ? obj.source_rule.trim() : '';
  const sourceSeq = coerceStimulusSequence(obj.source_sequence);
  const targetStemRaw = typeof obj.target_stem === 'string' ? obj.target_stem.trim() : '';
  const shapeTokens =
    targetStemRaw.length === 0
      ? []
      : targetStemRaw.includes(',')
        ? targetStemRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [targetStemRaw];
  const hasPatternTransferVisual = sourceSeq.length > 0 || shapeTokens.length > 0;
  const showPatternTransfer =
    hasPatternTransferVisual && !shouldSuppressPatternTransferStimulusBox(q, sourceSeq, shapeTokens);

  if (showPatternTransfer) {
    const symTileSx = stimulusSymbolTileSx(theme);
    const showRuleBlock = sourceRule.length > 0 && !hideSharedRule;
    const dualNarr = dualPatternNarrativeSplit(q.prompt ?? '');
    const showDualNarrative = dualNarr !== null && patternTransferStimulusPresent(q);
    return (
      <Box sx={stimulusPanelSx(theme)}>
        {showDualNarrative ? (
          <Box sx={{ mb: 2.5 }}>
            {renderMath ? (
              <ExamMathText
                inline={false}
                sx={{
                  fontWeight: 700,
                  color: theme.heading,
                  fontSize: '0.97rem',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-line',
                }}
              >
                {formatDualPatternPromptLinebreaks(dualNarr.narrative)}
              </ExamMathText>
            ) : (
              <Typography
                sx={{
                  fontWeight: 700,
                  color: theme.heading,
                  fontSize: '0.97rem',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-line',
                }}
              >
                {formatDualPatternPromptLinebreaks(dualNarr.narrative)}
              </Typography>
            )}
          </Box>
        ) : null}
        {sourceSeq.length > 0 ? (
          <Box sx={{ mb: shapeTokens.length > 0 ? 2.25 : showRuleBlock ? 2.25 : 1.5 }}>
            <Typography variant="caption" sx={{ ...capSx, mb: 1.25 }}>
              Number pattern
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
              {sourceSeq.map((v, i) => (
                <Box key={i} sx={{ ...symTileSx, fontSize: '1.2rem', fontWeight: 700 }}>
                  {v}
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}
        {showRuleBlock ? (
          <Box sx={{ mb: shapeTokens.length > 0 ? 2.25 : 0 }}>
            <Typography variant="caption" sx={capSx}>
              Rule
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: theme.text, lineHeight: 1.55 }}>{sourceRule}</Typography>
          </Box>
        ) : null}
        {shapeTokens.length > 0 ? (
          <Box>
            <Typography variant="caption" sx={{ ...capSx, mb: 1.25 }}>
              Shape pattern
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
              {shapeTokens.map((s, i) => (
                <Box key={i} sx={symTileSx}>
                  {s}
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}
        {stimulusConstraintsAppendixForPatternTransferBox(obj, theme, hideSharedRule, q)}
      </Box>
    );
  }

  const passageOnlyText = gatherPassageOnlyStimulus(obj);
  if (passageOnlyText) {
    return (
      <Box sx={stimulusPanelSx(theme)}>
        <Typography sx={{ color: theme.text, fontSize: '1rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
          {passageOnlyText}
        </Typography>
      </Box>
    );
  }

  const gridMatrix = parseStimulusGridMatrix(obj);
  const dataTable = parseStimulusDataTable(obj);
  const seqCandidate = obj.input_sequence ?? obj.sequence ?? obj.text;
  const seq = parseStimulusSequence(seqCandidate);
  const rulesRaw = obj.rules;
  const hasSeq = seq !== null && seq.length > 0;
  const rulesArr = Array.isArray(rulesRaw) ? rulesRaw : [];
  const hasRules = rulesArr.some((r) => String(r ?? '').trim());
  const textRule = hasRules ? null : parseRuleFromStimulusText(obj.text);
  const seqStrings = hasSeq && seq ? seq.map((x) => String(x)) : [];
  const blankMeta = hasSeq
    ? blankSlotFromStimulus(obj.blank_position, sequenceLooksNumeric(seqStrings))
    : ({ kind: 'none' } as BlankSlot);
  const blankHelp = 'caption' in blankMeta ? blankMeta.caption : null;

  if (hasSeq || gridMatrix || (hasRules && !hideSharedRule) || textRule) {
    return (
      <Box sx={stimulusPanelSx(theme)}>
        {textRule ? (
          <Box sx={{ mb: hasSeq || gridMatrix || (hasRules && !hideSharedRule) ? 2.25 : 0 }}>
            <Typography variant="caption" sx={capSx}>
              Rules to apply
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: theme.text, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {textRule}
            </Typography>
          </Box>
        ) : null}
        {hasSeq && (
          <StimulusSequenceView
            sequence={seqStrings}
            border={border}
            blankMeta={blankMeta}
            blankHelp={blankHelp}
            mb={gridMatrix || (hasRules && !hideSharedRule) ? 2.25 : 0}
            theme={theme}
          />
        )}
        {gridMatrix ? (
          <Box sx={{ mb: hasRules && !hideSharedRule ? 2.25 : 0 }}>
            <StimulusGridMatrixView matrix={gridMatrix} border={border} renderMath={renderMath} theme={theme} />
          </Box>
        ) : null}
        {hasRules && !hideSharedRule && (
          <Box>
            <Typography variant="caption" sx={capSx}>
              {stimulusType === 'symbol_sequence' || stimulusType === 'transformation'
                ? 'Apply these rules'
                : 'Rules to apply'}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.25, color: theme.text, '& li': { mb: 0.5 } }}>
              {rulesArr.map((r, i) => (
                <Typography component="li" key={i} sx={{ fontSize: '0.95rem', lineHeight: 1.55 }}>
                  {String(r ?? '')
                    .replace(/^Rule:\s*/i, '')
                    .trim()}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  const comparisonQuantities = gatherComparisonQuantities(obj);
  if (comparisonQuantities) {
    const qtyTileSx = {
      flex: 1,
      minWidth: 0,
      p: 2,
      borderRadius: 2,
      border: `1px solid ${theme.border}`,
      bgcolor: theme.qtyTileBg,
    };
    return (
      <Box sx={stimulusPanelSx(theme)}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <Box sx={qtyTileSx}>
            <Typography variant="caption" sx={{ ...capSx, mb: 1, letterSpacing: 0.04 }}>
              Quantity A
            </Typography>
            <Typography sx={{ fontWeight: 700, color: theme.heading, fontSize: '1.05rem', lineHeight: 1.45 }}>
              {comparisonQuantities.a}
            </Typography>
          </Box>
          <Box sx={qtyTileSx}>
            <Typography variant="caption" sx={{ ...capSx, mb: 1, letterSpacing: 0.04 }}>
              Quantity B
            </Typography>
            <Typography sx={{ fontWeight: 700, color: theme.heading, fontSize: '1.05rem', lineHeight: 1.45 }}>
              {comparisonQuantities.b}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  const concealedRuleKeys = hideSharedRule ? hiddenRuleKeysWhenConcealed() : null;
  const entries = Object.entries(obj).filter(
    ([key, value]) =>
      key !== '__proto__' &&
      !(dataTable && (key === 'headers' || key === 'columns' || key === 'rows' || key === 'data')) &&
      !(dataTable && key === 'text' && typeof value === 'string' && parseMarkdownDataTableText(value)) &&
      !STIMULUS_KEYS_HIDDEN_FROM_LEARNER.has(key) &&
      !hideGridDimensionStimulusKeys(key, obj, gridMatrix !== null) &&
      !stimulusFieldRenderedAsGrid(key, value, gridMatrix !== null) &&
      !(concealedRuleKeys?.has(key) ?? false) &&
      !(key === 'text' && shouldHideStimulusTextSummary(value, obj)) &&
      !(key === 'setup' && plainSetupTextBeforePrompt(q)) &&
      !stimulusFieldDuplicatesPrompt(key, value, q.prompt)
  );
  if (entries.length === 0 && !gridMatrix && !dataTable) return null;

  return (
    <Box
      sx={{
        ...stimulusPanelSx(theme, { p: 2 }),
        maxHeight: gridMatrix ? 520 : 320,
        overflow: 'auto',
      }}
    >
      {gridMatrix ? (
        <StimulusGridMatrixView matrix={gridMatrix} border={border} renderMath={renderMath} theme={theme} />
      ) : null}
      {dataTable ? <StimulusDataTableView table={dataTable} border={border} theme={theme} /> : null}
      {entries.map(([key, value]) =>
        key === 'text' && typeof value === 'string' ? renderMath ? (
          <ExamMathText
            key={key}
            inline={false}
            sx={{
              fontSize: '0.95rem',
              color: theme.text,
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              mb: 0.85,
            }}
          >
            {value.trim()}
          </ExamMathText>
        ) : (
          <Typography
            key={key}
            sx={{
              fontSize: '0.95rem',
              color: theme.text,
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              mb: 0.85,
            }}
          >
            {value.trim()}
          </Typography>
        ) : key === 'constraints' ? (
          <Box key={key} sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ ...capSx, mb: 1 }}>
              Constraints
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.25, color: theme.text, '& li': { mb: 0.65 } }}>
              {splitConstraintLines(value).map((line, i) => (
                <Typography component="li" key={i} sx={{ fontSize: '0.92rem', lineHeight: 1.55 }}>
                  {line}
                </Typography>
              ))}
            </Box>
          </Box>
        ) : (
          <Typography key={key} sx={{ fontSize: '0.9rem', color: theme.text, mb: 0.85, lineHeight: 1.45 }}>
            <Box component="span" sx={{ fontWeight: 700, color: theme.textMuted }}>
              {humanizeFieldKey(key)}:{' '}
            </Box>
            {formatStimulusLeafValue(value)}
          </Typography>
        )
      )}
    </Box>
  );
};

const HumanFriendlyStimulus = React.memo(HumanFriendlyStimulusInner);

interface OptionPickerProps {
  options: string[];
  selectedOption: number | null;
  onSelect: (i: number) => void;
  primaryColor: string;
  primarySoft: string;
  borderMuted: string;
  mathWrap?: boolean;
  selectionLocked?: boolean;
  answerFeedback?: { correctIndex: number; selectedIndex: number } | null;
}

function OptionPicker({
  options,
  selectedOption,
  onSelect,
  primaryColor,
  primarySoft,
  borderMuted,
  mathWrap,
  selectionLocked = false,
  answerFeedback = null,
}: OptionPickerProps) {
  return (
    <FormControl component="fieldset" fullWidth>
      <RadioGroup
        value={selectedOption !== null ? String(selectedOption) : ''}
        onChange={(e) => {
          if (selectionLocked) return;
          onSelect(parseInt(e.target.value, 10));
        }}
      >
        {options.map((rawOption, idx) => {
          const option = stripEmbeddedOptionLetterPrefix(rawOption);
          const fb = answerFeedback;
          let rowBorder = selectedOption === idx ? primaryColor : borderMuted;
          let rowBg = selectedOption === idx ? primarySoft : '#fff';
          let letterBg = selectedOption === idx ? primaryColor : '#f1f5f9';
          let letterBorder = selectedOption === idx ? primaryColor : borderMuted;
          let letterFg = selectedOption === idx ? '#fff' : '#64748b';
          let labelStrong = selectedOption === idx;
          if (fb) {
            if (idx === fb.correctIndex) {
              rowBorder = '#059669';
              rowBg = 'rgba(5, 150, 105, 0.1)';
              letterBg = '#059669';
              letterBorder = '#059669';
              letterFg = '#fff';
              labelStrong = true;
            } else if (idx === fb.selectedIndex && idx !== fb.correctIndex) {
              rowBorder = '#dc2626';
              rowBg = 'rgba(220, 38, 38, 0.07)';
              letterBg = '#dc2626';
              letterBorder = '#dc2626';
              letterFg = '#fff';
              labelStrong = true;
            } else {
              rowBorder = borderMuted;
              rowBg = '#fff';
              letterBg = '#f1f5f9';
              letterBorder = borderMuted;
              letterFg = '#64748b';
              labelStrong = false;
            }
          }
          return (
            <FormControlLabel
              key={idx}
              value={String(idx)}
              control={<Radio sx={{ display: 'none' }} />}
              onClick={() => {
                if (selectionLocked) return;
                onSelect(idx);
              }}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: letterBg,
                      border: `2px solid ${letterBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: letterFg }}>
                      {String.fromCharCode(65 + idx)}
                    </Typography>
                  </Box>
                  {mathWrap ? (
                    <ExamMathText
                      inline
                      sx={{
                        color: labelStrong ? '#0f172a' : '#475569',
                        fontSize: '0.92rem',
                        fontWeight: labelStrong ? 700 : 500,
                      }}
                    >
                      {option}
                    </ExamMathText>
                  ) : (
                    <Typography
                      sx={{
                        color: labelStrong ? '#0f172a' : '#475569',
                        fontSize: '0.92rem',
                        fontWeight: labelStrong ? 700 : 500,
                        lineHeight: 1.45,
                      }}
                    >
                      {option}
                    </Typography>
                  )}
                </Box>
              }
              sx={{
                m: 0,
                mb: 1.25,
                p: '14px 16px',
                borderRadius: 2,
                border: `2px solid ${rowBorder}`,
                bgcolor: rowBg,
                cursor: selectionLocked ? 'default' : 'pointer',
                alignItems: 'center',
                transition: 'all 0.15s',
                '&:hover': selectionLocked ? {} : { borderColor: `${primaryColor}99` },
              }}
            />
          );
        })}
      </RadioGroup>
    </FormControl>
  );
}

interface VisualOptionPickerProps {
  choices: VisualChoiceMatrix[];
  selectedOption: number | null;
  onSelect: (i: number) => void;
  primaryColor: string;
  primarySoft: string;
  borderMuted: string;
  selectionLocked?: boolean;
  answerFeedback?: { correctIndex: number; selectedIndex: number } | null;
}

function VisualOptionPicker({
  choices,
  selectedOption,
  onSelect,
  primaryColor,
  primarySoft,
  borderMuted,
  selectionLocked = false,
  answerFeedback = null,
}: VisualOptionPickerProps) {
  const maxChoiceColumns = Math.max(1, ...choices.flatMap((choice) => choice.map((row) => row.length)));
  const stackChoices = maxChoiceColumns > 6;

  return (
    <FormControl component="fieldset" fullWidth>
      <RadioGroup
        value={selectedOption !== null ? String(selectedOption) : ''}
        onChange={(e) => {
          if (selectionLocked) return;
          onSelect(parseInt(e.target.value, 10));
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: stackChoices ? '1fr' : { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          {choices.map((choice, idx) => {
            const fb = answerFeedback;
            let rowBorder = selectedOption === idx ? primaryColor : borderMuted;
            let rowBg = selectedOption === idx ? primarySoft : '#fff';
            let letterBg = selectedOption === idx ? primaryColor : '#f1f5f9';
            let letterBorder = selectedOption === idx ? primaryColor : borderMuted;
            let letterFg = selectedOption === idx ? '#fff' : '#64748b';
            if (fb) {
              if (idx === fb.correctIndex) {
                rowBorder = '#059669';
                rowBg = 'rgba(5, 150, 105, 0.1)';
                letterBg = '#059669';
                letterBorder = '#059669';
                letterFg = '#fff';
              } else if (idx === fb.selectedIndex && idx !== fb.correctIndex) {
                rowBorder = '#dc2626';
                rowBg = 'rgba(220, 38, 38, 0.07)';
                letterBg = '#dc2626';
                letterBorder = '#dc2626';
                letterFg = '#fff';
              } else {
                rowBorder = borderMuted;
                rowBg = '#fff';
                letterBg = '#f1f5f9';
                letterBorder = borderMuted;
                letterFg = '#64748b';
              }
            }
            const cols = Math.max(1, ...choice.map((row) => row.length));
            return (
              <FormControlLabel
                key={idx}
                value={String(idx)}
                control={<Radio sx={{ display: 'none' }} />}
                onClick={() => {
                  if (selectionLocked) return;
                  onSelect(idx);
                }}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: letterBg,
                        border: `2px solid ${letterBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: letterFg }}>
                        {String.fromCharCode(65 + idx)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${cols}, 1.45rem)`,
                        gap: 0.6,
                        justifyContent: 'start',
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: '#fff',
                        border: `1px solid ${borderMuted}`,
                        maxWidth: '100%',
                        overflowX: 'auto',
                      }}
                      aria-label={`Option ${String.fromCharCode(65 + idx)} visual pattern`}
                    >
                      {choice.flatMap((row, rowIdx) => {
                        const padded = [...row];
                        while (padded.length < cols) padded.push('');
                        return padded.map((cell, colIdx) => (
                          <Typography
                            key={`${rowIdx}-${colIdx}`}
                            sx={{
                              color: cell ? '#0f172a' : 'transparent',
                              fontSize: '1.45rem',
                              fontWeight: 800,
                              lineHeight: 1,
                              textAlign: 'center',
                              minHeight: '1.45rem',
                            }}
                          >
                            {cell || ' '}
                          </Typography>
                        ));
                      })}
                    </Box>
                  </Box>
                }
                sx={{
                  m: 0,
                  p: '14px 16px',
                  width: '100%',
                  minWidth: 0,
                  borderRadius: 2,
                  border: `2px solid ${rowBorder}`,
                  bgcolor: rowBg,
                  cursor: selectionLocked ? 'default' : 'pointer',
                  alignItems: 'center',
                  transition: 'all 0.15s',
                  '&:hover': selectionLocked ? {} : { borderColor: `${primaryColor}99` },
                  '& .MuiFormControlLabel-label': { width: '100%', minWidth: 0 },
                }}
              />
            );
          })}
        </Box>
      </RadioGroup>
    </FormControl>
  );
}

const ListeningMcqInner: React.FC<{
  question: ExamQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: number | null;
  onSelectOption: (i: number) => void;
  primary: string;
  primarySoft: string;
  borderMuted: string;
  renderMath?: boolean;
  footer?: React.ReactNode;
  selectionLocked?: boolean;
  answerFeedback?: { correctIndex: number; selectedIndex: number } | null;
}> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  primary,
  primarySoft,
  borderMuted,
  renderMath,
  footer,
  selectionLocked = false,
  answerFeedback = null,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  };
  return (
    <Box sx={{ width: '100%' }}>
      <audio ref={audioRef} src={question.audio_url!} onEnded={() => setPlaying(false)} />
      <Typography
        variant="caption"
        sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.68rem' }}
      >
        Question {questionNumber} of {totalQuestions}
      </Typography>
      <QuestionPromptBlock
        question={question}
        renderMath={renderMath}
        mathSx={{ mb: 2, fontWeight: 400, color: '#334155', fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.6 }}
        typographySx={{ fontWeight: 400, color: '#334155', mb: 2, fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.6, whiteSpace: 'pre-line' }}
      />
      {question.instruction && !shouldSuppressInstructionAsDuplicateRule(question) && (
        <InstructionLine text={question.instruction} />
      )}
      <HumanFriendlyStimulus q={question} border={borderMuted} renderMath={!!renderMath} />
      <Button
        startIcon={playing ? <StopIcon /> : <PlayArrowIcon />}
        variant="outlined"
        onClick={toggle}
        sx={{ mb: 3, borderColor: primary, color: primary, fontWeight: 700 }}
      >
        {playing ? 'Stop audio' : 'Play audio'}
      </Button>
      <OptionPicker
        options={question.options}
        selectedOption={selectedOption}
        onSelect={onSelectOption}
        primaryColor={primary}
        primarySoft={primarySoft}
        borderMuted={borderMuted}
        mathWrap={renderMath}
        selectionLocked={selectionLocked}
        answerFeedback={answerFeedback}
      />
      {footer}
    </Box>
  );
};

const SpokenResponseInner: React.FC<{
  question: ExamQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: number | null;
  onSelectOption: (i: number) => void;
  primary: string;
  primarySoft: string;
  borderMuted: string;
  renderMath?: boolean;
  footer?: React.ReactNode;
  selectionLocked?: boolean;
  answerFeedback?: { correctIndex: number; selectedIndex: number } | null;
}> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  primary,
  primarySoft,
  borderMuted,
  renderMath,
  footer,
  selectionLocked = false,
  answerFeedback = null,
}) => {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const startRec = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      mr.onstop = () => {
        const b = new Blob(chunks.current, { type: 'audio/webm' });
        setBlobUrl((u) => {
          if (u) URL.revokeObjectURL(u);
          return URL.createObjectURL(b);
        });
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRec(mr);
      setRecording(true);
    } catch {
      // mic denied
    }
  }, []);

  const stopRec = useCallback(() => {
    if (rec && recording) {
      rec.stop();
      setRecording(false);
      setRec(null);
    }
  }, [rec, recording]);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>
        Question {questionNumber} of {totalQuestions}
      </Typography>
      <QuestionPromptBlock
        question={question}
        renderMath={renderMath}
        mathSx={{ mb: 2, fontWeight: 400, color: '#334155', fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.6 }}
        typographySx={{ fontWeight: 400, color: '#334155', mb: 2, fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.6, whiteSpace: 'pre-line' }}
      />
      {question.instruction && !shouldSuppressInstructionAsDuplicateRule(question) && (
        <InstructionLine text={question.instruction} />
      )}
      <HumanFriendlyStimulus q={question} border={borderMuted} renderMath={!!renderMath} />
      <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2, mb: 2, border: `1px solid ${borderMuted}` }}>
        <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 1.5 }}>
          Record your spoken response (practice). Select the option that best matches your response for scoring.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {!recording ? (
            <Button startIcon={<FiberManualRecordIcon />} variant="contained" color="error" size="small" onClick={startRec}>
              Record
            </Button>
          ) : (
            <Button startIcon={<StopIcon />} variant="outlined" color="error" size="small" onClick={stopRec}>
              Stop
            </Button>
          )}
          {blobUrl && <audio controls src={blobUrl} style={{ maxWidth: '100%', height: 36 }} />}
        </Box>
      </Box>
      <OptionPicker
        options={question.options}
        selectedOption={selectedOption}
        onSelect={onSelectOption}
        primaryColor={primary}
        primarySoft={primarySoft}
        borderMuted={borderMuted}
        mathWrap={renderMath}
        selectionLocked={selectionLocked}
        answerFeedback={answerFeedback}
      />
      {footer}
    </Box>
  );
};

interface ExamQuestionBodyProps {
  assessmentId: string;
  question: ExamQuestion | null;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: number | null;
  onSelectOption: (i: number) => void;
  theme: 'blue' | 'purple';
  /** When true, prompt/options/passage use MathJax (requires MathJaxContext ancestor). */
  renderMath?: boolean;
  /** Enables “Report a problem” for signed-in official or practice sessions */
  questionReport?: QuestionReportFrame | null;
  /** Practice immediate feedback: lock choice after “check answer”. */
  selectionLocked?: boolean;
  /** Practice immediate feedback: highlight correct vs selected incorrect option. */
  answerFeedback?: { correctIndex: number; selectedIndex: number } | null;
}

const ExamQuestionBodyInner: React.FC<ExamQuestionBodyProps> = ({
  assessmentId,
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
  theme,
  renderMath = false,
  questionReport = null,
  selectionLocked = false,
  answerFeedback = null,
}) => {
  const primary = theme === 'purple' ? '#7b1fa2' : '#0d47a1';
  const primarySoft = theme === 'purple' ? 'rgba(123,31,162,0.08)' : 'rgba(13,71,161,0.06)';
  const borderMuted = '#e2e8f0';

  if (!question) return null;

  const mode = inferQuestionInteraction(assessmentId, question);
  const opts = (question.options ?? []).map(stripEmbeddedOptionLetterPrefix);
  const visualChoices = visualChoicesFromQuestion({
    ...question,
    options: opts,
  });

  const reportItemId = resolvePracticeItemId(question);
  const problemReportBlock =
    questionReport && reportItemId ? (
      <QuestionProblemReport frame={questionReport} itemId={reportItemId} accent={primary} />
    ) : null;

  if (mode === 'likert' && opts.length >= 5) {
    const scale = [0, 1, 2, 3, 4];
    return (
      <Box sx={{ width: '100%' }}>
        <Typography
          variant="caption"
          sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.68rem' }}
        >
          Question {questionNumber} of {totalQuestions}
        </Typography>
        <QuestionPromptBlock
          question={question}
          renderMath={renderMath}
          mathSx={{ lineHeight: 1.6, mb: 3, fontWeight: 400, color: '#334155', fontSize: { xs: '0.95rem', sm: '1rem' } }}
          typographySx={{ fontWeight: 400, color: '#334155', lineHeight: 1.6, mb: 3, fontSize: { xs: '0.95rem', sm: '1rem' }, whiteSpace: 'pre-line' }}
        />
        {question.instruction && !shouldSuppressInstructionAsDuplicateRule(question) && (
          <InstructionLine text={question.instruction} />
        )}
        <HumanFriendlyStimulus q={question} border={borderMuted} renderMath={!!renderMath} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.75, mb: 1, flexWrap: 'nowrap' }}>
          {scale.map((i) => (
            <Button
              key={i}
              onClick={() => onSelectOption(i)}
              variant={selectedOption === i ? 'contained' : 'outlined'}
              sx={{
                minWidth: 0,
                flex: 1,
                py: 1.25,
                fontWeight: 800,
                borderRadius: 2,
                borderColor: selectedOption === i ? primary : borderMuted,
                bgcolor: selectedOption === i ? primary : '#fff',
                color: selectedOption === i ? '#fff' : '#64748b',
                '&:hover': { borderColor: primary, bgcolor: selectedOption === i ? primary : primarySoft },
              }}
            >
              {i + 1}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.25, mb: 3 }}>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', maxWidth: '28%' }}>{LIKERT_LEFT}</Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center' }}>{LIKERT_MID}</Typography>
          <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'right', maxWidth: '28%' }}>{LIKERT_RIGHT}</Typography>
        </Box>
        <Box sx={{ bgcolor: '#f1f5f9', borderRadius: 2, p: 2 }}>
          <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic', lineHeight: 1.55 }}>
            There are no right or wrong answers. Be honest - this helps us understand you better.
          </Typography>
        </Box>
        {problemReportBlock}
      </Box>
    );
  }

  if (mode === 'listening_mcq' && question.audio_url) {
    return (
      <ListeningMcqInner
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        selectedOption={selectedOption}
        onSelectOption={onSelectOption}
        primary={primary}
        primarySoft={primarySoft}
        borderMuted={borderMuted}
        renderMath={renderMath}
        footer={problemReportBlock}
        selectionLocked={selectionLocked}
        answerFeedback={answerFeedback}
      />
    );
  }

  if (mode === 'spoken_response') {
    return (
      <SpokenResponseInner
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        selectedOption={selectedOption}
        onSelectOption={onSelectOption}
        primary={primary}
        primarySoft={primarySoft}
        borderMuted={borderMuted}
        renderMath={renderMath}
        footer={problemReportBlock}
        selectionLocked={selectionLocked}
        answerFeedback={answerFeedback}
      />
    );
  }

  if (mode === 'passage_mcq' && question.passage) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>
          Question {questionNumber} of {totalQuestions}
        </Typography>
        <Box sx={{ borderLeft: `4px solid ${primary}`, bgcolor: primarySoft, borderRadius: 2, p: 2, mb: 2.5 }}>
          {renderMath ? (
            <ExamMathBlock>{question.passage}</ExamMathBlock>
          ) : (
            <Typography sx={{ fontSize: '0.92rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.65 }}>
              {question.passage}
            </Typography>
          )}
        </Box>
        <QuestionPromptBlock
          question={question}
          renderMath={renderMath}
          mathSx={{ fontWeight: 400, color: '#334155', mb: 2, lineHeight: 1.6, fontSize: { xs: '0.95rem', sm: '1rem' } }}
          typographySx={{ fontWeight: 400, color: '#334155', mb: 2, lineHeight: 1.6, fontSize: { xs: '0.95rem', sm: '1rem' }, whiteSpace: 'pre-line' }}
        />
        {question.instruction && !shouldSuppressInstructionAsDuplicateRule(question) && (
          <InstructionLine text={question.instruction} />
        )}
        <HumanFriendlyStimulus q={question} border={borderMuted} renderMath={!!renderMath} />
        <OptionPicker
          options={opts}
          selectedOption={selectedOption}
          onSelect={onSelectOption}
          primaryColor={primary}
          primarySoft={primarySoft}
          borderMuted={borderMuted}
          mathWrap={renderMath}
          selectionLocked={selectionLocked}
          answerFeedback={answerFeedback}
        />
        {problemReportBlock}
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>
        Question {questionNumber} of {totalQuestions}
      </Typography>
      <QuestionPromptBlock
        question={question}
        renderMath={renderMath}
        mathSx={{ fontWeight: 400, color: '#334155', mb: 2.5, lineHeight: 1.6, fontSize: { xs: '0.95rem', sm: '1rem' } }}
        typographySx={{ fontWeight: 400, color: '#334155', mb: 2.5, lineHeight: 1.6, fontSize: { xs: '0.95rem', sm: '1rem' }, whiteSpace: 'pre-line' }}
      />
      {question.instruction && !shouldSuppressInstructionAsDuplicateRule(question) && (
        <InstructionLine text={question.instruction} />
      )}
      {!visualChoices && <HumanFriendlyStimulus q={question} border={borderMuted} renderMath={!!renderMath} />}
      {question.image_url && (
        <Box
          sx={{
            mb: 2.5,
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${borderMuted}`,
            bgcolor: '#f8fafc',
            display: 'grid',
            placeItems: 'center',
            minHeight: 200,
          }}
        >
          <img src={question.image_url} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }} />
        </Box>
      )}
      {visualChoices ? (
        <VisualOptionPicker
          choices={visualChoices}
          selectedOption={selectedOption}
          onSelect={onSelectOption}
          primaryColor={primary}
          primarySoft={primarySoft}
          borderMuted={borderMuted}
          selectionLocked={selectionLocked}
          answerFeedback={answerFeedback}
        />
      ) : (
        <OptionPicker
          options={opts}
          selectedOption={selectedOption}
          onSelect={onSelectOption}
          primaryColor={primary}
          primarySoft={primarySoft}
          borderMuted={borderMuted}
          mathWrap={renderMath}
          selectionLocked={selectionLocked}
          answerFeedback={answerFeedback}
        />
      )}
      {problemReportBlock}
    </Box>
  );
};

export const ExamQuestionBody = React.memo(ExamQuestionBodyInner);

/** Structured stimulus renderer (grids, sequences, tables) shared by practice and QoD. */
export const ExamQuestionStimulus = HumanFriendlyStimulus;

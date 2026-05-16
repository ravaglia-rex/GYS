import React, { useRef, useState, useCallback } from 'react';
import { Box, Typography, FormControl, FormControlLabel, RadioGroup, Radio, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import type { ExamQuestion, QuestionInteractionType } from '../../db/assessmentCollection';
import { resolvePracticeItemId } from '../practice/practiceModeConfig';
import { getAssessmentFlowDefinition } from '../../config/assessmentFlowUI';
import { ExamMathBlock, ExamMathText } from './ExamMathText';
import { QuestionProblemReport, type QuestionReportFrame } from './QuestionProblemReport';

const LIKERT_LEFT = 'Strongly disagree';
const LIKERT_MID = 'Neutral';
const LIKERT_RIGHT = 'Strongly agree';

export function inferQuestionInteraction(
  assessmentId: string,
  q: ExamQuestion | null
): QuestionInteractionType {
  if (!q) return 'visual_mcq';
  if (q.question_type) return q.question_type;
  if (q.audio_url) return 'listening_mcq';
  if (q.passage && q.passage.trim()) return 'passage_mcq';
  const flow = getAssessmentFlowDefinition(assessmentId);
  const pid = assessmentId === 'comprehensive_personality';
  if (pid && q.options?.length >= 5) return 'likert';
  if (flow.defaultQuestionInteraction === 'likert' && q.options?.length >= 5) return 'likert';
  if (flow.defaultQuestionInteraction === 'listening_mcq' && q.audio_url) return 'listening_mcq';
  if (flow.defaultQuestionInteraction === 'passage_mcq' && q.passage) return 'passage_mcq';
  return 'visual_mcq';
}

/** Secondary stem line (canonical `presentation.instruction`). */
const InstructionLine: React.FC<{ text: string }> = ({ text }) => (
  <Typography variant="body2" sx={{ color: '#475569', mb: 2, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
    {text}
  </Typography>
);

function humanizeFieldKey(key: string): string {
  const spaced = key.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatStimulusLeafValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
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

/** Prompt shown above the grey stimulus box — omits example/test copy, rule dedup, then dual-pattern narrative (shown in box). */
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
  const out = raw.length > 0 ? raw : (q.prompt ?? '').trim();
  return formatDualPatternPromptLinebreaks(out);
}

/**
 * Item banks often repeat `question` / `setup` inside `stimulus` for authoring pipelines while the same
 * text is already shown as {@link ExamQuestion.prompt} above this block — skip those duplicates.
 */
function stimulusFieldDuplicatesPrompt(fieldKey: string, value: unknown, prompt: string | undefined): boolean {
  const stemTrim = (prompt ?? '').trim();
  /* Short task line (e.g. "Which box is green?") is almost never substring of the long stem — hide whenever we already show a stem. */
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
 * Bank authoring keys — omit from the generic key/value dump.
 * `items` is still used by {@link parseStimulusGridMatrix} to render the puzzle grid (not raw JSON).
 */
const STIMULUS_KEYS_HIDDEN_FROM_LEARNER = new Set(['items']);

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
  /* “Which one does NOT follow the same rule as the other three?” — same intent as odd-one-out. */
  if (p.includes('not follow the same rule') || p.includes("doesn't follow the same rule")) return true;
  if (p.includes('same rule as the other')) return true;
  if (/\bother three\b/.test(p) && /\bsame rule\b/.test(p)) return true;
  /* “Three share a hidden structural rule — which does NOT follow that rule?” */
  if (p.includes('hidden structural rule')) return true;
  if (p.includes('not follow that rule') || p.includes("doesn't follow that rule")) return true;
  if (/\bthree of the following\b/.test(p) && /\bshare\b/.test(p) && /\brule\b/.test(p)) return true;
  if (/\bwhich one does not follow\b/.test(p) && /\brule\b/.test(p)) return true;
  return false;
}

/** Pattern A → Pattern B / “same rule connects both” items — learner must infer `source_rule` (e.g. `double_each_step`). */
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

/** Stem points learners at listed constraints in the stimulus — do not infer-hide those payloads. */
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
 * When true, do not surface authoring rules (students infer them — e.g. odd-one-out, pattern transfer).
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

/** Stimulus keys treated as “the rule” for learners — omitted when {@link shouldHideSharedLearnerRule} applies. */
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

/** Shared tile style for symbol / shape stimuli (sequence, examples, pattern transfer). */
function stimulusSymbolTileSx(border: string) {
  return {
    fontSize: '1.65rem',
    lineHeight: 1,
    minWidth: 44,
    textAlign: 'center' as const,
    px: 1.25,
    py: 1,
    color: '#0f172a',
    bgcolor: '#fff',
    borderRadius: 1.5,
    border: `1px solid ${border}`,
    boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
  };
}

/**
 * Resolves a row-major symbol grid from practice-bank stimuli.
 * Firestore upload may stringify inner rows as JSON strings (nested arrays are not allowed).
 */
function parseStimulusGridMatrix(obj: Record<string, unknown>): string[][] | null {
  const rowsHint = Number(obj.rows);
  const colsHint = Number(obj.cols);

  const normalizeRow = (row: unknown): string[] | null => {
    if (Array.isArray(row)) return row.map((c) => String(c ?? '').trim());
    if (typeof row === 'string') {
      const t = row.trim();
      if (!t) return [];
      if (t.startsWith('[')) {
        try {
          const p = JSON.parse(t) as unknown;
          if (Array.isArray(p)) return p.map((c) => String(c ?? '').trim());
        } catch {
          return null;
        }
      }
      if (t.includes(',')) return t.split(/,\s*/).map((x) => x.trim());
      return [t];
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

  const gridRaw = obj.grid;
  if (gridRaw != null && typeof gridRaw === 'object' && !Array.isArray(gridRaw)) {
    const g = gridRaw as Record<string, unknown>;
    const cells = g.cells ?? g.items;
    if (Array.isArray(cells)) {
      const m = fromRowsArray(cells);
      if (m) return m;
    }
  }
  if (Array.isArray(gridRaw)) {
    const m = fromRowsArray(gridRaw);
    if (m) return m;
  }

  const items = obj.items;
  if (!Array.isArray(items) || !items.length) return null;

  const allScalars = items.every(
    (x) => x !== null && (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean')
  );
  if (
    allScalars &&
    Number.isFinite(rowsHint) &&
    Number.isFinite(colsHint) &&
    rowsHint > 0 &&
    colsHint > 0 &&
    items.length === rowsHint * colsHint
  ) {
    const cells = items.map((x) => String(x ?? '').trim());
    const rows: string[][] = [];
    for (let r = 0; r < rowsHint; r++) rows.push(cells.slice(r * colsHint, (r + 1) * colsHint));
    return rows;
  }

  return fromRowsArray(items);
}

function StimulusGridMatrixView(props: {
  matrix: string[][];
  border: string;
  renderMath: boolean;
}): React.ReactNode {
  const { matrix, border, renderMath } = props;
  if (!matrix.length) return null;
  const cols = Math.max(1, ...matrix.map((r) => r.length));
  const symTileSx = stimulusSymbolTileSx(border);
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(2.75rem, 1fr))`,
        gap: 1.1,
        maxWidth: `min(100%, ${cols * 5.5}rem)`,
        mb: 2.25,
        mt: 0.5,
      }}
      role="img"
      aria-label="Puzzle grid"
    >
      {matrix.flatMap((row, ri) =>
        row.map((cell, ci) => {
          const display = String(cell ?? '').trim();
          const isBlank = !display || display === '?' || display === '??' || display === '…';
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
                  ? { borderStyle: 'dashed', bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 800 }
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
        })
      )}
    </Box>
  );
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
  border: string,
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
    color: '#64748b',
    display: 'block',
    mb: 1,
    letterSpacing: 0.02,
  } as const;

  return (
    <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${border}` }}>
      {hasCons ? (
        <Box sx={{ mb: showRules ? 2.25 : 0 }}>
          <Typography variant="caption" sx={capSx}>
            Constraints
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.25, color: '#334155', '& li': { mb: 0.65 } }}>
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
          <Box component="ul" sx={{ m: 0, pl: 2.25, color: '#334155', '& li': { mb: 0.5 } }}>
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

/** Where the missing term sits — item banks often use `end`; show plain language + a "?" tile. */
function blankSlotFromStimulus(raw: unknown): BlankSlot {
  if (raw === null || raw === undefined) return { kind: 'none' };
  const s = String(raw).trim().toLowerCase();
  if (s === 'end' || s === 'last' || s === 'after_last') {
    return {
      kind: 'end',
      caption: 'Choose the shape that comes next — right after the last symbol in the row.',
    };
  }
  if (s === 'start' || s === 'first' || s === 'before_first') {
    return {
      kind: 'start',
      caption: 'Choose the shape that belongs at the beginning, before the first symbol.',
    };
  }
  const n = parseInt(s, 10);
  if (Number.isFinite(n) && n >= 1) {
    return {
      kind: 'beforeIndex',
      zeroBased: n - 1,
      caption: `Choose the shape that belongs at position ${n} in the sequence (counting from the left).`,
    };
  }
  return { kind: 'unknown', caption: `Missing item placement: ${String(raw)}.` };
}

function interleaveBlankSlot(syms: unknown[], blank: BlankSlot): Array<{ kind: 'sym'; v: string } | { kind: 'blank' }> {
  const out: Array<{ kind: 'sym'; v: string } | { kind: 'blank' }> = [];
  const list = syms.map((x) => String(x));
  if (blank.kind === 'none' || blank.kind === 'unknown') {
    for (const v of list) out.push({ kind: 'sym', v });
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

/** Pattern-logic and generic structured stimuli — readable layout instead of raw JSON. */
const HumanFriendlyStimulus: React.FC<{ q: ExamQuestion; border: string; renderMath?: boolean }> = ({
  q,
  border,
  renderMath = false,
}) => {
  const stimulus = q.stimulus;
  const stimulusType = q.stimulus_type;

  if (stimulus == null) return null;

  if (typeof stimulus === 'string') {
    const text = stimulus.trim();
    if (!text) return null;
    return (
      <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${border}` }}>
        <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, color: '#334155', fontSize: '0.95rem' }}>
          {text}
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
      const symTileSx = stimulusSymbolTileSx(border);
      const testRaw =
        obj.test_input ?? obj.test_query ?? obj.query_input ?? obj.test_case ?? obj.query;
      const testStr =
        testRaw !== null && testRaw !== undefined && String(testRaw).trim() !== ''
          ? String(testRaw).trim()
          : '';

      return (
        <Box sx={{ mb: 2.5, p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${border}` }}>
          {pairs.map((row, i) => (
            <Box key={i} sx={{ mb: i < pairs.length - 1 || testStr ? 2 : 0 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1, letterSpacing: 0.02 }}
              >
                Example {i + 1}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
                <Box sx={symTileSx}>{String(row.input)}</Box>
                <Typography sx={{ color: '#64748b', fontWeight: 700, fontSize: '1.1rem' }} aria-hidden>
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
                borderTop: pairs.length ? `1px solid ${border}` : 'none',
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1, letterSpacing: 0.02 }}
              >
                Test input
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
                <Box sx={symTileSx}>{testStr}</Box>
                <Typography sx={{ color: '#64748b', fontWeight: 700, fontSize: '1.1rem' }} aria-hidden>
                  →
                </Typography>
                <Box
                  sx={{
                    ...symTileSx,
                    borderStyle: 'dashed',
                    bgcolor: '#f1f5f9',
                    color: '#64748b',
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
  const showPatternTransfer =
    sourceSeq.length > 0 ||
    shapeTokens.length > 0 ||
    (sourceRule.length > 0 && !hideSharedRule);

  if (showPatternTransfer) {
    const symTileSx = stimulusSymbolTileSx(border);
    const showRuleBlock = sourceRule.length > 0 && !hideSharedRule;
    const dualNarr = dualPatternNarrativeSplit(q.prompt ?? '');
    const showDualNarrative = dualNarr !== null && patternTransferStimulusPresent(q);
    return (
      <Box sx={{ mb: 2.5, p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${border}` }}>
        {showDualNarrative ? (
          <Box sx={{ mb: 2.5 }}>
            {renderMath ? (
              <ExamMathText
                inline={false}
                sx={{
                  fontWeight: 700,
                  color: '#0f172a',
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
                  color: '#0f172a',
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
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1.25, letterSpacing: 0.02 }}
            >
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
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1, letterSpacing: 0.02 }}
            >
              Rule
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.55 }}>{sourceRule}</Typography>
          </Box>
        ) : null}
        {shapeTokens.length > 0 ? (
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1.25, letterSpacing: 0.02 }}
            >
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
        {stimulusConstraintsAppendixForPatternTransferBox(obj, border, hideSharedRule, q)}
      </Box>
    );
  }

  const seqCandidate = obj.input_sequence ?? obj.sequence;
  const seq = Array.isArray(seqCandidate) ? seqCandidate : null;
  const rulesRaw = obj.rules;
  const hasSeq = seq !== null && seq.length > 0;
  const rulesArr = Array.isArray(rulesRaw) ? rulesRaw : [];
  const hasRules = rulesArr.some((r) => String(r ?? '').trim());
  const blankMeta = hasSeq ? blankSlotFromStimulus(obj.blank_position) : ({ kind: 'none' } as BlankSlot);
  const interleaved = hasSeq && seq ? interleaveBlankSlot(seq, blankMeta) : [];
  const blankHelp = 'caption' in blankMeta ? blankMeta.caption : null;

  if (hasSeq || (hasRules && !hideSharedRule)) {
    const symTileSx = stimulusSymbolTileSx(border);

    return (
      <Box sx={{ mb: 2.5, p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${border}` }}>
        {hasSeq && (
          <Box sx={{ mb: hasRules && !hideSharedRule ? 2.25 : 0 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1.25, letterSpacing: 0.02 }}
            >
              Sequence
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
              {interleaved.map((cell, i) =>
                cell.kind === 'blank' ? (
                  <Box
                    key={`blank-${i}`}
                    sx={{
                      ...symTileSx,
                      borderStyle: 'dashed',
                      bgcolor: '#f1f5f9',
                      color: '#64748b',
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
              <Typography variant="body2" sx={{ mt: 1.35, color: '#475569', lineHeight: 1.55, maxWidth: 520 }}>
                {blankHelp}
              </Typography>
            )}
          </Box>
        )}
        {hasRules && !hideSharedRule && (
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1, letterSpacing: 0.02 }}
            >
              {stimulusType === 'symbol_sequence' || stimulusType === 'transformation'
                ? 'Apply these rules'
                : 'Rules to apply'}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.25, color: '#334155', '& li': { mb: 0.5 } }}>
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

  const concealedRuleKeys = hideSharedRule ? hiddenRuleKeysWhenConcealed() : null;
  const gridMatrix = parseStimulusGridMatrix(obj);
  const entries = Object.entries(obj).filter(
    ([key, value]) =>
      key !== '__proto__' &&
      !STIMULUS_KEYS_HIDDEN_FROM_LEARNER.has(key) &&
      !hideGridDimensionStimulusKeys(key, obj, gridMatrix !== null) &&
      !(concealedRuleKeys?.has(key) ?? false) &&
      !stimulusFieldDuplicatesPrompt(key, value, q.prompt)
  );
  if (entries.length === 0 && !gridMatrix) return null;

  return (
    <Box
      sx={{
        mb: 2.5,
        p: 2,
        bgcolor: '#f8fafc',
        borderRadius: 2,
        border: `1px solid ${border}`,
        maxHeight: gridMatrix ? 520 : 320,
        overflow: 'auto',
      }}
    >
      {entries.map(([key, value]) =>
        key === 'constraints' ? (
          <Box key={key} sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1, letterSpacing: 0.02 }}
            >
              Constraints
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.25, color: '#334155', '& li': { mb: 0.65 } }}>
              {splitConstraintLines(value).map((line, i) => (
                <Typography component="li" key={i} sx={{ fontSize: '0.92rem', lineHeight: 1.55 }}>
                  {line}
                </Typography>
              ))}
            </Box>
          </Box>
        ) : (
          <Typography key={key} sx={{ fontSize: '0.9rem', color: '#334155', mb: 0.85, lineHeight: 1.45 }}>
            <Box component="span" sx={{ fontWeight: 700, color: '#475569' }}>
              {humanizeFieldKey(key)}:{' '}
            </Box>
            {formatStimulusLeafValue(value)}
          </Typography>
        )
      )}
      {gridMatrix ? (
        <StimulusGridMatrixView matrix={gridMatrix} border={border} renderMath={renderMath} />
      ) : null}
    </Box>
  );
};

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
        {options.map((option, idx) => {
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
      {renderMath ? (
        <Box sx={{ mb: 2, fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
          <ExamMathText inline={false} sx={{ whiteSpace: 'pre-line' }}>{examPromptWithoutRedundantRuleBlock(question)}</ExamMathText>
        </Box>
      ) : (
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2, fontSize: { xs: '1.05rem', sm: '1.2rem' }, whiteSpace: 'pre-line' }}>
          {examPromptWithoutRedundantRuleBlock(question)}
        </Typography>
      )}
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
      {renderMath ? (
        <Box sx={{ mb: 2, fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
          <ExamMathText inline={false} sx={{ whiteSpace: 'pre-line' }}>{examPromptWithoutRedundantRuleBlock(question)}</ExamMathText>
        </Box>
      ) : (
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2, fontSize: { xs: '1.05rem', sm: '1.2rem' }, whiteSpace: 'pre-line' }}>
          {examPromptWithoutRedundantRuleBlock(question)}
        </Typography>
      )}
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

export const ExamQuestionBody: React.FC<ExamQuestionBodyProps> = ({
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
  const opts = question.options ?? [];

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
        {renderMath ? (
          <Box sx={{ lineHeight: 1.5, mb: 3, fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
            <ExamMathText inline={false} sx={{ whiteSpace: 'pre-line' }}>{examPromptWithoutRedundantRuleBlock(question)}</ExamMathText>
          </Box>
        ) : (
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.5, mb: 3, fontSize: { xs: '1.05rem', sm: '1.2rem' }, whiteSpace: 'pre-line' }}>
            {examPromptWithoutRedundantRuleBlock(question)}
          </Typography>
        )}
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
        {renderMath ? (
          <Box sx={{ fontWeight: 800, color: '#0f172a', mb: 2, lineHeight: 1.5 }}>
            <ExamMathText inline={false} sx={{ whiteSpace: 'pre-line' }}>{examPromptWithoutRedundantRuleBlock(question)}</ExamMathText>
          </Box>
        ) : (
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 2, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {examPromptWithoutRedundantRuleBlock(question)}
          </Typography>
        )}
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
      {renderMath ? (
        <Box sx={{ fontWeight: 700, color: '#0f172a', mb: 2.5, lineHeight: 1.5, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
          <ExamMathText inline={false} sx={{ whiteSpace: 'pre-line' }}>{examPromptWithoutRedundantRuleBlock(question)}</ExamMathText>
        </Box>
      ) : (
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2.5, lineHeight: 1.2, fontSize: { xs: '1.0rem', sm: '1rem' }, whiteSpace: 'pre-line' }}>
          {examPromptWithoutRedundantRuleBlock(question)}
        </Typography>
      )}
      {question.instruction && !shouldSuppressInstructionAsDuplicateRule(question) && (
        <InstructionLine text={question.instruction} />
      )}
      <HumanFriendlyStimulus q={question} border={borderMuted} renderMath={!!renderMath} />
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
};

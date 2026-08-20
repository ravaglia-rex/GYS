import { EXAM_FIGURE_MAX_HEIGHT_PX, EXAM_FIGURE_MAX_WIDTH_PX } from './ExamMarkdown';

const MD_IMAGE = /!\[([^\]]*)\]\(([^)]+)\)/g;
const HTML_IMG_TAG = /<img\b[^>]*\bsrc=["'][^"']+["'][^>]*>/gi;

export type ArOptionFigureRef = { alt: string; src: string };
export type ArOptionFigureLayout = 'row' | 'stack' | 'grid';

export function isLetterKeyOptionText(text: string): boolean {
  return /^[A-D]\.?$/i.test(String(text ?? '').trim());
}

/** True when option i is only the A–D key for that slot (not an answer like "B" in slot A). */
export function isPlaceholderOptionText(text: string, index: number): boolean {
  const letter = String.fromCharCode(65 + index);
  const t = String(text ?? '').trim();
  return (
    new RegExp(`^${letter}\\.?$`, 'i').test(t) ||
    new RegExp(
      `^(?:option|choice|network|figure|diagram|image|cover|tile|state)\\s+${letter}\\.?$`,
      'i'
    ).test(t)
  );
}

export function allLetterKeyOptions(texts: string[]): boolean {
  return texts.length >= 2 && texts.every((t, i) => isPlaceholderOptionText(t, i));
}

function normalizeChoiceLine(line: string): string {
  return line.replace(/^\s*(?:>\s*)?/, '');
}

function choiceLetterOf(line: string): string | null {
  const t = normalizeChoiceLine(line);
  const m = t.match(
    /^(?:[-*+]\s+|\d+\.\s+)?(?:\*{1,2}|_{1,2})?([A-D])(?:\*{1,2}|_{1,2})?[.)](?:\s+|$)/i
  );
  return m ? m[1].toUpperCase() : null;
}

function choiceBodyOf(line: string): string {
  const t = normalizeChoiceLine(line);
  return t
    .replace(
      /^(?:[-*+]\s+|\d+\.\s+)?(?:\*{1,2}|_{1,2})?[A-D](?:\*{1,2}|_{1,2})?[.)]\s*/i,
      ''
    )
    .trim();
}

export function parseAbcdChoiceLines(block: string): string[] | null {
  const lines = (block ?? '').replace(/\r\n/g, '\n').split('\n');
  const choices: string[] = [];
  let expected = 'A';
  let current: string[] = [];
  let started = false;
  const flush = () => {
    if (!started) return;
    choices.push(current.join('\n').trim());
    current = [];
  };
  for (const line of lines) {
    const letter = choiceLetterOf(line);
    if (letter) {
      if (!started) {
        if (letter !== 'A') return null;
        started = true;
      } else if (letter !== expected) {
        return null;
      } else {
        flush();
      }
      expected = String.fromCharCode(letter.charCodeAt(0) + 1);
      current = [choiceBodyOf(line)];
      continue;
    }
    if (!started) {
      if (line.trim() === '') continue;
      return null;
    }
    if (/^\s*<\/?(?:details|summary)\b/i.test(line)) {
      break;
    }
    current.push(line);
  }
  flush();
  if (choices.length < 2 || choices.length > 6) return null;
  return choices;
}

export function splitEmbeddedAbcdChoiceList(markdown: string): {
  stemMarkdown: string;
  choices: string[] | null;
} {
  const raw = (markdown ?? '').replace(/\r\n/g, '\n');
  if (!raw.trim()) return { stemMarkdown: raw, choices: null };

  const fenceRe = /```[^\n]*\n([\s\S]*?)\n```/g;
  const fences: RegExpExecArray[] = [];
  let fenceMatch: RegExpExecArray | null;
  while ((fenceMatch = fenceRe.exec(raw)) !== null) {
    fences.push(fenceMatch);
  }
  for (let i = fences.length - 1; i >= 0; i--) {
    const hit = fences[i];
    const parsed = parseAbcdChoiceLines(hit[1] ?? '');
    if (!parsed) continue;
    const idx = hit.index ?? 0;
    const stemMarkdown = `${raw.slice(0, idx)}${raw.slice(idx + hit[0].length)}`
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return { stemMarkdown, choices: parsed };
  }

  const lines = raw.split('\n');
  const aIdxs: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (choiceLetterOf(lines[i]) === 'A') aIdxs.push(i);
  }
  for (let k = aIdxs.length - 1; k >= 0; k--) {
    const start = aIdxs[k];
    const parsed = parseAbcdChoiceLines(lines.slice(start).join('\n'));
    if (!parsed) continue;
    const stemMarkdown = lines.slice(0, start).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    return { stemMarkdown, choices: parsed };
  }
  return { stemMarkdown: raw, choices: null };
}

function parsePipeRow(line: string): string[] | null {
  const t = line.trim();
  if (!t.includes('|')) return null;
  if (/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?)+\s*\|?\s*$/.test(t)) return null;
  const inner = t.replace(/^\|/, '').replace(/\|$/, '');
  const cells = inner.split('|').map((c) => c.replace(/\*\*/g, '').trim());
  return cells.length >= 2 ? cells : null;
}

function isTableSepRow(line: string): boolean {
  const t = line.trim();
  if (/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?)+\s*\|?\s*$/.test(t)) return true;
  const cells = parsePipeRow(line);
  return Boolean(cells?.length && cells.every((c) => /^:?-{2,}:?$/.test(c)));
}

function isLetterHeaderRow(cells: string[]): boolean {
  return cells.length >= 2 && cells.length <= 6 && cells.every((c, i) => isPlaceholderOptionText(c, i));
}

function looksLikeOptionTableCell(cell: string): boolean {
  const t = cell.trim();
  if (!t || t.length > 48) return false;
  if (/^(HIDDEN|\[\?\]|\?+)$/i.test(t)) return false;
  return true;
}

function markdownTableBlocks(lines: string[]): Array<{ start: number; end: number; rows: string[][] }> {
  const blocks: Array<{ start: number; end: number; rows: string[][] }> = [];
  let i = 0;
  while (i < lines.length) {
    if (!parsePipeRow(lines[i]) && !isTableSepRow(lines[i])) {
      i += 1;
      continue;
    }
    const start = i;
    while (i < lines.length && (parsePipeRow(lines[i]) || isTableSepRow(lines[i]))) {
      i += 1;
    }
    const end = i - 1;
    const rows: string[][] = [];
    for (const line of lines.slice(start, end + 1)) {
      if (!line.trim() || isTableSepRow(line)) continue;
      const cells = parsePipeRow(line);
      if (!cells) {
        rows.length = 0;
        break;
      }
      rows.push(cells);
    }
    if (rows.length) blocks.push({ start, end, rows });
  }
  return blocks;
}

function compactChoicesFromRows(rows: string[][]): string[] | null {
  if (rows.length === 0 || rows.length > 2) return null;
  const colCount = rows[0].length;
  if (colCount < 2 || colCount > 4) return null;
  if (rows.some((r) => r.length !== colCount)) return null;
  let choices: string[] | null = null;
  if (rows.length === 2 && isLetterHeaderRow(rows[0]) && rows[1].every(looksLikeOptionTableCell)) {
    choices = rows[1];
  } else if (rows.length === 1 && !isLetterHeaderRow(rows[0]) && rows[0].every(looksLikeOptionTableCell)) {
    choices = rows[0];
  }
  if (!choices?.some((t, i) => t && !isPlaceholderOptionText(t, i))) return null;
  return choices;
}

function formatMatrixOptionRow(values: string[], labels: string[]): string {
  const named =
    labels.length === values.length &&
    labels.some((lab) => lab.trim() && !isLetterKeyOptionText(lab));
  if (named) {
    return values
      .map((v, i) => {
        const lab = (labels[i] || '').trim();
        return lab ? `${lab}: ${v}` : v;
      })
      .filter(Boolean)
      .join('; ');
  }
  return values.filter(Boolean).join('; ');
}

/** Rows whose first cell is A–D in order (optional header like Option | Room A | …). */
function matrixChoicesFromRows(rows: string[][]): string[] | null {
  if (rows.length < 2) return null;
  let header: string[] | null = null;
  let data = rows;
  if (!isPlaceholderOptionText(rows[0][0] || '', 0)) {
    header = rows[0];
    data = rows.slice(1);
  }
  if (data.length < 2 || data.length > 4) return null;
  if (data.some((r, i) => r.length < 2 || !isPlaceholderOptionText(r[0] || '', i))) return null;
  const colCount = data[0].length;
  if (data.some((r) => r.length !== colCount)) return null;
  const labels = header ? header.slice(1) : [];
  const choices = data.map((row) => formatMatrixOptionRow(row.slice(1), labels));
  if (!choices.some((t, i) => t && !isPlaceholderOptionText(t, i))) return null;
  return choices;
}

/**
 * Markdown tables that are actually A–D choices: a compact 1–2 row label table,
 * or a matrix whose first column is A–D (e.g. Option | Room A | Room B | Room C).
 */
export function splitEmbeddedOptionTable(markdown: string): {
  stemMarkdown: string;
  choices: string[] | null;
} {
  const raw = (markdown ?? '').replace(/\r\n/g, '\n');
  if (!raw.trim()) return { stemMarkdown: raw, choices: null };
  const lines = raw.split('\n');
  const blocks = markdownTableBlocks(lines);
  for (let b = blocks.length - 1; b >= 0; b--) {
    const { start, end, rows } = blocks[b];
    const compact = compactChoicesFromRows(rows);
    if (compact) {
      const trailing = !lines.slice(end + 1).join('\n').trim();
      const stemMarkdown = trailing
        ? [...lines.slice(0, start), ...lines.slice(end + 1)].join('\n').replace(/\n{3,}/g, '\n\n').trim()
        : raw;
      return { stemMarkdown, choices: compact };
    }
    const matrix = matrixChoicesFromRows(rows);
    if (matrix) return { stemMarkdown: raw, choices: matrix };
  }

  const tableRe = /<table\b[^>]*>[\s\S]*?<\/table>/gi;
  const htmlTables: RegExpExecArray[] = [];
  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tableRe.exec(raw)) !== null) {
    htmlTables.push(tableMatch);
  }
  for (let i = htmlTables.length - 1; i >= 0; i--) {
    const hit = htmlTables[i];
    const rows = rowsFromHtmlTable(hit[0] ?? '');
    if (!rows) continue;
    const compact = compactChoicesFromRows(rows);
    if (compact) {
      const after = raw.slice((hit.index ?? 0) + hit[0].length).trim();
      const stemMarkdown = after
        ? raw
        : `${raw.slice(0, hit.index ?? 0)}${raw.slice((hit.index ?? 0) + hit[0].length)}`
            .replace(/\n{3,}/g, '\n\n')
            .trim();
      return { stemMarkdown, choices: compact };
    }
    const matrix = matrixChoicesFromRows(rows);
    if (matrix) return { stemMarkdown: raw, choices: matrix };
  }
  return { stemMarkdown: raw, choices: null };
}

function rowsFromHtmlTable(html: string): string[][] | null {
  const rows: string[][] = [];
  const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let tr: RegExpExecArray | null;
  while ((tr = trRe.exec(html)) !== null) {
    const cells: string[] = [];
    const cellRe = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cell: RegExpExecArray | null;
    while ((cell = cellRe.exec(tr[1] ?? '')) !== null) {
      cells.push(
        String(cell[1] ?? '')
          .replace(/<br\s*\/?>/gi, ', ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/\s+/g, ' ')
          .trim()
      );
    }
    if (cells.length) rows.push(cells);
  }
  return rows.length ? rows : null;
}

export function splitLearnerExamChoices(markdown: string): {
  stemMarkdown: string;
  choices: string[] | null;
} {
  const list = splitEmbeddedAbcdChoiceList(markdown);
  const listHasReal = Boolean(list.choices?.some((t, i) => t && !isPlaceholderOptionText(t, i)));
  if (listHasReal) return list;
  const table = splitEmbeddedOptionTable(list.stemMarkdown);
  if (table.choices) return table;
  return list;
}

export function choicesFromTableGrid(headers: string[], rows: string[][]): string[] | null {
  const grid = headers.some((h) => String(h ?? '').trim()) ? [headers.map((h) => String(h ?? '')), ...rows] : rows;
  return matrixChoicesFromRows(grid) ?? compactChoicesFromRows(grid);
}

export function optionChoicesFromStimulus(stimulus: unknown): string[] | null {
  if (stimulus == null) return null;
  if (typeof stimulus === 'string') return splitEmbeddedOptionTable(stimulus).choices;
  if (typeof stimulus !== 'object' || Array.isArray(stimulus)) return null;
  const rec = stimulus as Record<string, unknown>;
  if (typeof rec.body_markdown === 'string') {
    const fromBody = splitLearnerExamChoices(rec.body_markdown).choices;
    if (fromBody?.some((t, i) => t && !isPlaceholderOptionText(t, i))) return fromBody;
  }
  if (typeof rec.text === 'string') {
    const fromText = splitEmbeddedOptionTable(rec.text).choices;
    if (fromText?.some((t, i) => t && !isPlaceholderOptionText(t, i))) return fromText;
  }
  const rawHeaders = rec.headers ?? rec.columns;
  const rawRows = rec.rows ?? rec.data;
  const headers = Array.isArray(rawHeaders)
    ? rawHeaders.map((h) => String(h ?? '').trim())
    : [];
  if (!Array.isArray(rawRows) || rawRows.length < 2) return null;
  const rows = rawRows.map((row) =>
    Array.isArray(row) ? row.map((c) => String(c ?? '').trim()) : [String(row ?? '')]
  );
  return choicesFromTableGrid(headers, rows);
}

export function splitArOptionFigure(markdown: string): {
  stemMarkdown: string;
  optionFigure: ArOptionFigureRef | null;
} {
  return splitArOptionFigureInternal(markdown, false);
}

export function splitLastArImageAsOptionFigure(markdown: string): {
  stemMarkdown: string;
  optionFigure: ArOptionFigureRef | null;
} {
  return splitArOptionFigureInternal(markdown, true);
}

export function splitArImageBySrc(markdown: string, src: string | undefined | null): {
  stemMarkdown: string;
  optionFigure: ArOptionFigureRef | null;
} {
  const raw = markdown ?? '';
  const target = imageSrcKey(src);
  if (!raw.trim() || !target) return { stemMarkdown: raw, optionFigure: null };
  const matches = arImageMatches(raw);
  const hit = matches
    .slice()
    .reverse()
    .find((m) => imageSrcKey(m.src) === target);
  if (!hit) return { stemMarkdown: raw, optionFigure: null };
  const stemMarkdown = `${raw.slice(0, hit.index)}${raw.slice(hit.index + hit.rawTag.length)}`
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return {
    stemMarkdown,
    optionFigure: { alt: hit.alt, src: hit.src },
  };
}

type ImgMatch = { alt: string; src: string; index: number; rawTag: string };

function imageSrcKey(src: string | undefined | null): string {
  return String(src ?? '')
    .trim()
    .split('#')[0]
    .split('?')[0]
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    ?.toLowerCase() ?? '';
}

function arImageMatches(raw: string): ImgMatch[] {
  const matches: ImgMatch[] = [];

  // Markdown image syntax: ![alt](src)
  MD_IMAGE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MD_IMAGE.exec(raw)) !== null) {
    matches.push({
      alt: match[1] ?? '',
      src: match[2] ?? '',
      index: match.index ?? 0,
      rawTag: match[0],
    });
  }

  // HTML image tags (some item prompts come through as HTML, not markdown)
  HTML_IMG_TAG.lastIndex = 0;
  let htmlMatch: RegExpExecArray | null;
  while ((htmlMatch = HTML_IMG_TAG.exec(raw)) !== null) {
    const tag = htmlMatch[0] ?? '';
    const srcMatch = /<img\b[^>]*\bsrc=["']([^"']+)["']/i.exec(tag);
    const altMatch = /\balt=["']([^"']*)["']/i.exec(tag);
    matches.push({
      alt: altMatch?.[1] ?? '',
      src: srcMatch?.[1] ?? '',
      index: htmlMatch.index ?? 0,
      rawTag: tag,
    });
  }

  return matches;
}

function splitArOptionFigureInternal(markdown: string, allowAnyImage: boolean): {
  stemMarkdown: string;
  optionFigure: ArOptionFigureRef | null;
} {
  const raw = markdown ?? '';
  if (!raw.trim()) return { stemMarkdown: raw, optionFigure: null };
  const matches = arImageMatches(raw);

  const hit = matches
    .slice()
    .reverse()
    .find((m) => allowAnyImage || looksLikeArOptionFigureHint(m.src ?? '', m.alt ?? ''));
  if (!hit) return { stemMarkdown: raw, optionFigure: null };

  const stemMarkdown = `${raw.slice(0, hit.index)}${raw.slice(hit.index + hit.rawTag.length)}`
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return {
    stemMarkdown,
    optionFigure: { alt: hit.alt, src: hit.src },
  };
}

/**
 * Shared hint for “this image is the A–D option strip” (or a combined
 * stem+options SVG that we crop). Keep composite/cycle matrices as stem.
 */
export function looksLikeArOptionFigureHint(src: string, alt = ''): boolean {
  const haystack = `${src} ${alt}`;
  if (/(?:composite|cycle)_matrix/i.test(haystack)) return false;
  if (/followed by\s+.+answer cards/i.test(haystack)) return false;
  return (
    /\b(option|options|choice|choices|answer|answers|possible)\b/i.test(haystack) ||
    /followed by\s+.+\bcovers\b/i.test(haystack) ||
    /(?:^|\/|_|\b)covers(?:_|\.|$)/i.test(src)
  );
}

export function optionFigureFromAssets(
  assets?: Array<{ path?: string; alt?: string }> | null
): ArOptionFigureRef | null {
  if (!assets?.length) return null;
  const hit = [...assets]
    .reverse()
    .find((a) => looksLikeArOptionFigureHint(a.path ?? '', a.alt ?? ''));
  if (!hit?.path) return null;
  return { src: hit.path, alt: hit.alt ?? '' };
}

const SKIP_TEXT_CLASS = /\b(letter|number|inside|symbol|num|lab|mark)\b/i;

/**
 * Option-figure sizing for current and future items (no class-name dependency):
 *
 * GRID (compact): one 2×2 or 3×3 cell matrix — an interior cross or thirds
 *   split, including slightly landscape grids with axis labels around them.
 * WIDE (larger): two+ side-by-side panels, 1×N strips, tables, trees, dual views.
 */
export type OptionFigureSliceKind = 'grid' | 'wide';

export type OptionFigureSliceRect = {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  kind: OptionFigureSliceKind;
};

/** Display cap for a compact 2×2 / 3×3 card option (matches live exam rows). */
export const AR_OPTION_GRID_SLICE_MAX_HEIGHT_PX = 72;
export const AR_OPTION_GRID_SLICE_MAX_WIDTH_PX = 110;
/** Display cap for larger image options such as tiles/cards with edge symbols. */
export const AR_OPTION_SLICE_MAX_HEIGHT_PX = 104;
export const AR_OPTION_SLICE_MAX_WIDTH_PX = 140;
/** Stem crops from combined stem+options SVGs should not use the full exam cap. */
export const AR_OPTION_STEM_SLICE_MAX_HEIGHT_PX = 340;
export const AR_OPTION_STEM_SLICE_MAX_WIDTH_PX = 560;

const LARGER_OPTION_FIGURE_SIZE_EXCEPTIONS = [
  'AR-L1-T3-05-P1',
  'T3-05-P1',
  'item_17_t3_05_plan_options',
  'AR-L1-T4-06-P1',
  'T4-06-P1',
  'item_18_T4-06-P1',
  'AR-L1-T4-08-P3',
  'T4-08-P3',
  'item_47_T4-08-P3',
  'AR-L1-T5-02-P3',
  'T5-02-P3',
  'item_13_X2_scanner_options',
  'AR-L1-T5-03-P2',
  'T5-03-P2',
  'item_22_X3_relay_options',
  'AR-L1-T5-04-P3',
  'T5-04-P3',
  'item_06_X4_restoration_target_options',
  'AR-L1-T5-05-P1',
  'T5-05-P1',
  'item_23_X5_station_network_options',
] as const;

function optionFigureSizeMultiplier(src: string | undefined): number {
  const normalized = (src ?? '').toLowerCase();
  return LARGER_OPTION_FIGURE_SIZE_EXCEPTIONS.some((key) =>
    normalized.includes(key.toLowerCase())
  )
    ? 1.75
    : 1;
}

/**
 * When a combined stem+options SVG is scaled to the exam figure cap, a single
 * grid option slice can inherit the full figure height (~460px). Cap grid slices
 * so fold / card options stay the same size as standalone 2×2 option rows.
 *
 * Stem crops stay on that same figure scale. Fitting the crop box itself to
 * 560×340 upscaled tight trays (IF10) to ~340px while every other exam figure
 * stayed at the 640×460 cap.
 */
export function arOptionFigureSliceDisplaySize(
  natW: number,
  natH: number,
  figW: number,
  figH: number,
  fit: 'option' | 'exam' | 'stem' | 'crop',
  slice?: Pick<OptionFigureSliceRect, 'kind'> | null,
  src?: string
): { width: number; height: number } {
  const figureScale = Math.min(
    EXAM_FIGURE_MAX_WIDTH_PX / Math.max(figW, 1),
    EXAM_FIGURE_MAX_HEIGHT_PX / Math.max(figH, 1)
  );
  const scale =
    fit === 'exam'
      ? Math.min(
          EXAM_FIGURE_MAX_WIDTH_PX / Math.max(natW, 1),
          EXAM_FIGURE_MAX_HEIGHT_PX / Math.max(natH, 1)
        )
      : fit === 'stem'
        ? Math.min(
            figureScale,
            AR_OPTION_STEM_SLICE_MAX_WIDTH_PX / Math.max(natW, 1),
            AR_OPTION_STEM_SLICE_MAX_HEIGHT_PX / Math.max(natH, 1)
          )
        : figureScale;
  let width = Math.max(1, natW * scale);
  let height = Math.max(1, natH * scale);
  if (fit === 'option' || fit === 'crop') {
    const multiplier = optionFigureSizeMultiplier(src);
    const maxWidth =
      (slice?.kind === 'grid' ? AR_OPTION_GRID_SLICE_MAX_WIDTH_PX : AR_OPTION_SLICE_MAX_WIDTH_PX) *
      multiplier;
    const maxHeight =
      (slice?.kind === 'grid' ? AR_OPTION_GRID_SLICE_MAX_HEIGHT_PX : AR_OPTION_SLICE_MAX_HEIGHT_PX) *
      multiplier;
    const capScale = Math.min(
      maxWidth / width,
      maxHeight / height,
      1
    );
    width *= capScale;
    height *= capScale;
  }
  return { width, height };
}

function svgLocalPoint(el: Element): { x: number; y: number } {
  let x = Number.parseFloat(el.getAttribute('x') || '0') || 0;
  let y = Number.parseFloat(el.getAttribute('y') || '0') || 0;
  let node: Element | null = el;
  while (node) {
    const tr = node.getAttribute('transform');
    if (tr) {
      const m = /translate\(\s*(-?[\d.]+)(?:[,\s]+(-?[\d.]+))?/.exec(tr);
      if (m) {
        x += Number.parseFloat(m[1]);
        y += Number.parseFloat(m[2] || '0');
      }
    }
    node = node.parentElement;
  }
  return { x, y };
}

function optionLabelEls(doc: Document, count: number): Element[] | null {
  const texts = Array.from(doc.querySelectorAll('text'));
  const labels = ['A', 'B', 'C', 'D'].slice(0, Math.min(4, Math.max(2, count)));
  const found: Element[] = [];
  const isChoiceLabel = (t: Element) =>
    /\b(option|choice|head|opt)\b/i.test(t.getAttribute('class') || '');
  for (const letter of labels) {
    const matchLetter = (t: Element) => {
      const content = (t.textContent || '').trim().replace(/\.$/, '');
      if (content !== letter) return false;
      const cls = t.getAttribute('class') || '';
      if (SKIP_TEXT_CLASS.test(cls)) return false;
      return true;
    };
    const el = texts.find((t) => matchLetter(t) && isChoiceLabel(t)) || texts.find(matchLetter);
    if (!el) return null;
    found.push(el);
  }
  return found;
}

function svgViewBox(doc: Document): { x: number; y: number; w: number; h: number } | null {
  const svg = doc.documentElement;
  const vb = svg.getAttribute('viewBox');
  if (vb) {
    const p = vb.trim().split(/[\s,]+/).map(Number);
    if (p.length >= 4 && p.every((n) => Number.isFinite(n)) && p[2] > 0 && p[3] > 0) {
      return { x: p[0], y: p[1], w: p[2], h: p[3] };
    }
  }
  const w = Number.parseFloat(svg.getAttribute('width') || '');
  const h = Number.parseFloat(svg.getAttribute('height') || '');
  if (w > 0 && h > 0) return { x: 0, y: 0, w, h };
  return null;
}

export function svgNaturalSizeFromText(svgText: string): { width: number; height: number } | null {
  if (typeof DOMParser === 'undefined') return null;
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return null;
  const vb = svgViewBox(doc);
  if (!vb) return null;
  return { width: vb.w, height: vb.h };
}

function svgTransformOrigin(el: Element): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let node: Element | null = el;
  while (node) {
    const tr = node.getAttribute('transform');
    if (tr) {
      const m = /translate\(\s*(-?[\d.]+)(?:[,\s]+(-?[\d.]+))?/.exec(tr);
      if (m) {
        x += Number.parseFloat(m[1]);
        y += Number.parseFloat(m[2] || '0');
      }
    }
    node = node.parentElement;
  }
  return { x, y };
}

function parsePathAxisSegments(
  d: string,
  ox: number,
  oy: number
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const segs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const re = /([MLHV])\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?/gi;
  let cx = 0;
  let cy = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const cmd = m[1].toUpperCase();
    if (cmd === 'M') {
      cx = Number.parseFloat(m[2]);
      cy = Number.parseFloat(m[3] || '0');
    } else if (cmd === 'L') {
      const nx = Number.parseFloat(m[2]);
      const ny = Number.parseFloat(m[3] || '0');
      segs.push({ x1: cx + ox, y1: cy + oy, x2: nx + ox, y2: ny + oy });
      cx = nx;
      cy = ny;
    } else if (cmd === 'V') {
      const ny = Number.parseFloat(m[2]);
      segs.push({ x1: cx + ox, y1: cy + oy, x2: cx + ox, y2: ny + oy });
      cy = ny;
    } else if (cmd === 'H') {
      const nx = Number.parseFloat(m[2]);
      segs.push({ x1: cx + ox, y1: cy + oy, x2: nx + ox, y2: cy + oy });
      cx = nx;
    }
  }
  return segs;
}

function collectAxisSegments(doc: Document): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const segs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (const line of Array.from(doc.querySelectorAll('line'))) {
    const o = svgTransformOrigin(line);
    segs.push({
      x1: (Number.parseFloat(line.getAttribute('x1') || '0') || 0) + o.x,
      y1: (Number.parseFloat(line.getAttribute('y1') || '0') || 0) + o.y,
      x2: (Number.parseFloat(line.getAttribute('x2') || '0') || 0) + o.x,
      y2: (Number.parseFloat(line.getAttribute('y2') || '0') || 0) + o.y,
    });
  }
  for (const path of Array.from(doc.querySelectorAll('path'))) {
    const o = svgTransformOrigin(path);
    segs.push(...parsePathAxisSegments(path.getAttribute('d') || '', o.x, o.y));
  }
  return segs;
}

function uniqueNear(values: number[], tol: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const out: number[] = [];
  for (const v of sorted) {
    if (!out.length || Math.abs(v - out[out.length - 1]) > tol) out.push(v);
  }
  return out;
}

type SliceBox = { x: number; y: number; w: number; h: number };

function hasCellMatrixDividers(
  box: SliceBox,
  segs: Array<{ x1: number; y1: number; x2: number; y2: number }>
): boolean {
  const xMin = box.x + box.w * 0.18;
  const xMax = box.x + box.w * 0.82;
  const yMin = box.y + box.h * 0.18;
  const yMax = box.y + box.h * 0.82;
  const vxs: number[] = [];
  const hys: number[] = [];
  for (const s of segs) {
    const dx = Math.abs(s.x2 - s.x1);
    const dy = Math.abs(s.y2 - s.y1);
    const len = Math.hypot(dx, dy);
    if (dx < 8 && dy > box.h * 0.4) {
      const x = (s.x1 + s.x2) / 2;
      const yLo = Math.min(s.y1, s.y2);
      const yHi = Math.max(s.y1, s.y2);
      if (x > xMin && x < xMax && yLo <= box.y + box.h * 0.2 && yHi >= box.y + box.h * 0.8) {
        vxs.push(x);
      }
    } else if (dy < 8 && dx > box.w * 0.4) {
      const y = (s.y1 + s.y2) / 2;
      const xLo = Math.min(s.x1, s.x2);
      const xHi = Math.max(s.x1, s.x2);
      if (y > yMin && y < yMax && xLo <= box.x + box.w * 0.2 && xHi >= box.x + box.w * 0.8) {
        hys.push(y);
      }
    } else if (len < 1) {
      continue;
    }
  }
  const v = uniqueNear(vxs, Math.max(6, box.w * 0.06)).length;
  const h = uniqueNear(hys, Math.max(6, box.h * 0.06)).length;
  if (v === 1 && h === 1) return true;
  if (v === 2 && h === 2) return true;
  if (v === 3 && h === 3) return true;
  return false;
}

function hasSideBySidePanels(parent: SliceBox, cards: SliceBox[]): boolean {
  const parentArea = parent.w * parent.h;
  const kids = cards.filter((c) => {
    if (c === parent) return false;
    if (c.w >= parent.w * 0.92 && c.h >= parent.h * 0.92) return false;
    const area = c.w * c.h;
    if (area < parentArea * 0.1 || area > parentArea * 0.7) return false;
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    return cx > parent.x && cx < parent.x + parent.w && cy > parent.y && cy < parent.y + parent.h;
  });
  if (kids.length < 2) return false;
  const xs = kids.map((k) => k.x + k.w / 2).sort((a, b) => a - b);
  return xs[xs.length - 1] - xs[0] > parent.w * 0.28;
}

function classifyOptionFigureKind(
  box: SliceBox,
  segs: Array<{ x1: number; y1: number; x2: number; y2: number }>,
  cards: SliceBox[]
): OptionFigureSliceKind {
  if (hasCellMatrixDividers(box, segs)) return 'grid';
  if (hasSideBySidePanels(box, cards)) return 'wide';
  const vOnly = uniqueNear(
    segs
      .filter((s) => {
        const dx = Math.abs(s.x2 - s.x1);
        const dy = Math.abs(s.y2 - s.y1);
        const x = (s.x1 + s.x2) / 2;
        return (
          dx < 8 &&
          dy > box.h * 0.35 &&
          x > box.x + box.w * 0.15 &&
          x < box.x + box.w * 0.85
        );
      })
      .map((s) => (s.x1 + s.x2) / 2),
    Math.max(6, box.w * 0.08)
  ).length;
  const hOnly = uniqueNear(
    segs
      .filter((s) => {
        const dx = Math.abs(s.x2 - s.x1);
        const dy = Math.abs(s.y2 - s.y1);
        const y = (s.y1 + s.y2) / 2;
        return (
          dy < 8 &&
          dx > box.w * 0.35 &&
          y > box.y + box.h * 0.15 &&
          y < box.y + box.h * 0.85
        );
      })
      .map((s) => (s.y1 + s.y2) / 2),
    Math.max(6, box.h * 0.08)
  ).length;
  if (vOnly >= 2 && hOnly === 0) return 'wide';
  if (box.w / Math.max(box.h, 1) >= 1.45) return 'wide';
  return 'grid';
}

function isFullCanvasRect(
  w: number,
  h: number,
  vb: { w: number; h: number }
): boolean {
  if (w >= vb.w * 0.75 && h >= vb.h * 0.75) return true;
  if (w * h >= vb.w * vb.h * 0.4) return true;
  return false;
}

function letterPointsAreStacked(pts: Array<{ x: number; y: number }>): boolean {
  if (pts.length < 2) return false;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const xSpread = Math.max(...xs) - Math.min(...xs);
  const ySpread = Math.max(...ys) - Math.min(...ys);
  return ySpread >= 8 && xSpread < ySpread * 0.35;
}

function sliceRectFromBounds(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  vb: { x: number; y: number; w: number; h: number },
  kind: OptionFigureSliceKind
): OptionFigureSliceRect {
  const pad = Math.max(3, Math.min(maxX - minX, maxY - minY) * 0.03);
  const x1 = Math.max(vb.x, minX - pad);
  const y1 = Math.max(vb.y, minY - pad);
  const x2 = Math.min(vb.x + vb.w, maxX + pad);
  const y2 = Math.min(vb.y + vb.h, maxY + pad);
  return {
    xPct: ((x1 - vb.x) / vb.w) * 100,
    yPct: ((y1 - vb.y) / vb.h) * 100,
    wPct: ((x2 - x1) / vb.w) * 100,
    hPct: ((y2 - y1) / vb.h) * 100,
    kind,
  };
}

/**
 * Stacked A–D tables (one row per option). Crop each letter's horizontal band
 * so a multi-cell row is not reduced to its largest single box, and stem
 * content above the table is not assigned to option A.
 */
function stackedRowSlicesFromCards(
  letterPts: Array<{ x: number; y: number }>,
  cards: Array<{ x: number; y: number; w: number; h: number; cy: number }>,
  vb: { x: number; y: number; w: number; h: number }
): OptionFigureSliceRect[] | null {
  const n = letterPts.length;
  const order = letterPts
    .map((p, i) => ({ i, y: p.y }))
    .sort((a, b) => a.y - b.y);
  const slices: Array<OptionFigureSliceRect | undefined> = new Array(n);
  for (let k = 0; k < n; k++) {
    const y = order[k].y;
    const prev = order[k - 1];
    const next = order[k + 1];
    const halfPrev = prev ? (y - prev.y) / 2 : next ? (next.y - y) / 2 : 40;
    const halfNext = next ? (next.y - y) / 2 : halfPrev;
    const y1 = y - halfPrev;
    const y2 = y + halfNext;
    const letterX = letterPts[order[k].i].x;
    const rowCards = cards.filter((c) =>
      k === n - 1 ? c.cy >= y1 && c.cy <= y2 : c.cy >= y1 && c.cy < y2
    );
    const withoutLetter = rowCards.filter((c) => c.x + c.w > letterX + 24);
    const inBand = withoutLetter.length ? withoutLetter : rowCards;
    if (!inBand.length) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const c of inBand) {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + c.w);
      maxY = Math.max(maxY, c.y + c.h);
    }
    slices[order[k].i] = sliceRectFromBounds(minX, minY, maxX, maxY, vb, 'wide');
  }
  if (slices.some((s) => !s)) return null;
  return slices as OptionFigureSliceRect[];
}

/**
 * Options must sit clearly in the lower half before we treat the top as stem art.
 * Options-only sheets often reserve ~25–35% for A–D labels above the cards; that
 * headroom is not stem content and must not trigger stem cropping / crop fit.
 */
export const OPTION_FIGURE_STEM_CONTENT_MIN_Y_PCT = 40;

/** True when A–D sit in the lower part of a figure that also has stem content above. */
export function optionFigureIncludesStemContent(
  _layout: ArOptionFigureLayout,
  slices: OptionFigureSliceRect[] | null
): boolean {
  if (!slices?.length) return false;
  return Math.min(...slices.map((s) => s.yPct)) >= OPTION_FIGURE_STEM_CONTENT_MIN_Y_PCT;
}

/** Top of a combined stem+options figure (initial state, route), above the A–D rows. */
export function optionFigureStemSliceFromOptionSlices(
  slices: OptionFigureSliceRect[] | null
): OptionFigureSliceRect | null {
  if (!slices?.length) return null;
  const minY = Math.min(...slices.map((s) => s.yPct));
  if (minY < OPTION_FIGURE_STEM_CONTENT_MIN_Y_PCT) return null;
  return {
    xPct: 0,
    yPct: 0,
    wPct: 100,
    hPct: Math.max(8, minY - 0.6),
    kind: 'wide',
  };
}

export function optionFigureContentSlicesFromSvg(
  svgText: string,
  optionCount: number
): OptionFigureSliceRect[] | null {
  if (typeof DOMParser === 'undefined') return null;
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return null;
  const vb = svgViewBox(doc);
  if (!vb) return null;
  const n = Math.min(4, Math.max(2, optionCount));
  const labels = optionLabelEls(doc, n);
  if (!labels) return null;
  const letterPts = labels.map((el) => svgLocalPoint(el));

  const cards: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    cx: number;
    cy: number;
    area: number;
    className: string;
  }> = [];
  for (const rect of Array.from(doc.querySelectorAll('rect'))) {
    const w = Number.parseFloat(rect.getAttribute('width') || '');
    const h = Number.parseFloat(rect.getAttribute('height') || '');
    if (!(w > 28 && h > 28)) continue;
    if (isFullCanvasRect(w, h, vb)) continue;
    const pt = svgLocalPoint(rect);
    cards.push({
      x: pt.x,
      y: pt.y,
      w,
      h,
      cx: pt.x + w / 2,
      cy: pt.y + h / 2,
      area: w * h,
      className: rect.getAttribute('class') || '',
    });
  }
  if (!cards.length) return null;
  if (letterPointsAreStacked(letterPts)) {
    const minY = Math.min(...letterPts.map((p) => p.y));
    if ((minY - vb.y) / vb.h >= OPTION_FIGURE_STEM_CONTENT_MIN_Y_PCT / 100) {
      const stacked = stackedRowSlicesFromCards(letterPts, cards, vb);
      if (stacked) return stacked;
    }
  }
  const segs = collectAxisSegments(doc);

  const grouped: Array<typeof cards> = Array.from({ length: n }, () => []);
  for (const card of cards) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      const dx = card.cx - letterPts[i].x;
      const dy = card.cy - letterPts[i].y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    grouped[best].push(card);
  }

  const slices: OptionFigureSliceRect[] = [];
  const mains: typeof cards = [];
  for (let i = 0; i < n; i++) {
    const group = grouped[i];
    if (!group.length) return null;
    const matrix = group.filter((c) => hasCellMatrixDividers(c, segs));
    mains.push(
      (matrix.length ? matrix : group).reduce((best, card) => (card.area > best.area ? card : best))
    );
  }
  const mainAreas = mains.map((c) => c.area).sort((a, b) => a - b);
  const medianMain = mainAreas[Math.floor(mainAreas.length / 2)] || 1;
  for (let i = 0; i < n; i++) {
    let main = mains[i];
    if (main.area > medianMain * 2.2) {
      const tighter = grouped[i]
        .filter((c) => c.area <= medianMain * 2.2)
        .sort((a, b) => b.area - a.area)[0];
      if (tighter) main = tighter;
    }
    const pad = Math.max(3, Math.min(main.w, main.h) * 0.03);
    const x1 = Math.max(vb.x, main.x - pad);
    const y1 = Math.max(vb.y, main.y - pad);
    const x2 = Math.min(vb.x + vb.w, main.x + main.w + pad);
    const y2 = Math.min(vb.y + vb.h, main.y + main.h + pad);
    slices.push({
      xPct: ((x1 - vb.x) / vb.w) * 100,
      yPct: ((y1 - vb.y) / vb.h) * 100,
      wPct: ((x2 - x1) / vb.w) * 100,
      hPct: ((y2 - y1) / vb.h) * 100,
      kind: classifyOptionFigureKind(main, segs, grouped[i]),
    });
  }
  return slices;
}

export function layoutFromSvgText(svgText: string): ArOptionFigureLayout | null {
  if (typeof DOMParser === 'undefined') return null;
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return null;
  const labels = optionLabelEls(doc, 4) || optionLabelEls(doc, 3) || optionLabelEls(doc, 2);
  if (!labels) return null;
  const xs: number[] = [];
  const ys: number[] = [];
  for (const el of labels) {
    const pt = svgLocalPoint(el);
    xs.push(pt.x);
    ys.push(pt.y);
  }
  const xSpread = Math.max(...xs) - Math.min(...xs);
  const ySpread = Math.max(...ys) - Math.min(...ys);
  if (xSpread < 8 && ySpread < 8) return null;
  if (ySpread < xSpread * 0.35) return 'row';
  if (xSpread < ySpread * 0.35) return 'stack';
  return 'grid';
}

export function layoutFromAspect(width: number, height: number): ArOptionFigureLayout {
  if (!width || !height) return 'grid';
  const r = width / height;
  if (r >= 2.8) return 'row';
  if (r <= 0.85) return 'stack';
  return 'grid';
}

export function optionFigureGridSx(layout: ArOptionFigureLayout) {
  if (layout === 'row') {
    return { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gridTemplateRows: '1fr' };
  }
  if (layout === 'stack') {
    return { gridTemplateColumns: '1fr', gridTemplateRows: 'repeat(4, minmax(0, 1fr))' };
  }
  return { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))' };
}

export function optionFigureSliceWindow(
  layout: ArOptionFigureLayout,
  index: number,
  optionCount: number
): { cols: number; rows: number; col: number; row: number } {
  const n = Math.min(4, Math.max(2, optionCount));
  if (layout === 'row') {
    return { cols: n, rows: 1, col: index, row: 0 };
  }
  if (layout === 'stack') {
    return { cols: 1, rows: n, col: 0, row: index };
  }
  return { cols: 2, rows: 2, col: index % 2, row: Math.floor(index / 2) };
}

const MD_IMAGE = /!\[([^\]]*)\]\(([^)]+)\)/g;

export type ArOptionFigureRef = { alt: string; src: string };
export type ArOptionFigureLayout = 'row' | 'stack' | 'grid';

export function isLetterKeyOptionText(text: string): boolean {
  return /^[A-D]\.?$/i.test(String(text ?? '').trim());
}

export function allLetterKeyOptions(texts: string[]): boolean {
  return texts.length >= 2 && texts.every(isLetterKeyOptionText);
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

export function splitArOptionFigure(markdown: string): {
  stemMarkdown: string;
  optionFigure: ArOptionFigureRef | null;
} {
  const raw = markdown ?? '';
  if (!raw.trim()) return { stemMarkdown: raw, optionFigure: null };
  const matches: RegExpExecArray[] = [];
  MD_IMAGE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MD_IMAGE.exec(raw)) !== null) {
    matches.push(match);
  }
  const hit = matches.reverse().find((m) => /option/i.test(m[2] ?? '') || /option/i.test(m[1] ?? ''));
  if (!hit || hit.index == null) return { stemMarkdown: raw, optionFigure: null };
  const stemMarkdown = `${raw.slice(0, hit.index)}${raw.slice(hit.index + hit[0].length)}`
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return {
    stemMarkdown,
    optionFigure: { alt: hit[1] ?? '', src: hit[2] ?? '' },
  };
}

export function optionFigureFromAssets(
  assets?: Array<{ path?: string; alt?: string }> | null
): ArOptionFigureRef | null {
  if (!assets?.length) return null;
  const hit = [...assets].reverse().find((a) => /option/i.test(a.path ?? '') || /option/i.test(a.alt ?? ''));
  if (!hit?.path) return null;
  return { src: hit.path, alt: hit.alt ?? '' };
}

const SKIP_TEXT_CLASS = /\b(letter|number|inside|symbol|num|lab|mark)\b/i;

export type OptionFigureSliceRect = {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
};

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

function isFullCanvasRect(
  w: number,
  h: number,
  vb: { w: number; h: number }
): boolean {
  if (w >= vb.w * 0.75 && h >= vb.h * 0.75) return true;
  if (w * h >= vb.w * vb.h * 0.4) return true;
  return false;
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

  const cards: Array<{ x: number; y: number; w: number; h: number; cx: number; cy: number; area: number }> = [];
  for (const rect of Array.from(doc.querySelectorAll('rect'))) {
    const w = Number.parseFloat(rect.getAttribute('width') || '');
    const h = Number.parseFloat(rect.getAttribute('height') || '');
    if (!(w > 28 && h > 28)) continue;
    if (isFullCanvasRect(w, h, vb)) continue;
    const pt = svgLocalPoint(rect);
    cards.push({ x: pt.x, y: pt.y, w, h, cx: pt.x + w / 2, cy: pt.y + h / 2, area: w * h });
  }
  if (!cards.length) return null;

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
    mains.push(group.reduce((best, card) => (card.area > best.area ? card : best)));
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

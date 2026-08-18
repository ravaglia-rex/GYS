/**
 * Cut A–D crop boxes once from public AR SVGs and write arOptionFigureCrops.json.
 *
 * Usage (from argus-frontend):
 *   npx --yes -p jsdom -p tsx tsx scripts/generateArOptionFigureCrops.ts
 */
import fs from 'fs';
import path from 'path';
import {JSDOM} from 'jsdom';
import {
  layoutFromSvgText,
  optionFigureContentSlicesFromSvg,
  optionFigureIncludesStemContent,
  optionFigureStemSliceFromOptionSlices,
  svgNaturalSizeFromText,
} from '../src/components/assessment/arOptionFigureModel';

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'public', 'question-assets');
const OUT = path.join(ROOT, 'src', 'components', 'assessment', 'arOptionFigureCrops.json');

function installDom(): void {
  const {window} = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    contentType: 'text/html',
  });
  (globalThis as {DOMParser?: unknown}).DOMParser = window.DOMParser;
}

function walkSvgs(dir: string, acc: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkSvgs(full, acc);
    else if (name.toLowerCase().endsWith('.svg')) acc.push(full);
  }
  return acc;
}

function roundSlice(s: {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  kind: string;
}) {
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return {xPct: r(s.xPct), yPct: r(s.yPct), wPct: r(s.wPct), hPct: r(s.hPct), kind: s.kind};
}

function main(): void {
  installDom();
  const files = walkSvgs(ASSETS).sort();
  const catalog: Record<string, unknown> = {};
  const skipped: string[] = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const slices = optionFigureContentSlicesFromSvg(text, 4);
    if (!slices?.length) {
      skipped.push(path.basename(file));
      continue;
    }
    const size = svgNaturalSizeFromText(text);
    const layout = layoutFromSvgText(text) ?? 'grid';
    const stemSlice = optionFigureIncludesStemContent(layout, slices)
      ? optionFigureStemSliceFromOptionSlices(slices)
      : null;
    catalog[path.basename(file)] = {
      layout,
      naturalWidth: size?.width ?? 0,
      naturalHeight: size?.height ?? 0,
      slices: slices.map(roundSlice),
      stemSlice: stemSlice ? roundSlice(stemSlice) : null,
    };
  }
  fs.writeFileSync(OUT, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(catalog).length} crop sets to ${path.relative(ROOT, OUT)}`);
  if (skipped.length) {
    console.log(`No A–D slices (${skipped.length}): ${skipped.join(', ')}`);
  }
}

main();

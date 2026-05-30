#!/usr/bin/env python3
"""Regenerate previewSampleAssessments.ts from argus-backend *.numbers files."""
from numbers_parser import Document
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'argus-frontend/src/data/previewSampleAssessments.ts'

files = {
    'symbolic_reasoning': ROOT / 'argus-backend/pattern_logic.numbers',
    'verbal_reasoning': ROOT / 'argus-backend/critical_reading.numbers',
    'mathematical_reasoning': ROOT / 'argus-backend/mathematical_reasoning.numbers',
}

def find_header_row(table):
    for r in range(table.num_rows):
        vals = [table.cell(r, c).value for c in range(min(10, table.num_cols))]
        if vals[0] == 'source_file' and vals[1] == 'item_id':
            return r
    return None

def parse_stimulus(raw):
    if raw is None:
        return None
    if isinstance(raw, str):
        s = raw.strip()
        if not s:
            return None
        try:
            return json.loads(s)
        except json.JSONDecodeError:
            return {'text': s}
    if isinstance(raw, dict):
        return raw
    return {'text': str(raw)}

def answer_key_to_index(key):
    if key is None:
        return 0
    s = str(key).strip().upper()
    if s in ('A', 'B', 'C', 'D'):
        return ord(s) - ord('A')
    return 0

def parse_level(value):
    try:
        return max(1, min(3, int(float(value))))
    except (TypeError, ValueError):
        return 1

def ts_string(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)

def ts_value(v):
    return json.dumps(v, ensure_ascii=False)

all_data = {}
for exam_id, path in files.items():
    doc = Document(str(path))
    table = doc.sheets[0].tables[0]
    header_row = find_header_row(table)
    items = []
    for r in range(table.num_rows):
        if r == header_row:
            continue
        row = [table.cell(r, c).value for c in range(table.num_cols)]
        if not row[1] or row[1] == 'item_id':
            continue
        if row[6] != 'approved_for_sample':
            continue
        item_id = str(row[1]).strip()
        prompt = str(row[9] or '').strip()
        options = [str(row[22] or '').strip(), str(row[23] or '').strip(), str(row[24] or '').strip(), str(row[25] or '').strip()]
        if not prompt or not all(options):
            continue
        stimulus_type = str(row[11] or 'text').strip() or 'text'
        stimulus = parse_stimulus(row[12])
        solution_steps = row[27]
        if solution_steps and isinstance(stimulus, dict):
            existing = stimulus.get('structured_solution')
            if not (isinstance(existing, str) and existing.strip()):
                stimulus['structured_solution'] = str(solution_steps).strip()
        item = {
            'id': item_id,
            'prompt': prompt,
            'options': options,
            'correctIndex': answer_key_to_index(row[21]),
            'level': parse_level(row[3]),
        }
        if stimulus_type:
            item['stimulus_type'] = stimulus_type
        if stimulus is not None:
            item['stimulus'] = stimulus
        items.append(item)
    all_data[exam_id] = items

lines = []
lines.append('/**')
lines.append(' * Frontend-only sample assessment questions extracted from argus-backend *.numbers files.')
lines.append(' * Regenerate: python3 scripts/generatePreviewSampleAssessments.py')
lines.append(' */')
lines.append('')
lines.append('export type PreviewSampleQuestion = {')
lines.append('  id: string;')
lines.append('  prompt: string;')
lines.append('  options: string[];')
lines.append('  correctIndex: number;')
lines.append('  level: PreviewSampleLevel;')
lines.append('  stimulus_type?: string;')
lines.append('  stimulus?: unknown;')
lines.append('};')
lines.append('')
lines.append('export const PREVIEW_SAMPLE_LEVELS = [1, 2, 3] as const;')
lines.append('')
lines.append('export type PreviewSampleLevel = (typeof PREVIEW_SAMPLE_LEVELS)[number];')
lines.append('')
lines.append('export const PREVIEW_SAMPLE_EXAM_IDS = [')
lines.append("  'symbolic_reasoning',")
lines.append("  'verbal_reasoning',")
lines.append("  'mathematical_reasoning',")
lines.append('] as const;')
lines.append('')
lines.append('export type PreviewSampleExamId = (typeof PREVIEW_SAMPLE_EXAM_IDS)[number];')
lines.append('')
lines.append("export const DEFAULT_PREVIEW_SAMPLE_EXAM_ID: PreviewSampleExamId = 'symbolic_reasoning';")
lines.append('')
lines.append('export const PREVIEW_SAMPLE_QUESTIONS_BY_EXAM: Record<PreviewSampleExamId, PreviewSampleQuestion[]> = {')
for exam_id in ['symbolic_reasoning', 'verbal_reasoning', 'mathematical_reasoning']:
    lines.append(f'  {exam_id}: [')
    for item in all_data[exam_id]:
        line = f"    {{ id: {ts_string(item['id'])}, prompt: {ts_string(item['prompt'])}, options: [{', '.join(ts_string(o) for o in item['options'])}], correctIndex: {item['correctIndex']}, level: {item['level']}"
        if item.get('stimulus_type'):
            line += f", stimulus_type: {ts_string(item['stimulus_type'])}"
        if item.get('stimulus') is not None:
            line += f", stimulus: {ts_value(item['stimulus'])}"
        line += ' },'
        lines.append(line)
    lines.append('  ],')
lines.append('};')
lines.append('')
lines.append('export function isPreviewSampleExamId(examId: string): examId is PreviewSampleExamId {')
lines.append('  return (PREVIEW_SAMPLE_EXAM_IDS as readonly string[]).includes(examId);')
lines.append('}')
lines.append('')
lines.append('export function getPreviewSampleQuestions(examId: string, level?: PreviewSampleLevel): PreviewSampleQuestion[] {')
lines.append('  const questions = isPreviewSampleExamId(examId)')
lines.append('    ? PREVIEW_SAMPLE_QUESTIONS_BY_EXAM[examId]')
lines.append('    : PREVIEW_SAMPLE_QUESTIONS_BY_EXAM[DEFAULT_PREVIEW_SAMPLE_EXAM_ID];')
lines.append('  return level == null ? questions : questions.filter((q) => q.level === level);')
lines.append('}')
lines.append('')
lines.append('export function getPreviewSampleQuestionCount(examId: string, level?: PreviewSampleLevel): number {')
lines.append('  return getPreviewSampleQuestions(examId, level).length;')
lines.append('}')
lines.append('')
lines.append('export function getPreviewSampleAssessmentPath(examId: string): string {')
lines.append('  const resolved = isPreviewSampleExamId(examId) ? examId : DEFAULT_PREVIEW_SAMPLE_EXAM_ID;')
lines.append('  return `/for-schools/preview/assessment/${resolved}`;')
lines.append('}')
lines.append('')
lines.append("export const PREVIEW_SAMPLE_ASSESSMENT_BASE_PATH = '/for-schools/preview/assessment';")
lines.append('')

OUT.write_text('\n'.join(lines), encoding='utf-8')
print(f'Wrote {OUT} ({OUT.stat().st_size} bytes)')
for k,v in all_data.items():
    print(f'  {k}: {len(v)} questions')

/**
 * Admin-only review draft of PRACTICE_GOLD_PARENTS_STUDENT.md.
 * Not in Firestore practice_bank — students never receive these via practice APIs.
 */
import type {
  OfficialExamItemBank,
  OfficialItemBankFacets,
  OfficialItemBankFilters,
  OfficialQuestionStatRow,
} from '../db/platformAdminAnalytics';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

function opts(texts: string[]): OfficialQuestionStatRow['options'] {
  return texts.map((text, i) => ({
    index: i,
    letter: LETTERS[i],
    text,
    pick_count: 0,
    pick_pct: 0,
    is_correct: false,
  }));
}

function row(partial: {
  item_id: string;
  band: string;
  instruction_family: string;
  prompt: string;
  options: string[];
  hasImages?: boolean;
}): OfficialQuestionStatRow {
  const prompt = partial.prompt.trim();
  return {
    item_id: partial.item_id,
    prompt,
    prompt_preview: prompt.slice(0, 160),
    stimulus: null,
    stimulus_type: null,
    assets: [],
    option_figure: null,
    options: opts(partial.options),
    correct_index: null,
    family: null,
    mechanic: null,
    subconstruct: null,
    strand: 'pattern',
    instruction_family: partial.instruction_family,
    band: partial.band,
    times_seen: 0,
    times_correct: 0,
    times_incorrect: 0,
    times_ungraded: 0,
    accuracy_pct: null,
    avg_time_ms: null,
    avg_time_sec: null,
    imported_at: null,
    is_new_in_latest_upload: true,
  };
}

/** Ten gold practice parents from the keyless authoring-review packet. */
export const PRACTICE_GOLD_PARENT_REVIEW_ITEMS: OfficialQuestionStatRow[] = [
  row({
    item_id: 'AR-L1-PRAC-IF01-P01:v1',
    band: 'L0-E',
    instruction_family: 'IF01',
    hasImages: true,
    prompt: `In each row, remove from the first group every symbol that also appears in the second group. The symbols that remain form the result. The order of symbols within a group does not matter.

*(Figure SVG not bundled — screen-reader text:)* The diagram has columns labelled First group, Remove, and Result. Row 1 is triangle, square, circle; remove square; result triangle, circle. Row 2 is diamond, star, circle; remove diamond, circle; result star. Row 3 is triangle, square, diamond; remove square, diamond; result unknown.

Which group belongs in the missing result?`,
    options: ['▲', '■', '▲ ■', '◆'],
  }),
  row({
    item_id: 'AR-L1-PRAC-IF02-P01:v1',
    band: 'L0-C',
    instruction_family: 'IF02',
    prompt: `Each row is produced from the row above it. Two different changes alternate.

\`\`\`
1.  ▲  ■  ●  ◆  ★
2.  ■  ▲  ●  ◆  ★
3.  ■  ▲  ★  ●  ◆
4.  ▲  ■  ★  ●  ◆
5.  [?]
\`\`\`

Which row comes next?`,
    options: ['■ ▲ ◆ ★ ●', '▲ ■ ◆ ★ ●', '▲ ■ ● ◆ ★', '▲ ■ ★ ◆ ●'],
  }),
  row({
    item_id: 'AR-L1-PRAC-IF03-P01:v1',
    band: 'L0-E',
    instruction_family: 'IF03',
    hasImages: true,
    prompt: `Both examples use the same two changes. Apply those changes to the target card.

*(Figure SVG not bundled — screen-reader text:)* Each card is a two-by-two grid. Example 1 begins with a solid triangle at upper-left and a hollow circle at lower-right. It becomes a hollow triangle at lower-left and a solid circle at upper-right. Example 2 begins with a solid square at upper-right and a hollow diamond at lower-left. It becomes a hollow square at lower-right and a solid diamond at upper-left. The target has a solid circle at upper-left, a hollow triangle at lower-left, and a solid square at lower-right. Four result cards are labelled A through D.

Which option shows the transformed target?`,
    options: ['Option A (figure)', 'Option B (figure)', 'Option C (figure)', 'Option D (figure)'],
  }),
  row({
    item_id: 'AR-L1-PRAC-IF04-P01:v1',
    band: 'L0-C',
    instruction_family: 'IF04',
    prompt: `The four symbols ▲, ■, ●, and ◆ have one-to-one codes K, M, P, and R. The machine replaces each symbol with its code and then writes the two codes in reverse order.

\`\`\`
▲  ■   →   M  K
■  ●   →   P  M
●  ◆   →   R  P
\`\`\`

What does the machine output for this input?

\`\`\`
◆  ▲   →   [?] [?]
\`\`\``,
    options: ['R K', 'K R', 'M K', 'R P'],
  }),
  row({
    item_id: 'AR-L1-PRAC-IF05-P01:v1',
    band: 'L0-E',
    instruction_family: 'IF05',
    prompt: `Four different shapes—▲, ■, ●, and ◆—occupy positions 1 through 4, one shape per position.

- ▲ is two positions before ◆.
- ■ is immediately before ◆.
- ● is not in position 1.

Which shape must be in position 2?`,
    options: ['▲', '■', '●', '◆'],
  }),
  row({
    item_id: 'AR-L1-PRAC-IF06-P01:v1',
    band: 'L0-C',
    instruction_family: 'IF06',
    prompt: `Six robots—J, K, L, M, N, and P—are divided between the Red and Blue teams, with three robots on each team.

- J and K are on different teams.
- L and M are on the same team.
- N is on Red.
- Whenever J is on Red, P must be on Blue.

Which assignment could be correct?`,
    options: [
      'Red: J, L, M · Blue: K, N, P',
      'Red: J, N, P · Blue: K, L, M',
      'Red: J, K, N · Blue: L, M, P',
      'Red: K, N, P · Blue: J, L, M',
    ],
  }),
  row({
    item_id: 'AR-L1-PRAC-IF07-P01:v1',
    band: 'L0-E',
    instruction_family: 'IF07',
    prompt: `A scanner accepts a four-symbol code only when both rules are satisfied:

1. The code contains exactly two circles.
2. The first and last symbols have the same fill: both solid or both hollow.

This code is rejected:

\`\`\`
▲  ○  ■  △
\`\`\`

Which single replacement would make the code accepted?`,
    options: [
      'Replace the first ▲ with ○.',
      'Replace the first ▲ with ●.',
      'Replace the third ■ with ○.',
      'Replace the last △ with ■.',
    ],
  }),
  row({
    item_id: 'AR-L1-PRAC-IF08-P01:v1',
    band: 'L0-C',
    instruction_family: 'IF08',
    hasImages: true,
    prompt: `A mirror is placed directly below the card. The arrow is printed on the card and must be reflected along with the other marks.

*(Figure SVG not bundled — screen-reader text:)* The original is a three-by-three card with a solid triangle at upper-left, an upward arrow in the center, and a solid diamond at lower-right. A horizontal mirror lies along the card's bottom edge. Four possible reflected cards are labelled A through D.

Which option shows the mirror image?`,
    options: ['Option A (figure)', 'Option B (figure)', 'Option C (figure)', 'Option D (figure)'],
  }),
  row({
    item_id: 'AR-L1-PRAC-IF09-P01:v1',
    band: 'L0-E',
    instruction_family: 'IF09',
    prompt: `Three lockers numbered 1, 2, and 3 contain a star, a circle, and a square—one object per locker.

- The star is not in Locker 1.
- The circle is in a lower-numbered locker than the square.

Which object cannot be in Locker 2?`,
    options: ['Star', 'Circle', 'Square', 'All three objects could be in Locker 2'],
  }),
  row({
    item_id: 'AR-L1-PRAC-IF10-P01:v1',
    band: 'L0-C',
    instruction_family: 'IF10',
    hasImages: true,
    prompt: `A rectangular sheet of paper has two rows and four columns. Fold the right half to the left along the dotted line. Punch the two marked holes through the folded paper, and then unfold it.

*(Figure SVG not bundled — screen-reader text:)* The original paper is a two-row by four-column rectangle with a vertical fold between columns 2 and 3. The right half folds left. On the resulting two-by-two folded paper, holes are punched at its top-left and bottom-right positions. Four unfolded two-by-four hole patterns are labelled A through D.

Which option shows the unfolded paper?`,
    options: ['Option A (figure)', 'Option B (figure)', 'Option C (figure)', 'Option D (figure)'],
  }),
];

const EMPTY_FACETS: OfficialItemBankFacets = {
  strand: [{ key: 'pattern', label: 'Pattern', count: PRACTICE_GOLD_PARENT_REVIEW_ITEMS.length }],
  instruction_family: Array.from(
    new Set(PRACTICE_GOLD_PARENT_REVIEW_ITEMS.map((q) => q.instruction_family || '')),
  )
    .filter(Boolean)
    .map((key) => ({
      key,
      label: key,
      count: PRACTICE_GOLD_PARENT_REVIEW_ITEMS.filter((q) => q.instruction_family === key).length,
    })),
  band: Array.from(
    new Set(PRACTICE_GOLD_PARENT_REVIEW_ITEMS.map((q) => q.band || '')),
  )
    .filter(Boolean)
    .map((key) => ({
      key,
      label: key,
      count: PRACTICE_GOLD_PARENT_REVIEW_ITEMS.filter((q) => q.band === key).length,
    })),
  family: [],
  subconstruct: [],
  mechanic: [],
  has_images: [
    { key: 'yes', label: 'With images', count: 4 },
    { key: 'no', label: 'Without images', count: 6 },
  ],
  is_new: [{ key: 'yes', label: 'Latest upload only', count: PRACTICE_GOLD_PARENT_REVIEW_ITEMS.length }],
};

const IMAGE_ITEM_IDS = new Set([
  'AR-L1-PRAC-IF01-P01:v1',
  'AR-L1-PRAC-IF03-P01:v1',
  'AR-L1-PRAC-IF08-P01:v1',
  'AR-L1-PRAC-IF10-P01:v1',
]);

export function loadPracticeGoldParentsReviewBank(opts: {
  level: number;
  filters?: OfficialItemBankFilters;
}): OfficialExamItemBank {
  const filters = opts.filters ?? {};
  let questions = [...PRACTICE_GOLD_PARENT_REVIEW_ITEMS];

  // Review packet is L0 / Level 1 only.
  if (opts.level !== 1) {
    questions = [];
  } else {
    if (filters.band) {
      questions = questions.filter((q) => q.band === filters.band);
    }
    if (filters.instruction_family) {
      questions = questions.filter((q) => q.instruction_family === filters.instruction_family);
    }
    if (filters.strand) {
      questions = questions.filter((q) => q.strand === filters.strand);
    }
    if (filters.has_images === 'yes') {
      questions = questions.filter((q) => IMAGE_ITEM_IDS.has(q.item_id));
    } else if (filters.has_images === 'no') {
      questions = questions.filter((q) => !IMAGE_ITEM_IDS.has(q.item_id));
    }
    // All review items are "new" relative to the live practice pool.
    if (filters.is_new === 'no') {
      questions = [];
    }
  }

  return {
    exam_id: 'analytical_reasoning',
    label: 'Analytical Reasoning',
    level: opts.level,
    filters,
    facets: EMPTY_FACETS,
    source: 'review_packet',
    total_items: questions.length,
    served_items: 0,
    questions,
    generated_at: new Date().toISOString(),
    latest_upload_at: null,
  };
}

/**
 * Admin-only review draft of practice_review_30_2026-08-28-r1.
 * 10 revised parents + 20 expansion candidates. Not in Firestore practice_bank —
 * students never receive these via practice APIs. No answer keys (blind review).
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
  strand: string;
  prompt: string;
  options: string[];
  assets?: Array<{ path?: string; alt?: string }>;
  /** Keep composite stem+options SVGs intact in the stem (no option-figure peel). */
  display_mode?: 'figure_tiles' | 'letter_buttons' | 'text_options' | null;
}): OfficialQuestionStatRow {
  const prompt = partial.prompt.trim();
  return {
    item_id: partial.item_id,
    prompt,
    prompt_preview: prompt.slice(0, 160),
    stimulus: null,
    stimulus_type: null,
    assets: partial.assets ?? [],
    option_figure: null,
    display_mode: partial.display_mode ?? null,
    options: opts(partial.options),
    correct_index: null,
    family: null,
    mechanic: null,
    subconstruct: null,
    strand: partial.strand,
    instruction_family: partial.instruction_family,
    band: partial.band,
    delivery_authorized: false,
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

/** Combined 30-item practice review pool from practice_review_30_2026-08-28-r1. */
export const PRACTICE_GOLD_PARENT_REVIEW_ITEMS: OfficialQuestionStatRow[] = [
  row({
    item_id: `AR-L1-PRAC-IF01-P01:v1`,
    band: `L0-E`,
    instruction_family: `IF01`,
    strand: `pattern`,
    prompt: `In each row, remove from the first group every symbol that also appears in the second group. The symbols that remain form the result. The order of symbols within a group does not matter.

![Three rows of symbol groups using the same removal rule](/review-drafts/practice_review_30/practice_if01_set_difference.svg)

Which group belongs in the missing result?`,
    options: [
      `▲`,
      `■`,
      `▲ ■`,
      `◆`,
    ],
    assets: [{ path: `/review-drafts/practice_review_30/practice_if01_set_difference.svg`, alt: `Three rows of symbol groups using the same removal rule` }],
  }),
  row({
    item_id: `AR-L1-PRAC-IF02-P01:v1`,
    band: `L0-C`,
    instruction_family: `IF02`,
    strand: `pattern`,
    prompt: `Each row is produced from the row above it. Two different changes alternate.

\`\`\`text
1.  ▲  ■  ●  ◆  ★
2.  ■  ▲  ●  ◆  ★
3.  ■  ▲  ★  ●  ◆
4.  ▲  ■  ★  ●  ◆
5.  [?]
\`\`\`

Which row comes next?`,
    options: [
      `■ ▲ ◆ ★ ●`,
      `▲ ■ ◆ ★ ●`,
      `▲ ■ ● ◆ ★`,
      `▲ ■ ★ ◆ ●`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF03-P01:v1`,
    band: `L0-E`,
    instruction_family: `IF03`,
    strand: `rule`,
    prompt: `Both examples use the same two changes. Apply those changes to the target card.

![Two transformation examples, a target card, and four result cards](/review-drafts/practice_review_30/practice_if03_flip_toggle.svg)

Which option shows the transformed target?`,
    // Letter keys only — composite SVG already embeds A–D. Avoid "Option A (figure)"
    // placeholders (not treated as empty) and alts with "possible/options" that strip the
    // stem into a partial option-figure crop.
    options: [`A`, `B`, `C`, `D`],
    assets: [{ path: `/review-drafts/practice_review_30/practice_if03_flip_toggle.svg`, alt: `Two transformation examples, a target card, and four result cards` }],
    display_mode: `text_options`,
  }),
  row({
    item_id: `AR-L1-PRAC-IF04-P01:v1`,
    band: `L0-C`,
    instruction_family: `IF04`,
    strand: `pattern`,
    prompt: `The four symbols ▲, ■, ●, and ◆ have one-to-one codes K, M, P, and R. The machine replaces each symbol with its code and then writes the two codes in reverse order.

\`\`\`text
▲  ■   →   M  K
■  ●   →   P  M
●  ◆   →   R  P
\`\`\`

What does the machine output for this input?

\`\`\`text
◆  ▲   →   [?] [?]
\`\`\``,
    options: [
      `R K`,
      `K R`,
      `M K`,
      `R P`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF05-P01:v1`,
    band: `L0-E`,
    instruction_family: `IF05`,
    strand: `pattern`,
    prompt: `Four different shapes—▲, ■, ●, and ◆—occupy positions 1 through 4, one shape per position.

- ▲ is two positions before ◆.
- ■ is immediately before ◆.
- ● is not in position 1.

Which shape must be in position 2?`,
    options: [
      `▲`,
      `■`,
      `●`,
      `◆`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF06-P01:v1`,
    band: `L0-C`,
    instruction_family: `IF06`,
    strand: `relational`,
    prompt: `Six robots—J, K, L, M, N, and P—are divided between the Red and Blue teams, with three robots on each team.

- J and K are on different teams.
- L and M are on the same team.
- N is on Red.
- Whenever J is on Red, P must be on Blue.

Which assignment could be correct?`,
    options: [
      `Red: J, L, M · Blue: K, N, P`,
      `Red: J, N, P · Blue: K, L, M`,
      `Red: J, K, N · Blue: L, M, P`,
      `Red: K, N, P · Blue: J, L, M`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF07-P02:v1`,
    band: `L0-C`,
    instruction_family: `IF07`,
    strand: `flexible`,
    prompt: `A scanner accepts a row only when both rules are satisfied:

1. The row contains exactly one triangle.
2. The two middle symbols have different fills: one solid and one hollow.

Which row is accepted?`,
    options: [
      `▲  ●  ■  ◆`,
      `●  ○  ■  ◆`,
      `▲  ○  ■  ◆`,
      `▲  ○  △  ◆`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF08-P01:v1`,
    band: `L0-C`,
    instruction_family: `IF08`,
    strand: `relational`,
    prompt: `A mirror is placed directly below the card. The arrow is printed on the card and must be reflected along with the other marks.

![A marked card above a mirror and four mirror-image cards](/review-drafts/practice_review_30/practice_if08_bottom_mirror.svg)

Which option shows the mirror image?`,
    options: [`A`, `B`, `C`, `D`],
    assets: [{ path: `/review-drafts/practice_review_30/practice_if08_bottom_mirror.svg`, alt: `A marked card above a mirror and four mirror-image cards` }],
    display_mode: `text_options`,
  }),
  row({
    item_id: `AR-L1-PRAC-IF09-P01:v1`,
    band: `L0-E`,
    instruction_family: `IF09`,
    strand: `flexible`,
    prompt: `Three lockers numbered 1, 2, and 3 contain a star, a circle, and a square—one object per locker.

- The star is not in Locker 1.
- The circle is in a lower-numbered locker than the square.

Which object cannot be in Locker 2?`,
    options: [
      `Star`,
      `Circle`,
      `Square`,
      `All three objects could be in Locker 2`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF10-P01:v1`,
    band: `L0-C`,
    instruction_family: `IF10`,
    strand: `rule`,
    prompt: `A rectangular sheet of paper has two rows and four columns. Fold the right half to the left along the dotted line. Punch the two marked holes through the folded paper, and then unfold it.

![A two-by-four sheet folded in half, two punched positions, and four unfolded patterns](/review-drafts/practice_review_30/practice_if10_fold_punch.svg)

Which option shows the unfolded paper?`,
    options: [`A`, `B`, `C`, `D`],
    assets: [{ path: `/review-drafts/practice_review_30/practice_if10_fold_punch.svg`, alt: `A two-by-four sheet folded in half, two punched positions, and four unfolded patterns` }],
    display_mode: `text_options`,
  }),
  row({
    item_id: `AR-L1-PRAC-IF01-P02:v1`,
    band: `L0-E`,
    instruction_family: `IF01`,
    strand: `pattern`,
    prompt: `Keep every symbol that appears in exactly one of the two groups. Remove any symbol that appears in both groups. The order of symbols within a group does not matter.

\`\`\`text
First group:   ★  ●  ◆
Second group:  ●  ■
\`\`\`

Which group remains?`,
    options: [
      `★ ◆ ■`,
      `●`,
      `★ ◆`,
      `★ ● ◆ ■`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF01-P03:v1`,
    band: `L0-E`,
    instruction_family: `IF01`,
    strand: `rule`,
    prompt: `Each card is a 2 × 2 grid. ■ marks a filled position, and □ marks an empty position.

Compare the same position on Card A and Card B. Fill a position on the result only when it is filled on **both** cards. Leave it empty otherwise.

\`\`\`text
Card A        Card B
■  □          ■  ■
□  ■          □  □
\`\`\`

Each option lists the top row, followed by the bottom row. Which card is the result?`,
    options: [
      `top: ■ ■; bottom: □ ■`,
      `top: □ ■; bottom: □ □`,
      `top: ■ □; bottom: □ □`,
      `top: □ □; bottom: □ ■`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF02-P02:v1`,
    band: `L0-C`,
    instruction_family: `IF02`,
    strand: `pattern`,
    prompt: `Seven positions are arranged in a straight line and numbered 1 through 7. The triangle moves forward one position at each step. The square moves backward two positions at each step.

\`\`\`text
Step 1:  ▲ at 1    ■ at 7
Step 2:  ▲ at 2    ■ at 5
Step 3:  ▲ at 3    ■ at 3
Step 4:  [?]
\`\`\`

Which pair gives the positions at Step 4?`,
    options: [
      `▲ at 4; ■ at 3`,
      `▲ at 3; ■ at 1`,
      `▲ at 5; ■ at 1`,
      `▲ at 4; ■ at 1`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF02-P03:v1`,
    band: `L0-C`,
    instruction_family: `IF02`,
    strand: `rule`,
    prompt: `Each row is produced from the row above it. These two changes repeat in order:

1. Reverse the entire row.
2. Toggle the fill of the last two symbols.

After Change 2, start again with Change 1.

\`\`\`text
1.  ▲  ○  ■  ◇
2.  ◇  ■  ○  ▲
3.  ◇  ■  ●  △
4.  △  ●  ■  ◇
5.  △  ●  □  ◆
6.  [?]
\`\`\`

Which row comes next?`,
    options: [
      `△ ● ◆ □`,
      `◆ □ ● △`,
      `△ ● □ ◆`,
      `◆ ■ ● △`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF03-P02:v1`,
    band: `L0-E`,
    instruction_family: `IF03`,
    strand: `rule`,
    prompt: `Rotate the entire card 90 degrees clockwise. Then toggle every symbol from solid to hollow or from hollow to solid.

\`\`\`text
Input card
▲  □
○  ■
\`\`\`

Each option lists the top row, followed by the bottom row. Which card is the result?`,
    options: [
      `top: ○ ▲; bottom: ■ □`,
      `top: ● △; bottom: □ ■`,
      `top: △ ■; bottom: ● □`,
      `top: ■ □; bottom: △ ●`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF03-P03:v1`,
    band: `L0-E`,
    instruction_family: `IF03`,
    strand: `rule`,
    prompt: `Move the first symbol to the end of the row. Toggle the fill of that moved symbol. Do not change the other symbols.

\`\`\`text
Input:  ▲  ○  ■  ◆
\`\`\`

Which row is the result?`,
    options: [
      `○ ■ ◆ ▲`,
      `◆ ▲ ○ ■`,
      `○ □ ◆ △`,
      `○ ■ ◆ △`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF04-P02:v1`,
    band: `L0-C`,
    instruction_family: `IF04`,
    strand: `pattern`,
    prompt: `Each symbol always has the same one-letter code.

\`\`\`text
▲ ■  →  K M
■ ●  →  M P
● ◆  →  P R
\`\`\`

What is the code for \`◆ ▲ ●\`?`,
    options: [
      `R P K`,
      `K R P`,
      `R K P`,
      `P K R`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF04-P03:v1`,
    band: `L0-C`,
    instruction_family: `IF04`,
    strand: `rule`,
    prompt: `Machine K moves the first symbol to the end of the row. Machine M toggles the fill of the first symbol and leaves the others unchanged.

\`\`\`text
Input:  ▲  ○  ■  ◇
Apply:  K, then M
\`\`\`

Which row is the final output?`,
    options: [
      `○ ■ ◇ ▲`,
      `● □ ◆ ▲`,
      `● ■ ◇ ▲`,
      `△ ○ ■ ◇`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF05-P02:v1`,
    band: `L0-E`,
    instruction_family: `IF05`,
    strand: `relational`,
    prompt: `Four books—P, Q, R, and S—stand in a row.

- P is immediately before Q.
- R is immediately after Q.
- S is not first.

Which order is possible?`,
    options: [
      `S P Q R`,
      `P R Q S`,
      `P Q R S`,
      `R P Q S`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF05-P03:v1`,
    band: `L0-E`,
    instruction_family: `IF05`,
    strand: `relational`,
    prompt: `Four deliveries—P, Q, R, and S—are scheduled from first to fourth.

- P is somewhere before Q.
- R is immediately before S.
- Q is not first.

Which schedule follows all three rules?`,
    options: [
      `R S Q P`,
      `P S R Q`,
      `R P S Q`,
      `P R S Q`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF06-P02:v1`,
    band: `L0-C`,
    instruction_family: `IF06`,
    strand: `relational`,
    prompt: `Five robots—A, B, C, D, and E—are assigned to Green or Orange. Exactly two robots are Green.

- A and B are on the same team.
- C and D are on different teams.
- E is Green.

Which assignment could be correct?`,
    options: [
      `Green: A, B · Orange: C, D, E`,
      `Green: C, E · Orange: A, B, D`,
      `Green: A, E · Orange: B, C, D`,
      `Green: C, D · Orange: A, B, E`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF06-P03:v1`,
    band: `L0-C`,
    instruction_family: `IF06`,
    strand: `relational`,
    prompt: `Five robots—J, K, L, M, and N—stand in a row.

- J stands next to K.
- L does not stand next to M.
- N stands at one end.

Which order could be correct?`,
    options: [
      `N J K L M`,
      `J K N L M`,
      `L J K M N`,
      `N J L K M`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF07-P03:v1`,
    band: `L0-C`,
    instruction_family: `IF07`,
    strand: `flexible`,
    prompt: `A scanner accepts a row only when both rules are satisfied:

1. Exactly two symbols are solid.
2. The first and last symbols are different shapes.

Which row is accepted?`,
    options: [
      `▲ ○ ■ △`,
      `▲ ○ □ ◆`,
      `▲ ● ■ ◆`,
      `△ ○ □ ◆`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF07-P04:v1`,
    band: `L0-C`,
    instruction_family: `IF07`,
    strand: `flexible`,
    prompt: `Two possible rules are being tested:

- Rule P: the row contains exactly one hollow symbol.
- Rule Q: the first and last symbols are the same shape.

Which row satisfies Rule P but does not satisfy Rule Q?`,
    options: [
      `▲ ○ ■ ◆`,
      `▲ ○ ■ △`,
      `▲ ● ■ △`,
      `▲ ● ■ ◆`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF08-P02:v1`,
    band: `L0-C`,
    instruction_family: `IF08`,
    strand: `relational`,
    prompt: `A vertical mirror is placed to the right of the card. The arrow is printed on the card and is reflected with the other marks.

![A marked card beside a vertical mirror and four mirror-image cards](/review-drafts/practice_review_30/practice_if08_vertical_mirror.svg)

Which option shows the mirror image?`,
    options: [`A`, `B`, `C`, `D`],
    assets: [{ path: `/review-drafts/practice_review_30/practice_if08_vertical_mirror.svg`, alt: `A marked card beside a vertical mirror and four mirror-image cards` }],
    display_mode: `text_options`,
  }),
  row({
    item_id: `AR-L1-PRAC-IF08-P03:v1`,
    band: `L0-C`,
    instruction_family: `IF08`,
    strand: `flexible`,
    prompt: `Four markers stand on a straight rail. An observer stands at the east end and looks west.

![Four markers on a west-to-east rail with an observer at the east end](/review-drafts/practice_review_30/practice_if08_east_view_line.svg)

Which order does the observer see from nearest to farthest?`,
    options: [
      `▲ ● ■ ◆`,
      `◆ ■ ● ▲`,
      `▲ ■ ● ◆`,
      `◆ ● ■ ▲`,
    ],
    assets: [{ path: `/review-drafts/practice_review_30/practice_if08_east_view_line.svg`, alt: `Four markers on a west-to-east rail with an observer at the east end` }],
  }),
  row({
    item_id: `AR-L1-PRAC-IF09-P02:v1`,
    band: `L0-E`,
    instruction_family: `IF09`,
    strand: `flexible`,
    prompt: `A student claims: “Every row that starts with a solid symbol also ends with a solid symbol.”

Which row proves that the claim is false?`,
    options: [
      `▲ ○ ■`,
      `△ ● □`,
      `■ ○ △`,
      `◆ ● ▲`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF09-P03:v1`,
    band: `L0-E`,
    instruction_family: `IF09`,
    strand: `flexible`,
    prompt: `A row passes when it contains more solid symbols than hollow symbols. One result below is labelled incorrectly.

Which result is labelled incorrectly?`,
    options: [
      `\`▲ ■ ○\` — PASS`,
      `\`△ □ ●\` — FAIL`,
      `\`▲ ○ △\` — PASS`,
      `\`■ ● ◆\` — PASS`,
    ],
  }),
  row({
    item_id: `AR-L1-PRAC-IF10-P02:v1`,
    band: `L0-C`,
    instruction_family: `IF10`,
    strand: `rule`,
    prompt: `Fold the right half of the sheet to the left along the dotted line. Punch the marked position once through the folded sheet. Then unfold the sheet.

![A two-by-four sheet folded in half, one punched position, and four unfolded patterns](/review-drafts/practice_review_30/practice_if10_single_punch.svg)

Which option shows the unfolded sheet?`,
    options: [`A`, `B`, `C`, `D`],
    assets: [{ path: `/review-drafts/practice_review_30/practice_if10_single_punch.svg`, alt: `A two-by-four sheet folded in half, one punched position, and four unfolded patterns` }],
    display_mode: `text_options`,
  }),
  row({
    item_id: `AR-L1-PRAC-IF10-P03:v1`,
    band: `L0-C`,
    instruction_family: `IF10`,
    strand: `pattern`,
    prompt: `The highlighted spaces form one uncovered area. Choose the single cover that can be rotated—but not flipped—to fit the area exactly.

![An uncovered four-square shape and four cover tiles](/review-drafts/practice_review_30/practice_if10_cover_shape.svg)

Which cover fits?`,
    options: [`A`, `B`, `C`, `D`],
    assets: [{ path: `/review-drafts/practice_review_30/practice_if10_cover_shape.svg`, alt: `An uncovered four-square shape and four cover tiles` }],
    display_mode: `text_options`,
  }),
];

function facetCounts(
  items: OfficialQuestionStatRow[],
  key: 'strand' | 'instruction_family' | 'band',
): Array<{ key: string; label: string; count: number }> {
  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const q of items) {
    const v = (q[key] || '').trim();
    if (!v) continue;
    if (!counts.has(v)) order.push(v);
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return order.map((k) => ({ key: k, label: k, count: counts.get(k) || 0 }));
}

function buildFacets(items: OfficialQuestionStatRow[]): OfficialItemBankFacets {
  const approvedCount = items.filter((q) => q.delivery_authorized === true).length;
  return {
    strand: facetCounts(items, 'strand'),
    instruction_family: facetCounts(items, 'instruction_family'),
    band: facetCounts(items, 'band'),
    family: [],
    subconstruct: [],
    mechanic: [],
    approved: [
      { key: 'yes', label: 'Approved', count: approvedCount },
      { key: 'no', label: 'Not approved', count: items.length - approvedCount },
    ],
    is_new: [{ key: 'yes', label: 'Latest upload only', count: items.length }],
  };
}

function packetHasValue(
  items: OfficialQuestionStatRow[],
  key: 'strand' | 'instruction_family' | 'band',
  value: string,
): boolean {
  return items.some((q) => (q[key] || '') === value);
}

export function loadPracticeGoldParentsReviewBank(opts: {
  level: number;
  filters?: OfficialItemBankFilters;
}): OfficialExamItemBank {
  const filters = opts.filters ?? {};
  let questions = [...PRACTICE_GOLD_PARENT_REVIEW_ITEMS];

  // Review packet is L0 / Level 1 only.
  // Ignore stale Official/Practice URL filters (e.g. band=L0-S) that aren't in this packet.
  if (opts.level !== 1) {
    questions = [];
  } else {
    if (filters.band && packetHasValue(questions, 'band', filters.band)) {
      questions = questions.filter((q) => q.band === filters.band);
    }
    if (
      filters.instruction_family &&
      packetHasValue(questions, 'instruction_family', filters.instruction_family)
    ) {
      questions = questions.filter((q) => q.instruction_family === filters.instruction_family);
    }
    if (filters.strand && packetHasValue(questions, 'strand', filters.strand)) {
      questions = questions.filter((q) => q.strand === filters.strand);
    }
    if (filters.approved === 'yes') {
      questions = questions.filter((q) => q.delivery_authorized === true);
    } else if (filters.approved === 'no') {
      questions = questions.filter((q) => q.delivery_authorized !== true);
    }
    if (filters.is_new === 'no') {
      questions = [];
    }
  }

  return {
    exam_id: 'analytical_reasoning',
    label: 'Analytical Reasoning',
    level: opts.level,
    filters,
    facets: buildFacets(PRACTICE_GOLD_PARENT_REVIEW_ITEMS),
    source: 'review_packet',
    total_items: questions.length,
    served_items: 0,
    questions,
    generated_at: new Date().toISOString(),
    latest_upload_at: null,
  };
}

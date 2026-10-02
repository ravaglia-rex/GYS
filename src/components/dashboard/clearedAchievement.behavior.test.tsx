// @ts-nocheck
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { AttemptRecord, AssessmentType } from '../../db/assessmentCollection';
import AssessmentAttemptHistorySection from './AssessmentAttemptHistorySection';
import { EnhancedAssessmentCardsGroup } from './EnhancedAssessmentCardsGroup';
import ClearedAchievementPopup from './ClearedAchievementPopup';

const mockAttempts: { current: AttemptRecord[] } = { current: [] };

jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('../../firebase/firebase', () => ({
  auth: {
    currentUser: { uid: 'student-1', email: 'student@test.argus' },
  },
}));

jest.mock('../../query/hooks', () => ({
  useAssessmentConfig: () => ({ data: [], isLoading: false, isError: false, error: null }),
  useOfficialExamOps: () => ({ data: { new_starts_paused: false } }),
  useStudent: () => ({
    data: { grade: 8, assessment_progress: {} },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useStudentAssessments: () => ({
    data: { attempts: mockAttempts.current, assessments: [] },
  }),
}));

const previewAssessments = [
  { id: 'analytical_reasoning', name: 'Analytical Reasoning', tiers: [] },
  { id: 'verbal_reasoning', name: 'Verbal Reasoning', tiers: [] },
] as unknown as AssessmentType[];

function attempt(
  overrides: Partial<AttemptRecord> & Pick<AttemptRecord, 'attempt_id' | 'assessment_id' | 'completed_at'>
): AttemptRecord {
  return {
    proficiency_tier: 1,
    status: 'completed',
    score: 0.9,
    passed: true,
    started_at: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

const arLevel1Pass = attempt({
  attempt_id: 'ar-l1',
  assessment_id: 'analytical_reasoning',
  proficiency_tier: 1,
  completed_at: '2026-09-20T10:00:00.000Z',
});

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(node: React.ReactElement) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root?.render(node);
  });
}

function unmount() {
  act(() => {
    root?.unmount();
  });
  host?.remove();
  root = null;
  host = null;
}

function clearedText(): string | null {
  return document.body.textContent?.match(/You cleared [^!]+!/)?.[0] ?? null;
}

function clearedCount(): number {
  return document.body.textContent?.match(/You cleared /g)?.length ?? 0;
}

function clickOk() {
  const button = Array.from(document.querySelectorAll('button')).find((node) => node.textContent === 'OK');
  if (!button) throw new Error('OK button was not on screen');
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function renderHistory(attempts: AttemptRecord[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mount(
    <QueryClientProvider client={client}>
      <AssessmentAttemptHistorySection
        previewAttempts={attempts}
        previewAssessments={previewAssessments}
      />
    </QueryClientProvider>
  );
}

function renderAvailable(attempts: AttemptRecord[]) {
  mockAttempts.current = attempts;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mount(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <EnhancedAssessmentCardsGroup
          uid="student-1"
          filterType="available"
          student={{ grade: 8, assessment_progress: {} }}
          assessmentConfig={[]}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function renderPopup(attempts: AttemptRecord[], options?: { keepAck?: boolean }) {
  if (!options?.keepAck) window.localStorage.clear();
  mockAttempts.current = attempts;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mount(
    <QueryClientProvider client={client}>
      <ClearedAchievementPopup />
    </QueryClientProvider>
  );
}

function renderCompletedTab(attempts: AttemptRecord[]) {
  mockAttempts.current = attempts;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mount(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <EnhancedAssessmentCardsGroup
          uid="student-1"
          filterType="completed"
          student={{ grade: 8, assessment_progress: {} }}
          assessmentConfig={[]}
        />
        <AssessmentAttemptHistorySection
          previewAttempts={attempts}
          previewAssessments={previewAssessments}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('cleared achievement follows the newest released result', () => {
  afterEach(() => {
    unmount();
    window.localStorage.clear();
  });

  const pendingVerbalAfterArPass = [
    arLevel1Pass,
    attempt({
      attempt_id: 'vr-l1',
      assessment_id: 'verbal_reasoning',
      completed_at: '2026-10-01T10:00:00.000Z',
      passed: true,
    }),
  ];

  const newerArPass = [
    arLevel1Pass,
    attempt({
      attempt_id: 'ar-l2',
      assessment_id: 'analytical_reasoning',
      proficiency_tier: 2,
      completed_at: '2026-10-01T10:00:00.000Z',
      passed: true,
    }),
  ];

  const newerArFail = [
    arLevel1Pass,
    attempt({
      attempt_id: 'ar-l2-fail',
      assessment_id: 'analytical_reasoning',
      proficiency_tier: 2,
      completed_at: '2026-10-01T10:00:00.000Z',
      score: 0.4,
      passed: false,
    }),
  ];

  it('keeps the last pass while a newer attempt has no released score', () => {
    renderHistory(pendingVerbalAfterArPass);
    expect(clearedText()).toBe('You cleared Analytical Reasoning Level 1!');
    unmount();

    renderAvailable(pendingVerbalAfterArPass);
    expect(clearedText()).toBe('You cleared Analytical Reasoning Level 1!');
    unmount();

    renderPopup(pendingVerbalAfterArPass);
    expect(document.body.textContent).toContain('You cleared Analytical Reasoning Level 1!');
  });

  it('replaces the banner when a newer released result is a different pass', () => {
    renderHistory([...newerArPass].reverse());
    expect(clearedText()).toBe('You cleared Analytical Reasoning Level 2!');
    unmount();

    renderAvailable(newerArPass);
    expect(clearedText()).toBe('You cleared Analytical Reasoning Level 2!');
    unmount();

    renderPopup(newerArPass);
    expect(document.body.textContent).toContain('You cleared Analytical Reasoning Level 2!');
  });

  it('removes the banner when the newest released result is not a pass', () => {
    renderHistory(newerArFail);
    expect(clearedText()).toBeNull();
    unmount();

    renderAvailable(newerArFail);
    expect(clearedText()).toBeNull();
    unmount();

    renderPopup(newerArFail);
    expect(clearedText()).toBeNull();
  });

  it('ignores in-progress, held, and ended-early attempts that are not a released result', () => {
    const stillPending = [
      arLevel1Pass,
      attempt({
        attempt_id: 'ar-in-progress',
        assessment_id: 'analytical_reasoning',
        proficiency_tier: 2,
        status: 'in_progress',
        passed: null,
        score: null,
        completed_at: null,
        started_at: '2026-10-02T10:00:00.000Z',
      }),
      attempt({
        attempt_id: 'ar-held',
        assessment_id: 'analytical_reasoning',
        proficiency_tier: 2,
        completed_at: '2026-10-02T11:00:00.000Z',
        passed: true,
        score_release_held: true,
      }),
      attempt({
        attempt_id: 'ar-ended',
        assessment_id: 'analytical_reasoning',
        proficiency_tier: 2,
        status: 'failed',
        passed: false,
        completed_at: null,
        failed_at: '2026-10-02T12:00:00.000Z',
      }),
    ];

    renderHistory(stillPending);
    expect(clearedText()).toBe('You cleared Analytical Reasoning Level 1!');
    unmount();

    renderAvailable(stillPending);
    expect(clearedText()).toBe('You cleared Analytical Reasoning Level 1!');
    unmount();

    renderPopup(stillPending);
    expect(clearedText()).toBe('You cleared Analytical Reasoning Level 1!');
  });

  it('shows the clearance once on Completed & Results, not twice', () => {
    renderCompletedTab(pendingVerbalAfterArPass);
    expect(clearedText()).toBe('You cleared Analytical Reasoning Level 1!');
    expect(clearedCount()).toBe(1);
  });

  it('shows nothing when the only released result is not a pass', () => {
    const onlyFail = [
      attempt({
        attempt_id: 'ar-only-fail',
        assessment_id: 'analytical_reasoning',
        completed_at: '2026-10-01T10:00:00.000Z',
        score: 0.2,
        passed: false,
      }),
    ];

    renderHistory(onlyFail);
    expect(clearedText()).toBeNull();
    unmount();

    renderAvailable(onlyFail);
    expect(clearedText()).toBeNull();
    unmount();

    renderPopup(onlyFail);
    expect(clearedText()).toBeNull();
    expect(document.querySelector('button')).toBeNull();
  });

  it('keeps the celebration up until OK, then does not show that same result again', () => {
    renderPopup([arLevel1Pass]);
    expect(clearedText()).toBe('You cleared Analytical Reasoning Level 1!');

    act(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    const backdrop = document.querySelector('.MuiBackdrop-root');
    act(() => {
      backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(clearedText()).toBe('You cleared Analytical Reasoning Level 1!');
    expect(window.localStorage.getItem('argus.cleared-achievement-ack:student-1')).toBeNull();

    clickOk();
    expect(clearedText()).toBeNull();
    expect(window.localStorage.getItem('argus.cleared-achievement-ack:student-1')).toBe('ar-l1');
    unmount();

    renderPopup([arLevel1Pass], { keepAck: true });
    expect(clearedText()).toBeNull();
    unmount();

    renderHistory([arLevel1Pass]);
    expect(clearedText()).toBe('You cleared Analytical Reasoning Level 1!');
  });

  it('shows a new celebration for a later pass, and drops it if that result is not a pass', () => {
    renderPopup([arLevel1Pass]);
    clickOk();
    expect(clearedText()).toBeNull();
    unmount();

    renderPopup(newerArPass, { keepAck: true });
    expect(clearedText()).toBe('You cleared Analytical Reasoning Level 2!');
    unmount();

    renderPopup(newerArFail, { keepAck: true });
    expect(clearedText()).toBeNull();
  });
});

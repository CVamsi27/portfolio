export type InterviewSprintDay = {
  day: number;
  date: string;
  build: string;
  evidence: string;
};

export type InterviewSprintPhase = {
  id: string;
  label: string;
  window: string;
  status: "active" | "gated";
  summary: string;
  points: string[];
};

/**
 * Public, generic roadmap content. The detailed personal schedule and
 * application record stay in the private workspace, not in this repository.
 */
export const interviewReadySprint = {
  headline: "Income first, then one defensible slice",
  summary:
    "Applications stay full-time until a signed contract or funded milestone. Then ten working days extend RLS Rehearsal with closure evidence, a transactional outbox, bounded retries and replay.",
  triggerDate: "27 November 2026",
  sprintWindow: "30 November–10 December 2026",
  defenseDate: "10 December 2026",
  repositoryUrl: "https://github.com/CVamsi27/rls-rehearsal",
  triggerNote:
    "If the trigger arrives after 27 November, shift the ten working days and the defense date by the same amount. Do not compress the verification gates to keep a date.",
  frontendNote:
    "Keep React, React Hook Form, Zod and TanStack Query current with Docita drills. The sprint adds only a small ledger change; it does not grow a second frontend.",
  phases: [
    {
      id: "income",
      label: "Phase 0 · Income first",
      window: "Now–27 November 2026",
      status: "active",
      summary:
        "The first daily block goes to applications, follow-ups and paid contracts.",
      points: [
        "One hour of interview maintenance on weekdays; Saturday review; Sunday off.",
        "The trigger is a signed employment contract with start and first-payment dates.",
        "A funded paid engagement with a milestone or first-invoice date also counts.",
      ],
    },
    {
      id: "sprint",
      label: "Phase 1 · Ten-day vertical slice",
      window: "30 November–10 December 2026",
      status: "gated",
      summary:
        "One feature that proves tenant isolation, atomicity, delivery and recovery.",
      points: [
        "Closure note, attachment metadata and a transactional outbox event.",
        "Five-attempt retry, lease fencing, dead-letter replay and delivery metrics.",
        "Small ledger change, case study and a timed defense.",
      ],
    },
  ] satisfies InterviewSprintPhase[],
  days: [
    {
      day: 1,
      date: "Mon 30 Nov",
      build: "Baseline and one-page design brief",
      evidence: "Clean verify; trust boundary and eight failure cases",
    },
    {
      day: 2,
      date: "Tue 1 Dec",
      build: "Failing tests for evidence, isolation and duplicate close",
      evidence: "Red tests fail on assertions, not compile errors",
    },
    {
      day: 3,
      date: "Wed 2 Dec",
      build: "Migration 003: note, attachments, outbox, RLS and grants",
      evidence: "Foreign insert denied; cross-tenant key rejected",
    },
    {
      day: 4,
      date: "Thu 3 Dec",
      build: "Close with note plus outbox in one transaction",
      evidence: "404 parity; exactly one event per close",
    },
    {
      day: 5,
      date: "Fri 4 Dec",
      build: "Worker claim with FOR UPDATE SKIP LOCKED and a lease",
      evidence: "Two workers claim once; a stale lease cannot complete",
    },
    {
      day: 6,
      date: "Sat 5 Dec",
      build: "Five-attempt retry and dead-letter state",
      evidence: "Failure transcript with attempt count and safe error",
    },
    {
      day: 7,
      date: "Mon 7 Dec",
      build: "Replay script and outbox delivery metrics",
      evidence: "Idempotent replay; pending, dead and age metrics",
    },
    {
      day: 8,
      date: "Tue 8 Dec",
      build: "200 lists at concurrency 4; EXPLAIN and index decision",
      evidence: "P95, P99, both plans and the write-cost trade-off",
    },
    {
      day: 9,
      date: "Wed 9 Dec",
      build: "Case study, ledger delivery state and demo",
      evidence: "Two-minute demo; every claim traceable",
    },
    {
      day: 10,
      date: "Thu 10 Dec",
      build: "Timed defense and scorecard",
      evidence: "Three gaps, each with a next action",
    },
  ] satisfies InterviewSprintDay[],
  gates: [
    "Project: clean checkout, Compose demo, broken control, failure/retry/replay and metrics.",
    "Resume: every selected bullet has the change, location, check and claim limit.",
    "Rounds: one frontend, backend/design, coding and behavioral round, each timed.",
    "Feedback: one independent mock or peer review with the first concern and fix.",
    "Logistics: introduction, stories, interviewer questions and working links.",
  ],
} as const;

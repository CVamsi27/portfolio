import test from "node:test";
import assert from "node:assert/strict";
import {
  studyTaskUrl,
  scoreExam,
  examReadiness,
  appendExamAttempt,
  datedAssignments,
  type GermanyRound,
  type GermanyExamAttempt,
  type GermanyExecution,
} from "./germany-execution.ts";
const round: GermanyRound = {
  id: "R2",
  title: "Practical",
  dimensions: [
    "Requirements",
    "Correctness",
    "Boundaries",
    "Tests",
    "Maintainability",
    "Limits",
  ],
  passTotal: 19,
  minimum3: [1, 2],
  content: "Explain and test.",
  version: "b".repeat(64),
};
const attempt: GermanyExamAttempt = {
  id: "attempt-1",
  roundId: "R2",
  track: "frontend",
  prompt: "Frontend stale-response form A",
  promptVersion: "a".repeat(64),
  startedAt: "2026-10-24T04:45:00Z",
  finishedAt: "2026-10-24T05:45:00Z",
  focusedMinutes: 60,
  tools: "official-docs",
  reviewerType: "self",
  reviewer: "Self",
  scores: [3, 4, 3, 3, 3, 3],
  reasons: Array(6).fill(
    "Observed expected behavior and tested the edge case.",
  ),
  criticalFailures: "",
  evidence:
    "Frozen revision and controllable-promise test demonstrate latest request wins.",
  repair: "Repeat with duplicate writes on form B.",
  retakeDate: "2026-10-28",
};
test("adds only safe study return context and rejects a mismatched task date", () => {
  const url = new URL(
    studyTaskUrl(
      "https://study.buildora.work/10-frontend/scope.md",
      "2026-10-12",
      "germany:2026:day:2026-10-12",
    ),
  );
  assert.equal(url.searchParams.get("roadmapDate"), "2026-10-12");
  assert.equal(
    url.searchParams.get("roadmapTask"),
    "germany:2026:day:2026-10-12",
  );
  assert.equal(
    studyTaskUrl("https://example.org/", "2026-10-12", "bad"),
    "https://example.org/",
  );
  assert.equal(
    studyTaskUrl("https://study.buildora.work/a.md", "2026-02-30", "bad"),
    "https://study.buildora.work/a.md",
  );
});
test("high totals cannot conceal a critical failure, weak boundary or overtime", () => {
  assert.equal(scoreExam(round, attempt).status, "passed");
  assert.equal(
    scoreExam(round, { ...attempt, criticalFailures: "Wrong tenant returned" })
      .status,
    "repair",
  );
  assert.equal(
    scoreExam(round, { ...attempt, scores: [4, 4, 2, 4, 4, 4] }).status,
    "repair",
  );
  assert.equal(
    scoreExam(round, {
      ...attempt,
      focusedMinutes: 61,
      finishedAt: "2026-10-24T05:46:00Z",
    }).status,
    "repair",
  );
  assert.equal(
    scoreExam(round, { ...attempt, scores: [null, 4, 3, 3, 3, 3] }).status,
    "unscored",
  );
  assert.equal(
    scoreExam(round, { ...attempt, tools: "assisted" }).eligible,
    false,
  );
});
test("readiness needs different prompts, current criteria and separate practical tracks", () => {
  const second = {
    ...attempt,
    id: "attempt-2",
    prompt: "Frontend duplicate-write form B",
  };
  assert.equal(
    examReadiness(round, [attempt, second], attempt.promptVersion, "frontend"),
    "Self-assessed readiness",
  );
  assert.equal(
    examReadiness(
      round,
      [attempt, { ...second, prompt: attempt.prompt }],
      attempt.promptVersion,
      "frontend",
    ),
    "1 of 2 changed-prompt passes",
  );
  assert.equal(
    examReadiness(round, [attempt, second], "c".repeat(64), "frontend"),
    "Criteria changed · review earlier attempts",
  );
  assert.equal(
    examReadiness(round, [attempt, second], attempt.promptVersion, "backend"),
    "Pending",
  );
  assert.equal(
    examReadiness(
      round,
      [
        attempt,
        { ...second, reviewerType: "human", reviewer: "Peer reviewer" },
      ],
      attempt.promptVersion,
      "frontend",
    ),
    "Reviewed readiness",
  );
});
test("append-only attempts preserve earlier evidence and reject duplicate IDs or incomplete records", () => {
  const state = {
    version: 1 as const,
    evidenceByItemId: {
      legacy: {
        evidence: { value: "Existing evidence" },
        completedAt: "2026-10-01",
      },
    },
    archivedItems: [],
    germanyExamAttempts: [attempt],
  };
  const next = appendExamAttempt(
    state,
    { ...attempt, id: "attempt-2", prompt: "Frontend form B" },
    round,
    attempt.promptVersion,
  );
  assert.deepEqual(next.evidenceByItemId, state.evidenceByItemId);
  assert.equal(next.germanyExamAttempts?.length, 2);
  assert.equal(state.germanyExamAttempts.length, 1);
  assert.throws(
    () => appendExamAttempt(state, attempt, round, attempt.promptVersion),
    /duplicate/i,
  );
  assert.throws(
    () =>
      appendExamAttempt(
        state,
        { ...attempt, id: "x", evidence: "passed" },
        round,
        attempt.promptVersion,
      ),
    /evidence/i,
  );
});
test("Wednesday replaces coding and speaking and Sunday adds no work", () => {
  const execution = {
    days: [
      {
        date: "2026-10-14",
        blocks: {
          study: "Trace promises",
          project: "Test boundary",
          assessment: "W01 with scoring",
        },
      },
    ],
    weeks: [
      {
        number: 1,
        application: "Check roles",
        oss: { wednesday: "Run tests" },
        german: "Introduce yourself",
      },
    ],
    assessments: [{ id: "W01", date: "2026-10-14", content: "Diagnostic" }],
  } as unknown as GermanyExecution;
  const actual = datedAssignments(execution, "2026-10-14");
  assert.equal(
    actual["16:15-17:15"],
    "W01 with scoring · 16:15–17:45 (includes the speaking block)",
  );
  assert.equal(
    actual["17:15-17:45"],
    "Continue the same assessment and scoring; no separate speaking task.",
  );
  assert.deepEqual(datedAssignments(execution, "2026-10-18"), {});
});

import { mergeExecutionState } from "./career-roadmap.ts";
test("a curriculum reseed preserves exam history and dated/company evidence", () => {
  const state = {
    version: 1 as const,
    evidenceByItemId: {
      "germany:2026:day:2026-10-12:result": {
        evidence: {
          value: "Existing daily explanation and meaningful test result.",
        },
        completedAt: "2026-10-12",
      },
    },
    archivedItems: [],
    germanyExamAttempts: [attempt],
  };
  const next = mergeExecutionState(state, []);
  assert.deepEqual(next.germanyExamAttempts, [attempt]);
  assert.deepEqual(next.evidenceByItemId, state.evidenceByItemId);
});
import {
  recordGermanyCompany,
  type GermanyCompanyRecord,
} from "./germany-execution.ts";
test("actual company stages require exact role evidence and preserve custom records", () => {
  const state = {
    version: 1 as const,
    evidenceByItemId: {},
    archivedItems: [],
  };
  const record: GermanyCompanyRecord = {
    stage: "submitted",
    eligibility: "eligible",
    roleUrl: "https://example.org/jobs/123",
    checkedOn: "2026-10-10",
    confirmation: "Application receipt reference 123",
    note: "Role language, location and required skills checked; authorization support needs recruiter clarification.",
  };
  assert.equal(
    recordGermanyCompany(state, "DE01", record).germanyCompanyRecords?.DE01
      .stage,
    "submitted",
  );
  assert.throws(
    () => recordGermanyCompany(state, "DE01", { ...record, confirmation: "" }),
    /confirmation/i,
  );
  assert.throws(
    () =>
      recordGermanyCompany(state, "DE01", {
        ...record,
        roleUrl: "javascript:alert(1)",
      }),
    /role/i,
  );
});
test("an unscored attempt with a critical failure still needs repair", () => {
  assert.equal(
    scoreExam(round, {
      ...attempt,
      scores: Array(6).fill(null),
      criticalFailures: "Wrong tenant access",
    }).status,
    "repair",
  );
});

test("single-session overtime cannot be hidden by reporting fewer focused minutes", () => {
  assert.equal(
    scoreExam(round, { ...attempt, finishedAt: "2026-10-24T06:00:00Z" }).status,
    "repair",
  );
});
import { annotateGermanySchedule } from "./germany-execution.ts";
test("dated assessment labels replace generic practice without changing the time budget", () => {
  const execution = {
    days: [
      {
        date: "2026-10-14",
        blocks: {
          study: "Trace promises",
          project: "Test boundary",
          assessment: "W01",
        },
      },
    ],
    weeks: [
      {
        number: 1,
        application: "Check roles",
        oss: { wednesday: "Run tests" },
        german: "Introduce yourself",
      },
    ],
    assessments: [],
  } as unknown as GermanyExecution;
  const schedule = {
    "16:15-17:15": { label: "Coding", minutes: 60, work: true },
    "17:15-17:45": { label: "Speaking", minutes: 30, work: true },
  };
  const result = annotateGermanySchedule(execution, "2026-10-14", schedule);
  assert.equal(
    result["16:15-17:15"].label,
    "Interview assessment · continues to 17:45",
  );
  assert.equal(result["17:15-17:45"].minutes, 30);
  assert.equal(schedule["16:15-17:15"].label, "Coding");
});

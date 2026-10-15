import test from "node:test";
import assert from "node:assert/strict";
import {
  executionFixture,
  roadmapFixture,
} from "../../scripts/fixtures/job-plan.mjs";
import {
  annotateGermanySchedule,
  datedAssignments,
  isGermanyExecution,
  type GermanyExecution,
} from "./germany-execution.ts";
import { isGermanyRoadmap, alignCampaignTimetable } from "./germany-roadmap.ts";
import { urgentRoadmapFixture } from "../../scripts/fixtures/urgent-job-plan.mjs";
import { isJobPlan } from "./job-plan.ts";

test("urgent version 2 accepts the approved rotation while retaining strict legacy validation", () => {
  const p = urgentRoadmapFixture();
  assert.equal(isJobPlan(p.execution.jobPlan), true);
  assert.equal(isJobPlan(roadmapFixture().execution.jobPlan), true);
  for (const mutate of [
    (x: typeof p) => {
      x.execution.jobPlan.days[3].assignments[0].range = "08:00-10:00";
    },
    (x: typeof p) => {
      x.execution.jobPlan.days[3].assignments[0].kind = "study";
    },
    (x: typeof p) => {
      x.execution.jobPlan.days[3].assignments[0].brief =
        "[private](2026-10-15-urgent-remote-germany-campaign.md)";
    },
    (x: typeof p) => {
      x.execution.jobPlan.days[0].assignments[0].kind = "applications";
    },
  ]) {
    const invalid = structuredClone(p);
    mutate(invalid);
    assert.equal(isJobPlan(invalid.execution.jobPlan), false);
  }
  const downgraded = structuredClone(p);
  downgraded.execution.jobPlan.version = 1;
  assert.equal(isJobPlan(downgraded.execution.jobPlan), false);
});
const legacy: Record<
  string,
  { label: string; minutes: number; work: boolean; output: string }
> = {
  "08:30-10:00": {
    label: "Study",
    minutes: 90,
    work: true,
    output: "Old assignment",
  },
};

test("approved future assignments replace durations while past dates and source objects remain intact", () => {
  const e = executionFixture() as GermanyExecution;
  const snapshot = JSON.stringify(e);
  const schedule = annotateGermanySchedule(e, "2026-10-15", legacy);
  assert.equal(Object.keys(schedule)[0], "08:00-09:30");
  assert.equal(
    Object.values(schedule).reduce((sum, b) => sum + b.minutes, 0),
    660,
  );
  assert.equal(
    Object.keys(annotateGermanySchedule(e, "2026-10-14", legacy))[0],
    "08:30-10:00",
  );
  assert.match(
    datedAssignments(e, "2026-10-15")["08:00-09:30"],
    /Type narrowing/,
  );
  assert.deepEqual(datedAssignments(e, "2026-10-18"), {});
  assert.equal(JSON.stringify(e), snapshot);
});
test("expanded payload validation rejects malformed or unsafe assignments instead of accepting an unusable plan", () => {
  const p = roadmapFixture();
  assert.equal(isGermanyRoadmap(p), true);
  for (const change of [
    (x: typeof p) => x.execution.jobPlan.days.pop(),
    (x: typeof p) => {
      x.execution.jobPlan.days[0].assignments[0].minutes = 80;
    },
    (x: typeof p) => {
      x.execution.jobPlan.days[0].assignments[1].range = "08:30-11:00";
    },
    (x: typeof p) => {
      x.execution.jobPlan.days[0].assignments[0].brief =
        "[Bad](javascript:alert(1))";
    },
    (x: typeof p) => {
      x.execution.jobPlan.days[0].assignments[0].steps = [];
    },
    (x: typeof p) => {
      x.allocations[0].hours = 50;
    },
  ]) {
    const broken = structuredClone(p);
    change(broken);
    assert.equal(isGermanyRoadmap(broken), false);
  }
  const e = executionFixture();
  delete (e as { jobPlan?: unknown }).jobPlan;
  assert.equal(isGermanyExecution(e), true);
});
test("Wednesday uses a single assessment block and Saturday remains five hours", () => {
  const e = executionFixture() as GermanyExecution;
  const w = annotateGermanySchedule(e, "2026-10-21", legacy);
  assert.equal(w["16:45-18:45"].minutes, 120);
  assert.equal(
    Object.values(w).reduce((s, b) => s + b.minutes, 0),
    660,
  );
  assert.deepEqual(annotateGermanySchedule(e, "2026-10-18", legacy), {});
  assert.equal(
    Object.values(annotateGermanySchedule(e, "2026-10-17", legacy)).reduce(
      (s, b) => s + b.minutes,
      0,
    ),
    300,
  );
});
test("explicit import alignment preserves historical and unrelated timetable data and is owner-only", () => {
  const plan = roadmapFixture();
  const prior = {
    timezone: "Asia/Kolkata",
    custom: "keep",
    days: [
      { date: "2026-10-14", schedule: legacy, notes: "history" },
      { date: "2026-10-15", schedule: legacy, notes: "future" },
    ],
  };
  const result = alignCampaignTimetable(
    "cvamsik99@gmail.com",
    prior,
    plan as never,
  );
  assert.deepEqual(result.days[0], prior.days[0]);
  assert.equal(result.custom, "keep");
  assert.equal(Object.keys(result.days[1].schedule)[0], "08:00-09:30");
  assert.deepEqual(
    alignCampaignTimetable("other@example.com", prior, plan as never),
    prior,
  );
});

test("assignment progress requires its own valid evidence and distinguishes saving from verification", async () => {
  const { jobEvidenceStatus, jobProgress } = await import("./job-plan.ts");
  const assignments = executionFixture().jobPlan.days[3].assignments;
  const saved = {
    evidence: {
      value:
        "The malformed payload is rejected by the runtime schema. Saved the observed check and its limitation.",
    },
    completedAt: "2026-10-15T05:00:00Z",
  };
  assert.equal(jobEvidenceStatus(saved), "saved");
  assert.equal(
    jobEvidenceStatus({ ...saved, verifiedAt: "2026-10-15T05:05:00Z" }),
    "verified",
  );
  assert.equal(
    jobEvidenceStatus({ ...saved, verifiedAt: "bad date" }),
    "saved",
  );
  assert.equal(
    jobEvidenceStatus({
      ...saved,
      evidence: { value: "done" },
      verifiedAt: "2026-10-15T05:05:00Z",
    }),
    "planned",
  );
  assert.deepEqual(
    jobProgress(assignments as never, {
      ["germany:2026:day:2026-10-15:result"]: {
        ...saved,
        verifiedAt: "2026-10-15T05:05:00Z",
      },
    }),
    { total: 8, saved: 0, verified: 0 },
  );
  assert.deepEqual(
    jobProgress(assignments as never, {
      [assignments[0].id]: saved,
      [assignments[1].id]: { ...saved, verifiedAt: "2026-10-15T05:05:00Z" },
    }),
    { total: 8, saved: 1, verified: 1 },
  );
});

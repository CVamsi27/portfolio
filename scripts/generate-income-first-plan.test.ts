import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { generateStudyDayRoadmap } from "./generate-job-plan.mjs";
import { roadmapFixture } from "./fixtures/job-plan.mjs";
import * as generator from "./generate-income-first-plan.ts";
import {
  isJobPlan,
  jobAssignments,
  type JobPlan,
} from "../src/lib/job-plan.ts";
import {
  isGermanyRoadmap,
  alignCampaignTimetable,
  mergeGermanyCareer,
  roadmapForDate,
  type GermanyRoadmap,
} from "../src/lib/germany-roadmap.ts";
import {
  annotateGermanySchedule,
  type GermanyExecution,
} from "../src/lib/germany-execution.ts";
import {
  TIMETABLE_OWNER_EMAIL,
  BALANCED_7AM_SCHEDULE_REVISION,
} from "../src/lib/personal-timetable.ts";

const catalogue = JSON.parse(
  readFileSync(
    new URL("../src/data/career-curriculum.json", import.meta.url),
    "utf8",
  ),
);
const baseline = () =>
  generateStudyDayRoadmap(roadmapFixture(), catalogue, {
    scheduleRevision: BALANCED_7AM_SCHEDULE_REVISION,
  }) as GermanyRoadmap;

test("income-first authoring preserves all earlier assignment IDs and makes full weeks 32 hours", () => {
  assert.equal(typeof generator.generateIncomeFirstPlan, "function");
  const before = baseline(),
    original = JSON.stringify(before);
  const plan = generator.generateIncomeFirstPlan(before);
  assert.ok(isGermanyRoadmap(plan));
  assert.ok(isJobPlan(plan.execution!.jobPlan));
  assert.equal(JSON.stringify(before), original);
  const job = plan.execution!.jobPlan!;
  assert.equal(job.version, 4);
  assert.equal(job.weeklyMinutes, 1920);
  assert.equal(job.endDate, "2027-02-18");
  assert.equal(job.days.length, 100);
  assert.deepEqual(
    job.days.filter((day) => day.date < "2026-11-05"),
    before.execution!.jobPlan!.days.filter((day) => day.date < "2026-11-05"),
  );
  const first = jobAssignments(job, "2026-11-05");
  assert.deepEqual(
    first.map((a) => a.kind),
    ["applications", "network", "project", "coding", "review"],
  );
  assert.equal(
    first.reduce((sum, a) => sum + a.minutes, 0),
    360,
  );
  assert.ok(first.every((a) => a.id.startsWith("income-first:2026-11-05:")));
  assert.equal(
    job.days
      .filter((d) => d.date >= "2026-11-09" && d.date <= "2026-11-14")
      .flatMap((d) => d.assignments)
      .reduce((sum, a) => sum + a.minutes, 0),
    1920,
  );
  assert.equal(
    job.days
      .filter((d) => d.date >= "2026-11-05" && d.date <= "2026-11-07")
      .flatMap((d) => d.assignments)
      .reduce((sum, a) => sum + a.minutes, 0),
    840,
  );
  assert.equal(
    jobAssignments(job, "2026-12-01").reduce((sum, a) => sum + a.minutes, 0),
    360,
  );
  assert.deepEqual(generator.generateIncomeFirstPlan(plan), plan);
});

test("income plan validation rejects overload, altered identities and unsafe links", () => {
  const plan = generator.generateIncomeFirstPlan(baseline());
  for (const change of [
    (job: JobPlan) => {
      job.weeklyMinutes = 3600;
    },
    (job: JobPlan) => {
      jobAssignments(job, "2026-11-05")[0].minutes = 121;
    },
    (job: JobPlan) => {
      jobAssignments(job, "2026-11-07")[0].range = "09:00-14:00";
    },
    (job: JobPlan) => {
      jobAssignments(job, "2026-11-05")[0].id = "fullstack:fake";
    },
    (job: JobPlan) => {
      jobAssignments(job, "2026-11-05")[0].brief = "[go](javascript:alert(1))";
    },
    (job: JobPlan) => {
      jobAssignments(job, "2026-11-04")[0].id = "income-first:past";
    },
  ]) {
    const broken = structuredClone(plan.execution!.jobPlan!);
    change(broken);
    assert.equal(isJobPlan(broken), false);
  }
});

test("aligned timetable keeps historical records, Sunday off and current capacity after November", () => {
  const plan = generator.generateIncomeFirstPlan(baseline());
  const previous = {
    days: [
      {
        date: "2026-11-04",
        schedule: { historic: "keep" },
        notes: "keep evidence",
      },
      {
        date: "2026-11-05",
        schedule: { previous: "retained in history" },
        notes: "retained",
      },
    ],
  };
  const aligned = alignCampaignTimetable(TIMETABLE_OWNER_EMAIL, previous, plan);
  assert.deepEqual(
    aligned.days.find((d) => d.date === "2026-11-04"),
    previous.days[0],
  );
  assert.deepEqual(
    (aligned as unknown as { scheduleBudgetMinutes: unknown })
      .scheduleBudgetMinutes,
    { weekday: 360, saturday: 120, sunday: 0, week: 1920 },
  );
  assert.equal(
    aligned.days.find((d) => d.date === "2026-11-05")!.notes,
    "retained",
  );
  assert.deepEqual(
    annotateGermanySchedule(plan.execution as GermanyExecution, "2026-11-08", {
      old: "ignore",
    }),
    {},
  );
  assert.deepEqual(
    alignCampaignTimetable(TIMETABLE_OWNER_EMAIL, aligned, plan),
    aligned,
  );
  const old = baseline();
  const merged = mergeGermanyCareer(
    {
      germanyRoadmap: old,
      custom: "keep",
      weeklyTargets: { custom: 1 },
      evidence: { "old-id": "unchanged" },
    },
    plan,
  );
  assert.equal(
    roadmapForDate(merged, "2026-11-04")!.sourceDigest,
    old.sourceDigest,
  );
  assert.equal(
    roadmapForDate(merged, "2026-11-05")!.sourceDigest,
    plan.sourceDigest,
  );
  assert.deepEqual(merged.evidence, { "old-id": "unchanged" });
  assert.deepEqual(mergeGermanyCareer(merged, plan), merged);
});

test("the authoring CLI rejects public output paths before reading private content", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "scripts/generate-income-first-plan.ts",
      "--input=README.md",
      "--output=src/data/personal-plan.json",
    ],
    { cwd: new URL("..", import.meta.url), encoding: "utf8" },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /canonical private workspace/i);
});

test("the income campaign makes German optional without completing its old checklist", () => {
  const plan = generator.generateIncomeFirstPlan(baseline());
  const merged = mergeGermanyCareer(
    {
      germanyChecklist: [
        {
          id: "germany-language",
          text: "Previous language commitment",
          done: false,
        },
      ],
      weeklyTargets: {},
    },
    plan,
  );
  const items = merged.germanyChecklist as Array<{
    text: string;
    done: boolean;
  }>;
  assert.match(items[0].text, /optional/i);
  assert.equal(items[0].done, false);
  assert.equal(
    (merged.weeklyTargets as Record<string, number>).germanPracticeMinutes,
    0,
  );
  assert.equal((merged.weeklyTargets as Record<string, number>).ossHours, 0);
});

test("income metadata rejects duplicate allocation labels before a merge can fail", () => {
  const plan = generator.generateIncomeFirstPlan(baseline());
  plan.allocations[0].label = plan.allocations[1].label;
  assert.equal(isGermanyRoadmap(plan), false);
});

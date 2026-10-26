import test from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import * as generator from "./generate-job-plan.mjs";
import { roadmapFixture } from "./fixtures/job-plan.mjs";
import { isJobPlan } from "../src/lib/job-plan.ts";
import {
  isGermanyRoadmap,
  mergeGermanyCareer,
  alignCampaignTimetable,
} from "../src/lib/germany-roadmap.ts";
import { TIMETABLE_OWNER_EMAIL } from "../src/lib/personal-timetable.ts";
import { annotateGermanySchedule } from "../src/lib/germany-execution.ts";

const catalogue = JSON.parse(
  readFileSync(
    new URL("../src/data/career-curriculum.json", import.meta.url),
    "utf8",
  ),
);
const generate = () => {
  assert.equal(
    typeof generator.generateStudyDayRoadmap,
    "function",
    "existing generator supports the reviewed 100-study-day revision",
  );
  return generator.generateStudyDayRoadmap(roadmapFixture(), catalogue);
};
test("new revision has 100 Monday–Saturday study days, exact capacities and prerequisite order", () => {
  const plan = generate();
  assert.ok(isGermanyRoadmap(plan));
  assert.ok(isJobPlan(plan.execution.jobPlan));
  const days = plan.execution.jobPlan.days;
  assert.equal(days.length, 100);
  assert.equal(days[0].date, "2026-10-26");
  assert.equal(days.at(-1).date, "2027-02-18");
  const known = new Set();
  for (const day of days) {
    const weekday = new Date(day.date + "T12:00:00Z").getUTCDay();
    assert.notEqual(weekday, 0);
    assert.equal(
      day.assignments.reduce((n, a) => n + a.minutes, 0),
      weekday === 6 ? 300 : 660,
    );
    for (const a of day.assignments) {
      for (const id of a.prerequisiteAssignmentIds)
        assert.ok(known.has(id), `orphan/out-of-order ${id}`);
      assert.ok(
        a.chapterIds.every((id) => plan.catalogueChapterIds.includes(id)),
      );
      assert.equal(known.has(a.id), false);
      known.add(a.id);
    }
  }
  assert.deepEqual(
    plan.allocations.map((a) => a.hours),
    [16, 7, 12, 10, 4, 3, 5, 3],
  );
  assert.equal(plan.weeks.length, 17);
  assert.match(
    days[0].assignments.find((a) => a.kind === "study").brief,
    /execution-context.*scope.*closures/s,
  );
  assert.match(
    days[5].assignments.find((a) => a.kind === "study").brief,
    /REVISION.md/,
  );
  assert.equal(plan.execution.jobPlan.version, 3);
});
test("validator rejects forward Sunday work, overload, dangling chapters and prerequisite cycles", () => {
  const valid = generate();
  for (const mutate of [
    (p) => {
      p.days[0].date = "2026-11-01";
    },
    (p) => {
      p.days[0].assignments[0].minutes++;
    },
    (p) => {
      p.days[0].assignments[0].prerequisiteAssignmentIds = ["missing"];
    },
    (p) => {
      p.days[0].assignments[0].chapterIds = ["removed.md"];
    },
    (p) => {
      p.days[0].assignments[0].skillIds = ["orphan-skill"];
    },
    (p) => {
      p.days[0].assignments[0].relatedRoleIds = ["orphan-role"];
    },
    (p) => {
      p.days[0].assignments[0].relatedClaimIds = ["orphan-claim"];
    },
    (p) => {
      p.days[0].assignments[0].prerequisiteAssignmentIds = [
        p.days[0].assignments[0].id,
      ];
    },
  ]) {
    const p = structuredClone(valid.execution.jobPlan);
    mutate(p);
    assert.equal(isJobPlan(p), false);
  }
});
test("owner migration preserves history, evidence and arbitrary fields, extends dates and is a no-op on repeat", () => {
  const plan = generate();
  const previous = {
    germanyRoadmap: roadmapFixture(),
    custom: true,
    evidence: { "old-id": "keep" },
    weeklyTargets: { custom: 3 },
  };
  const merged = mergeGermanyCareer(previous, plan);
  assert.deepEqual(merged.evidence, previous.evidence);
  assert.equal(merged.custom, true);
  assert.deepEqual(merged.roadmapHistory[0], previous.germanyRoadmap);
  assert.deepEqual(mergeGermanyCareer(merged, plan), merged);
  const timetable = {
    reminder: { enabled: false },
    days: [
      {
        date: "2026-10-24",
        schedule: { custom: "past" },
        chapters: [{ id: "old" }],
        completed: true,
      },
      {
        date: "2026-10-26",
        schedule: { custom: "old future" },
        chapters: [{ id: "retained" }],
        evidence: "unchanged",
      },
    ],
  };
  const aligned = alignCampaignTimetable(
    TIMETABLE_OWNER_EMAIL,
    timetable,
    plan,
  );
  assert.deepEqual(aligned.days[0], timetable.days[0]);
  assert.equal(aligned.days[1].evidence, "unchanged");
  assert.deepEqual(aligned.days[1].chapters, timetable.days[1].chapters);
  assert.deepEqual(aligned.scheduleHistory[0].days[1], timetable.days[1]);
  assert.equal(aligned.days.at(-1).date, "2027-02-18");
  assert.equal(
    aligned.days.find((d) => d.date === "2026-11-01").schedule &&
      Object.keys(aligned.days.find((d) => d.date === "2026-11-01").schedule)
        .length,
    0,
  );
  assert.deepEqual(
    alignCampaignTimetable(TIMETABLE_OWNER_EMAIL, aligned, plan),
    aligned,
  );
  assert.equal(
    alignCampaignTimetable("other@example.test", timetable, plan),
    timetable,
  );
  assert.deepEqual(
    annotateGermanySchedule(plan.execution, "2027-02-14", { old: "work" }),
    {},
  );
});

test("past date resolves its retained roadmap, future revision never relabels old assignments", async () => {
  const { roadmapForDate } = await import("../src/lib/germany-roadmap.ts");
  assert.equal(typeof roadmapForDate, "function");
  const old = roadmapFixture(),
    active = generate();
  const career = { germanyRoadmap: active, roadmapHistory: [old] };
  assert.equal(roadmapForDate(career, "2026-10-16"), old);
  assert.equal(roadmapForDate(career, "2026-10-26"), active);
});

test("new full-stack role IDs record their actual stage without touching historical DE application records", async () => {
  const { recordGermanyCompany } = await import(
    "../src/lib/germany-execution.ts"
  );
  const state = {
    version: 1,
    evidenceByItemId: {},
    archivedItems: [],
    germanyCompanyRecords: {
      DE01: { stage: "submitted", confirmation: "original receipt" },
    },
  };
  const record = {
    stage: "research",
    eligibility: "unknown",
    roleUrl: "https://example.test/jobs/1",
    checkedOn: "2026-10-25",
    confirmation: "",
    note: "Review the exact full-stack responsibilities and confirm India engagement and working hours before preparing the packet.",
  };
  const next = recordGermanyCompany(state, "particle41-fullstack", record);
  assert.deepEqual(
    next.germanyCompanyRecords.DE01,
    state.germanyCompanyRecords.DE01,
  );
  assert.deepEqual(next.germanyCompanyRecords["particle41-fullstack"], record);
});

test("private assignment map covers each named skill without promoting scheduled evidence", () => {
  const plan = generate();
  const matrix = {
    skills: plan.execution.jobPlan.knownSkillIds.map((skillId) => ({
      skillId,
      label: skillId,
      chapterIds: [],
      claimIds: [],
      prerequisiteSkillIds: [],
      roleRequirementIds: [],
      readinessState: "unassessed",
      evidenceState: "unverified",
    })),
    roles: plan.execution.jobPlan.knownRoleIds.map((roleId) => ({ roleId })),
  };
  assert.equal(typeof generator.mapStudyAssignments, "function");
  const result = generator.mapStudyAssignments(plan, matrix);
  assert.equal(result.skills.length, 14);
  assert.ok(
    result.skills.every(
      (skill) =>
        skill.assignmentIds.length > 0 && skill.readinessState === "unassessed",
    ),
  );
  assert.throws(
    () =>
      generator.mapStudyAssignments(plan, {
        ...matrix,
        skills: [...matrix.skills, { skillId: "unmapped", chapterIds: [] }],
      }),
    /unscheduled|unknown/i,
  );
});

test("reviewed campaign presentation replaces obsolete active targeting while retaining exact prior data", () => {
  const plan = generate();
  plan.campaignPresentation = {
    reviewedOn: "2026-10-25",
    profile: {
      headline: "Full-stack engineer — remote India/global",
      currentRole: "Independent healthcare SaaS venture",
    },
    roleResearchNote:
      "Source check: 2026-10-25. Full-stack remote only. No verified EU/Germany relocation opening; lower pay remains reviewable.",
    targetRoles: {
      germany: [],
      remoteEU: [],
      remoteIndia: [
        {
          id: "particle41-fullstack",
          company: "Synthetic employer",
          role: "Full Stack Engineer",
          link: "https://example.test/jobs/1",
          status: "research ready",
          notes:
            "Remote India explicitly permitted. Pay, hours and engagement need clarification.",
          sourceChecked: "2026-10-25",
          fitScore: null,
        },
      ],
      remote: [],
    },
    outreachTemplates: {
      germanySaaS:
        "Draft only: does the full-stack remote vacancy support relocation?",
      remote: "Draft only: is the full-stack role available from India?",
      ossMaintainer: "Draft only: clarify the actual contribution scope.",
    },
  };
  const previous = {
    profile: {
      headline: "Old backend focus",
      currentRole: "Old role",
      custom: "preserve",
    },
    targetRoles: {
      germany: [{ company: "Old broad lead", status: "submitted" }],
    },
    outreachTemplates: { remote: "Old draft" },
    customProgress: { done: 3 },
  };
  assert.ok(isGermanyRoadmap(plan));
  const merged = mergeGermanyCareer(previous, plan);
  assert.equal(
    merged.profile.headline,
    plan.campaignPresentation.profile.headline,
  );
  assert.equal(merged.profile.custom, "preserve");
  assert.deepEqual(merged.targetRoles, plan.campaignPresentation.targetRoles);
  assert.deepEqual(
    merged.campaignPresentationHistory[0].targetRoles,
    previous.targetRoles,
  );
  assert.deepEqual(merged.customProgress, previous.customProgress);
  assert.deepEqual(mergeGermanyCareer(merged, plan), merged);
  const unsafe = structuredClone(plan);
  unsafe.campaignPresentation.targetRoles.remoteIndia[0].link =
    "javascript:alert(1)";
  assert.equal(isGermanyRoadmap(unsafe), false);
});

test("daily technical workstreams have concrete distinct cases and acceptance outputs", () => {
  const plan = generate();
  const day = plan.execution.jobPlan.days[0];
  const work = ["study", "project", "coding", "speaking"].map((kind) =>
    day.assignments.find((a) => a.kind === kind),
  );
  assert.equal(new Set(work.map((a) => a.outcome)).size, 4);
  assert.deepEqual(
    day.assignments.find((a) => a.kind === "german").skillIds,
    [],
  );
  assert.equal(new Set(work.map((a) => a.deliverable)).size, 4);
  assert.match(work[1].brief, /two counters|captured cell/);
  assert.match(work[2].brief, /makeCounter/);
  assert.match(work[3].brief, /three-minute/);
  assert.equal(
    new Set(plan.execution.days.slice(0, 6).map((day) => day.title)).size,
    6,
  );
});

test("canonical references follow the specific mechanism rather than a coincidental filename word", () => {
  const plan = generate();
  const study = (date) =>
    plan.execution.jobPlan.days
      .find((d) => d.date === date)
      .assignments.find((a) => a.kind === "study").chapterIds;
  assert.match(study("2026-11-02")[0], /usestate\.md$/);
  assert.match(study("2026-11-30")[0], /webhooks\.md$/);
  assert.match(study("2026-12-14")[0], /github-actions\.md$/);
  assert.match(study("2026-12-28")[0], /10\.4-next\.js\//);
  assert.match(study("2027-02-18")[0], /80\.33-weekly-study-tracker\.md$/);
});

test("AI practice links the safety and evaluation mechanisms its saved evidence requires", () => {
  const plan = generate();
  for (const [date, expected] of [
    [
      "2027-02-04",
      "20-backend/20.12-ai-engineering/20.12.06-safety-cost-governance.md",
    ],
    [
      "2027-02-05",
      "20-backend/20.12-ai-engineering/20.12.02-prompts-context-evals.md",
    ],
    [
      "2027-02-06",
      "20-backend/20.12-ai-engineering/20.12.01-llm-app-architecture.md",
    ],
  ]) {
    const study = plan.execution.jobPlan.days
      .find((day) => day.date === date)
      .assignments.find((assignment) => assignment.kind === "study");
    assert.deepEqual(
      study.chapterIds,
      [expected],
      `${date}: the AI task needs its actual canonical mechanism`,
    );
    assert.ok(study.brief.includes(`https://study.buildora.work/${expected}`));
  }
});

test("forward execution never manufactures historical Saturday work when no retained plan is supplied", async () => {
  const { datedAssignments } = await import("../src/lib/germany-execution.ts");
  const plan = generate();
  assert.deepEqual(datedAssignments(plan.execution, "2026-10-24"), {});
  assert.deepEqual(datedAssignments(plan.execution, "2027-02-20"), {});
});

test("forward authoring and owner preview reject a public path merely named like the private workspace", () => {
  const temp = mkdtempSync(join(tmpdir(), "forward-private-boundary-"));
  const fake = join(temp, "repos/personal/reports");
  mkdirSync(fake, { recursive: true });
  const baseline = join(fake, "base.json"),
    payload = join(fake, "payload.json"),
    calendar = join(fake, "calendar.md");
  writeFileSync(baseline, JSON.stringify(roadmapFixture()));
  try {
    const result = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        resolve("scripts/generate-job-plan.mjs"),
        "--study-days",
        baseline,
        resolve("src/data/career-curriculum.json"),
        payload,
        calendar,
      ],
      { encoding: "utf8" },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /canonical private workspace/i);
    assert.equal(existsSync(payload), false);
    writeFileSync(payload, JSON.stringify(generate()));
    const preview = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        resolve("scripts/sync-germany-roadmap.ts"),
        "--payload=" + payload,
      ],
      {
        encoding: "utf8",
        env: { ...process.env, SUPABASE_URL: "", SUPABASE_SECRET_KEY: "" },
      },
    );
    assert.notEqual(preview.status, 0);
    assert.match(preview.stderr, /canonical private workspace/i);
    const orientation = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        resolve("scripts/sync-career-plan.ts"),
        "--payload=" + payload,
      ],
      {
        encoding: "utf8",
        env: { ...process.env, SUPABASE_URL: "", SUPABASE_SECRET_KEY: "" },
      },
    );
    assert.notEqual(orientation.status, 0);
    assert.match(orientation.stderr, /canonical private workspace/i);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

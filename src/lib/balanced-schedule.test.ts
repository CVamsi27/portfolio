import assert from "node:assert/strict";
import test from "node:test";
import * as timetable from "./personal-timetable.ts";
import {
  isJobPlan,
  studyDates,
  studyDaySlots,
  studyAssignmentId,
  type JobPlan,
} from "./job-plan.ts";
import {
  alignCampaignTimetable,
  mergeGermanyCareer,
  roadmapForDate,
  isGermanyRoadmap,
  type GermanyRoadmap,
} from "./germany-roadmap.ts";
import { DEFAULT_REMINDERS, REMINDER_LABELS } from "./reminders.ts";
import { generateStudyDayRoadmap } from "../../scripts/generate-job-plan.mjs";
import { roadmapFixture } from "../../scripts/fixtures/job-plan.mjs";
import { readFileSync } from "node:fs";
import {
  careerTelegramMayBeDue,
  dueCareerNotifications,
  DEFAULT_CAREER_TELEGRAM_PREFERENCES,
} from "./career-telegram.ts";

const revision = {
  version: 1,
  effectiveOn: "2026-10-30",
  profile: "balanced-7am",
} as const;
const revisedSlots = (date: string): Array<[string, string]> => {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (day === 0) return [];
  if (day === 6)
    return [
      ["09:00-10:00", "funnel"],
      ["10:00-12:00", "mock"],
      ["12:00-14:00", "oss"],
      ["15:00-17:00", "study"],
      ["17:00-18:30", "review"],
      ["18:30-20:00", "planning"],
    ];
  return [
    ["09:00-10:30", "study"],
    ["10:30-11:30", "applications"],
    ["11:30-13:30", "project"],
    ["13:30-14:00", "network"],
    ["15:00-15:30", "network"],
    ["15:30-16:30", day === 2 || day === 4 ? "network" : "oss"],
    ...((day === 3
      ? [["16:30-18:30", "assessment"]]
      : [
          ["16:30-18:00", "coding"],
          ["18:00-18:30", "speaking"],
        ]) as Array<[string, string]>),
    ["18:30-19:30", "german"],
    ["19:30-20:00", "review"],
  ];
};
const minutes = (range: string) => {
  const [a, b] = range
    .split("-")
    .map((time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3)));
  return b - a;
};
function legacyPlan(): JobPlan {
  return {
    version: 3,
    effectiveOn: "2026-10-26",
    endDate: "2027-02-18",
    studyDayCount: 100,
    timezone: "Asia/Kolkata",
    weeklyMinutes: 3600,
    sourceDigest: "a".repeat(64),
    provenance: "Synthetic schedule",
    catalogueChapterIds: ["systems"],
    knownSkillIds: ["systems"],
    knownRoleIds: [],
    knownClaimIds: [],
    days: studyDates().map((date) => ({
      date,
      assignments: studyDaySlots(date).map(([range, kind]) => ({
        id: studyAssignmentId(date, kind, range),
        date,
        range,
        minutes: minutes(range),
        kind,
        title: "Trace one boundary",
        outcome: "Explain the observed result",
        brief: "Predict a changed input before running the trace",
        steps: [
          "Retain the original prediction",
          "Run the changed input and record the result",
        ],
        deliverable: "A reproducible trace and one correction",
        doneCheck: "Evidence supports the result",
        dependency: "Recall the prerequisite",
        blocked: "Narrow the missing prerequisite",
        chapterIds: ["systems"],
        prerequisiteAssignmentIds: [],
        skillIds: ["systems"],
        relatedRoleIds: [],
        relatedClaimIds: [],
        provenance: "Synthetic schedule",
      })),
    })),
  };
}
function revisedPlan(): JobPlan {
  const plan = legacyPlan();
  Object.assign(plan, { scheduleRevision: revision });
  for (const day of plan.days) {
    if (day.date < revision.effectiveOn) continue;
    const slots = revisedSlots(day.date);
    day.assignments.forEach((assignment, index) => {
      assignment.range = slots[index][0];
      assignment.minutes = minutes(assignment.range);
    });
  }
  return plan;
}
const at = (date: string, time: string) =>
  Date.parse(`${date}T${time}:00+05:30`);
const preferences = {
  version: 1,
  enabled: true,
  cadence: "digest-and-learning",
  digestTime: "07:00",
  timezone: "Asia/Kolkata",
  catchUpMinutes: 10,
  enabledAt: "2026-10-29T00:00:00Z",
} as const;

test("versioned slots protect the new study and lunch windows without changing legacy dates", () => {
  assert.equal(studyDaySlots("2026-10-29", revision)[0][0], "06:30-07:00");
  assert.equal(studyDaySlots("2026-11-02")[0][0], "06:30-07:00");
  for (const date of studyDates("2026-11-02", 6)) {
    const slots = studyDaySlots(date, revision);
    assert.deepEqual(slots, revisedSlots(date));
    assert.equal(
      slots.reduce((sum, [range]) => sum + minutes(range), 0),
      600,
    );
    for (const [range] of slots) {
      const [start, end] = range.split("-");
      assert.ok(
        (start >= "09:00" && end <= "14:00") ||
          (start >= "15:00" && end <= "20:00"),
      );
    }
  }
  assert.deepEqual(studyDaySlots("2026-11-01", revision), []);
});

test("the revised plan validates with the 919 legacy identities and rejects clock-derived replacement IDs", () => {
  assert.equal(isJobPlan(legacyPlan()), true);
  const plan = revisedPlan();
  assert.equal(isJobPlan(plan), true);
  assert.equal(plan.days.flatMap((day) => day.assignments).length, 919);
  const changed = plan.days.find((day) => day.date === "2026-10-30")!
    .assignments[0];
  assert.equal(
    changed.id,
    "fullstack:2026-10-26:day:2026-10-30:assignment:study:0630",
  );
  changed.id = studyAssignmentId(changed.date, changed.kind, changed.range);
  assert.equal(isJobPlan(plan), false);
  for (const invalid of [
    { ...revision, effectiveOn: "2026-10-29" },
    { ...revision, profile: "unknown" },
    { ...revision, version: 2 },
  ]) {
    const malformed = revisedPlan();
    Object.assign(malformed, { scheduleRevision: invalid });
    assert.equal(isJobPlan(malformed), false);
  }
});

test("owner fallback exposes the new routine and keeps Sunday study free", () => {
  const api = timetable as typeof timetable & {
    isNewPersonalRoutine?: (date: string) => boolean;
    personalDayFrame?: (date: string) => Array<{
      id: string;
      startLocal: string;
      durationMinutes: number;
      label: string;
      kind: string;
    }>;
  };
  assert.equal(typeof api.personalDayFrame, "function");
  assert.equal(api.isNewPersonalRoutine!("2026-10-29"), false);
  assert.equal(api.isNewPersonalRoutine!("2026-02-30"), false);
  const frame = api.personalDayFrame!("2026-10-30");
  assert.deepEqual(
    frame.map(({ startLocal, durationMinutes, kind }) => [
      startLocal,
      durationMinutes,
      kind,
    ]),
    [
      ["07:00", 30, "event"],
      ["07:30", 60, "exercise"],
      ["08:30", 30, "event"],
      ["09:00", 300, "study"],
      ["14:00", 60, "event"],
      ["15:00", 300, "study"],
    ],
  );
  assert.equal(
    api.personalDayFrame!("2026-11-01").some((block) => block.kind === "study"),
    false,
  );
  const fallback = timetable.personalSchedule(
    timetable.TIMETABLE_OWNER_EMAIL,
    "2026-10-30",
  )!;
  assert.equal(
    Object.values(fallback).reduce(
      (sum, block) => sum + (block.work ? block.minutes : 0),
      0,
    ),
    600,
  );
  assert.deepEqual(
    Object.keys(fallback),
    revisedSlots("2026-10-30").map(([range]) => range),
  );
});

test("alignment retains every pre-revision day and arbitrary progress while recording a repeat-safe schedule history", () => {
  const jobPlan = revisedPlan();
  const plan = {
    version: 2,
    startDate: "2026-10-26",
    endDate: "2027-02-18",
    reviewedOn: "2026-10-29",
    sourceDigest: "b".repeat(64),
    execution: { jobPlan },
  } as GermanyRoadmap;
  const priorDays = studyDates().map((date) => ({
    date,
    schedule: { old: date },
    done: true,
    notes: "retain",
    checklist: [{ id: "proof", done: true }],
  }));
  const previous = {
    days: priorDays,
    scheduleRevision: "legacy",
    scheduleHistory: [{ retained: true }],
    custom: "retain",
  };
  const before = JSON.stringify(previous);
  const aligned = alignCampaignTimetable(
    timetable.TIMETABLE_OWNER_EMAIL,
    previous,
    plan,
  ) as typeof previous & {
    scheduleEffectiveOn: string;
    scheduleProfile: string;
    scheduleBudgetMinutes: { weekday: number; saturday: number; week: number };
  };
  for (const day of priorDays.filter((day) => day.date < "2026-10-30"))
    assert.equal(
      aligned.days.find((next) => next.date === day.date),
      day,
    );
  assert.equal(
    aligned.days.find((day) => day.date === "2026-10-30")!.checklist,
    priorDays[4].checklist,
  );
  assert.equal(aligned.scheduleEffectiveOn, "2026-10-30");
  assert.equal(aligned.scheduleProfile, "balanced-7am");
  assert.deepEqual(aligned.scheduleBudgetMinutes, {
    weekday: 600,
    saturday: 600,
    sunday: 0,
    week: 3600,
  });
  assert.equal(aligned.scheduleHistory.length, 2);
  assert.equal(aligned.custom, "retain");
  assert.equal(JSON.stringify(previous), before);
  assert.deepEqual(
    alignCampaignTimetable(timetable.TIMETABLE_OWNER_EMAIL, aligned, plan),
    aligned,
  );
});

test("revised career reminders follow actual starts, skip old starts and preserve the assignment delivery identity", () => {
  const plan = revisedPlan();
  assert.equal(DEFAULT_CAREER_TELEGRAM_PREFERENCES.digestTime, "07:00");
  const date = "2026-10-30";
  assert.equal(careerTelegramMayBeDue(preferences, at(date, "09:00")), true);
  const study = dueCareerNotifications(
    plan,
    {},
    preferences,
    at(date, "09:00"),
  ).find((notice) => notice.kind === "career-study")!;
  assert.ok(study);
  assert.equal(
    study.assignmentId,
    "fullstack:2026-10-26:day:2026-10-30:assignment:study:0630",
  );
  assert.equal(study.id, `career:career-study:${date}:${study.assignmentId}`);
  assert.equal(study.scheduledAt, at(date, "09:00"));
  assert.equal(
    dueCareerNotifications(plan, {}, preferences, at(date, "09:10")).filter(
      (notice) => notice.kind === "career-study",
    ).length,
    1,
  );
  assert.deepEqual(
    dueCareerNotifications(plan, {}, preferences, at(date, "09:10") + 1),
    [],
  );
  for (const time of ["06:30", "20:30", "21:30"])
    assert.deepEqual(
      dueCareerNotifications(plan, {}, preferences, at(date, time)),
      [],
    );
  const saturday = dueCareerNotifications(
    plan,
    {},
    preferences,
    at("2026-10-31", "15:00"),
  );
  assert.equal(
    careerTelegramMayBeDue(preferences, at("2026-10-31", "15:00")),
    true,
  );
  assert.equal(
    saturday[0].assignmentId,
    "fullstack:2026-10-26:day:2026-10-31:assignment:study:1415",
  );
  assert.deepEqual(
    dueCareerNotifications(plan, {}, preferences, at("2026-10-31", "14:15")),
    [],
  );
  assert.deepEqual(
    dueCareerNotifications(plan, {}, preferences, at("2026-11-01", "09:00")),
    [],
  );
  const saved = {
    evidenceByItemId: {
      [study.assignmentId!]: {
        completedAt: "2026-10-30T03:20:00Z",
        verifiedAt: "2026-10-30T03:25:00Z",
        evidence: {
          value:
            "Retained observed evidence supports the original assignment identity.",
        },
      },
    },
  };
  assert.equal(
    dueCareerNotifications(plan, saved, preferences, at(date, "09:00")).some(
      (notice) => notice.kind === "career-study",
    ),
    false,
  );
});

test("a same-program schedule revision retains the roadmap that governed earlier dates", () => {
  const catalogue = JSON.parse(
    readFileSync(
      new URL("../data/career-curriculum.json", import.meta.url),
      "utf8",
    ),
  );
  const old = generateStudyDayRoadmap(
    roadmapFixture(),
    catalogue,
  ) as GermanyRoadmap;
  old.execution!.jobPlan = legacyPlan();
  old.catalogueChapterIds = ["systems"];
  old.sourceDigest = "c".repeat(64);
  old.campaignPresentation = undefined;
  old.execution!.assessments = [];
  assert.equal(isGermanyRoadmap(old), true);
  const active = structuredClone(old);
  active.execution!.jobPlan = revisedPlan();
  active.sourceDigest = "d".repeat(64);
  assert.equal(isGermanyRoadmap(active), true);
  assert.equal(
    roadmapForDate(
      { germanyRoadmap: active, roadmapHistory: [old] },
      "2026-10-29",
    ) === old,
    true,
  );
  assert.equal(
    roadmapForDate(
      { germanyRoadmap: active, roadmapHistory: [old] },
      "2026-10-30",
    ) === active,
    true,
  );
  const merged = mergeGermanyCareer({}, active) as {
    daySchedule: { effectiveOn: string; blocks: Array<{ time: string }> };
  };
  assert.equal(merged.daySchedule.effectiveOn, "2026-10-30");
  assert.equal(merged.daySchedule.blocks[0].time, "09:00-10:30");
});

test("new in-app preferences place study and review inside the revised day", () => {
  assert.equal(DEFAULT_REMINDERS.career.study.time, "09:00");
  assert.equal(DEFAULT_REMINDERS.career.roleResearch.time, "10:30");
  assert.equal(DEFAULT_REMINDERS.career.interview.time, "16:30");
  assert.equal(DEFAULT_REMINDERS.career.eveningReview.time, "19:30");
  assert.doesNotMatch(REMINDER_LABELS.morning, /Exercise/);
});

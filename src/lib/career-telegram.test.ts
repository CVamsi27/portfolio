import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_CAREER_TELEGRAM_PREFERENCES,
  careerTelegramMayBeDue,
  dueCareerNotifications,
  validCareerTelegramPreferences,
  type CareerTelegramPreferences,
} from "./career-telegram.ts";
import {
  isJobPlan,
  studyAssignmentId,
  studyDates,
  studyDaySlots,
  type JobPlan,
} from "./job-plan.ts";
import { routineOccurrences } from "./routine-reminders.ts";
import { jobPlanFixture } from "../../scripts/fixtures/job-plan.mjs";

// Synthetic technical plan only; no owner, destination or candidate material.
function planFixture(): JobPlan {
  return {
    version: 3,
    effectiveOn: "2026-10-26",
    endDate: "2027-02-18",
    studyDayCount: 100,
    timezone: "Asia/Kolkata",
    weeklyMinutes: 3600,
    sourceDigest: "a".repeat(64),
    provenance: "Synthetic test plan",
    catalogueChapterIds: ["systems"],
    knownSkillIds: ["observability"],
    knownRoleIds: [],
    knownClaimIds: [],
    days: studyDates().map((date) => ({
      date,
      assignments: studyDaySlots(date).map(([range, kind]) => ({
        id: studyAssignmentId(date, kind, range),
        date,
        range,
        minutes:
          Number(range.slice(6, 8)) * 60 +
          Number(range.slice(9)) -
          Number(range.slice(0, 2)) * 60 -
          Number(range.slice(3, 5)),
        kind,
        title:
          kind === "study" ? "Trace a slow request" : "Build a bounded queue",
        outcome: "Explain the latency budget with measured evidence",
        brief: "Inspect the request path before changing the implementation",
        steps: ["Capture a trace", "Compare the result with the budget"],
        deliverable: "A trace with timings and a reproducible benchmark",
        doneCheck: "The benchmark and trace support the decision",
        dependency: "Read the request-path notes",
        blocked: "If the worker stops, retain the job and record the retry",
        chapterIds: ["systems"],
        prerequisiteAssignmentIds: [],
        skillIds: ["observability"],
        relatedRoleIds: [],
        relatedClaimIds: [],
        provenance: "Synthetic test assignment",
      })),
    })),
  };
}
const preferences = (
  overrides: Partial<CareerTelegramPreferences> = {},
): CareerTelegramPreferences => ({
  version: 1,
  enabled: true,
  cadence: "digest-and-learning",
  digestTime: "06:00",
  timezone: "Asia/Kolkata",
  catchUpMinutes: 10,
  enabledAt: "2026-10-25T00:00:00.000Z",
  ...overrides,
});
const instant = (time: string) => Date.parse(`2026-10-26T${time}:00+05:30`);
const notifications = (time: string, prefs = preferences()) =>
  dueCareerNotifications(planFixture(), {}, prefs, instant(time));

test("disabled defaults cannot produce recurring messages", () => {
  assert.equal(
    validCareerTelegramPreferences(DEFAULT_CAREER_TELEGRAM_PREFERENCES),
    true,
  );
  assert.equal(DEFAULT_CAREER_TELEGRAM_PREFERENCES.enabled, false);
  assert.deepEqual(
    notifications("06:00", DEFAULT_CAREER_TELEGRAM_PREFERENCES),
    [],
  );
});

test("only explicit bounded preferences with an activation timestamp can enable delivery", () => {
  assert.equal(validCareerTelegramPreferences(preferences()), true);
  assert.equal(
    validCareerTelegramPreferences(
      preferences({ digestTime: "23:59", catchUpMinutes: 1 }),
    ),
    true,
  );
  for (const invalid of [
    undefined,
    null,
    {},
    { ...preferences(), version: 2 },
    { ...preferences(), enabled: "true" },
    { ...preferences(), cadence: "every-hour" },
    { ...preferences(), timezone: "UTC" },
    { ...preferences(), digestTime: "6:00" },
    { ...preferences(), digestTime: "24:00" },
    { ...preferences(), digestTime: "06:60" },
    { ...preferences(), catchUpMinutes: 0 },
    { ...preferences(), catchUpMinutes: 11 },
    { ...preferences(), catchUpMinutes: 1.5 },
    { ...preferences(), catchUpMinutes: NaN },
    { ...preferences(), enabledAt: null },
    { ...preferences(), enabledAt: "tomorrow" },
    { ...preferences(), enabledAt: "2026-02-30T00:00:00Z" },
    { ...preferences(), enabledAt: "2026-10-25" },
  ]) {
    assert.equal(validCareerTelegramPreferences(invalid), false);
    assert.deepEqual(
      dueCareerNotifications(planFixture(), {}, invalid, instant("06:00")),
      [],
    );
  }
});

test("06:00 IST digest is due at the local minute and includes working personal links", () => {
  const [digest] = notifications("06:00");
  assert.equal(notifications("05:59").length, 0);
  assert.equal(digest.kind, "career-digest");
  assert.equal(digest.date, "2026-10-26");
  assert.equal(digest.scheduledAt, Date.parse("2026-10-26T00:30:00Z"));
  assert.equal(digest.assignmentId, undefined);
  assert.match(digest.text, /Trace a slow request/);
  assert.match(digest.text, /11:30-13:30/);
  assert.match(
    digest.text,
    /https:\/\/personal\.buildora\.work\/hub\?date=2026-10-26/,
  );
  assert.match(
    digest.text,
    /https:\/\/personal\.buildora\.work\/roadmap\?view=plan/,
  );
  assert.doesNotMatch(digest.text, /completed|mastered/i);
});

test("catch-up is inclusive at ten minutes and never replays stale starts", () => {
  assert.equal(notifications("06:10").length, 1);
  assert.deepEqual(
    dueCareerNotifications(
      planFixture(),
      {},
      preferences(),
      instant("06:10") + 1,
    ),
    [],
  );
  assert.deepEqual(notifications("08:00"), []);
  assert.equal(
    notifications("06:01", preferences({ catchUpMinutes: 1 })).length,
    1,
  );
  assert.deepEqual(
    notifications("06:02", preferences({ catchUpMinutes: 1 })),
    [],
  );
});

test("late activation cannot send a reminder scheduled before activation", () => {
  assert.deepEqual(
    notifications("06:06", preferences({ enabledAt: "2026-10-26T00:35:00Z" })),
    [],
  );
  assert.equal(
    notifications("06:00", preferences({ enabledAt: "2026-10-26T00:30:00Z" }))
      .length,
    1,
  );
  assert.equal(
    notifications("06:30", preferences({ enabledAt: "2026-10-26T00:35:00Z" }))
      .length,
    1,
  );
});

test("study and project use their dated plan starts and expose their evidence action", () => {
  const [study] = notifications("06:30");
  assert.equal(study.kind, "career-study");
  assert.equal(
    study.assignmentId,
    "fullstack:2026-10-26:day:2026-10-26:assignment:study:0630",
  );
  assert.match(study.text, /A trace with timings and a reproducible benchmark/);
  assert.match(
    study.text,
    /If the worker stops, retain the job and record the retry/,
  );
  assert.match(study.text, /save.*evidence/i);
  const [project] = notifications("11:30");
  assert.equal(project.kind, "career-project");
  assert.equal(project.scheduledAt, Date.parse("2026-10-26T06:00:00Z"));
  for (const time of ["08:30", "13:30", "14:30", "16:00", "20:30", "21:30"])
    assert.deepEqual(notifications(time), []);
});

test("Saturday uses its actual 14:15 study start and has no project reminder", () => {
  const at = (time: string) => Date.parse(`2026-10-31T${time}:00+05:30`);
  assert.deepEqual(
    dueCareerNotifications(planFixture(), {}, preferences(), at("06:30")),
    [],
  );
  const [study] = dueCareerNotifications(
    planFixture(),
    {},
    preferences(),
    at("14:15"),
  );
  assert.equal(study.kind, "career-study");
  assert.equal(study.date, "2026-10-31");
  assert.equal(study.scheduledAt, Date.parse("2026-10-31T08:45:00Z"));
  assert.deepEqual(
    dueCareerNotifications(planFixture(), {}, preferences(), at("11:30")),
    [],
  );
});

test("digest-only preference keeps daily planning and suppresses learning starts", () => {
  const prefs = preferences({ cadence: "digest-only" });
  assert.equal(notifications("06:00", prefs).length, 1);
  assert.deepEqual(notifications("06:30", prefs), []);
  assert.deepEqual(notifications("11:30", prefs), []);
});

test("Sunday, missing days and dates outside the approved plan are silent", () => {
  for (const date of ["2026-10-25", "2026-11-01", "2027-02-19"])
    assert.deepEqual(
      dueCareerNotifications(
        planFixture(),
        {},
        preferences(),
        Date.parse(`${date}T06:00:00+05:30`),
      ),
      [],
    );
  const missing = planFixture();
  missing.days.splice(0, 1);
  assert.deepEqual(
    dueCareerNotifications(missing, {}, preferences(), instant("06:00")),
    [],
  );
});

test("local date selection stays correct across UTC midnight", () => {
  const prefs = preferences({ digestTime: "00:03" });
  const [digest] = dueCareerNotifications(
    planFixture(),
    {},
    prefs,
    Date.parse("2026-10-25T18:33:00Z"),
  );
  assert.equal(digest.date, "2026-10-26");
  assert.equal(digest.scheduledAt, Date.parse("2026-10-25T18:33:00Z"));
  assert.deepEqual(
    dueCareerNotifications(
      planFixture(),
      {},
      preferences(),
      Date.parse("2026-10-26T23:59:00Z"),
    ),
    [],
  );
});

test("malformed plans and clocks fail closed without throwing", () => {
  assert.equal(isJobPlan(planFixture()), true);
  const invalidPlans: unknown[] = [
    undefined,
    null,
    {},
    { ...planFixture(), timezone: "UTC" },
  ];
  for (const mutate of [
    (p: JobPlan) => {
      p.days[0].date = "2026-02-30";
    },
    (p: JobPlan) => {
      p.days[0].assignments[0].range = "06:99-07:00";
    },
    (p: JobPlan) => {
      p.days[0].assignments[0].date = "2026-10-27";
    },
    (p: JobPlan) => {
      p.days[0].assignments[1].id = p.days[0].assignments[0].id;
    },
  ]) {
    const plan = planFixture();
    mutate(plan);
    invalidPlans.push(plan);
  }
  for (const plan of invalidPlans)
    assert.deepEqual(
      dueCareerNotifications(
        plan as JobPlan,
        {},
        preferences(),
        instant("06:00"),
      ),
      [],
    );
  for (const now of [NaN, Infinity, -Infinity, 9e20])
    assert.deepEqual(
      dueCareerNotifications(planFixture(), {}, preferences(), now),
      [],
    );
});

test("verified assignment evidence suppresses learning and disappears from digest", () => {
  const plan = planFixture();
  const id = plan.days[0].assignments[0].id;
  const execution = {
    version: 1,
    evidenceByItemId: {
      [id]: {
        evidence: {
          value: "A measured trace captured the queue wait and worker timings.",
        },
        completedAt: "2026-10-25T10:00:00Z",
        verifiedAt: "2026-10-25T11:00:00Z",
      },
    },
  };
  assert.deepEqual(
    dueCareerNotifications(plan, execution, preferences(), instant("06:30")),
    [],
  );
  const [digest] = dueCareerNotifications(
    plan,
    execution,
    preferences(),
    instant("06:00"),
  );
  assert.doesNotMatch(digest.text, /Trace a slow request/);
});

test("saved evidence invites review while invalid or legacy completion claims do not suppress starts", () => {
  const plan = planFixture();
  const id = plan.days[0].assignments[0].id;
  const evidence = {
    evidence: {
      value: "A measured trace captured the queue wait and worker timings.",
    },
    completedAt: "2026-10-25T10:00:00Z",
  };
  const [saved] = dueCareerNotifications(
    plan,
    { evidenceByItemId: { [id]: evidence } },
    preferences(),
    instant("06:30"),
  );
  assert.match(saved.text, /review.*saved evidence/i);
  assert.doesNotMatch(saved.text, /unfinished|mastered|completed/i);
  for (const execution of [
    {
      evidenceByItemId: {
        [id]: {
          ...evidence,
          evidence: { value: "too short" },
          verifiedAt: "2026-10-25T11:00:00Z",
        },
      },
    },
    {
      evidenceByItemId: {
        [id]: { ...evidence, verifiedAt: "2026-10-24T11:00:00Z" },
      },
    },
    { evidenceByItemId: null, completed: [id] },
    { evidenceByItemId: { [id]: null } },
    {
      evidenceByItemId: {
        [id]: { ...evidence, completedAt: Symbol("invalid") },
      },
    },
    {
      evidenceByItemId: {
        [id]: { ...evidence, verifiedAt: Symbol("invalid") },
      },
    },
    null,
    true,
  ])
    assert.equal(
      dueCareerNotifications(plan, execution, preferences(), instant("06:30"))
        .length,
      1,
    );
});

test("learning IDs survive wording changes and simultaneous digest and routine starts remain distinct", () => {
  const plan = planFixture();
  const [before] = dueCareerNotifications(
    plan,
    {},
    preferences(),
    instant("06:30"),
  );
  plan.days[0].assignments[0].title = "Compare two request traces";
  plan.days[0].assignments[0].deliverable = "An updated trace comparison";
  const [after] = dueCareerNotifications(
    plan,
    {},
    preferences(),
    instant("06:30"),
  );
  assert.equal(before.id, after.id);
  assert.notEqual(before.text, after.text);
  const simultaneous = dueCareerNotifications(
    plan,
    {},
    preferences({ digestTime: "06:30" }),
    instant("06:30"),
  );
  assert.equal(simultaneous.length, 2);
  const [routine] = routineOccurrences(
    [
      {
        id: "career-study",
        label: "Breakfast",
        time: "06:30",
        days: [1],
        timezone: "Asia/Kolkata",
        enabled: true,
        type: "meal",
        updatedAt: 0,
      },
    ],
    "2026-10-26",
  );
  assert.equal(
    new Set([...simultaneous.map((item) => item.id), routine.id]).size,
    3,
  );
  assert.ok(simultaneous.every((item) => item.id.startsWith("career:")));
});

test("digest excludes non-learning titles, outreach, profile and arbitrary execution text", () => {
  const plan = planFixture();
  for (const assignment of plan.days[0].assignments) {
    if (!["study", "project"].includes(assignment.kind)) {
      assignment.title = "PRIVATE_OUTREACH_SENTINEL";
      assignment.deliverable = "PRIVATE_CONTACT_SENTINEL";
    }
  }
  const [digest] = dueCareerNotifications(
    plan,
    {
      profile: "PRIVATE_PROFILE_SENTINEL",
      outreach: "PRIVATE_MESSAGE_SENTINEL",
    },
    preferences(),
    instant("06:00"),
  );
  assert.match(digest.text, /Applications/);
  assert.doesNotMatch(digest.text, /PRIVATE_/);
});

test("long Unicode messages preserve length, readable text and both navigation links", () => {
  const plan = planFixture();
  for (const a of plan.days[0].assignments) {
    a.title = "🔎 Trace latency ".repeat(400);
    a.deliverable = "A bounded queue benchmark ".repeat(400);
    a.blocked = "🔧 Record the retry ".repeat(400);
  }
  for (const time of ["06:00", "06:30", "11:30"]) {
    const messages = dueCareerNotifications(
      plan,
      {},
      preferences(),
      instant(time),
    );
    assert.equal(messages.length, 1);
    for (const item of messages) {
      assert.ok(item.text.length <= 3900);
      assert.equal(item.text.isWellFormed(), true);
      assert.match(
        item.text,
        /https:\/\/personal\.buildora\.work\/hub\?date=2026-10-26/,
      );
      assert.match(
        item.text,
        /https:\/\/personal\.buildora\.work\/roadmap\?view=plan/,
      );
    }
  }
});

test("contact and credential material in technical fields is withheld from messages", () => {
  const plan = planFixture();
  const study = plan.days[0].assignments[0];
  study.title = "Ask engineer@example.invalid about trace sampling";
  study.deliverable = "Call +00 1234 567 890 for the evidence";
  study.blocked = "Use token 123456789:FAKE_SYNTHETIC_TOKEN_VALUE for a retry";
  for (const time of ["06:00", "06:30"]) {
    const [item] = dueCareerNotifications(
      plan,
      {},
      preferences(),
      instant(time),
    );
    assert.ok(item);
    assert.doesNotMatch(
      item.text,
      /engineer@|1234 567|123456789|FAKE_SYNTHETIC_TOKEN/,
    );
    assert.match(item.text, /complete plan/i);
  }
});

test("a fully verified day does not produce a digest or block reminders", () => {
  const plan = planFixture();
  const execution = {
    evidenceByItemId: Object.fromEntries(
      plan.days[0].assignments.map((a) => [
        a.id,
        {
          evidence: {
            value:
              "A measured trace captured the queue wait and worker timings.",
          },
          completedAt: "2026-10-25T10:00:00Z",
          verifiedAt: "2026-10-25T11:00:00Z",
        },
      ]),
    ),
  };
  for (const time of ["06:00", "06:30", "11:30"])
    assert.deepEqual(
      dueCareerNotifications(plan, execution, preferences(), instant(time)),
      [],
    );
});

test("cheap prefilter preserves every due start across all 100 supported dates and cadences", () => {
  const plan = planFixture();
  let dueCount = 0;
  for (const day of plan.days) {
    for (const cadence of ["digest-only", "digest-and-learning"] as const) {
      const prefs = preferences({ cadence });
      const starts = new Set([
        "06:00",
        ...day.assignments
          .filter((assignment) =>
            ["study", "project"].includes(assignment.kind),
          )
          .map((assignment) => assignment.range.slice(0, 5)),
      ]);
      for (const time of starts) {
        const scheduledAt = Date.parse(`${day.date}T${time}:00+05:30`);
        for (const delay of [0, 600_000]) {
          const now = scheduledAt + delay;
          const actual = dueCareerNotifications(plan, {}, prefs, now);
          if (!actual.length) continue;
          dueCount += actual.length;
          assert.equal(
            careerTelegramMayBeDue(prefs, now),
            true,
            `${day.date} ${time} ${cadence} +${delay}`,
          );
        }
      }
    }
  }
  // Two digest windows per cadence/day, plus weekday study/project and Saturday study.
  assert.equal(dueCount, 768);
});

test("cheap prefilter skips silent periods without loading a dated plan", () => {
  for (const time of [
    "00:00",
    "05:59",
    "06:11",
    "06:41",
    "08:30",
    "11:41",
    "13:30",
    "20:30",
    "23:59",
  ])
    assert.equal(
      careerTelegramMayBeDue(preferences(), instant(time)),
      false,
      time,
    );
  for (const date of ["2026-10-25", "2026-11-01", "2027-02-19"])
    assert.equal(
      careerTelegramMayBeDue(
        preferences(),
        Date.parse(`${date}T06:00:00+05:30`),
      ),
      false,
      date,
    );
  assert.equal(careerTelegramMayBeDue(preferences(), instant("06:00")), true);
  assert.equal(careerTelegramMayBeDue(preferences(), instant("06:30")), true);
  assert.equal(careerTelegramMayBeDue(preferences(), instant("11:30")), true);
  assert.equal(
    careerTelegramMayBeDue(
      preferences({ cadence: "digest-only" }),
      instant("06:30"),
    ),
    false,
  );
  assert.equal(
    careerTelegramMayBeDue(
      preferences(),
      Date.parse("2026-10-31T14:15:00+05:30"),
    ),
    true,
  );
  assert.equal(
    careerTelegramMayBeDue(
      preferences(),
      Date.parse("2026-10-31T06:30:00+05:30"),
    ),
    false,
  );
});

test("cheap prefilter honors catch-up boundaries, activation and a custom local digest time", () => {
  assert.equal(careerTelegramMayBeDue(preferences(), instant("06:10")), true);
  assert.equal(
    careerTelegramMayBeDue(preferences(), instant("06:10") + 1),
    false,
  );
  assert.equal(
    careerTelegramMayBeDue(
      preferences({ catchUpMinutes: 1 }),
      instant("06:01"),
    ),
    true,
  );
  assert.equal(
    careerTelegramMayBeDue(
      preferences({ catchUpMinutes: 1 }),
      instant("06:01") + 1,
    ),
    false,
  );
  assert.equal(
    careerTelegramMayBeDue(
      preferences({ enabledAt: "2026-10-26T00:35:00Z" }),
      instant("06:06"),
    ),
    false,
  );
  assert.equal(
    careerTelegramMayBeDue(
      preferences({ enabledAt: "2026-10-26T00:30:00Z" }),
      instant("06:00"),
    ),
    true,
  );
  assert.equal(
    careerTelegramMayBeDue(
      preferences({ digestTime: "00:03" }),
      Date.parse("2026-10-25T18:33:00Z"),
    ),
    true,
  );
  for (const prefs of [
    undefined,
    {},
    DEFAULT_CAREER_TELEGRAM_PREFERENCES,
    { ...preferences(), enabledAt: null },
    { ...preferences(), catchUpMinutes: 11 },
  ])
    assert.equal(careerTelegramMayBeDue(prefs, instant("06:00")), false);
  for (const now of [NaN, Infinity, -Infinity, 9e20])
    assert.equal(careerTelegramMayBeDue(preferences(), now), false);
});

test("career reminders support only the validated version 3 dated schedule", () => {
  const legacy = jobPlanFixture() as JobPlan;
  assert.equal(isJobPlan(legacy), true);
  assert.deepEqual(
    dueCareerNotifications(legacy, {}, preferences(), instant("06:00")),
    [],
  );
  assert.deepEqual(
    dueCareerNotifications(legacy, {}, preferences(), instant("08:00")),
    [],
  );
});

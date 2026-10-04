import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validPlanBlock,
  validPlanDay,
  dayAgenda,
  shiftDay,
} from "./day-plan.ts";
const block = {
  id: "a",
  date: "2026-10-04",
  startLocal: "09:00",
  durationMinutes: 60,
  timeZone: "Asia/Kolkata",
  kind: "task" as const,
  title: "API practice",
  sourceId: "task-a",
  updatedAt: 1,
};
test("blocks reject impossible dates, midnight crossing and invalid zones", () => {
  assert.equal(validPlanBlock(block), true);
  for (const change of [
    { date: "2026-02-30" },
    { startLocal: "25:00" },
    { durationMinutes: 0 },
    { startLocal: "23:30", durationMinutes: 60 },
    { timeZone: "fake" },
    { kind: "alien" },
    { sourceId: "" },
  ])
    assert.equal(validPlanBlock({ ...block, ...change }), false);
});
test("priorities are references with a limit and no duplicates", () => {
  assert.equal(
    validPlanDay({
      date: block.date,
      priorityTaskIds: ["a", "b"],
      updatedAt: 1,
    }),
    true,
  );
  assert.equal(
    validPlanDay({
      date: block.date,
      priorityTaskIds: ["a", "a"],
      updatedAt: 1,
    }),
    false,
  );
  assert.equal(
    validPlanDay({
      date: block.date,
      priorityTaskIds: ["a", "b", "c", "d"],
      updatedAt: 1,
    }),
    false,
  );
  assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
});
test("agenda excludes deleted/other dates and preserves exact task links", () => {
  const rows = dayAgenda({
    date: block.date,
    blocks: {
      a: block,
      b: { ...block, id: "b", deleted: true },
      c: { ...block, id: "c", date: "2026-10-05" },
    },
    tasks: [
      {
        id: "task-a",
        text: "Actual title",
        done: false,
        date: block.date,
        priority: "P1",
        tag: "Work",
        createdAt: 1,
      },
    ],
    routines: [],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].href, "/plan?view=focus&task=task-a");
  assert.equal(rows[0].title, "Actual title");
  const missing = dayAgenda({
    date: block.date,
    blocks: { a: block },
    tasks: [],
    routines: [],
  });
  assert.equal(missing[0].unavailable, true);
});

test("owner timetable stays ten hours weekdays and four on weekends", async () => {
  const { personalSchedule } = await import("./personal-timetable.ts");
  const minutes = (date: string) =>
    Object.values(personalSchedule("cvamsik99@gmail.com", date) ?? {}).reduce(
      (sum, b) => sum + b.minutes,
      0,
    );
  assert.equal(minutes("2026-10-05"), 600);
  assert.equal(minutes("2026-10-04"), 240);
  assert.equal(
    personalSchedule("someone@example.com", "2026-10-05"),
    undefined,
  );
});

test("saved account timetables preserve full text and explicit range without focus credit", async () => {
  const { timetableBlocks } = await import("./day-plan.ts");
  const blocks = timetableBlocks(
    "2026-10-04",
    {
      "09:00-10:00": "Legacy instructions",
      "10:00-10:30": { label: "Meal break", work: false },
    },
    "UTC",
  );
  assert.equal(Object.keys(blocks).length, 2);
  assert.equal(Object.values(blocks)[0].title, "Legacy instructions");
  assert.equal(Object.values(blocks)[0].durationMinutes, 60);
  assert.equal(Object.values(blocks)[1].kind, "event");
});

test("IST source blocks follow the selected calendar day abroad", () => {
  const b = {
    ...block,
    kind: "study" as const,
    date: "2026-10-05",
    sourceId: undefined,
  };
  const rows = dayAgenda({
    date: "2026-10-04",
    calendarTimeZone: "America/Los_Angeles",
    blocks: { a: b },
    tasks: [],
    routines: [],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].block?.date, "2026-10-05");
  assert.equal(
    dayAgenda({
      date: "2026-10-05",
      calendarTimeZone: "America/Los_Angeles",
      blocks: { a: b },
      tasks: [],
      routines: [],
    }).length,
    0,
  );
});
test("overlap checks use instants and permit touching intervals", async () => {
  const { conflicts } = await import("./day-plan.ts");
  assert.equal(
    conflicts(block, { ...block, id: "b", startLocal: "10:00" }),
    false,
  );
  assert.equal(
    conflicts(block, { ...block, id: "b", startLocal: "09:30" }),
    true,
  );
  assert.equal(
    conflicts(block, {
      ...block,
      id: "b",
      startLocal: "03:30",
      timeZone: "UTC",
    }),
    true,
  );
  assert.equal(
    conflicts(
      {
        ...block,
        date: "2026-10-04",
        startLocal: "20:00",
        timeZone: "America/Los_Angeles",
      },
      {
        ...block,
        id: "b",
        date: "2026-10-05",
        startLocal: "08:30",
        timeZone: "Asia/Kolkata",
      },
    ),
    true,
  );
});

test("configured planning stays closed until the explicit rollout flag", async () => {
  const { planningCanEdit } = await import("./day-plan.ts");
  assert.equal(planningCanEdit(false), true);
  assert.equal(planningCanEdit(true), false);
  assert.equal(planningCanEdit(true, "false"), false);
  assert.equal(planningCanEdit(true, "1"), false);
  assert.equal(planningCanEdit(true, "true"), true);
});

import assert from "node:assert/strict";
import test from "node:test";
import * as timetable from "./personal-timetable.ts";

test("income-first slots total 32 hours across a full week and keep Sunday free", () => {
  assert.equal(typeof timetable.incomeFirstDaySlots, "function");
  const dates = [
    "2026-11-09",
    "2026-11-10",
    "2026-11-11",
    "2026-11-12",
    "2026-11-13",
    "2026-11-14",
    "2026-11-15",
  ];
  const totals = dates.map((date) =>
    timetable.incomeFirstDaySlots(date).reduce((sum, [range]) => {
      const [start, end] = range
        .split("-")
        .map((t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3)));
      return sum + end - start;
    }, 0),
  );
  assert.deepEqual(totals, [360, 360, 360, 360, 360, 120, 0]);
  assert.equal(
    totals.reduce((sum, n) => sum + n, 0),
    1920,
  );
  assert.deepEqual(timetable.incomeFirstDaySlots("2026-11-05"), [
    ["09:00-11:00", "applications"],
    ["11:15-12:45", "network"],
    ["13:00-14:00", "project"],
    ["15:00-16:00", "coding"],
    ["16:00-16:30", "review"],
  ]);
  assert.deepEqual(timetable.incomeFirstDaySlots("invalid"), []);
});

test("selecting the income revision preserves earlier personal schedules and other account boundaries", () => {
  assert.equal(typeof timetable.isIncomeFirstScheduleRevision, "function");
  const revision = timetable.INCOME_FIRST_SCHEDULE_REVISION;
  assert.equal(timetable.isIncomeFirstScheduleRevision(revision), true);
  assert.equal(
    timetable.isIncomeFirstScheduleRevision({
      ...revision,
      effectiveOn: "2026-11-04",
    }),
    false,
  );
  const owner = timetable.TIMETABLE_OWNER_EMAIL;
  assert.deepEqual(
    timetable.personalSchedule(owner, "2026-11-04", revision),
    timetable.personalSchedule(owner, "2026-11-04"),
  );
  const schedule = timetable.personalSchedule(owner, "2026-11-05", revision)!;
  assert.equal(
    Object.values(schedule).reduce((sum, block) => sum + block.minutes, 0),
    360,
  );
  assert.match(schedule["11:15-12:45"].label, /contract/i);
  assert.equal(
    timetable.personalSchedule("someone@example.test", "2026-11-05", revision),
    undefined,
  );
  assert.deepEqual(
    timetable.personalSchedule(owner, "2026-11-08", revision),
    {},
  );
});

test("the new day frame does not retain ten hours of study behind the career schedule", () => {
  const frame = timetable.personalDayFrame(
    "2026-11-05",
    timetable.INCOME_FIRST_SCHEDULE_REVISION,
  );
  const work = frame.filter((block) => block.kind === "study");
  assert.deepEqual(
    work.map((block) => block.startLocal),
    ["09:00", "11:15", "13:00", "15:00", "16:00"],
  );
  assert.equal(
    work.reduce((sum, block) => sum + block.durationMinutes, 0),
    360,
  );
  assert.equal(
    frame.find((block) => block.id === "lunch")?.startLocal,
    "14:00",
  );
  const past = timetable.personalDayFrame(
    "2026-11-04",
    timetable.INCOME_FIRST_SCHEDULE_REVISION,
  );
  assert.deepEqual(past, timetable.personalDayFrame("2026-11-04"));
});

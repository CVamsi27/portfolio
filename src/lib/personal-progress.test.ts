import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProgress, progressDates } from "./personal-progress.ts";
import type { FoodEntry } from "./nutrition.ts";
const meal = (
  id: string,
  date: string,
  energy: number | null,
  extra = {},
): FoodEntry => ({
  id,
  date,
  name: "Meal",
  basisAmount: 100,
  basisUnit: "g",
  quantity: 150,
  nutrients: { energy, protein: 10, calcium: null },
  foodId: id,
  meal: "Lunch",
  source: "Manual",
  updatedAt: 1,
  ...extra,
});
test("calendar ranges cross month and leap-day boundaries without timezone shifts", () => {
  assert.deepEqual(progressDates("2024-03-02", 3), [
    "2024-02-29",
    "2024-03-01",
    "2024-03-02",
  ]);
  assert.throws(() => progressDates("2026-02-30", 7));
  assert.throws(() => progressDates("2026-10-04", 0));
});
test("sparse measurements remain gaps, one reading has no trend and out-of-range data stays excluded", () => {
  const p = buildProgress({
    end: "2026-10-04",
    days: 7,
    weights: {
      "2026-10-03": { weightKg: 80, updatedAt: 1 },
      "2026-10-05": { weightKg: 70, updatedAt: 1 },
    },
  });
  assert.equal(p.days[0].weight, null);
  assert.equal(p.latestWeight?.value, 80);
  assert.equal(p.weightChange, null);
  const q = buildProgress({
    end: "2026-10-04",
    days: 7,
    weights: {
      "2026-10-01": { weightKg: 82, updatedAt: 1 },
      "2026-10-04": { weightKg: 80, updatedAt: 1 },
    },
  });
  assert.equal(q.weightChange, -2);
  assert.equal(q.weightCount, 2);
});
test("food uses consumed portions and known-day averages, never fills unlogged days with zero", () => {
  const p = buildProgress({
    end: "2026-10-04",
    days: 7,
    food: {
      a: meal("a", "2026-10-01", 200),
      b: meal("b", "2026-10-01", null),
      c: meal("c", "2026-10-04", 0),
      d: meal("d", "2026-10-03", 500, { deleted: true }),
      e: meal("e", "2026-10-04", 400, { quantity: 0 }),
    },
  });
  assert.equal(p.foodCount, 3);
  assert.equal(p.foodDays, 2);
  assert.equal(p.nutrients.energy.total, 300);
  assert.equal(p.nutrients.energy.average, 150);
  assert.equal(p.nutrients.energy.knownEntries, 2);
  assert.equal(p.nutrients.calcium.average, null);
  assert.equal(p.days[1].energy, null);
  assert.equal(p.days.at(-1)?.energy, 0);
});
test("exercise counts recorded sets and duration without inventing calories or minutes", () => {
  const p = buildProgress({
    end: "2026-10-04",
    days: 7,
    workouts: {
      "2026-10-04": {
        squat: {
          done: true,
          sets: [
            { reps: 8, weightKg: 20 },
            { reps: 6, weightKg: null },
          ],
        },
        walk: { done: true, sets: [], minutes: 30 },
        blank: { done: false, sets: [] },
      },
      "2026-10-05": { future: { done: true, sets: [] } },
    },
  });
  assert.equal(p.workoutDays, 1);
  assert.equal(p.exerciseCount, 2);
  assert.equal(p.setCount, 2);
  assert.equal(p.exerciseMinutes, 30);
  assert.equal(p.days[0].exercise, null);
});
test("session totals exclude incomplete, invalid and future records, and study is separate", () => {
  const base = {
    id: "a",
    date: "2026-10-04",
    createdAt: new Date("2026-10-04T09:00:00").getTime(),
    endedAt: new Date("2026-10-04T09:25:00").getTime(),
    durationMinutes: 25,
    status: "completed" as const,
    label: "Work",
    mode: "timed" as const,
    startedAt: 1,
  };
  const p = buildProgress({
    end: "2026-10-04",
    days: 7,
    focus: [
      base,
      { ...base, id: "b", status: "cancelled" },
      { ...base, id: "c", durationMinutes: NaN },
    ],
    study: [{ date: "2026-10-04", durationMinutes: 40 }],
  });
  assert.equal(p.focusMinutes, 25);
  assert.equal(p.studyMinutes, 40);
  assert.equal(p.focusSessions, 1);
});
test("water and sleep retain recorded zeros and ignore deleted or invalid values", () => {
  const p = buildProgress({
    end: "2026-10-04",
    days: 7,
    water: { "2026-10-03": 0, "2026-10-04": 8, "2026-10-02": -1 },
    recovery: {
      one: {
        id: "one",
        date: "2026-10-04",
        sleepHours: 7,
        energy: 4,
        mood: "",
        note: "",
        updatedAt: 1,
      },
      two: {
        id: "two",
        date: "2026-10-03",
        sleepHours: 9,
        energy: null,
        mood: "",
        note: "",
        updatedAt: 1,
        deleted: true,
      },
    },
  });
  assert.equal(p.waterTotal, 8);
  assert.equal(p.waterDays, 2);
  assert.equal(p.sleepAverage, 7);
  assert.equal(p.days.at(-2)?.water, 0);
});
test("exercise load totals preserve unknown weights and fasting counts only completed valid records", () => {
  const p = buildProgress({
    end: "2026-10-04",
    days: 7,
    workouts: {
      "2026-10-04": {
        squat: {
          done: true,
          sets: [
            { reps: 8, weightKg: 20 },
            { reps: 6, weightKg: null },
          ],
        },
      },
    },
    fasting: [
      {
        id: "one",
        start: new Date("2026-10-03T20:00:00").getTime(),
        end: new Date("2026-10-04T12:00:00").getTime(),
        protocolId: "16-8",
        source: "timer",
      },
      { id: "two", start: 200, end: 100, protocolId: "16-8", source: "timer" },
    ],
  });
  assert.equal(p.loadVolumeKg, 160);
  assert.equal(p.knownLoadSets, 1);
  assert.equal(p.repCount, 14);
  assert.equal(p.fastCount, 1);
  assert.equal(p.fastHours, 16);
});
test("goal readings keep zero and unknown distinct, and journal counts actual nonempty days", () => {
  const p = buildProgress({
    end: "2026-10-04",
    days: 7,
    goalMetric: { "2026-10-03": 0, "2026-10-04": 5, "2026-10-05": 100 },
    journal: {
      "2026-10-03": { win: "", learned: "", focus: " ", updatedAt: 1 },
      "2026-10-04": {
        win: "Delivered the API",
        learned: "",
        focus: "",
        updatedAt: 1,
      },
    },
  });
  assert.equal(p.goalMetricTotal, 5);
  assert.equal(p.goalMetricDays, 2);
  assert.equal(p.days.at(-2)?.goalMetric, 0);
  assert.equal(p.days[0].goalMetric, null);
  assert.equal(p.journalDays, 1);
});

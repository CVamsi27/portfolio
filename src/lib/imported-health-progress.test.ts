import test from "node:test";
import assert from "node:assert/strict";
import { importedHealthProgress } from "./imported-health-progress.ts";
const row = (change = {}) => ({
  id: "a",
  type: "weight",
  date: "2026-10-07",
  value: 72,
  unit: "kg",
  source: "scale",
  measuredAt: "2026-10-07T06:00:00Z",
  updatedAt: 1,
  ...change,
});
test("one explicit source supplies daily measurements and missing days stay gaps", () => {
  const data = importedHealthProgress(
    [row(), row({ id: "b", source: "other", value: 100 })],
    "2026-10-06",
    "2026-10-07",
    "scale",
  );
  assert.deepEqual(
    data.weight.map((p) => p.value),
    [null, 72],
  );
  assert.equal(data.sources.length, 2);
});
test("priority daily steps are selected rather than added across records or devices", () => {
  const rows = [
    row({ type: "steps", unit: "count", value: 5000 }),
    row({ id: "b", type: "steps", unit: "count", value: 5500, updatedAt: 2 }),
    row({
      id: "c",
      type: "steps",
      source: "other",
      unit: "count",
      value: 9000,
    }),
  ];
  assert.equal(
    importedHealthProgress(rows, "2026-10-07", "2026-10-07", "scale").steps[0]
      .value,
    5500,
  );
});
test("overlapping or unbounded sleep sessions are never silently summed", () => {
  const sleep = row({
    type: "sleep",
    unit: "minutes",
    value: 300,
    startAt: "2026-10-07T00:00:00Z",
    endAt: "2026-10-07T06:00:00Z",
  });
  const data = importedHealthProgress(
    [
      sleep,
      {
        ...sleep,
        id: "b",
        startAt: "2026-10-07T03:00:00Z",
        endAt: "2026-10-07T09:00:00Z",
      },
    ],
    "2026-10-07",
    "2026-10-07",
    "scale",
  );
  assert.equal(data.sleep[0].value, null);
  assert.ok(data.notes.length > 0);
});
test("disjoint sessions from the selected source keep their reported minutes", () => {
  const rows = [
    row({
      type: "sleep",
      unit: "minutes",
      value: 300,
      startAt: "2026-10-07T00:00:00Z",
      endAt: "2026-10-07T06:00:00Z",
    }),
    row({
      id: "b",
      type: "sleep",
      unit: "minutes",
      value: 30,
      startAt: "2026-10-07T08:00:00Z",
      endAt: "2026-10-07T09:00:00Z",
    }),
  ];
  assert.equal(
    importedHealthProgress(rows, "2026-10-07", "2026-10-07", "scale").sleep[0]
      .value,
    330,
  );
});
test("deleted, invalid and out-of-range records cannot populate a trend", () => {
  const rows = [
    row({ deleted: true }),
    row({ value: Infinity }),
    row({ unit: "lb" }),
    row({ date: "2026-10-08" }),
  ];
  assert.equal(
    importedHealthProgress(rows, "2026-10-07", "2026-10-07", "scale").weight[0]
      .value,
    null,
  );
});
test("repeated pages deduplicate upstream keys and retain their latest tombstone", () => {
  const sleep = row({ type: "sleep", unit: "minutes", value: 300 });
  const data = importedHealthProgress(
    [sleep, sleep],
    "2026-10-07",
    "2026-10-07",
    "scale",
  );
  assert.equal(data.sleep[0].value, 300);
  const removed = importedHealthProgress(
    [row(), row({ deleted: true, updatedAt: 2 })],
    "2026-10-07",
    "2026-10-07",
    "scale",
  );
  assert.equal(removed.weight[0].value, null);
});

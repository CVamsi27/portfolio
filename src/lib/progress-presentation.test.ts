import assert from "node:assert/strict";
import { test } from "node:test";
import { metricPoints, progressMetric } from "./progress-presentation.ts";

test("content and account pages have no progress metric", () => {
  for (const path of [
    "/share",
    "/archive",
    "/settings",
    "/motivation",
    "/login",
    "/log",
  ])
    assert.equal(progressMetric(path), null);
  assert.equal(progressMetric("/health", "recovery"), "sleep");
  assert.equal(progressMetric("/log", "journal"), null);
  assert.equal(progressMetric("/plan"), "focus");
  assert.equal(progressMetric("/health", "connections"), null);
});

test("workout progress can show recorded sets without inventing duration", () => {
  assert.deepEqual(
    metricPoints(
      [{ date: "2026-10-12", sets: 3, exerciseMinutes: null }],
      "sets",
    ),
    [{ date: "2026-10-12", value: 3 }],
  );
});

test("weight presentation converts recorded kilograms and keeps missing dates as gaps", () => {
  const days = [
    { date: "2026-10-10", weight: 10 },
    { date: "2026-10-11", weight: null },
    { date: "2026-10-12", weight: 0 },
  ];
  const points = metricPoints(days, "weight", "lb");
  assert.ok(Math.abs(points[0].value! - 22.0462262185) < 0.000001);
  assert.deepEqual(points.slice(1), [
    { date: "2026-10-11", value: null },
    { date: "2026-10-12", value: 0 },
  ]);
});

test("invalid readings do not become chart marks and explicit zero remains recorded", () => {
  assert.deepEqual(
    metricPoints(
      [
        { date: "2026-10-10", water: NaN },
        { date: "2026-10-11", water: 0 },
        { date: "2026-10-12", water: null },
      ],
      "water",
    ),
    [
      { date: "2026-10-10", value: null },
      { date: "2026-10-11", value: 0 },
      { date: "2026-10-12", value: null },
    ],
  );
});

test("reflection coverage counts saved text rather than treating every date as an entry", () => {
  assert.deepEqual(
    metricPoints(
      [
        { date: "2026-10-11", journal: false },
        { date: "2026-10-12", journal: true },
      ],
      "reflection",
    ),
    [
      { date: "2026-10-11", value: 0 },
      { date: "2026-10-12", value: 1 },
    ],
  );
});

test("configuration and catalogue views omit unrelated tracking charts", () => {
  for (const view of ["saved", "strategy", "insights"])
    assert.equal(progressMetric("/food", view), null);
  assert.equal(progressMetric("/workout-tracking", "plan"), null);
  assert.equal(progressMetric("/routine", "notifications"), null);
  assert.equal(progressMetric("/food", "diary"), "energy");
});

test("eating window views show their own history metric", () => {
  assert.equal(progressMetric("/intermittent-fasting", "window"), "fasting");
  assert.equal(progressMetric("/intermittent-fasting", "history"), "fasting");
  assert.equal(progressMetric("/intermittent-fasting", "water"), "water");
});

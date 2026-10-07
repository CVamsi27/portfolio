import test from "node:test";
import assert from "node:assert/strict";
import { nutritionRange } from "./nutrition-insights.ts";
import type { FoodEntry } from "./nutrition.ts";
const entry = (id: string, date: string, energy: number | null): FoodEntry => ({
  id,
  date,
  name: id,
  nutrients: { energy },
  basisAmount: 100,
  basisUnit: "g",
  quantity: 100,
  meal: "Lunch",
  source: "Manual",
  updatedAt: 1,
  foodId: id,
});
test("ranges preserve calendar gaps and distinguish all known days from confirmed complete days", () => {
  const entries = [
    entry("complete", "2026-10-06", 1000),
    entry("partial", "2026-10-07", 600),
  ];
  const result = nutritionRange("2026-10-07", 7, entries, {
    "2026-10-06": { id: "2026-10-06", status: "complete", updatedAt: 2 },
  });
  assert.equal(result.days.length, 7);
  assert.equal(result.days[0].date, "2026-10-01");
  assert.equal(result.days[0].quality.energy, null);
  assert.equal(result.completeAverage, 1000);
  assert.equal(result.completeCount, 1);
  assert.equal(result.knownAverage, 800);
  assert.equal(result.knownCount, 2);
});
test("explicit fasting is zero while unknown food days and unlogged days stay gaps", () => {
  const result = nutritionRange(
    "2026-03-01",
    3,
    [entry("unknown", "2026-02-28", null)],
    { "2026-03-01": { id: "2026-03-01", status: "fasting", updatedAt: 2 } },
  );
  assert.equal(result.days[0].date, "2026-02-27");
  assert.equal(result.days[1].quality.energy, null);
  assert.equal(result.completeAverage, 0);
  assert.equal(result.completeCount, 1);
  assert.equal(result.knownCount, 1);
});
test("range contributors exclude deleted and out-of-range food, scale portions and count nutrient coverage", () => {
  const result = nutritionRange(
    "2026-10-07",
    7,
    [
      entry("old", "2026-09-30", 100),
      { ...entry("deleted", "2026-10-07", 100), deleted: true },
      { ...entry("scaled", "2026-10-07", 100), quantity: 200 },
      entry("unknown", "2026-10-07", null),
    ],
    {},
  );
  assert.equal(result.entries.length, 2);
  assert.equal(result.totals.values.energy, 200);
  assert.equal(result.totals.coverage.energy, 1);
  assert.equal(result.knownAverage, null);
});
test("invalid ranges cannot silently create fake observations", () => {
  assert.throws(() => nutritionRange("2026-02-30", 7, [], {}));
  assert.throws(() => nutritionRange("2026-10-07", 0, [], {}));
  assert.throws(() => nutritionRange("2026-10-07", 91, [], {}));
});
test("range averages stay finite when valid daily totals overflow a naive sum", () => {
  const result = nutritionRange(
    "2026-10-07",
    2,
    [
      { ...entry("a", "2026-10-06", 1e308), basisAmount: 1, quantity: 1 },
      { ...entry("b", "2026-10-07", 1e308), basisAmount: 1, quantity: 1 },
    ],
    {},
  );
  assert.equal(result.knownAverage, 1e308);
});
test("malformed persisted rows cannot crash range analysis or turn unknown intake into zero", () => {
  const result = nutritionRange(
    "2026-10-07",
    1,
    [null, { date: "2026-10-07", updatedAt: 1 }] as unknown as FoodEntry[],
    {},
  );
  assert.equal(result.knownAverage, null);
  assert.equal(result.completeCount, 0);
  assert.throws(() => nutritionRange("0000-01-01", 1, [], {}));
});

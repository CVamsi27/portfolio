import test from "node:test";
import assert from "node:assert/strict";
import { recentFoodSnapshots } from "./nutrition-history.ts";
import type { FoodEntry } from "./nutrition.ts";
const entry: FoodEntry = {
  id: "new",
  foodId: "rice",
  name: "Corrected rice",
  date: "2026-10-07",
  meal: "Lunch",
  quantity: 150,
  basisAmount: 100,
  basisUnit: "g",
  nutrients: { energy: 130, calcium: null },
  source: "Label",
  updatedAt: 3,
  mealId: "meal",
  batchId: "batch",
  batchFraction: 0.25,
  portions: [{ name: "Bowl", amount: 1, unit: "serving", gramWeight: 150 }],
};
test("recent retrieval keeps latest consumed correction and strips intake identity", () => {
  const result = recentFoodSnapshots([
    entry,
    { ...entry, id: "old", name: "Old rice", updatedAt: 1 },
  ]);
  assert.equal(result.rice.name, "Corrected rice");
  assert.equal(result.rice.id, "rice");
  assert.equal("batchId" in result.rice, false);
  assert.equal("mealId" in result.rice, false);
  assert.equal("date" in result.rice, false);
  assert.equal("quantity" in result.rice, false);
  assert.deepEqual(result.rice.portions, entry.portions);
  result.rice.nutrients.energy = 999;
  assert.equal(entry.nutrients.energy, 130);
});
test("recent limit counts distinct foods and ignores planned deleted or invalid records", () => {
  const repeated = Array.from({ length: 25 }, (_, i) => ({
    ...entry,
    id: String(i),
    updatedAt: 100 - i,
  }));
  const rows = [
    ...repeated,
    { ...entry, id: "other", foodId: "dal", updatedAt: 1 },
    { ...entry, id: "planned", foodId: "future", planned: true },
    { ...entry, id: "removed", foodId: "removed", deleted: true },
    null,
  ] as FoodEntry[];
  assert.deepEqual(Object.keys(recentFoodSnapshots(rows, 2)), ["rice", "dal"]);
  assert.throws(() => recentFoodSnapshots(rows, 0));
});

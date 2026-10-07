import test from "node:test";
import assert from "node:assert/strict";
import {
  validNutrients,
  validFood,
  validEntry,
  scaleNutrients,
  nutrientTotals,
} from "./nutrition.ts";
const food = {
  id: "food",
  name: "Fixture",
  basisAmount: 100,
  basisUnit: "g" as const,
  nutrients: { energy: 100 },
  source: "Label",
  updatedAt: 1,
};
test("prototype property names are never recognized nutrients", () => {
  for (const key of ["constructor", "toString", "__proto__"])
    assert.equal(validNutrients(JSON.parse(`{"${key}":1}`)), false);
});
test("malformed record containers and flags cannot enter active diary data", () => {
  assert.equal(validFood(Object.assign([], food)), false);
  assert.equal(validFood({ ...food, deleted: "true" }), false);
  assert.equal(validFood({ ...food, favorite: 1 }), false);
  assert.equal(validFood({ ...food, updatedAt: -1 }), false);
});
test("overflowing consumed amounts are rejected before rendering", () => {
  assert.throws(
    () => scaleNutrients({ energy: 1e308 }, 100, 1),
    /large|finite|portion/i,
  );
  assert.equal(
    validEntry({
      ...food,
      date: "2026-10-07",
      meal: "Lunch",
      foodId: "food",
      quantity: 100,
      basisAmount: 1,
      nutrients: { energy: 1e308 },
    }),
    false,
  );
});
test("overflowing totals remain unknown rather than displaying Infinity", () => {
  const totals = nutrientTotals([{ energy: 1e308 }, { energy: 1e308 }]);
  assert.equal(totals.values.energy, null);
  assert.equal(totals.coverage.energy, 2);
});
test("declared portions are bounded and never accept an invented or malformed unit", () => {
  assert.equal(
    validFood({
      ...food,
      portions: [{ name: "Cup", amount: 0, unit: "serving" }],
    }),
    false,
  );
  assert.equal(
    validFood({
      ...food,
      portions: [{ name: "Cup", amount: 1, unit: "cups" }],
    }),
    false,
  );
  assert.equal(
    validFood({
      ...food,
      portions: [{ name: "Cup", amount: 1, unit: "serving", gramWeight: -1 }],
    }),
    false,
  );
  assert.equal(
    validFood({
      ...food,
      portions: [{ name: "Cup", amount: 1, unit: "serving", gramWeight: 150 }],
    }),
    true,
  );
});
test("planned portions never enter consumed day totals or complete-day analysis", async () => {
  const { dayQuality } = await import("./nutrition-program.ts");
  const { nutritionRange } = await import("./nutrition-insights.ts");
  const planned = {
    ...food,
    foodId: "food",
    date: "2026-10-07",
    meal: "Lunch",
    quantity: 100,
    planned: true,
  };
  assert.equal(dayQuality("2026-10-07", [planned]).status, "not-logged");
  assert.equal(
    nutritionRange("2026-10-07", 7, [planned], {}).entries.length,
    0,
  );
});

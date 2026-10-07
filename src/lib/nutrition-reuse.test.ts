import test from "node:test";
import assert from "node:assert/strict";
import {
  correctBatchBasis,
  createMealTemplate,
  repeatMeal,
  prepareBatch,
  batchRemaining,
  logBatchPortion,
  validMealTemplate,
  validPreparedBatch,
} from "./nutrition-reuse.ts";
import type { FoodEntry } from "./nutrition.ts";
const entry: FoodEntry = {
  id: "one",
  foodId: "rice",
  name: "Rice",
  date: "2026-10-07",
  meal: "Lunch",
  quantity: 150,
  basisAmount: 100,
  basisUnit: "g",
  nutrients: { energy: 130, calcium: null },
  source: "Label",
  updatedAt: 1,
};
const recipe = {
  id: "stew",
  name: "Stew",
  basisAmount: 4,
  basisUnit: "serving" as const,
  servings: 4,
  cookedWeightGrams: 800,
  nutrients: { energy: 1200 },
  ingredients: [],
  source: "Private recipe",
  updatedAt: 1,
};
test("templates snapshot reviewed consumed food and preserve quantities and unknowns", () => {
  const template = createMealTemplate("t", "My lunch", [entry], 2);
  entry.nutrients.energy = 999;
  assert.equal(template.items[0].food.nutrients.energy, 130);
  assert.equal(template.items[0].quantity, 150);
  assert.equal(validMealTemplate(template), true);
  entry.nutrients.energy = 130;
});
test("repeating a meal scales quantities once and stable operation IDs avoid duplicate retries", () => {
  const t = createMealTemplate("t", "Lunch", [entry], 2);
  const a = repeatMeal(t, "operation", "2026-10-08", "Dinner", 2, 3);
  const b = repeatMeal(t, "operation", "2026-10-08", "Dinner", 2, 3);
  assert.deepEqual(a, b);
  assert.equal(Object.values(a)[0].quantity, 300);
  assert.equal(Object.values(a)[0].nutrients.energy, 130);
  assert.throws(() => repeatMeal(t, "op", "2026-02-30", "Lunch", 1, 3));
  assert.throws(() => repeatMeal(t, "op", "2026-10-08", "Lunch", 0, 3));
});
test("planned and deleted meals cannot become a consumed template", () => {
  assert.throws(() =>
    createMealTemplate("t", "Lunch", [{ ...entry, deleted: true }], 2),
  );
  assert.throws(() =>
    createMealTemplate(
      "t",
      "Lunch",
      [{ ...entry, planned: true } as FoodEntry],
      2,
    ),
  );
});
test("preparing a batch freezes recipe without logging food", () => {
  const batch = prepareBatch("b", recipe, "2026-10-07", 2);
  recipe.nutrients.energy = 999;
  assert.equal(batch.recipe.nutrients.energy, 1200);
  recipe.nutrients.energy = 1200;
  assert.equal(validPreparedBatch(batch), true);
  assert.equal(batchRemaining(batch, []).fraction, 1);
});
test("grams and servings subtract from the same declared batch and scale only once", () => {
  const batch = prepareBatch("b", recipe, "2026-10-07", 2);
  const a = logBatchPortion(batch, [], 200, "g", "a", "2026-10-07", "Lunch", 3);
  assert.equal(a.nutrients.energy, 300);
  assert.equal(a.quantity, a.basisAmount);
  const b = logBatchPortion(
    batch,
    [a],
    1,
    "serving",
    "c",
    "2026-10-08",
    "Lunch",
    4,
  );
  assert.equal(b.nutrients.energy, 300);
  assert.deepEqual(batchRemaining(batch, [a, b]), {
    fraction: 0.5,
    grams: 400,
    servings: 2,
    overdrawn: false,
  });
  assert.throws(() =>
    logBatchPortion(batch, [a, b], 500, "g", "d", "2026-10-08", "Lunch", 4),
  );
});
test("corrections and tombstones update remaining; planned entries do not consume", () => {
  const batch = prepareBatch("b", recipe, "2026-10-07", 2);
  const a = logBatchPortion(batch, [], 200, "g", "a", "2026-10-07", "Lunch", 3);
  assert.equal(batchRemaining(batch, [{ ...a, quantity: 100 }]).grams, 700);
  assert.equal(batchRemaining(batch, [{ ...a, deleted: true }]).grams, 800);
  assert.equal(
    batchRemaining(batch, [{ ...a, planned: true } as typeof a]).grams,
    800,
  );
  const over = batchRemaining(batch, [{ ...a, quantity: 1000 }]);
  assert.equal(over.grams, 0);
  assert.equal(over.overdrawn, true);
});
test("missing cooked weight cannot be inferred and malformed records fail validation", () => {
  const { cookedWeightGrams: _g, ...without } = recipe;
  const batch = prepareBatch("b", without, "2026-10-07", 2);
  assert.equal(batchRemaining(batch, []).grams, null);
  assert.throws(() =>
    logBatchPortion(batch, [], 100, "g", "a", "2026-10-07", "Lunch", 3),
  );
  assert.equal(
    validPreparedBatch({ ...batch, recipe: { ...batch.recipe, servings: 0 } }),
    false,
  );
  assert.equal(validMealTemplate({ id: "bad", items: [null] }), false);
});
test("repeated meals do not retain prepared-batch or planned-consumption tags", () => {
  const template = createMealTemplate(
    "t",
    "Batch lunch",
    [{ ...entry, batchId: "original", batchFraction: 0.5 } as FoodEntry],
    2,
  );
  const repeated = Object.values(
    repeatMeal(template, "new", "2026-10-08", "Lunch", 1, 3),
  )[0];
  assert.equal("batchId" in repeated, false);
  assert.equal("batchFraction" in repeated, false);
  assert.equal("planned" in repeated, false);
});
test("retrying an existing prepared portion is idempotent even when batch is exhausted", () => {
  const batch = prepareBatch("b", recipe, "2026-10-07", 2);
  const first = logBatchPortion(
    batch,
    [],
    800,
    "g",
    "same",
    "2026-10-07",
    "Lunch",
    3,
  );
  const retry = logBatchPortion(
    batch,
    [first],
    800,
    "g",
    "same",
    "2026-10-07",
    "Lunch",
    3,
  );
  assert.deepEqual(retry, first);
  assert.equal(batchRemaining(batch, [retry]).fraction, 0);
});
test("batch corrections recalculate fraction for changed basis and refuse unsupported units", () => {
  const batch = prepareBatch("b", recipe, "2026-10-07", 2);
  const entry = logBatchPortion(
    batch,
    [],
    200,
    "g",
    "e",
    "2026-10-07",
    "Lunch",
    3,
  );
  assert.deepEqual(correctBatchBasis(entry, 100, "g", batch), {
    batchId: "b",
    batchFraction: 0.125,
  });
  assert.deepEqual(correctBatchBasis(entry, 1, "serving", batch), {
    batchId: "b",
    batchFraction: 0.25,
  });
  assert.deepEqual(correctBatchBasis(entry, 200, "g"), {
    batchId: "b",
    batchFraction: 0.25,
  });
  assert.deepEqual(
    correctBatchBasis(
      { ...entry, batchId: undefined, batchFraction: undefined },
      100,
      "g",
    ),
    {},
  );
  assert.throws(() => correctBatchBasis(entry, 100, "g"));
  assert.throws(() => correctBatchBasis(entry, 100, "ml", batch));
});
test("malformed flags dates snapshots and overflowing portions fail validation", () => {
  const t = createMealTemplate("t", "Lunch", [entry], 2);
  const b = prepareBatch("b", recipe, "2026-10-07", 2);
  assert.equal(validMealTemplate({ ...t, deleted: "true" }), false);
  assert.equal(
    validMealTemplate({
      ...t,
      items: [
        {
          ...t.items[0],
          food: { ...t.items[0].food, nutrients: { energy: 1e308 } },
          quantity: 1000000,
        },
      ],
    }),
    false,
  );
  assert.equal(validPreparedBatch({ ...b, preparedDate: "0000-10-07" }), false);
  assert.equal(validPreparedBatch({ ...b, deleted: "true" }), false);
  assert.equal(
    validPreparedBatch({ ...b, recipe: { ...b.recipe, ingredients: [null] } }),
    false,
  );
});
test("a prepared batch requires an actual declared yield and string date", () => {
  const { servings: _s, cookedWeightGrams: _g, ...without } = recipe;
  assert.throws(() =>
    prepareBatch("b", { ...without, basisUnit: "ml" }, "2026-10-07", 2),
  );
  assert.equal(
    validPreparedBatch({
      id: "b",
      recipe,
      preparedDate: ["2026-10-07"],
      updatedAt: 2,
    }),
    false,
  );
});

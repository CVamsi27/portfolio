import test from "node:test";
import assert from "node:assert/strict";
import {
  mealEntries,
  validateMealDraft,
  type MealDraft,
} from "./nutrition-meals.ts";

const draft = (): MealDraft => ({
  id: "meal-1",
  date: "2026-10-07",
  meal: "Lunch",
  updatedAt: 1,
  items: [
    {
      id: "item-1",
      quantity: 150,
      food: {
        id: "rice",
        name: "Cooked rice",
        basisAmount: 100,
        basisUnit: "g",
        nutrients: { energy: 130, sodium: 0, calcium: null },
        source: "custom",
        updatedAt: 1,
      },
    },
  ],
});

test("meal projection keeps immutable portion snapshots and stable IDs on retry", () => {
  const original = draft();
  const entries = mealEntries(original, 7);
  assert.deepEqual(mealEntries(original, 7), entries);
  const entry = entries["meal-1:item-1"];
  assert.equal(entry.foodId, "rice");
  assert.equal(entry.quantity, 150);
  assert.equal(entry.basisAmount, 100);
  assert.deepEqual(entry.nutrients, { energy: 130, sodium: 0, calcium: null });
  assert.equal((entry as typeof entry & { mealId: string }).mealId, "meal-1");
  original.items[0].food.nutrients.energy = 999;
  assert.equal(entry.nutrients.energy, 130);
});

test("draft validation permits empty editing drafts but saving requires food", () => {
  const empty = { ...draft(), items: [] };
  assert.equal(validateMealDraft(empty), true);
  assert.throws(() => mealEntries(empty, 3), /food/i);
});

test("every row is validated before projecting a meal", () => {
  const invalid = draft();
  invalid.items.push({ ...invalid.items[0], id: "other", quantity: 0 });
  assert.equal(validateMealDraft(invalid), true);
  assert.throws(() => mealEntries(invalid, 3));
  invalid.items[1].quantity = 1;
  invalid.items[1].id = "item-1";
  assert.equal(validateMealDraft(invalid), false);
});

test("validation rejects ambiguous IDs, impossible dates, oversized and non-finite values", () => {
  for (const change of [
    { date: "2026-02-30" },
    { date: "2026-1-01" },
    { date: "0000-01-01" },
    { id: "a:b" },
    { meal: " " },
    { note: "x".repeat(2001) },
    { updatedAt: Infinity },
    {
      items: Array.from({ length: 101 }, (_, i) => ({
        ...draft().items[0],
        id: String(i),
      })),
    },
  ])
    assert.equal(validateMealDraft({ ...draft(), ...change }), false);
  for (const quantity of [NaN, Infinity, -1, 1000001])
    assert.equal(
      validateMealDraft({
        ...draft(),
        items: [{ ...draft().items[0], quantity }],
      }),
      false,
    );
  assert.throws(() => mealEntries(draft(), NaN));
});

test("restored snapshots reject undeclared nutrient names and malformed flags", () => {
  const malformed = draft();
  malformed.items[0].food.nutrients = JSON.parse('{"constructor":100}');
  assert.equal(validateMealDraft(malformed), false);
  malformed.items[0].food.nutrients = { energy: 1 };
  Object.assign(malformed.items[0].food, { deleted: "true" });
  assert.equal(validateMealDraft(malformed), false);
});

test("cleared quantity persists as an incomplete draft but cannot become a consumed meal", () => {
  const incomplete = draft();
  incomplete.items[0].quantity = 0;
  assert.equal(validateMealDraft(incomplete), true);
  assert.throws(() => mealEntries(incomplete, 9), /positive quantity/i);
});

test("meal notes and date survive without leaking deleted food state", () => {
  const original = { ...draft(), note: "Packed lunch" };
  original.items[0].food.deleted = true;
  assert.equal(validateMealDraft(original), false);
  delete original.items[0].food.deleted;
  const result = mealEntries(original, 8)["meal-1:item-1"];
  assert.equal(result.note, "Packed lunch");
  assert.equal(result.date, original.date);
  assert.equal(result.updatedAt, 8);
});

test("retrying a locally saved meal cannot overwrite a later edit or deletion", async () => {
  const { mergeMealEntries } = await import("./nutrition-meals.ts");
  const incoming = mealEntries(draft(), 7);
  assert.deepEqual(mergeMealEntries(incoming, incoming), incoming);
  const id = Object.keys(incoming)[0];
  assert.throws(
    () =>
      mergeMealEntries(
        { [id]: { ...incoming[id], quantity: 75, updatedAt: 8 } },
        incoming,
      ),
    /changed|conflict/i,
  );
  assert.throws(
    () =>
      mergeMealEntries(
        { [id]: { ...incoming[id], deleted: true, updatedAt: 8 } },
        incoming,
      ),
    /changed|conflict/i,
  );
  assert.deepEqual(mergeMealEntries({}, incoming), incoming);
});

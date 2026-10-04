import test from "node:test";
import assert from "node:assert/strict";
import {
  scaleNutrients,
  nutrientTotals,
  recipeNutrients,
  validNutrients,
} from "./nutrition.ts";

test("portion amounts scale known values and preserve unknown nutrients", () => {
  assert.deepEqual(
    scaleNutrients(
      { energy: 200, protein: 10, calcium: null, sodium: 0 },
      150,
      100,
    ),
    { energy: 300, protein: 15, calcium: null, sodium: 0 },
  );
  assert.throws(() => scaleNutrients({ energy: 20 }, -1, 100));
});
test("subtotal coverage distinguishes absent and zero from complete intake", () => {
  const result = nutrientTotals([
    { energy: 200, calcium: 0 },
    { energy: null, calcium: null },
  ]);
  assert.equal(result.values.energy, 200);
  assert.equal(result.coverage.energy, 1);
  assert.equal(result.values.calcium, 0);
  assert.equal(result.coverage.calcium, 1);
  assert.equal(nutrientTotals([{ protein: null }]).values.protein, null);
});
test("recipe shares use actual declared batch yield", () => {
  assert.equal(
    recipeNutrients([{ energy: 400 }, { energy: 800 }], 250, 1000).energy,
    300,
  );
  assert.equal(
    recipeNutrients([{ calcium: 5 }, { calcium: null }], 1, 4).calcium,
    null,
  );
});
test("nutrient values reject negatives, non-finite and incompatible shapes", () => {
  assert.equal(validNutrients({ energy: 0, protein: null }), true);
  assert.equal(validNutrients({ energy: -1 }), false);
  assert.equal(validNutrients({ energy: Infinity }), false);
  assert.equal(validNutrients({ energy: "4" }), false);
});

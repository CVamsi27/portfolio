import test from "node:test";
import assert from "node:assert/strict";
import {
  convertRecipePortion,
  recipeMetrics,
  resizeIngredient,
  type RichRecipe,
} from "./nutrition-recipes.ts";
const recipe: RichRecipe = {
  id: "stew",
  name: "Stew",
  basisAmount: 4,
  basisUnit: "serving",
  source: "Recipe estimate",
  updatedAt: 1,
  servings: 4,
  cookedWeightGrams: 800,
  nutrients: { energy: 1200, protein: 60, calcium: null },
  ingredients: [
    {
      name: "Lentils",
      quantity: 200,
      unit: "g",
      nutrients: { energy: 600, protein: 30, calcium: null },
    },
    {
      name: "Potato",
      quantity: 300,
      unit: "g",
      nutrients: { energy: 600, protein: 30, calcium: 20 },
    },
  ],
};
test("weighed portions use final cooked weight rather than summed raw ingredient weight", () => {
  const result = convertRecipePortion(recipe, 100, "g");
  assert.equal(result.basisUnit, "g");
  assert.equal((result.nutrients.energy! * 100) / result.basisAmount, 150);
  assert.equal(result.nutrients.calcium, null);
});
test("serving portions and weighed portions agree using declared dual yield", () => {
  const result = convertRecipePortion(recipe, 1, "serving");
  assert.equal(result.nutrients.energy! / result.basisAmount, 300);
  assert.equal(result.nutrients.protein! / result.basisAmount, 15);
});
test("legacy serving recipes retain their declared yield without fabricating grams", () => {
  const { servings: _s, cookedWeightGrams: _g, ...legacy } = recipe;
  assert.equal(
    convertRecipePortion(legacy, 1, "serving").nutrients.energy! /
      convertRecipePortion(legacy, 1, "serving").basisAmount,
    300,
  );
  assert.throws(() => convertRecipePortion(legacy, 100, "g"));
});
test("legacy gram recipes keep gram yield without assuming serving count", () => {
  const legacy = {
    ...recipe,
    servings: undefined,
    cookedWeightGrams: undefined,
    basisUnit: "g" as const,
    basisAmount: 800,
  };
  assert.equal(recipeMetrics(legacy).per100g?.energy, 150);
  assert.equal(recipeMetrics(legacy).perServing, null);
  assert.throws(() => convertRecipePortion(legacy, 1, "serving"));
});
test("recipe preview marks partially known micronutrients unknown and gives all yield views", () => {
  const metrics = recipeMetrics(recipe);
  assert.equal(metrics.batch.energy, 1200);
  assert.equal(metrics.perServing?.energy, 300);
  assert.equal(metrics.per100g?.protein, 7.5);
  assert.equal(metrics.batch.calcium, null);
});
test("ingredient editing rescales its saved full quantity snapshot without changing original", () => {
  const ingredient = recipe.ingredients[0];
  const result = resizeIngredient(ingredient, 100);
  assert.equal(result.nutrients.energy, 300);
  assert.equal(result.nutrients.calcium, null);
  assert.equal(ingredient.nutrients.energy, 600);
  assert.equal(result.quantity, 100);
});
test("invalid quantity and declared yield never produce a silently plausible estimate", () => {
  for (const quantity of [0, -1, NaN, Infinity])
    assert.throws(() => convertRecipePortion(recipe, quantity, "g"));
  assert.throws(() =>
    convertRecipePortion({ ...recipe, cookedWeightGrams: 0 }, 100, "g"),
  );
  assert.throws(() => resizeIngredient(recipe.ingredients[0], 0));
});

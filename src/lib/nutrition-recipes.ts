import {
  recipeNutrients,
  scaleNutrients,
  type Food,
  type Recipe,
  type Nutrients,
} from "./nutrition.ts";
/** Ingredients remain immutable snapshots of nutrients for their full recorded quantity. */
export type RichRecipe = Recipe & {
  servings?: number;
  cookedWeightGrams?: number;
  notes?: string;
};
function positive(value: number) {
  return Number.isFinite(value) && value > 0;
}
export function recipeMetrics(recipe: RichRecipe): {
  batch: Nutrients;
  perServing: Nutrients | null;
  per100g: Nutrients | null;
  servings: number | null;
  cookedWeightGrams: number | null;
} {
  const servings =
    recipe.servings ??
    (recipe.basisUnit === "serving" ? recipe.basisAmount : null);
  const cookedWeightGrams =
    recipe.cookedWeightGrams ??
    (recipe.basisUnit === "g" ? recipe.basisAmount : null);
  if (servings !== null && !positive(servings))
    throw new Error("Enter a positive serving count.");
  if (cookedWeightGrams !== null && !positive(cookedWeightGrams))
    throw new Error("Enter a positive final cooked weight.");
  const batch = recipe.ingredients.length
    ? recipeNutrients(
        recipe.ingredients.map((item) => item.nutrients),
        1,
        1,
      )
    : recipe.nutrients;
  return {
    batch,
    servings,
    cookedWeightGrams,
    perServing: servings ? scaleNutrients(batch, 1, servings) : null,
    per100g: cookedWeightGrams
      ? scaleNutrients(batch, 100, cookedWeightGrams)
      : null,
  };
}
/** Portion view: quantity matches basisAmount, so entry consumers must not scale it again. */
export function convertRecipePortion(
  recipe: RichRecipe,
  quantity: number,
  unit: "g" | "serving",
): Food {
  if (!positive(quantity)) throw new Error("Enter a positive recipe quantity.");
  const metrics = recipeMetrics(recipe);
  const yieldAmount =
    unit === "g" ? metrics.cookedWeightGrams : metrics.servings;
  if (!yieldAmount)
    throw new Error(
      unit === "g"
        ? "Record the final cooked weight before logging grams."
        : "Record the serving count before logging servings.",
    );
  return {
    ...recipe,
    basisAmount: quantity,
    basisUnit: unit,
    nutrients: scaleNutrients(metrics.batch, quantity, yieldAmount),
  };
}
export function resizeIngredient(
  ingredient: Recipe["ingredients"][number],
  quantity: number,
): Recipe["ingredients"][number] {
  return {
    ...ingredient,
    quantity,
    nutrients: scaleNutrients(
      ingredient.nutrients,
      quantity,
      ingredient.quantity,
    ),
  };
}

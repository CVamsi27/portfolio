import {
  validEntry,
  validFood,
  type Food,
  type FoodEntry,
} from "./nutrition.ts";
import {
  recipeMetrics,
  convertRecipePortion,
  type RichRecipe,
} from "./nutrition-recipes.ts";
export type MealTemplate = {
  id: string;
  name: string;
  items: Array<{ food: Food; quantity: number }>;
  updatedAt: number;
  deleted?: boolean;
};
export type PreparedBatch = {
  id: string;
  recipe: RichRecipe;
  preparedDate: string;
  updatedAt: number;
  deleted?: boolean;
};
export type BatchEntry = FoodEntry & {
  batchId: string;
  batchFraction: number;
  planned?: boolean;
};
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const positive = (n: number) => Number.isFinite(n) && n > 0 && n <= 1000000;
const dateValid = (date: string) =>
  typeof date === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !date.startsWith("0000-") &&
  Number.isFinite(Date.parse(`${date}T12:00:00Z`)) &&
  new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
const idValid = (id: unknown) =>
  typeof id === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(id);
const stampValid = (n: unknown) =>
  typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
export function validMealTemplate(value: unknown): value is MealTemplate {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const t = value as MealTemplate;
  return (
    idValid(t.id) &&
    typeof t.name === "string" &&
    t.name.trim().length > 0 &&
    t.name.length <= 300 &&
    stampValid(t.updatedAt) &&
    (t.deleted === undefined || typeof t.deleted === "boolean") &&
    Array.isArray(t.items) &&
    t.items.length > 0 &&
    t.items.length <= 100 &&
    t.items.every(
      (i) =>
        i &&
        validFood(i.food) &&
        positive(i.quantity) &&
        Object.values(i.food.nutrients).every(
          (n) =>
            n === null ||
            Number.isFinite((n * i.quantity) / i.food.basisAmount),
        ),
    )
  );
}
export function validPreparedBatch(value: unknown): value is PreparedBatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const b = value as PreparedBatch;
  if (
    !idValid(b.id) ||
    !stampValid(b.updatedAt) ||
    (b.deleted !== undefined && typeof b.deleted !== "boolean") ||
    !dateValid(b.preparedDate) ||
    !validFood(b.recipe) ||
    (b.recipe.notes !== undefined &&
      (typeof b.recipe.notes !== "string" || b.recipe.notes.length > 2000)) ||
    !Array.isArray(b.recipe.ingredients) ||
    b.recipe.ingredients.length > 100
  )
    return false;
  try {
    const metrics = recipeMetrics(b.recipe);
    if (
      (metrics.servings === null && metrics.cookedWeightGrams === null) ||
      (metrics.servings !== null && !positive(metrics.servings)) ||
      (metrics.cookedWeightGrams !== null &&
        !positive(metrics.cookedWeightGrams))
    )
      return false;
    return b.recipe.ingredients.every(
      (i) =>
        i &&
        typeof i.name === "string" &&
        i.name.trim().length > 0 &&
        i.name.length <= 300 &&
        positive(i.quantity) &&
        ["g", "ml", "serving"].includes(i.unit) &&
        validFood({ ...b.recipe, nutrients: i.nutrients }),
    );
  } catch {
    return false;
  }
}
export function createMealTemplate(
  id: string,
  name: string,
  entries: FoodEntry[],
  updatedAt: number,
): MealTemplate {
  if (
    !entries.length ||
    entries.some(
      (e) =>
        !validEntry(e) ||
        e.deleted ||
        (e as FoodEntry & { planned?: boolean }).planned,
    )
  )
    throw new Error("Choose consumed, active food records to save a meal.");
  const result = {
    id,
    name: name.trim(),
    items: entries.map((e) => ({ food: clone(e), quantity: e.quantity })),
    updatedAt,
  };
  if (!validMealTemplate(result))
    throw new Error("Enter a meal name and valid food portions.");
  return result;
}
export function repeatMeal(
  template: MealTemplate,
  operationId: string,
  date: string,
  meal: string,
  multiplier: number,
  updatedAt: number,
): Record<string, FoodEntry> {
  if (
    !validMealTemplate(template) ||
    template.deleted ||
    !idValid(operationId) ||
    !dateValid(date) ||
    !positive(multiplier) ||
    !stampValid(updatedAt)
  )
    throw new Error("Review the meal date and positive portions.");
  return Object.fromEntries(
    template.items.map((item, index) => {
      const id = `${operationId}:${index}`;
      // Explicit fields deliberately omit old meal/batch/plan tags from source entries.
      const f = item.food;
      const entry = {
        id,
        name: f.name,
        basisAmount: f.basisAmount,
        basisUnit: f.basisUnit,
        nutrients: clone(f.nutrients),
        source: f.source,
        foodId: (f as FoodEntry).foodId ?? f.id,
        date,
        meal,
        quantity: item.quantity * multiplier,
        updatedAt,
        mealId: operationId,
      };
      if (!validEntry(entry) || !positive(entry.quantity))
        throw new Error("Enter a meal name and valid portions.");
      return [id, entry];
    }),
  );
}
export function prepareBatch(
  id: string,
  recipe: RichRecipe,
  preparedDate: string,
  updatedAt: number,
): PreparedBatch {
  const result = { id, recipe: clone(recipe), preparedDate, updatedAt };
  if (!validPreparedBatch(result))
    throw new Error("Review the recipe and declared yield before preparing.");
  return result;
}
export function batchRemaining(batch: PreparedBatch, entries: FoodEntry[]) {
  if (!validPreparedBatch(batch)) throw new Error("Invalid prepared batch.");
  const metrics = recipeMetrics(batch.recipe);
  const consumed = entries.reduce((sum, e) => {
    const tagged = e as BatchEntry;
    if (e.deleted || tagged.planned || tagged.batchId !== batch.id) return sum;
    // Editing quantity changes consumption relative to the saved nutrient snapshot basis.
    if (
      !positive(tagged.batchFraction) ||
      !positive(e.quantity) ||
      !positive(e.basisAmount)
    )
      throw new Error("A batch portion needs correction before logging more.");
    return sum + (tagged.batchFraction * e.quantity) / e.basisAmount;
  }, 0);
  const fraction = Math.max(0, 1 - consumed);
  return {
    fraction,
    grams:
      metrics.cookedWeightGrams === null
        ? null
        : fraction * metrics.cookedWeightGrams,
    servings: metrics.servings === null ? null : fraction * metrics.servings,
    overdrawn: consumed > 1 + 1e-9,
  };
}
export function logBatchPortion(
  batch: PreparedBatch,
  entries: FoodEntry[],
  quantity: number,
  unit: "g" | "serving",
  operationId: string,
  date: string,
  meal: string,
  updatedAt: number,
): BatchEntry {
  if (
    batch.deleted ||
    !idValid(operationId) ||
    !dateValid(date) ||
    !stampValid(updatedAt)
  )
    throw new Error("Review the batch and logging date.");
  const metrics = recipeMetrics(batch.recipe);
  const yieldAmount =
    unit === "g" ? metrics.cookedWeightGrams : metrics.servings;
  if (!yieldAmount || !positive(quantity))
    throw new Error("Record a positive declared yield and portion.");
  const fraction = quantity / yieldAmount;
  // Retries reuse the same ID and do not count their own already-written portion twice.
  const remaining = batchRemaining(
    batch,
    entries.filter((e) => e.id !== operationId),
  );
  if (remaining.overdrawn || fraction > remaining.fraction + 1e-9)
    throw new Error(
      "This portion exceeds the declared remaining batch. Correct earlier portions first.",
    );
  const food = convertRecipePortion(batch.recipe, quantity, unit);
  const result = {
    ...food,
    id: operationId,
    foodId: batch.recipe.id,
    date,
    meal,
    quantity,
    updatedAt,
    batchId: batch.id,
    batchFraction: fraction,
  };
  if (!validEntry(result)) throw new Error("Review the meal name and portion.");
  return result;
}
/** Keep physical batch provenance when a consumed portion's nutrient basis is edited. */
export function correctBatchBasis(
  entry: FoodEntry,
  basisAmount: number,
  basisUnit: Food["basisUnit"],
  batch?: PreparedBatch,
): { batchId: string; batchFraction: number } | {} {
  if (entry.batchId === undefined && entry.batchFraction === undefined)
    return {};
  if (
    !entry.batchId ||
    !positive(entry.batchFraction ?? 0) ||
    !positive(basisAmount)
  )
    throw new Error(
      "Correct the saved batch portion before changing its basis.",
    );
  if (basisAmount === entry.basisAmount && basisUnit === entry.basisUnit)
    return { batchId: entry.batchId, batchFraction: entry.batchFraction! };
  if (!batch || batch.id !== entry.batchId || !validPreparedBatch(batch))
    throw new Error(
      "The prepared batch snapshot is required to change this portion basis.",
    );
  const metrics = recipeMetrics(batch.recipe);
  const yieldAmount =
    basisUnit === "g"
      ? metrics.cookedWeightGrams
      : basisUnit === "serving"
        ? metrics.servings
        : null;
  if (!yieldAmount)
    throw new Error("Choose a declared gram or serving basis for this batch.");
  return { batchId: entry.batchId, batchFraction: basisAmount / yieldAmount };
}

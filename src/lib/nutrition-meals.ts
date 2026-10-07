import {
  NUTRIENTS,
  validFood,
  type Food,
  type FoodEntry,
} from "./nutrition.ts";

export type MealDraft = {
  id: string;
  date: string;
  meal: string;
  items: Array<{ id: string; food: Food; quantity: number }>;
  note?: string;
  updatedAt: number;
};

const safeId = (id: unknown): id is string =>
  typeof id === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(id);
const timestamp = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

/** Empty drafts are valid while editing; consumed meals require at least one row. */
export function validateMealDraft(value: unknown): value is MealDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const draft = value as MealDraft;
  if (
    !safeId(draft.id) ||
    typeof draft.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) ||
    draft.date.startsWith("0000-") ||
    !Number.isFinite(Date.parse(`${draft.date}T12:00:00Z`)) ||
    new Date(`${draft.date}T12:00:00Z`).toISOString().slice(0, 10) !==
      draft.date ||
    typeof draft.meal !== "string" ||
    !draft.meal.trim() ||
    draft.meal.length > 100 ||
    !timestamp(draft.updatedAt) ||
    (draft.note !== undefined &&
      (typeof draft.note !== "string" || draft.note.length > 2000)) ||
    !Array.isArray(draft.items) ||
    draft.items.length > 100
  )
    return false;
  const ids = new Set<string>();
  return draft.items.every((item) => {
    if (
      !item ||
      !safeId(item.id) ||
      ids.has(item.id) ||
      !validFood(item.food) ||
      Array.isArray(item.food) ||
      item.food.deleted === true ||
      !item.food.id ||
      item.food.id.length > 500 ||
      (item.food.deleted !== undefined &&
        typeof item.food.deleted !== "boolean") ||
      (item.food.favorite !== undefined &&
        typeof item.food.favorite !== "boolean") ||
      item.food.source.length > 1000 ||
      !timestamp(item.food.updatedAt) ||
      !Number.isFinite(item.quantity) ||
      item.quantity < 0 ||
      item.quantity > 1000000 ||
      Object.keys(item.food.nutrients).some(
        (key) => !Object.hasOwn(NUTRIENTS, key),
      ) ||
      Object.values(item.food.nutrients).some(
        (n) =>
          n !== null &&
          !Number.isFinite((n * item.quantity) / item.food.basisAmount),
      )
    )
      return false;
    ids.add(item.id);
    return true;
  });
}

/** Pure all-or-nothing projection. Stable IDs make retries converge to the same rows. */
export function mealEntries(
  draft: MealDraft,
  stamp: number,
): Record<string, FoodEntry> {
  if (!validateMealDraft(draft) || !timestamp(stamp))
    throw new Error("Invalid meal draft.");
  if (!draft.items.length)
    throw new Error("Add at least one food before saving a meal.");
  if (draft.items.some(({ quantity }) => quantity <= 0))
    throw new Error(
      "Enter a positive quantity for every food before saving a meal.",
    );
  return Object.fromEntries(
    draft.items.map(({ id: itemId, food, quantity }) => {
      const id = `${draft.id}:${itemId}`;
      const entry: FoodEntry & { mealId: string } = {
        id,
        mealId: draft.id,
        foodId: food.id,
        name: food.name,
        basisAmount: food.basisAmount,
        basisUnit: food.basisUnit,
        nutrients: { ...food.nutrients },
        source: food.source,
        updatedAt: stamp,
        date: draft.date,
        meal: draft.meal,
        quantity,
        ...(draft.note === undefined ? {} : { note: draft.note }),
      };
      return [id, entry];
    }),
  );
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
/** An acknowledged meal retry is harmless; a later correction must never be overwritten. */
export function mergeMealEntries(
  existing: Record<string, FoodEntry>,
  incoming: Record<string, FoodEntry>,
) {
  for (const [id, entry] of Object.entries(incoming)) {
    if (existing[id] && canonical(existing[id]) !== canonical(entry))
      throw new Error(
        "This meal changed after it was saved. Discard the draft and review the existing meal.",
      );
  }
  return { ...existing, ...incoming };
}

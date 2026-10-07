import { validEntry, type Food, type FoodEntry } from "./nutrition.ts";

/** Latest consumed snapshot per food; repeating food never consumes an old batch again. */
export function recentFoodSnapshots(
  entries: FoodEntry[],
  limit = 20,
): Record<string, Food> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 500)
    throw Error("Choose a recent-food limit between 1 and 500.");
  const rows = entries
    .filter((e) => validEntry(e) && !e.deleted && !e.planned)
    .sort(
      (a, b) =>
        b.updatedAt - a.updatedAt ||
        b.date.localeCompare(a.date) ||
        b.id.localeCompare(a.id),
    );
  const foods: Record<string, Food> = Object.create(null);
  for (const row of rows) {
    if (Object.hasOwn(foods, row.foodId)) continue;
    foods[row.foodId] = {
      id: row.foodId,
      name: row.name,
      basisAmount: row.basisAmount,
      basisUnit: row.basisUnit,
      nutrients: { ...row.nutrients },
      source: row.source,
      updatedAt: row.updatedAt,
      ...(row.portions
        ? { portions: row.portions.map((p) => ({ ...p })) }
        : {}),
    };
    if (Object.keys(foods).length === limit) break;
  }
  return foods;
}

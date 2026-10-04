"use client";
import { useSyncedStorage } from "./use-synced-storage";
import type { Food, FoodEntry, Recipe, Target } from "./nutrition";
const options = { accountScoped: true, records: true };
export function useNutrition() {
  const entries = useSyncedStorage<Record<string, FoodEntry>>(
    "nutrition:entries",
    {},
    options,
  );
  const foods = useSyncedStorage<Record<string, Food>>(
    "nutrition:foods",
    {},
    options,
  );
  const recipes = useSyncedStorage<Record<string, Recipe>>(
    "nutrition:recipes",
    {},
    options,
  );
  const targets = useSyncedStorage<Record<string, Target>>(
    "nutrition:targets",
    {},
    options,
  );
  return { entries, foods, recipes, targets };
}

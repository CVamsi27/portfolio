"use client";
import { useSyncedStorage } from "./use-synced-storage";
import type { Food, FoodEntry, Recipe, Target } from "./nutrition";
import type { NutritionProgram, NutritionDay } from "./nutrition-program";
import type { MealTemplate, PreparedBatch } from "./nutrition-reuse";
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
  const programs = useSyncedStorage<Record<string, NutritionProgram>>(
    "nutrition:programs",
    {},
    options,
  );
  const days = useSyncedStorage<Record<string, NutritionDay>>(
    "nutrition:days",
    {},
    options,
  );
  const templates = useSyncedStorage<Record<string, MealTemplate>>(
    "nutrition:templates",
    {},
    options,
  );
  const batches = useSyncedStorage<Record<string, PreparedBatch>>(
    "nutrition:batches",
    {},
    options,
  );
  return {
    entries,
    foods,
    recipes,
    targets,
    programs,
    days,
    templates,
    batches,
  };
}

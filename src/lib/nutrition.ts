export const NUTRIENTS = {
  energy: { label: "Calories", unit: "kcal", fdc: 1008 },
  protein: { label: "Protein", unit: "g", fdc: 1003 },
  carbs: { label: "Carbohydrate", unit: "g", fdc: 1005 },
  fat: { label: "Fat", unit: "g", fdc: 1004 },
  fibre: { label: "Fibre", unit: "g", fdc: 1079 },
  sugar: { label: "Total sugar", unit: "g", fdc: 2000 },
  saturatedFat: { label: "Saturated fat", unit: "g", fdc: 1258 },
  vitaminA: { label: "Vitamin A (RAE)", unit: "µg", fdc: 1106 },
  vitaminC: { label: "Vitamin C", unit: "mg", fdc: 1162 },
  vitaminD: { label: "Vitamin D", unit: "µg", fdc: 1114 },
  vitaminE: { label: "Vitamin E (alpha-tocopherol)", unit: "mg", fdc: 1109 },
  vitaminK: { label: "Vitamin K", unit: "µg", fdc: 1185 },
  thiamin: { label: "B1 / Thiamin", unit: "mg", fdc: 1165 },
  riboflavin: { label: "B2 / Riboflavin", unit: "mg", fdc: 1166 },
  niacin: { label: "B3 / Niacin", unit: "mg", fdc: 1167 },
  pantothenic: { label: "B5 / Pantothenic acid", unit: "mg", fdc: 1170 },
  vitaminB6: { label: "Vitamin B6", unit: "mg", fdc: 1175 },
  biotin: { label: "B7 / Biotin", unit: "µg", fdc: 1176 },
  folate: { label: "Folate (DFE)", unit: "µg", fdc: 1190 },
  vitaminB12: { label: "Vitamin B12", unit: "µg", fdc: 1178 },
  calcium: { label: "Calcium", unit: "mg", fdc: 1087 },
  iron: { label: "Iron", unit: "mg", fdc: 1089 },
  magnesium: { label: "Magnesium", unit: "mg", fdc: 1090 },
  phosphorus: { label: "Phosphorus", unit: "mg", fdc: 1091 },
  potassium: { label: "Potassium", unit: "mg", fdc: 1092 },
  sodium: { label: "Sodium", unit: "mg", fdc: 1093 },
  zinc: { label: "Zinc", unit: "mg", fdc: 1095 },
  copper: { label: "Copper", unit: "mg", fdc: 1098 },
  manganese: { label: "Manganese", unit: "mg", fdc: 1101 },
  iodine: { label: "Iodine", unit: "µg", fdc: 1100 },
  selenium: { label: "Selenium", unit: "µg", fdc: 1103 },
} as const;
export type NutrientKey = keyof typeof NUTRIENTS;
export type Nutrients = Partial<Record<NutrientKey, number | null>>;
export type Unit = "g" | "ml" | "serving";
export type Food = {
  id: string;
  name: string;
  basisAmount: number;
  basisUnit: Unit;
  nutrients: Nutrients;
  source: string;
  updatedAt: number;
  deleted?: boolean;
  favorite?: boolean;
};
export type FoodEntry = Food & {
  date: string;
  meal: string;
  quantity: number;
  foodId: string;
  note?: string;
};
export type Recipe = Food & {
  ingredients: Array<{
    name: string;
    nutrients: Nutrients;
    quantity: number;
    unit: Unit;
  }>;
};
export type Target = {
  id: NutrientKey;
  amount: number;
  kind: "reference" | "limit";
  updatedAt: number;
  deleted?: boolean;
};
export const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
export const MAIN_NUTRIENTS: NutrientKey[] = [
  "energy",
  "protein",
  "carbs",
  "fat",
  "fibre",
];
export function validNutrients(value: unknown): value is Nutrients {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([key, v]) =>
      key in NUTRIENTS &&
      (v === null || (typeof v === "number" && Number.isFinite(v) && v >= 0)),
  );
}
export function scaleNutrients(
  values: Nutrients,
  quantity: number,
  basis: number,
): Nutrients {
  if (
    !validNutrients(values) ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(basis) ||
    basis <= 0
  )
    throw new Error("Enter a positive quantity and portion basis.");
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === null ? null : (value * quantity) / basis,
    ]),
  );
}
export function nutrientTotals(values: Nutrients[]) {
  const keys = Object.keys(NUTRIENTS) as NutrientKey[];
  const totals: Nutrients = {};
  const coverage = {} as Record<NutrientKey, number>;
  for (const key of keys) {
    const known = values
      .map((value) => value[key])
      .filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value),
      );
    coverage[key] = known.length;
    totals[key] = known.length
      ? known.reduce((sum, value) => sum + value, 0)
      : null;
  }
  return { values: totals, coverage, count: values.length };
}
export function recipeNutrients(
  ingredients: Nutrients[],
  quantity: number,
  yieldAmount: number,
): Nutrients {
  const result = nutrientTotals(ingredients);
  for (const key of Object.keys(result.values) as NutrientKey[])
    if (result.coverage[key] !== ingredients.length) result.values[key] = null;
  return scaleNutrients(result.values, quantity, yieldAmount);
}
export function validFood(value: unknown): value is Food {
  if (!value || typeof value !== "object") return false;
  const f = value as Food;
  return (
    typeof f.id === "string" &&
    typeof f.name === "string" &&
    f.name.trim().length > 0 &&
    f.name.length <= 300 &&
    ["g", "ml", "serving"].includes(f.basisUnit) &&
    Number.isFinite(f.basisAmount) &&
    f.basisAmount > 0 &&
    Number.isFinite(f.updatedAt) &&
    validNutrients(f.nutrients) &&
    typeof f.source === "string"
  );
}
export function validEntry(value: unknown): value is FoodEntry {
  if (!validFood(value)) return false;
  const e = value as FoodEntry;
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
    Number.isFinite(Date.parse(`${e.date}T12:00:00Z`)) &&
    new Date(`${e.date}T12:00:00Z`).toISOString().slice(0, 10) === e.date &&
    Number.isFinite(e.quantity) &&
    e.quantity > 0 &&
    typeof e.meal === "string" &&
    e.meal.trim().length > 0 &&
    e.meal.length <= 100 &&
    typeof e.foodId === "string"
  );
}
export function displayNutrient(value: number | null | undefined) {
  return value == null
    ? "Unknown"
    : new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
}

/** Calendar date on the device, rather than the UTC day. */
export function foodDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

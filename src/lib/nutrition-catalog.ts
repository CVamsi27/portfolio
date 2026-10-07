import { NUTRIENTS, validFood, type Food, type Unit } from "./nutrition.ts";

/** The amount and optional total gram weight are declared by a label/provider/user, never inferred. */
export type DeclaredPortion = {
  name: string;
  amount: number;
  unit: Unit;
  gramWeight?: number;
};
export type CatalogFood = Food & { portions?: DeclaredPortion[] };
export type CachedFood = { food: CatalogFood; retrievedAt: number };
const DATABASE = "nova-nutrition-catalog-v1";
const STORE = "catalog";
const MAX_FOODS = 500;
const positive = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value > 0 &&
  value <= 1_000_000;
export function validPortion(value: unknown): value is DeclaredPortion {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const portion = value as DeclaredPortion;
  return (
    typeof portion.name === "string" &&
    !!portion.name.trim() &&
    portion.name.length <= 100 &&
    positive(portion.amount) &&
    ["g", "ml", "serving"].includes(portion.unit) &&
    (portion.gramWeight === undefined || positive(portion.gramWeight))
  );
}
export function validCatalogFood(value: unknown): value is CatalogFood {
  if (
    !validFood(value) ||
    value.deleted ||
    !value.id.trim() ||
    value.id.length > 300 ||
    !value.name.trim() ||
    value.name.length > 300 ||
    !value.source.trim() ||
    value.source.length > 1000 ||
    !Number.isSafeInteger(value.updatedAt) ||
    value.updatedAt < 0 ||
    value.basisAmount > 1_000_000 ||
    !Object.keys(value.nutrients).every((key) =>
      Object.hasOwn(NUTRIENTS, key),
    ) ||
    (value.favorite !== undefined && typeof value.favorite !== "boolean")
  )
    return false;
  const food = value as CatalogFood;
  return (
    food.portions === undefined ||
    (Array.isArray(food.portions) &&
      food.portions.length <= 50 &&
      food.portions.every(validPortion))
  );
}
export function portionQuantity(
  food: Food,
  portion: DeclaredPortion,
): number | null {
  if (!validFood(food) || !validPortion(portion)) return null;
  if (portion.unit === food.basisUnit) return portion.amount;
  return food.basisUnit === "g" && portion.gramWeight !== undefined
    ? portion.gramWeight
    : null;
}
const ALIASES: Record<string, string> = {
  curd: "yogurt",
  curds: "yogurt",
  dahi: "yogurt",
  dal: "lentils",
  dhal: "lentils",
  daal: "lentils",
};
/** Retrieval synonyms only; results retain the named food's own nutrient snapshot. */
export function catalogQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (Object.hasOwn(ALIASES, word) ? ALIASES[word] : word))
    .join(" ");
}
export function searchCatalog(foods: Food[], query: string): CatalogFood[] {
  const terms = catalogQuery(query).split(/\s+/).filter(Boolean);
  const unique = new Map<string, CatalogFood>();
  for (const food of foods)
    if (validCatalogFood(food)) {
      const text = catalogQuery(food.name);
      if (terms.every((term) => text.includes(term)) && !unique.has(food.id))
        unique.set(food.id, food);
    }
  return [...unique.values()].slice(0, 50);
}
function validScope(scope: string) {
  if (
    typeof scope !== "string" ||
    !scope.trim() ||
    scope.length > 300 ||
    scope === "account:signed-out"
  )
    throw Error("Invalid food catalog scope.");
}
function validRows(value: unknown): value is CachedFood[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_FOODS &&
    value.every(
      (row) =>
        row &&
        typeof row === "object" &&
        validCatalogFood(row.food) &&
        Number.isSafeInteger(row.retrievedAt) &&
        row.retrievedAt >= 0,
    ) &&
    new Set(value.map((row) => row.food.id)).size === value.length
  );
}
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(Error("Offline food storage is unavailable."));
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    let blocked = false;
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else resolve(request.result);
    };
    request.onerror = () =>
      reject(
        Error(
          `Food storage could not open: ${request.error?.message ?? "unknown error"}`,
        ),
      );
    request.onblocked = () => {
      blocked = true;
      reject(Error("Food storage is blocked by another tab."));
    };
  });
}
async function transaction(
  scope: string,
  foods?: CatalogFood[],
  stamp?: number,
  clear = false,
): Promise<CachedFood[]> {
  validScope(scope);
  const db = await open();
  return new Promise((resolve, reject) => {
    let rows: CachedFood[] = [];
    let failure: Error | undefined;
    const tx = db.transaction(STORE, foods || clear ? "readwrite" : "readonly");
    const store = tx.objectStore(STORE);
    tx.oncomplete = () => {
      db.close();
      resolve(rows);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(
        failure ??
          Error(
            `Food storage failed: ${tx.error?.message ?? "transaction aborted"}`,
          ),
      );
    };
    if (clear) {
      store.delete(scope);
      return;
    }
    const request = store.get(scope);
    request.onsuccess = () => {
      if (request.result !== undefined && !validRows(request.result)) {
        failure = Error(
          "Stored food catalog is invalid. Clear the offline catalog to start again.",
        );
        tx.abort();
        return;
      }
      rows = request.result ?? [];
      if (foods) {
        const merged = new Map(rows.map((row) => [row.food.id, row]));
        for (const food of foods) {
          const previous = merged.get(food.id);
          if (!previous || food.updatedAt >= previous.food.updatedAt)
            merged.set(food.id, { food, retrievedAt: stamp! });
        }
        rows = [...merged.values()]
          .sort((a, b) => b.retrievedAt - a.retrievedAt)
          .slice(0, MAX_FOODS);
        store.put(rows, scope);
      }
    };
  });
}
export async function readCatalog(scope: string): Promise<CachedFood[]> {
  return transaction(scope);
}
export async function cacheFoods(
  scope: string,
  foods: CatalogFood[],
  retrievedAt = Date.now(),
): Promise<void> {
  validScope(scope);
  if (!Number.isSafeInteger(retrievedAt) || retrievedAt < 0)
    throw Error("Invalid food retrieval timestamp.");
  if (
    !Array.isArray(foods) ||
    foods.length > MAX_FOODS ||
    !foods.every(validCatalogFood)
  )
    throw Error("Invalid food catalog snapshot.");
  await transaction(scope, structuredClone(foods), retrievedAt);
}
export async function clearCatalog(scope: string): Promise<void> {
  await transaction(scope, undefined, undefined, true);
}

/**
 * USDA FoodPortion gramWeight is the weight of the complete named portion.
 * Foundation documentation: https://fdc.nal.usda.gov/Foundation_Foods_Documentation/
 * API schema: https://api.nal.usda.gov/fdc/v1/json-spec?api_key=DEMO_KEY
 * Keep that whole portion as one selectable serving; never infer cup/ml density.
 */
export function normalizeFdcPortions(value: unknown): DeclaredPortion[] {
  if (!Array.isArray(value)) return [];
  const portions: DeclaredPortion[] = [];
  const seen = new Set<string>();
  const text = (value: unknown) =>
    typeof value === "string" && value.trim().length <= 100 ? value.trim() : "";
  for (const raw of value) {
    if (
      !raw ||
      typeof raw !== "object" ||
      Array.isArray(raw) ||
      !positive(raw.gramWeight)
    )
      continue;
    let name = text(raw.portionDescription);
    if (!name && positive(raw.amount)) {
      const unit =
        raw.measureUnit && typeof raw.measureUnit === "object"
          ? text(raw.measureUnit.abbreviation) || text(raw.measureUnit.name)
          : "";
      const modifier = text(raw.modifier);
      const meaningfulUnit = unit && unit.toLowerCase() !== "undetermined";
      const meaningfulModifier = modifier && !/^\d+$/.test(modifier);
      if (meaningfulUnit)
        name = `${raw.amount} ${unit}${meaningfulModifier ? `, ${modifier}` : ""}`;
      else if (meaningfulModifier) name = `${raw.amount} ${modifier}`;
    }
    if (!name || name.length > 100) continue;
    const key = `${name}:${raw.gramWeight}`;
    if (seen.has(key)) continue;
    seen.add(key);
    portions.push({
      name,
      amount: 1,
      unit: "serving",
      gramWeight: raw.gramWeight,
    });
    if (portions.length === 50) break;
  }
  return portions;
}

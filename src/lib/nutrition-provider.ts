import { NUTRIENTS, type Food, type NutrientKey } from "./nutrition";
import { normalizeFdcPortions } from "./nutrition-catalog";
import { createClient } from "@supabase/supabase-js";
export async function authenticatedRequest(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!url || !key || !token) return null;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}
export function normalizeFdcFood(raw: Record<string, unknown>): Food {
  const nutrients: Food["nutrients"] = {};
  const items = Array.isArray(raw.foodNutrients)
    ? raw.foodNutrients.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object" && !Array.isArray(item),
      )
    : [];
  for (const [key, meta] of Object.entries(NUTRIENTS)) {
    // Foundation Foods report Atwater energy rather than the legacy 1008 field.
    // Use a supplied kcal value, never derive calories from incomplete macros.
    const ids = key === "energy" ? [1008, 2048, 2047] : [meta.fdc];
    const item = ids
      .map((id) =>
        items.find((candidate) => {
          const detail = candidate.nutrient as
            | Record<string, unknown>
            | undefined;
          const value = candidate.amount ?? candidate.value;
          return (
            (detail?.id ?? candidate.nutrientId) === id &&
            typeof value === "number" &&
            Number.isFinite(value) &&
            value >= 0 &&
            (key !== "energy" ||
              String(
                detail?.unitName ?? candidate.unitName ?? "",
              ).toLowerCase() === "kcal")
          );
        }),
      )
      .find(Boolean);
    const detail = item?.nutrient as Record<string, unknown> | undefined;
    const unit = String(detail?.unitName ?? item?.unitName ?? "").toLowerCase();
    const value = item?.amount ?? item?.value;
    const wanted = meta.unit.toLowerCase();
    const normalizedUnit = unit === "ug" ? "µg" : unit;
    const factor =
      normalizedUnit === wanted
        ? 1
        : normalizedUnit === "mg" && wanted === "µg"
          ? 1000
          : normalizedUnit === "µg" && wanted === "mg"
            ? 0.001
            : null;
    nutrients[key as NutrientKey] =
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      factor !== null
        ? value * factor
        : null;
  }
  if (
    typeof raw.fdcId !== "number" ||
    !Number.isSafeInteger(raw.fdcId) ||
    raw.fdcId <= 0 ||
    typeof raw.description !== "string" ||
    !raw.description.trim()
  )
    throw new Error("Invalid food response");
  return {
    id: `fdc-${raw.fdcId}`,
    name: raw.description.slice(0, 300),
    basisAmount: 100,
    basisUnit: "g",
    nutrients,
    portions: normalizeFdcPortions(raw.foodPortions),
    source: `USDA FoodData Central #${raw.fdcId} · ${String(raw.dataType ?? "Food")} · Retrieved ${new Date().toISOString().slice(0, 10)}`,
    updatedAt: Date.now(),
  };
}
const cache = new Map<string, { at: number; value: unknown }>();
export async function fetchFdc(
  path: string,
  params: Record<string, string> = {},
) {
  const key = process.env.USDA_FDC_API_KEY;
  if (!key)
    throw new Error(
      "Database search is unavailable. Add a food manually or choose a saved food.",
    );
  const cacheKey = path + JSON.stringify(params);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < 86_400_000) return hit.value;
  const url = new URL(`https://api.nal.usda.gov/fdc/v1/${path}`);
  for (const [name, value] of Object.entries(params))
    url.searchParams.set(name, value);
  url.searchParams.set("api_key", key);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "Food database is busy. Try again later or add a food manually."
        : "Food database is unavailable. Your draft is safe.",
    );
  const value: unknown = await response.json();
  if (cache.size >= 128) cache.delete(cache.keys().next().value!);
  cache.set(cacheKey, { at: Date.now(), value });
  return value;
}

"use client";
import {
  displayNutrient,
  MAIN_NUTRIENTS,
  NUTRIENTS,
  nutrientTotals,
  scaleNutrients,
  type FoodEntry,
  type NutrientKey,
  type Target,
} from "@/lib/nutrition";
export default function NutritionSummary({
  entries,
  targets = {},
  details = true,
}: {
  entries: FoodEntry[];
  targets?: Record<string, Target>;
  details?: boolean;
}) {
  const totals = nutrientTotals(
    entries.map((entry) =>
      scaleNutrients(entry.nutrients, entry.quantity, entry.basisAmount),
    ),
  );
  const row = (key: NutrientKey) => (
    <div key={key} className="border-b border-border py-3">
      <div className="flex flex-wrap justify-between gap-2">
        <span className="text-sm">{NUTRIENTS[key].label}</span>
        <span className="font-medium text-sm">
          {displayNutrient(totals.values[key])}
          {totals.values[key] != null ? ` ${NUTRIENTS[key].unit}` : ""}
        </span>
      </div>
      {totals.coverage[key] < totals.count && (
        <p className="text-xs text-muted-foreground mt-1">
          Partial data · {totals.coverage[key]} of {totals.count} entries
        </p>
      )}
      {targets[key] && !targets[key].deleted && (
        <p className="text-xs text-muted-foreground mt-1">
          Your {targets[key].kind === "limit" ? "limit" : "reference"}:{" "}
          {targets[key].amount} {NUTRIENTS[key].unit}
          {targets[key].amount > 0 && totals.values[key] != null
            ? ` · ${Math.round((totals.values[key]! / targets[key].amount) * 100)}% of your ${targets[key].kind}`
            : ""}
          {totals.coverage[key] < totals.count
            ? " · comparison is incomplete"
            : ""}
        </p>
      )}
    </div>
  );
  return (
    <section
      aria-label="Daily nutrition"
      className="rounded-xl border border-border p-4 space-y-3"
    >
      <h2 className="font-semibold">Daily nutrition</h2>
      {!entries.length ? (
        <p className="text-sm text-muted-foreground">
          No food logged for this date.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-5">
            {MAIN_NUTRIENTS.map(row)}
          </div>
          {details && (
            <details>
              <summary className="flex min-h-11 items-center cursor-pointer text-sm font-medium">
                All nutrients and data coverage
              </summary>
              {(Object.keys(NUTRIENTS) as NutrientKey[])
                .filter((key) => !MAIN_NUTRIENTS.includes(key))
                .map(row)}
            </details>
          )}
        </>
      )}
    </section>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { nutritionRange } from "@/lib/nutrition-insights";
import type { NutritionDay } from "@/lib/nutrition-program";
import {
  NUTRIENTS,
  displayNutrient,
  scaleNutrients,
  type NutrientKey,
  type FoodEntry,
} from "@/lib/nutrition";

const labels = {
  "not-logged": "Not logged",
  partial: "Partial",
  complete: "Reviewed complete",
  estimated: "Estimated complete",
  fasting: "Confirmed fasting",
};
export default function NutritionInsights({
  date,
  entries,
}: {
  date: string;
  entries: FoodEntry[];
}) {
  const days = useSyncedStorage<Record<string, NutritionDay>>(
    "nutrition:days",
    {},
    { accountScoped: true, records: true },
  );
  const [range, setRange] = useState(7);
  const [nutrient, setNutrient] = useState<NutrientKey>("energy");
  let analysis: ReturnType<typeof nutritionRange>;
  try {
    analysis = nutritionRange(date, range, entries, days.value);
  } catch {
    return (
      <p role="alert" className="text-sm text-destructive">
        Select a valid date to view nutrition insights.
      </p>
    );
  }
  const contributors = analysis.entries
    .map((entry) => ({
      entry,
      value: scaleNutrients(entry.nutrients, entry.quantity, entry.basisAmount)[
        nutrient
      ],
    }))
    .filter(
      (item): item is { entry: FoodEntry; value: number } =>
        typeof item.value === "number",
    )
    .sort((a, b) => b.value - a.value);
  return (
    <section aria-label="Nutrition insights" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Nutrition insights</h2>
        <div className="flex flex-wrap gap-2" aria-label="Insight date range">
          {[7, 30, 90].map((value) => (
            <Button
              size="sm"
              key={value}
              variant={range === value ? "default" : "outline"}
              aria-pressed={range === value}
              onClick={() => setRange(value)}
            >
              {value} days
            </Button>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {analysis.days[0].date} – {date}. Empty dates remain gaps. Reviewing a
        day confirms logging completeness; nutrient coverage is separate.
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <dt className="text-sm text-muted-foreground">
            Known complete-day average
          </dt>
          <dd className="text-xl font-semibold">
            {analysis.completeAverage === null
              ? "Not enough reviewed data"
              : `${displayNutrient(analysis.completeAverage)} kcal`}
          </dd>
          <p className="text-xs text-muted-foreground mt-2">
            {analysis.completeCount} of {range} days · Reviewed complete with
            known calories, plus explicitly confirmed fasting.
          </p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <dt className="text-sm text-muted-foreground">
            All known logged-day average
          </dt>
          <dd className="text-xl font-semibold">
            {analysis.knownAverage === null
              ? "No known daily totals"
              : `${displayNutrient(analysis.knownAverage)} kcal`}
          </dd>
          <p className="text-xs text-muted-foreground mt-2">
            {analysis.knownCount} of {range} days · Includes partial and
            estimated logs when every logged entry has calories. This may
            understate actual intake.
          </p>
        </div>
      </dl>
      <section
        aria-label="Nutrient contributors"
        className="rounded-xl border border-border p-4 space-y-3"
      >
        <label className="block text-sm font-medium">
          Nutrient contributors
          <select
            value={nutrient}
            onChange={(e) => setNutrient(e.target.value as NutrientKey)}
            className="mt-2 block w-full rounded-md border border-border bg-background p-2"
          >
            {(Object.keys(NUTRIENTS) as NutrientKey[]).map((key) => (
              <option key={key} value={key}>
                {NUTRIENTS[key].label}
              </option>
            ))}
          </select>
        </label>
        {analysis.entries.length ? (
          <>
            <p className="text-sm">
              {displayNutrient(analysis.totals.values[nutrient])}
              {analysis.totals.values[nutrient] !== null
                ? ` ${NUTRIENTS[nutrient].unit}`
                : ""}{" "}
              known subtotal · {analysis.totals.coverage[nutrient]} of{" "}
              {analysis.entries.length} food entries have this nutrient.
            </p>
            {analysis.totals.coverage[nutrient] < analysis.entries.length && (
              <p className="text-xs text-muted-foreground">
                Incomplete coverage. Unknown values are not zero, so the
                subtotal is not a complete intake estimate.
              </p>
            )}
            <ul className="divide-y divide-border">
              {contributors.map(({ entry, value }) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap justify-between gap-2 py-2 text-sm"
                >
                  <Link
                    className="underline underline-offset-4"
                    href={`/food?date=${entry.date}&view=diary`}
                  >
                    {entry.name} · {entry.date}
                  </Link>
                  <span>
                    {displayNutrient(value)} {NUTRIENTS[nutrient].unit}
                  </span>
                </li>
              ))}
            </ul>
            {!contributors.length && (
              <p className="text-sm text-muted-foreground">
                No recorded amounts for this nutrient.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No food in this period.{" "}
            <Link href={`/food?date=${date}&view=diary`} className="underline">
              Log a meal
            </Link>{" "}
            to see nutrient sources.
          </p>
        )}
      </section>
      <details className="rounded-xl border border-border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Daily records and quality
        </summary>
        <ul className="mt-3 divide-y divide-border">
          {[...analysis.days].reverse().map((day) => (
            <li key={day.date} className="py-3 text-sm space-y-1">
              <div className="flex flex-wrap justify-between gap-2">
                <Link
                  className="underline underline-offset-4"
                  href={`/food?date=${day.date}&view=diary`}
                >
                  {day.date}
                </Link>
                <span>
                  {day.quality.energy === null
                    ? "Unknown"
                    : `${displayNutrient(day.quality.energy)} kcal`}{" "}
                  · {labels[day.quality.status]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {day.quality.reason}
              </p>
            </li>
          ))}
        </ul>
      </details>
      {days.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          Day-review sync failed. Insights reflect the available device records.
        </p>
      )}
    </section>
  );
}

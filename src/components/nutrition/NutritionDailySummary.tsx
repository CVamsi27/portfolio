"use client";
import NutritionSummary from "./NutritionSummary";
import {
  nutritionTargetsForDate,
  type NutritionProgram,
} from "@/lib/nutrition-program";
import type { FoodEntry, Target } from "@/lib/nutrition";

/** Effective program targets enhance the comparison; consumed nutrient snapshots stay unchanged. */
export default function NutritionDailySummary({
  date,
  entries,
  targets = {},
  programs = {},
  details = true,
}: {
  date: string;
  entries: FoodEntry[];
  targets?: Record<string, Target>;
  programs?: Record<string, NutritionProgram>;
  details?: boolean;
}) {
  const effective = nutritionTargetsForDate(programs, date, targets);
  const weekday = new Date(`${date}T12:00:00Z`).toLocaleDateString("en", {
    weekday: "long",
    timeZone: "UTC",
  });
  return (
    <div className="space-y-2">
      {effective.program && (
        <p
          className="text-xs text-muted-foreground"
          aria-label="Program target source"
        >
          Program targets effective from {effective.program.startDate} ·{" "}
          {effective.program.mode === "flexible"
            ? "Flexible weekly allocation"
            : "Manual daily targets"}
          . Calorie and macro references use your {weekday} plan. Other nutrient
          references are unchanged. Comparisons use recorded intake and may be
          incomplete.
        </p>
      )}
      <NutritionSummary
        entries={entries}
        targets={effective.targets}
        details={details}
      />
    </div>
  );
}

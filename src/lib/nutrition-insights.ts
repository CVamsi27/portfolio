import {
  nutrientTotals,
  scaleNutrients,
  validEntry,
  type FoodEntry,
} from "./nutrition.ts";
import { dayQuality, type NutritionDay } from "./nutrition-program.ts";

/** Inclusive calendar range; missing days remain missing rather than becoming zero intake. */
export function nutritionRange(
  date: string,
  range: number,
  entries: FoodEntry[],
  records: Record<string, NutritionDay>,
) {
  const end = new Date(`${date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(end.getTime()) ||
    end.toISOString().slice(0, 10) !== date ||
    !Number.isInteger(range) ||
    range < 1 ||
    range > 90
  )
    throw new Error("Choose a valid date and a range of 1–90 days.");
  const days = Array.from({ length: range }, (_, index) => {
    const day = new Date(end);
    day.setUTCDate(day.getUTCDate() - range + index + 1);
    const key = day.toISOString().slice(0, 10);
    return { date: key, quality: dayQuality(key, entries, records[key]) };
  });
  const start = days[0].date;
  const active = entries.filter(
    (entry) =>
      !entry.deleted && !entry.planned &&
      validEntry(entry) &&
      entry.date >= start &&
      entry.date <= date,
  );
  const known = days.filter((day) => day.quality.energy !== null);
  const complete = known.filter((day) => day.quality.eligible);
  const average = (list: typeof days) =>
    list.length
      ? list.reduce((sum, day) => sum + (day.quality.energy ?? 0), 0) /
        list.length
      : null;
  return {
    days,
    entries: active,
    totals: nutrientTotals(
      active.map((entry) =>
        scaleNutrients(entry.nutrients, entry.quantity, entry.basisAmount),
      ),
    ),
    knownCount: known.length,
    completeCount: complete.length,
    knownAverage: average(known),
    completeAverage: average(complete),
  };
}

export type MealWindowResult = {
  fastHours: number;
  eatingHours: number;
  overnight: boolean;
};

export type MealWindowRoutine = {
  firstMealTime: string;
  lastMealTime: string;
};

export function minutesSinceMidnight(value: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error("Enter a valid time.");
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function validateMealWindow(firstMeal: string, lastMeal: string): string | null {
  try {
    if (minutesSinceMidnight(firstMeal) === minutesSinceMidnight(lastMeal)) {
      return "Choose different first and last meal times.";
    }
    return null;
  } catch {
    return "Add a valid first meal and last meal time.";
  }
}

export function calculateMealWindow(firstMeal: string, lastMeal: string): MealWindowResult {
  const error = validateMealWindow(firstMeal, lastMeal);
  if (error) throw new Error(error);
  const start = minutesSinceMidnight(firstMeal);
  const end = minutesSinceMidnight(lastMeal);
  const eatingMinutes = end > start ? end - start : 1440 - start + end;
  return {
    fastHours: Math.round(((1440 - eatingMinutes) / 60) * 10) / 10,
    eatingHours: Math.round((eatingMinutes / 60) * 10) / 10,
    overnight: end > start,
  };
}

export function mealWindowTimestamps(date: string, firstMeal: string, lastMeal: string): { start: number; end: number } {
  const validation = validateMealWindow(firstMeal, lastMeal);
  if (validation) throw new Error(validation);
  const first = Date.parse(`${date}T${firstMeal}:00`);
  const last = Date.parse(`${date}T${lastMeal}:00`);
  const start = last;
  const end = last > first ? first + 86_400_000 : first;
  return { start, end };
}

export function pruneExpiredMealWindows<T extends { source: string; createdAt?: number; end: number }>(
  entries: T[],
  autoClearHours: 24 | 168 | 720,
  now: number = Date.now(),
): T[] {
  const cutoff = now - autoClearHours * 3_600_000;
  return entries.filter((entry) => entry.source !== "meal-window" || (entry.createdAt ?? entry.end) > cutoff);
}

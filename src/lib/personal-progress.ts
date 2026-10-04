import {
  NUTRIENTS,
  nutrientTotals,
  scaleNutrients,
  validEntry,
  type FoodEntry,
  type NutrientKey,
} from "./nutrition.ts";
import type { WeightEntry } from "./health";
import type { WorkoutLog, Todo, FastHistoryEntry } from "./trackers";
import type { FocusSession } from "./focus-sprint";
import type { RecoveryEntry } from "@/components/personal/RecoveryTracker";
import type { RoutineHistory } from "./routine-reminders";
import type { HabitCompletion } from "@/components/personal/HabitChecklist";

export function progressDates(end: string, days: number): string[] {
  const date = new Date(`${end}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== end ||
    !Number.isInteger(days) ||
    days < 1 ||
    days > 366
  )
    throw new Error("Choose a valid date and range.");
  return Array.from({ length: days }, (_, index) =>
    new Date(date.getTime() - (days - 1 - index) * 86400000)
      .toISOString()
      .slice(0, 10),
  );
}
const known = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
function localDay(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export type ProgressInput = {
  end: string;
  days: number;
  weights?: Record<string, WeightEntry>;
  food?: Record<string, FoodEntry>;
  workouts?: WorkoutLog;
  focus?: FocusSession[];
  study?: Array<{ date: string; durationMinutes: number }>;
  water?: Record<string, number>;
  recovery?: Record<string, RecoveryEntry>;
  tasks?: Todo[];
  routine?: Record<string, RoutineHistory>;
  habits?: Record<string, HabitCompletion>;
  fasting?: FastHistoryEntry[];
};
export function buildProgress(input: ProgressInput) {
  const dates = progressDates(input.end, input.days);
  const inRange = (date: string) =>
    date >= dates[0] && date <= input.end && dates.includes(date);
  const food = Object.values(input.food ?? {}).filter(
    (entry) => !entry.deleted && validEntry(entry) && inRange(entry.date),
  );
  const focus = (input.focus ?? []).filter(
    (item) =>
      item.status === "completed" &&
      known(item.durationMinutes) &&
      Number.isFinite(item.endedAt ?? item.createdAt) &&
      inRange(localDay(item.endedAt ?? item.createdAt)),
  );
  const study = (input.study ?? []).filter(
    (item) => inRange(item.date) && known(item.durationMinutes),
  );
  const tasks = (input.tasks ?? []).filter(
    (item) =>
      item.done &&
      Number.isFinite(item.completedAt) &&
      inRange(localDay(item.completedAt!)),
  );
  const routine = Object.values(input.routine ?? {}).filter(
    (item) =>
      !item.deleted &&
      inRange(item.date) &&
      ["done", "taken"].includes(item.status),
  );
  const habits = Object.values(input.habits ?? {}).filter(
    (item) => !item.deleted && item.done && inRange(item.date),
  );
  const fasts = (input.fasting ?? []).filter(
    (item) =>
      Number.isFinite(item.start) &&
      Number.isFinite(item.end) &&
      item.end > item.start &&
      inRange(localDay(item.end)),
  );
  const scaled = food.map((item) =>
    scaleNutrients(item.nutrients, item.quantity, item.basisAmount),
  );
  const totals = nutrientTotals(scaled);
  const days = dates.map((date) => {
    const meals = food.filter((item) => item.date === date);
    const nutrients = nutrientTotals(
      meals.map((item) =>
        scaleNutrients(item.nutrients, item.quantity, item.basisAmount),
      ),
    );
    const exercises = Object.values(input.workouts?.[date] ?? {}).filter(
      (item) =>
        item.done ||
        item.sets?.some((set) => known(set.reps) && set.reps > 0) ||
        (known(item.minutes) && item.minutes > 0),
    );
    const sets = exercises
      .flatMap((item) => item.sets ?? [])
      .filter((set) => known(set.reps) && set.reps > 0);
    const loaded = sets.filter((set) => known(set.weightKg));
    const minutes = exercises.map((item) => item.minutes).filter(known);
    const sessions = focus.filter(
      (item) => localDay(item.endedAt ?? item.createdAt) === date,
    );
    const learned = study.filter((item) => item.date === date);
    const recovery = Object.values(input.recovery ?? {}).find(
      (item) => !item.deleted && item.date === date,
    );
    return {
      date,
      weight:
        known(input.weights?.[date]?.weightKg) &&
        input.weights![date].weightKg > 0
          ? input.weights![date].weightKg
          : null,
      foodCount: meals.length,
      nutrients,
      energy: nutrients.values.energy ?? null,
      protein: nutrients.values.protein ?? null,
      exercise: exercises.length || null,
      sets: sets.length,
      reps: sets.reduce((sum, set) => sum + set.reps, 0),
      knownLoadSets: loaded.length,
      loadVolume: loaded.length
        ? loaded.reduce((sum, set) => sum + set.reps * set.weightKg!, 0)
        : null,
      exerciseMinutes: minutes.length
        ? minutes.reduce((a, b) => a + b, 0)
        : null,
      water: known(input.water?.[date]) ? input.water![date] : null,
      sleep:
        known(recovery?.sleepHours) && recovery!.sleepHours! <= 24
          ? recovery!.sleepHours!
          : null,
      focus: sessions.length
        ? sessions.reduce((sum, item) => sum + item.durationMinutes, 0)
        : null,
      study: learned.length
        ? learned.reduce((sum, item) => sum + item.durationMinutes, 0)
        : null,
      tasks: tasks.filter((item) => localDay(item.completedAt!) === date)
        .length,
      routine: routine.filter((item) => item.date === date).length,
      habits: habits.filter((item) => item.date === date).length,
    };
  });
  const readings = days.filter((item) => item.weight !== null);
  const nutrients = Object.fromEntries(
    (Object.keys(NUTRIENTS) as NutrientKey[]).map((key) => {
      const recorded = days
        .map((day) => day.nutrients.values[key])
        .filter(known);
      return [
        key,
        {
          total: totals.values[key] ?? null,
          average: recorded.length
            ? recorded.reduce((a, b) => a + b, 0) / recorded.length
            : null,
          knownEntries: totals.coverage[key],
          recordedDays: recorded.length,
        },
      ];
    }),
  ) as Record<
    NutrientKey,
    {
      total: number | null;
      average: number | null;
      knownEntries: number;
      recordedDays: number;
    }
  >;
  const sleeps = days.map((item) => item.sleep).filter(known);
  const minutes = days.map((item) => item.exerciseMinutes).filter(known);
  return {
    days,
    first: dates[0],
    end: input.end,
    weightCount: readings.length,
    latestWeight: readings.length
      ? { date: readings.at(-1)!.date, value: readings.at(-1)!.weight! }
      : null,
    weightChange:
      readings.length > 1
        ? readings.at(-1)!.weight! - readings[0].weight!
        : null,
    foodCount: food.length,
    foodDays: days.filter((item) => item.foodCount > 0).length,
    nutrients,
    workoutDays: days.filter((item) => item.exercise !== null).length,
    exerciseCount: days.reduce((sum, item) => sum + (item.exercise ?? 0), 0),
    setCount: days.reduce((sum, item) => sum + item.sets, 0),
    exerciseMinutes: minutes.length ? minutes.reduce((a, b) => a + b, 0) : null,
    repCount: days.reduce((sum, item) => sum + item.reps, 0),
    knownLoadSets: days.reduce((sum, item) => sum + item.knownLoadSets, 0),
    loadVolumeKg: days.some((item) => item.loadVolume !== null)
      ? days.reduce((sum, item) => sum + (item.loadVolume ?? 0), 0)
      : null,
    fastCount: fasts.length,
    fastHours: fasts.reduce(
      (sum, item) => sum + (item.end - item.start) / 3600000,
      0,
    ),
    waterTotal: days.reduce((sum, item) => sum + (item.water ?? 0), 0),
    waterDays: days.filter((item) => item.water !== null).length,
    sleepAverage: sleeps.length
      ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length
      : null,
    sleepDays: sleeps.length,
    focusMinutes: focus.reduce((sum, item) => sum + item.durationMinutes, 0),
    focusSessions: focus.length,
    studyMinutes: study.reduce((sum, item) => sum + item.durationMinutes, 0),
    studySessions: study.length,
    completedTasks: tasks.length,
    routineCompleted: routine.length,
    habitsCompleted: habits.length,
  };
}
export type ProgressData = ReturnType<typeof buildProgress>;

"use client";
import { useMemo } from "react";
import { useNutrition } from "./nutrition-store";
import { useSyncedStorage } from "./use-synced-storage";
import {
  useWorkouts,
  useJournal,
  useTodos,
  useGoalState,
  useNow,
  useFastingHistory,
} from "./tracker-store";
import { useUserPrefs } from "./user-prefs";
import { DEFAULT_WEIGHT_LOSS_STATE, type WeightLossState } from "./health";
import { zonedDate } from "./routine-reminders";
import { calendarZone } from "./day-plan";
import { buildProgress } from "./personal-progress";
import type { FocusSession } from "./focus-sprint";
import type { CompletedChapterRecord } from "./study-focus";
import type { RecoveryEntry } from "@/components/personal/RecoveryTracker";
import type { HabitCompletion } from "@/components/personal/HabitChecklist";
import type { RoutineHistory } from "./routine-reminders";
export function usePersonalProgress(days = 30, endDate?: string) {
  const now = useNow(60_000);
  const { prefs } = useUserPrefs();
  const end = endDate || zonedDate(now, calendarZone(prefs.timeZone));
  const nutrition = useNutrition();
  const workouts = useWorkouts();
  const tasks = useTodos();
  const goals = useGoalState();
  const journal = useJournal();
  const weights = useSyncedStorage<WeightLossState>(
    "weight-loss",
    DEFAULT_WEIGHT_LOSS_STATE,
  );
  const fasting = useFastingHistory();
  const water = useSyncedStorage<Record<string, number>>("fasting:water", {});
  const focus = useSyncedStorage<FocusSession[]>("focus:sessions", []);
  const study = useSyncedStorage<CompletedChapterRecord[]>(
    "study:completed_chapters",
    [],
  );
  const recovery = useSyncedStorage<Record<string, RecoveryEntry>>(
    "recovery:entries",
    {},
    { accountScoped: true, records: true },
  );
  const routine = useSyncedStorage<Record<string, RoutineHistory>>(
    "routine:history",
    {},
    { accountScoped: true, records: true },
  );
  const habits = useSyncedStorage<Record<string, HabitCompletion>>(
    "habits:history",
    {},
    { accountScoped: true, records: true },
  );
  const data = useMemo(
    () =>
      buildProgress({
        end,
        days,
        goalMetric: goals.value.metricByDay,
        journal: journal.value,
        weights: weights.value.entries,
        food: nutrition.entries.value,
        workouts: workouts.value,
        water: water.value,
        focus: focus.value,
        study: study.value,
        recovery: recovery.value,
        tasks: tasks.value,
        routine: routine.value,
        habits: habits.value,
        fasting: fasting.value,
      }),
    [
      end,
      days,
      goals.value,
      journal.value,
      weights.value,
      nutrition.entries.value,
      workouts.value,
      water.value,
      focus.value,
      study.value,
      recovery.value,
      tasks.value,
      routine.value,
      habits.value,
      fasting.value,
    ],
  );
  const milestones =
    goals.value.milestonesByCategory?.[prefs.goalCategory] ?? [];
  const statuses = [
    nutrition.entries.status,
    workouts.status,
    weights.status,
    focus.status,
    study.status,
    recovery.status,
    water.status,
    fasting.status,
    tasks.status,
    goals.status,
    journal.status,
    routine.status,
    habits.status,
    nutrition.targets.status,
  ];
  return {
    data,
    prefs,
    targets: nutrition.targets.value,
    weightTarget: weights.value.targetKg,
    milestones,
    goal: goals.value,
    syncing: statuses.some((status) => status === "syncing"),
    syncError: statuses.some((status) => status === "error"),
    tasks: tasks.value,
  };
}

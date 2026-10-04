"use client";
import { useEffect, useMemo } from "react";
import { useSyncedStorage } from "./use-synced-storage";
import {
  routineDefaults,
  validSchedule,
  type RoutineHistory,
  type RoutineSchedule,
} from "./routine-reminders";
export function useRoutine() {
  const schedules = useSyncedStorage<Record<string, RoutineSchedule>>(
    "routine:schedules",
    {},
    { accountScoped: true, records: true },
  );
  const history = useSyncedStorage<Record<string, RoutineHistory>>(
    "routine:history",
    {},
    { accountScoped: true, records: true },
  );
  const { status, value, setValue } = schedules;
  const email = schedules.user?.email;
  const defaults = useMemo(() => routineDefaults(email), [email]);
  useEffect(() => {
    if (
      status === "synced" &&
      Object.keys(value ?? {}).length === 0 &&
      defaults.length
    ) {
      setValue(
        Object.fromEntries(
          defaults.map((item) => [item.id, { ...item, updatedAt: Date.now() }]),
        ),
      );
    }
  }, [status, value, setValue, defaults]);
  const items = Object.values({
    ...Object.fromEntries(defaults.map((item) => [item.id, item])),
    ...schedules.value,
  }).filter(validSchedule);
  return { schedules, history, items };
}

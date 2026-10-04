import {
  routineOccurrences,
  zonedDate,
  type RoutineSchedule,
  type RoutineHistory,
  type RoutineOccurrence,
} from "./routine-reminders.ts";
export function deliveryGroupKey(endpoint: string, at: number) {
  return `${endpoint}:${at}`;
}
export function dueRoutineGroups(
  schedules: RoutineSchedule[],
  history: Record<string, RoutineHistory>,
  now: number,
) {
  const dates = new Set(
    schedules.flatMap((item) => [
      zonedDate(now, item.timezone),
      zonedDate(now - 86_400_000, item.timezone),
    ]),
  );
  const groups = new Map<number, RoutineOccurrence[]>();
  for (const date of dates)
    for (const item of routineOccurrences(schedules, date)) {
      const stored = history[item.id];
      const record = stored && !stored.deleted ? stored : undefined;
      if (record && record.status !== "snoozed") continue;
      const at = record?.snoozeUntil ?? item.scheduledAt;
      if (!Number.isFinite(at) || at > now || now - at > 15 * 60_000) continue;
      const group = groups.get(at) ?? [];
      if (!group.some((current) => current.id === item.id)) group.push(item);
      groups.set(at, group);
    }
  return groups;
}

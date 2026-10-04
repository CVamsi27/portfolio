export type RoutineSchedule = {
  id: string;
  label: string;
  time: string;
  days: number[];
  timezone: string;
  enabled: boolean;
  type: "meal" | "supplement";
  meal?: string;
  linkedTo?: string;
  note?: string;
  updatedAt: number;
  startsOn?: string;
  deleted?: boolean;
};
export type RoutineOccurrence = {
  id: string;
  reminderId: string;
  label: string;
  date: string;
  scheduledAt: number;
  type: "meal" | "supplement";
  meal?: string;
};
export type RoutineHistory = RoutineOccurrence & {
  status: "done" | "taken" | "skipped" | "snoozed";
  snoozeUntil?: number;
  completedAt?: number;
  updatedAt: number;
  deleted?: boolean;
};
export const ROUTINE_OWNER = "cvamsik99@gmail.com";
export function routineDefaults(
  email: string | undefined | null,
): RoutineSchedule[] {
  if (email?.toLowerCase() !== ROUTINE_OWNER) return [];
  const daily = [0, 1, 2, 3, 4, 5, 6];
  const base = {
    timezone: "Asia/Kolkata",
    enabled: true,
    updatedAt: 0,
    startsOn: "2026-10-03",
  };
  return [
    {
      ...base,
      id: "b12",
      label: "Vitamin B12",
      time: "08:00",
      days: [1],
      type: "supplement",
    },
    {
      ...base,
      id: "zinc",
      label: "Zinc",
      time: "12:00",
      days: daily,
      type: "supplement",
    },
    {
      ...base,
      id: "lunch",
      label: "Lunch",
      time: "14:00",
      days: daily,
      type: "meal",
      meal: "Lunch",
    },
    {
      ...base,
      id: "omega3",
      label: "Omega-3 with lunch",
      time: "14:00",
      days: daily,
      type: "supplement",
      linkedTo: "lunch",
    },
    {
      ...base,
      id: "snack",
      label: "Snacks",
      time: "18:00",
      days: daily,
      type: "meal",
      meal: "Snack",
    },
    {
      ...base,
      id: "dinner",
      label: "Dinner",
      time: "20:00",
      days: daily,
      type: "meal",
      meal: "Dinner",
    },
    {
      ...base,
      id: "magnesium",
      label: "Magnesium",
      time: "22:00",
      days: daily,
      type: "supplement",
    },
  ];
}
export function zonedDate(now: number, timezone = "Asia/Kolkata") {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) =>
    parts.find((item) => item.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function scheduledInstant(date: string, time: string, timezone: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  )
    throw new Error("Invalid schedule date/time");
  const desired = Date.parse(`${date}T${time}:00Z`);
  let actual = desired;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(actual);
    const p = (name: string) => parts.find((item) => item.type === name)!.value;
    const local = Date.parse(
      `${p("year")}-${p("month")}-${p("day")}T${p("hour")}:${p("minute")}:${p("second")}Z`,
    );
    actual += desired - local;
  }
  return actual;
}
export function routineOccurrences(
  schedules: RoutineSchedule[],
  date: string,
): RoutineOccurrence[] {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return schedules
    .filter(
      (item) =>
        item.enabled &&
        !item.deleted &&
        (!item.startsOn || date >= item.startsOn) &&
        item.days.includes(weekday),
    )
    .map((item) => {
      const parent = schedules.find(
        (candidate) => candidate.id === item.linkedTo,
      );
      const scheduledAt = scheduledInstant(
        date,
        parent?.time ?? item.time,
        parent?.timezone ?? item.timezone,
      );
      return {
        id: `${item.id}:${scheduledAt}`,
        reminderId: item.id,
        label: item.label,
        date,
        scheduledAt,
        type: item.type,
        meal: item.meal,
      };
    })
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
}
export function validSchedule(value: unknown): value is RoutineSchedule {
  if (!value || typeof value !== "object") return false;
  const v = value as RoutineSchedule;
  try {
    new Intl.DateTimeFormat("en", { timeZone: v.timezone });
  } catch {
    return false;
  }
  return (
    typeof v.id === "string" &&
    typeof v.label === "string" &&
    v.label.length <= 200 &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(v.time) &&
    Array.isArray(v.days) &&
    v.days.length > 0 &&
    v.days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
    typeof v.enabled === "boolean" &&
    ["meal", "supplement"].includes(v.type) &&
    Number.isFinite(v.updatedAt)
  );
}

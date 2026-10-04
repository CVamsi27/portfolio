import type { Todo } from "./trackers";
import type { RoutineOccurrence, RoutineHistory } from "./routine-reminders";
import { scheduledInstant, zonedDate } from "./routine-reminders.ts";
export type PlanBlock = {
  id: string;
  date: string;
  startLocal: string;
  durationMinutes: number;
  timeZone: string;
  kind: "task" | "study" | "exercise" | "event";
  title: string;
  sourceId?: string;
  description?: string;
  updatedAt: number;
  deleted?: boolean;
  completedAt?: number;
};
export type PlanDay = {
  date: string;
  priorityTaskIds: string[];
  updatedAt: number;
  deleted?: boolean;
};
export function planningCanEdit(configured: boolean, rollout?: string) {
  return !configured || rollout === "true";
}
export function calendarZone(value?: string) {
  try {
    if (value) {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return value;
    }
  } catch {}
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
}
export function validDay(date: unknown): date is string {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return false;
  const d = new Date(date + "T00:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === date;
}
export function shiftDay(date: string, amount: number) {
  if (!validDay(date)) throw new Error("Choose a valid date.");
  return new Date(new Date(date + "T00:00:00Z").getTime() + amount * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function minutesOf(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
export function validPlanBlock(value: unknown): value is PlanBlock {
  if (!value || typeof value !== "object") return false;
  const b = value as PlanBlock;
  try {
    new Intl.DateTimeFormat("en", { timeZone: b.timeZone });
  } catch {
    return false;
  }
  return (
    typeof b.timeZone === "string" &&
    !!b.timeZone &&
    typeof b.id === "string" &&
    !!b.id &&
    validDay(b.date) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(b.startLocal) &&
    Number.isInteger(b.durationMinutes) &&
    b.durationMinutes > 0 &&
    minutesOf(b.startLocal) + b.durationMinutes <= 1440 &&
    ["task", "study", "exercise", "event"].includes(b.kind) &&
    typeof b.title === "string" &&
    !!b.title.trim() &&
    b.title.length <= 500 &&
    Number.isFinite(b.updatedAt) &&
    (b.sourceId === undefined || typeof b.sourceId === "string") &&
    (b.kind !== "task" || (typeof b.sourceId === "string" && !!b.sourceId)) &&
    (b.description === undefined || typeof b.description === "string") &&
    (b.completedAt === undefined || Number.isFinite(b.completedAt)) &&
    (b.deleted === undefined || typeof b.deleted === "boolean")
  );
}
export function validPlanDay(value: unknown): value is PlanDay {
  if (!value || typeof value !== "object") return false;
  const d = value as PlanDay;
  return (
    validDay(d.date) &&
    Array.isArray(d.priorityTaskIds) &&
    d.priorityTaskIds.length <= 3 &&
    d.priorityTaskIds.every((x) => typeof x === "string" && !!x) &&
    new Set(d.priorityTaskIds).size === d.priorityTaskIds.length &&
    Number.isFinite(d.updatedAt) &&
    (d.deleted === undefined || typeof d.deleted === "boolean")
  );
}
export type AgendaItem = {
  id: string;
  title: string;
  at: number;
  durationMinutes?: number;
  kind: PlanBlock["kind"] | "meal" | "supplement";
  href: string;
  done: boolean;
  unavailable?: boolean;
  block?: PlanBlock;
  occurrence?: RoutineOccurrence;
  status?: string;
};
export function dayAgenda(input: {
  date: string;
  calendarTimeZone?: string;
  blocks: Record<string, PlanBlock>;
  tasks: Todo[];
  routines: RoutineOccurrence[];
  history?: Record<string, RoutineHistory>;
}): AgendaItem[] {
  const planned = Object.values(input.blocks)
    .filter(
      (b) =>
        validPlanBlock(b) &&
        !b.deleted &&
        (input.calendarTimeZone
          ? zonedDate(
              scheduledInstant(b.date, b.startLocal, b.timeZone),
              input.calendarTimeZone,
            ) === input.date
          : b.date === input.date),
    )
    .map((b) => {
      const task =
        b.kind === "task" && b.sourceId
          ? input.tasks.find((t) => t.id === b.sourceId)
          : undefined;
      return {
        id: b.id,
        title: task?.text ?? b.title,
        at: scheduledInstant(b.date, b.startLocal, b.timeZone),
        durationMinutes: b.durationMinutes,
        kind: b.kind,
        href:
          b.kind === "task" && task
            ? `/plan?view=focus&task=${encodeURIComponent(task.id)}`
            : b.kind === "exercise"
              ? `/workout-tracking?date=${b.date}`
              : b.kind === "study"
                ? "/roadmap?view=today"
                : `/plan?date=${b.date}`,
        done: task?.done ?? Boolean(b.completedAt),
        unavailable: b.kind === "task" && Boolean(b.sourceId) && !task,
        block: b,
      };
    });
  const routine = input.routines.map((o) => {
    const h = input.history?.[o.id];
    const state = h && !h.deleted ? h : undefined;
    return {
      id: o.id,
      title: o.label,
      at:
        state?.status === "snoozed" && state.snoozeUntil
          ? state.snoozeUntil
          : o.scheduledAt,
      kind: o.type,
      href:
        o.type === "meal"
          ? `/food?date=${input.date}&meal=${encodeURIComponent(o.meal ?? o.label)}&returnTo=%2Fhub`
          : "/routine",
      done: Boolean(
        state && ["done", "taken", "skipped"].includes(state.status),
      ),
      occurrence: o,
      status: state?.status,
    };
  });
  return [...planned, ...routine]
    .filter(
      (row) =>
        !input.calendarTimeZone ||
        zonedDate(row.at, input.calendarTimeZone) === input.date,
    )
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
}
export function conflicts(block: PlanBlock, other: PlanBlock) {
  if (block.id === other.id || block.deleted || other.deleted) return false;
  const a = scheduledInstant(block.date, block.startLocal, block.timeZone);
  const b = scheduledInstant(other.date, other.startLocal, other.timeZone);
  return (
    a < b + other.durationMinutes * 60000 &&
    b < a + block.durationMinutes * 60000
  );
}

export function timetableBlocks(
  date: string,
  schedule: Record<
    string,
    | string
    | { label: string; minutes?: number; work?: boolean; output?: string }
  >,
  timeZone: string,
  prefix = "timetable",
): Record<string, PlanBlock> {
  const result: Record<string, PlanBlock> = {};
  for (const [range, value] of Object.entries(schedule)) {
    const match = range.match(/^(\d{2}:\d{2})[-–](\d{2}:\d{2})$/);
    if (!match) continue;
    const id = `${prefix}:${date}:${range}`;
    const block: PlanBlock = {
      id,
      date,
      startLocal: match[1],
      durationMinutes: minutesOf(match[2]) - minutesOf(match[1]),
      timeZone,
      kind:
        typeof value === "object" && value.work === false ? "event" : "study",
      title: typeof value === "string" ? value : value.label,
      description: typeof value === "string" ? undefined : value.output,
      updatedAt: 0,
    };
    if (validPlanBlock(block)) result[id] = block;
  }
  return result;
}

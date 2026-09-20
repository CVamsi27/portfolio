import { dateKey } from "./trackers";

export type FocusMinutes = 15 | 25 | 45;
export type FocusSessionStatus = "completed" | "cancelled";

export type FocusActiveState = {
  id: string;
  label: string;
  plannedMinutes: FocusMinutes;
  startedAt: number;
  pausedAt?: number;
  pausedMs: number;
};

export type FocusSession = {
  id: string;
  label: string;
  plannedMinutes: FocusMinutes;
  startedAt: number;
  endedAt?: number;
  durationMinutes: number;
  status: FocusSessionStatus;
  createdAt: number;
};

export const FOCUS_PRESETS: ReadonlyArray<{ minutes: FocusMinutes; label: string }> = [
  { minutes: 15, label: "15 min" },
  { minutes: 25, label: "25 min" },
  { minutes: 45, label: "45 min" },
];

const minuteMs = 60_000;

export function getFocusElapsedMs(active: FocusActiveState, now: number): number {
  const pausedNow = active.pausedAt === undefined ? 0 : Math.max(0, now - active.pausedAt);
  const elapsed = now - active.startedAt - active.pausedMs - pausedNow;
  return Math.max(0, Math.min(active.plannedMinutes * minuteMs, elapsed));
}

export function getFocusRemainingMs(active: FocusActiveState, now: number): number {
  return active.plannedMinutes * minuteMs - getFocusElapsedMs(active, now);
}

export function completeFocusSession(active: FocusActiveState, endedAt: number): FocusSession {
  const elapsed = getFocusElapsedMs(active, endedAt);
  return {
    id: active.id,
    label: active.label,
    plannedMinutes: active.plannedMinutes,
    startedAt: active.startedAt,
    endedAt,
    durationMinutes: Math.max(1, Math.floor(elapsed / minuteMs)),
    status: "completed",
    createdAt: endedAt,
  };
}

export function focusMinutesForDates(sessions: FocusSession[], day: string): number {
  return sessions.reduce(
    (total, session) => {
      if (session.status !== "completed" || dateKey(new Date(session.startedAt)) !== day) return total;
      const duration = Number(session.durationMinutes);
      return Number.isFinite(duration) ? total + Math.max(0, duration) : total;
    },
    0,
  );
}

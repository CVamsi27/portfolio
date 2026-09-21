import { dateKey } from "./trackers";

export type FocusMinutes = 25 | 50 | 90;
export type FocusSessionMode = "timed" | "open";
export type FocusSessionStatus = "completed" | "cancelled";

export type FocusActiveState = {
  id: string;
  label: string;
  mode?: FocusSessionMode;
  plannedMinutes?: FocusMinutes;
  startedAt: number;
  pausedAt?: number;
  pausedMs: number;
  interruptions?: number;
  fullscreen?: boolean;
};

export type FocusSession = {
  id: string;
  label: string;
  mode?: FocusSessionMode;
  plannedMinutes?: FocusMinutes;
  startedAt: number;
  endedAt?: number;
  durationMinutes: number;
  status: FocusSessionStatus;
  interruptions?: number;
  createdAt: number;
};

export const FOCUS_PRESETS: ReadonlyArray<{ minutes: FocusMinutes; label: string }> = [
  { minutes: 25, label: "25 min" },
  { minutes: 50, label: "50 min" },
  { minutes: 90, label: "90 min" },
];

const minuteMs = 60_000;

export function getFocusElapsedMs(active: FocusActiveState, now: number): number {
  const pausedNow = active.pausedAt === undefined ? 0 : Math.max(0, now - active.pausedAt);
  const elapsed = now - active.startedAt - active.pausedMs - pausedNow;
  if (active.mode === "open") return Math.max(0, elapsed);
  return Math.max(0, Math.min((active.plannedMinutes ?? 25) * minuteMs, elapsed));
}

export function getFocusRemainingMs(active: FocusActiveState, now: number): number {
  if (active.mode === "open") return 0;
  return (active.plannedMinutes ?? 25) * minuteMs - getFocusElapsedMs(active, now);
}

export function completeFocusSession(active: FocusActiveState, endedAt: number): FocusSession {
  const elapsed = getFocusElapsedMs(active, endedAt);
  return {
    id: active.id,
    label: active.label,
    mode: active.mode ?? "timed",
    plannedMinutes: active.plannedMinutes,
    startedAt: active.startedAt,
    endedAt,
    durationMinutes: Math.max(1, Math.floor(elapsed / minuteMs)),
    status: "completed",
    interruptions: active.interruptions ?? 0,
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

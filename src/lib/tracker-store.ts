"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useSyncedStorage } from "./use-synced-storage";
import { collectKeyStats, type KeyStat } from "./backup";
import {
  type CustomQuote,
  type ExerciseLog,
  type FastHistoryEntry,
  type FastState,
  type GoalState,
  type JournalMap,
  type Milestone,
  type Todo,
  type TodoPriority,
  type TodoTag,
  type WorkoutLog,
  DEFAULT_FAST_STATE,
  DEFAULT_GOAL_STATE,
  dateKey,
  defaultMilestonesFor,
  normalizeExercise,
} from "./trackers";
import type { GoalCategory } from "./user-prefs";

// ─────────────────────────────────────────────────────────────────────────────
// Migration helpers — one-time v1 → v2 adapters with a safety snapshot.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Before a migration rewrites `vk:<key>`, copy the original JSON to
 * `vk:backup:v1:<key>` exactly once. Nothing is lost, even on a bad migration.
 */
function backupV1(localKey: string, raw: string | null) {
  if (raw === null) return;
  const backupKey = `vk:backup:v1:${localKey}`;
  if (window.localStorage.getItem(backupKey) === null) {
    try {
      window.localStorage.setItem(backupKey, raw);
    } catch {
      // quota — migration proceeds; the shape adapters below are conservative
    }
  }
}

/** Parse the stored value defensively; `null` when absent/corrupt. */
function readRaw<T>(localKey: string): T | null {
  try {
    const raw = window.localStorage.getItem(localKey);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return (parsed ?? null) as T | null;
  } catch {
    return null;
  }
}

/**
 * One-time migration runner. Reads `vk:<key>`, passes the raw value through
 * `adapt`, and writes back only if something changed. Idempotent: after the
 * first run `adapt` receives the new shape and returns it untouched.
 */
function migrate<T>(localKey: string, adapt: (v: unknown) => T | null): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(localKey);
  if (raw === null) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  let adapted: T | null = null;
  try {
    adapted = adapt(parsed);
  } catch {
    return;
  }
  if (adapted === null) return;
  backupV1(localKey, raw);
  try {
    window.localStorage.setItem(localKey, JSON.stringify(adapted));
  } catch {
    // quota — keep old value
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ─────────────────────────────────────────────────────────────────────────────
// useNow — a shared wall-clock ticker for live-updating timers.
// ─────────────────────────────────────────────────────────────────────────────

/** Re-renders every `intervalMs` with the current time (SSR-safe). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
  return now;
}

// ─────────────────────────────────────────────────────────────────────────────
// Workouts — structured set logging (v1: comma strings → v2: SetEntry[])
// ─────────────────────────────────────────────────────────────────────────────

type V1Cell = { done: boolean; sets?: string; minutes?: string };

/** "9, 7" → [{reps:9,weightKg:null},{reps:7,weightKg:null}] */
function parseV1Sets(s: string | undefined): { reps: number; weightKg: number | null }[] {
  if (!s) return [];
  return s
    .split(/[,+\s]+/)
    .map((x) => parseInt(x, 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((reps) => ({ reps, weightKg: null }));
}

function adaptWorkouts(v: unknown): WorkoutLog | null {
  if (!isRecord(v)) return null;
  let changed = false;
  const out: WorkoutLog = {};
  for (const [date, day] of Object.entries(v)) {
    if (!isRecord(day)) {
      changed = true;
      continue;
    }
    const nextDay: WorkoutLog[string] = {};
    for (const [exId, cell] of Object.entries(day)) {
      if (!isRecord(cell)) {
        changed = true;
        continue;
      }
      if (Array.isArray(cell.sets)) {
        // already v2
        nextDay[exId] = cell as unknown as ExerciseLog;
        continue;
      }
      changed = true;
      const v1 = cell as unknown as V1Cell;
      nextDay[exId] = {
        done: Boolean(v1.done),
        sets: parseV1Sets(v1.sets),
        minutes: v1.minutes ? Number(v1.minutes) || undefined : undefined,
      };
    }
    out[date] = nextDay;
  }
  return changed ? out : null;
}

export type WorkoutsStore = ReturnType<typeof useWorkouts>;

export function useWorkouts() {
  return useSyncedStorage<WorkoutLog>("workouts", {});
}

/** Runs the workouts migration once per page load. */
export function useMigrateWorkouts() {
  useEffect(() => {
    migrate<WorkoutLog>("vk:workouts", adaptWorkouts);
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Fasting — timestamp engine (v1: elapsedSec tick counter → v2: startedAt)
// ─────────────────────────────────────────────────────────────────────────────

type V1FastState = {
  protocolId?: string;
  phase?: string;
  elapsedSec?: number;
  running?: boolean;
  lastTickAt?: number | null;
};

function adaptFastState(v: unknown): FastState | null {
  if (!isRecord(v)) return null;
  if (typeof v.startedAt !== "undefined") return null; // already v2
  const v1 = v as V1FastState;
  const protocolId = typeof v1.protocolId === "string" ? v1.protocolId : "16-8";
  const phase = v1.phase === "eating" ? "eating" : "fasting";
  // A running timer's banked seconds become a real start timestamp, so the
  // in-flight fast survives the upgrade. A paused timer can't be trusted
  // (the old counter already drifted), so it resets to idle.
  const startedAt =
    v1.running && typeof v1.elapsedSec === "number" && v1.elapsedSec > 0
      ? Date.now() - v1.elapsedSec * 1000
      : null;
  return { protocolId, phase, startedAt, autoClearHours: 720 };
}

function adaptFastHistory(v: unknown): FastHistoryEntry[] | null {
  if (!Array.isArray(v)) return null;
  let changed = false;
  const out: FastHistoryEntry[] = [];
  for (const raw of v) {
    if (isRecord(raw) && typeof raw.start === "number" && typeof raw.end === "number") {
      out.push(raw as unknown as FastHistoryEntry);
      continue;
    }
    if (isRecord(raw) && typeof raw.date === "string" && typeof raw.hours === "number") {
      changed = true;
      const end = Date.parse(`${raw.date.slice(0, 10)}T20:00:00`);
      if (Number.isNaN(end) || raw.hours <= 0) continue;
      out.push({
        id: `migrated-${raw.date}-${out.length}`,
        start: end - raw.hours * 3600_000,
        end,
        protocolId: typeof raw.protocol === "string" ? (raw.protocol.startsWith("1") || raw.protocol.startsWith("2") ? raw.protocol.slice(0, 4).replace(":", "-").slice(0, 4) : "16-8") : "16-8",
        source: "timer",
      });
    } else {
      changed = true;
    }
  }
  return changed ? out : null;
}

export function useFasting() {
  return useSyncedStorage<FastState>("fasting", DEFAULT_FAST_STATE);
}

export function useFastingHistory() {
  return useSyncedStorage<FastHistoryEntry[]>("fasting:history", []);
}

export function useMigrateFasting() {
  useEffect(() => {
    migrate<FastState>("vk:fasting", adaptFastState);
    migrate<FastHistoryEntry[]>("vk:fasting:history", adaptFastHistory);
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Todos — priority + tag (v1: plain text tasks)
// ─────────────────────────────────────────────────────────────────────────────

type V1Todo = { id: string; text: string; done: boolean; date: string };

function adaptTodos(v: unknown): Todo[] | null {
  if (!Array.isArray(v)) return null;
  let changed = false;
  const out: Todo[] = [];
  for (const raw of v) {
    if (isRecord(raw) && "priority" in raw && "tag" in raw) {
      out.push(raw as unknown as Todo);
      continue;
    }
    if (isRecord(raw) && typeof raw.text === "string") {
      changed = true;
      const v1 = raw as unknown as V1Todo;
      out.push({
        id: v1.id || `${Date.now()}_${out.length}`,
        text: v1.text,
        done: Boolean(v1.done),
        date: v1.date || dateKey(),
        priority: "P2",
        tag: "Personal",
        createdAt: Date.now(),
        completedAt: v1.done ? Date.now() : undefined,
      });
    } else {
      changed = true;
    }
  }
  return changed ? out : null;
}

export function useTodos() {
  return useSyncedStorage<Todo[]>("todos", []);
}

export function useMigrateTodos() {
  useEffect(() => {
    migrate<Todo[]>("vk:todos", adaptTodos);
  }, []);
}

export function newTodo(
  text: string,
  opts: { date?: string; priority?: TodoPriority; tag?: TodoTag } = {},
): Todo {
  return {
    id: `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    text,
    done: false,
    date: opts.date ?? dateKey(),
    priority: opts.priority ?? "P2",
    tag: opts.tag ?? "Personal",
    createdAt: Date.now(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Goal — milestone objects + metricByDay (v1: checks[] + appsByDay)
// ─────────────────────────────────────────────────────────────────────────────

type V1GoalState = {
  hub?: string;
  visa?: string;
  dailyTarget?: number;
  checks?: boolean[];
  appsByDay?: Record<string, number>;
  category?: string;
};

function adaptGoal(v: unknown): GoalState | null {
  if (!isRecord(v)) return null;
  if (isRecord(v.metricByDay) || isRecord(v.milestonesByCategory)) {
    // Possibly a partial v2 (e.g. from an interrupted migration) — fill gaps.
    const partial = v as unknown as Partial<GoalState>;
    return {
      ...v,
      hub: typeof partial.hub === "string" ? partial.hub : undefined,
      visa: typeof partial.visa === "string" ? partial.visa : undefined,
      metricByDay: partial.metricByDay ?? {},
      milestonesByCategory: partial.milestonesByCategory ?? {},
    } as GoalState;
  }
  const v1 = v as V1GoalState;
  const cat = (v1.category ?? "relocation") as GoalCategory;
  const defaults = defaultMilestonesFor(cat);
  // Preserve v1 check indexes onto the default milestone list.
  const checks = Array.isArray(v1.checks) ? v1.checks : [];
  const milestones: Milestone[] = defaults.map((m, i) => ({
    ...m,
    done: Boolean(checks[i]),
    doneAt: checks[i] ? dateKey() : null,
  }));
  const metricByDay: Record<string, number> = {};
  if (isRecord(v1.appsByDay)) {
    for (const [k, n] of Object.entries(v1.appsByDay)) {
      if (typeof n === "number" && n > 0) metricByDay[k] = n;
    }
  }
  return {
    hub: v1.hub,
    visa: v1.visa,
    metricByDay,
    milestonesByCategory: { [cat]: milestones },
  };
}

export function useGoalState() {
  return useSyncedStorage<GoalState>("goal", DEFAULT_GOAL_STATE);
}

export function useMigrateGoal() {
  useEffect(() => {
    migrate<GoalState>("vk:goal", adaptGoal);
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Journal + custom quotes (new keys — no migration)
// ─────────────────────────────────────────────────────────────────────────────

export function useJournal() {
  return useSyncedStorage<JournalMap>("journal", {});
}

export function useCustomQuotes() {
  return useSyncedStorage<CustomQuote[]>("motivation:custom", []);
}

export function newCustomQuote(text: string, tag: string): CustomQuote {
  return { id: `q_${Date.now().toString(36)}`, text, tag, createdAt: Date.now() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Workout exercise library — per split-day overrides over the presets.
// ─────────────────────────────────────────────────────────────────────────────

/** dayId → Exercise[] (user's customized list for that split day) */
export type ExerciseLibrary = Record<string, unknown[]>;

export function useExerciseLibrary() {
  return useSyncedStorage<ExerciseLibrary>("workout:library", {});
}

/** Sanitize one day's library entries through normalizeExercise. */
export function libraryExercises(library: ExerciseLibrary | null | undefined, dayId: string) {
  const raw = library?.[dayId];
  if (!Array.isArray(raw)) return null;
  const list = raw.map(normalizeExercise).filter((e) => e !== null);
  return list.length ? list : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Motivation visits (kept from v1 for the streak calculation)
// ─────────────────────────────────────────────────────────────────────────────

export function useMotivationVisits() {
  return useSyncedStorage<Record<string, number>>("motivation:visits", {});
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage stats — external-store view of localStorage (settings page).
// ─────────────────────────────────────────────────────────────────────────────

let statsCache: { raw: string; stats: KeyStat[] } | null = null;

function statsSnapshot(): KeyStat[] {
  const stats = collectKeyStats();
  // Content-hash cache keeps the snapshot referentially stable across renders.
  const raw = stats.map((s) => `${s.key}:${s.bytes}:${s.items}:${s.exists}`).join("|");
  if (statsCache?.raw === raw) return statsCache.stats;
  statsCache = { raw, stats };
  return stats;
}

const subscribeStats = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

/** Live per-key storage stats; null during SSR. Re-render via `storage` events. */
export function useStorageStats(): KeyStat[] | null {
  return useSyncExternalStore(subscribeStats, statsSnapshot, () => null);
}

/**
 * Nudge stats subscribers after direct localStorage writes (import/wipe).
 * Same-tab writes don't fire `storage` events, so we dispatch one.
 */
export function notifyStorageChanged(): void {
  try {
    window.dispatchEvent(new StorageEvent("storage"));
  } catch {
    // older browsers — stats refresh on next mount
  }
}

import type { GoalCategory, MotivationStyle, WorkoutSplit } from "./user-prefs";

// ─────────────────────────────────────────────────────────────────────────────
// Tracker navigation
// ─────────────────────────────────────────────────────────────────────────────

export const TRACKER_LINKS = [
  { href: "/hub", label: "Hub", short: "Hub", icon: "hub" },
  { href: "/intermittent-fasting", label: "Fasting", short: "Fast", icon: "timer" },
  { href: "/workout-tracking", label: "Workouts", short: "Gym", icon: "workout" },
  { href: "/goal", label: "Goal", short: "Goal", icon: "flag" },
  { href: "/todo", label: "Todo", short: "Todo", icon: "todo" },
  { href: "/motivation", label: "Motivation", short: "Boost", icon: "flame" },
  { href: "/archive", label: "Archive", short: "Archive", icon: "archive" },
  { href: "/weight-loss", label: "Weight Loss", short: "Weight", icon: "scale" },
  { href: "/share", label: "Share", short: "Share", icon: "share" },
  { href: "/shared-with-me", label: "Shared", short: "Shared", icon: "shared" },
  { href: "/settings", label: "Settings", short: "More", icon: "settings" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Date utilities
// ─────────────────────────────────────────────────────────────────────────────

export function dateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Monday-first week containing `now`, shifted by `offsetWeeks`. */
export function weekDays(offsetWeeks = 0, now: Date = new Date()): Date[] {
  const day = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** The last `n` dates ending today (oldest first). */
export function lastNDates(n: number, now: Date = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (n - 1 - i));
    return d;
  });
}

export function formatHMS(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/** 5400000 → "1h 30m", 2700000 → "45m" */
export function formatDurationShort(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** "14:35" for a timestamp — locale pinned to avoid SSR/client mismatches. */
export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "Mon, Sep 16" — locale pinned. */
export function formatDateShort(ts: number | string): string {
  const d = typeof ts === "string" ? new Date(ts) : new Date(ts);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Genuine consecutive-calendar-day streak over a list of date keys.
 * Counts back from today (or yesterday if today isn't in the set).
 */
export function calculateStreak(activeDates: string[]): number {
  if (!activeDates.length) return 0;
  const set = new Set(activeDates);
  const now = new Date();
  const todayStr = dateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = dateKey(yesterday);

  const start = set.has(todayStr) ? now : set.has(yesterdayStr) ? yesterday : null;
  if (!start) return 0;

  let streak = 0;
  const cursor = new Date(start);
  for (;;) {
    if (set.has(dateKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ─────────────────────────────────────────────────────────────────────────────
// Intermittent fasting — timestamp-based engine (zero drift)
// ─────────────────────────────────────────────────────────────────────────────

export type FastingProtocol = {
  id: string;
  label: string;
  fastHours: number;
  blurb: string;
};

export const FASTING_PROTOCOLS: FastingProtocol[] = [
  { id: "14-10", label: "14:10 Gentle Start", fastHours: 14, blurb: "Easy entry, steady energy" },
  { id: "16-8", label: "16:8 Lean Gains", fastHours: 16, blurb: "Classic daily driver" },
  { id: "18-6", label: "18:6 Fat Burn", fastHours: 18, blurb: "Deeper ketosis push" },
  { id: "20-4", label: "20:4 Warrior", fastHours: 20, blurb: "Aggressive cut days" },
];

export const FASTING_STAGES = [
  {
    atPct: 0,
    title: "Blood Sugar Drops",
    desc: "Insulin falls and the body transitions from last meal's glucose to stored energy.",
  },
  {
    atPct: 25,
    title: "Fat Burn Kicks In",
    desc: "Glycogen is running low — the body starts tapping stored fat for fuel.",
  },
  {
    atPct: 55,
    title: "Ketosis + Focus",
    desc: "Ketones rise, appetite steadies and mental clarity often peaks.",
  },
  {
    atPct: 85,
    title: "Autophagy Zone",
    desc: "Cellular clean-up ramps up — the deepest benefits of the fast live here.",
  },
] as const;

export function fastingStage(pct: number): { title: string; desc: string } {
  let stage: { title: string; desc: string; atPct: number } = FASTING_STAGES[0];
  for (const s of FASTING_STAGES) if (pct >= s.atPct) stage = s;
  return stage;
}

export type FastPhase = "fasting" | "eating";

export type FastState = {
  protocolId: string;
  phase: FastPhase;
  /** Epoch ms when the current phase began; null = idle. */
  startedAt: number | null;
  mealRoutine?: { firstMealTime: string; lastMealTime: string };
  autoClearHours?: 24 | 168 | 720;
};

export const DEFAULT_FAST_STATE: FastState = {
  protocolId: "16-8",
  phase: "fasting",
  startedAt: null,
  autoClearHours: 720,
};

export type FastHistoryEntry = {
  id: string;
  start: number;
  end: number;
  protocolId: string;
  source: "timer" | "manual" | "meal-window";
  firstMealTime?: string;
  lastMealTime?: string;
  mealDate?: string;
  createdAt?: number;
  note?: string;
};

export type FastingDerived = {
  elapsedMs: number;
  targetMs: number;
  remainingMs: number;
  pct: number;
  complete: boolean;
  running: boolean;
  stage: { title: string; desc: string } | null;
  /** When in eating phase: when the next fast should start. */
  nextFastAt: number | null;
};

/** Derive everything from timestamps — no interval accumulation, no drift. */
export function computeFastingState(st: FastState, now: number, fastHours: number): FastingDerived {
  const eating = st.phase === "eating";
  const targetMs = (eating ? 24 - fastHours : fastHours) * 3600_000;
  const running = st.startedAt !== null;
  const elapsedMs = st.startedAt ? Math.max(0, now - st.startedAt) : 0;
  const pct = targetMs ? Math.min(100, (Math.min(elapsedMs, targetMs) / targetMs) * 100) : 0;
  return {
    elapsedMs,
    targetMs,
    remainingMs: Math.max(0, targetMs - elapsedMs),
    pct,
    complete: running && elapsedMs >= targetMs,
    running,
    stage: eating ? null : fastingStage(pct),
    nextFastAt: eating && st.startedAt ? st.startedAt + (24 - fastHours) * 3600_000 : null,
  };
}

export function protocolById(id: string): FastingProtocol {
  return FASTING_PROTOCOLS.find((p) => p.id === id) ?? FASTING_PROTOCOLS[1];
}

// Fasting analytics ──

export function fastDateKeys(history: FastHistoryEntry[]): string[] {
  return history.map((h) => h.mealDate ?? dateKey(new Date(h.end)));
}

export function fastingStreak(history: FastHistoryEntry[]): number {
  return calculateStreak(fastDateKeys(history));
}

/** Mean fast hours over the trailing `days` window. */
export function avgFastHours(history: FastHistoryEntry[], days: number, now: number = Date.now()): number {
  const cutoff = now - days * 86_400_000;
  const recent = history.filter((h) => h.end >= cutoff && h.end <= now + 3600_000);
  if (!recent.length) return 0;
  const totalH = recent.reduce((a, h) => a + (h.end - h.start) / 3600_000, 0);
  return totalH / recent.length;
}

export function longestFastHours(history: FastHistoryEntry[]): number {
  return history.reduce((max, h) => Math.max(max, (h.end - h.start) / 3600_000), 0);
}

export function totalFastHours(history: FastHistoryEntry[]): number {
  return history.reduce((a, h) => a + (h.end - h.start) / 3600_000, 0);
}

/** Fast hours per day for the trailing `n` days (oldest first) — for charts. */
export function fastHoursByDay(history: FastHistoryEntry[], n: number, now: Date = new Date()): { label: string; value: number }[] {
  const byDay = new Map<string, number>();
  for (const h of history) {
    const key = h.mealDate ?? dateKey(new Date(h.end));
    byDay.set(key, (byDay.get(key) ?? 0) + (h.end - h.start) / 3600_000);
  }
  return lastNDates(n, now).map((d) => ({
    label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
    value: Math.round((byDay.get(dateKey(d)) ?? 0) * 10) / 10,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Workouts — split-aware presets + structured logging
// ─────────────────────────────────────────────────────────────────────────────

export type ExerciseTag = "compound" | "isolation" | "cardio" | "core";
export type WeightUnit = "kg" | "lbs";

export type Exercise = {
  id: string;
  name: string;
  unit: "reps" | "minutes";
  targetSets: number;
  targetReps?: number;
  targetMinutes?: number;
  suggestedWeightKg?: number;
  tag: ExerciseTag;
  hint: string;
};

export type SetEntry = { reps: number; weightKg: number | null };
export type ExerciseLog = {
  done: boolean;
  sets: SetEntry[];
  minutes?: number;
  note?: string;
};
/** dateKey → exerciseId → log */
export type WorkoutLog = Record<string, Record<string, ExerciseLog>>;

/** Accepts v1 exercise shapes (baseline/baselineWeight/category) and v2. */
export function normalizeExercise(raw: unknown): Exercise | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name : "";
  if (!name) return null;
  const id = typeof r.id === "string" && r.id ? r.id : `ex_${Math.random().toString(36).slice(2, 9)}`;
  const unit: "reps" | "minutes" = r.unit === "minutes" ? "minutes" : "reps";
  // v1: baseline: number[]; v2: targetSets/targetReps
  const baseline = Array.isArray(r.baseline) ? (r.baseline as unknown[]).filter((n): n is number => typeof n === "number") : [];
  const targetSets = typeof r.targetSets === "number" && r.targetSets > 0 ? Math.round(r.targetSets) : baseline.length || 3;
  const targetReps = typeof r.targetReps === "number" && r.targetReps > 0 ? r.targetReps : baseline[0] ?? 10;
  const targetMinutes = typeof r.targetMinutes === "number" ? r.targetMinutes : typeof r.baselineMinutes === "number" ? r.baselineMinutes : undefined;
  const suggestedWeightKg =
    typeof r.suggestedWeightKg === "number" ? r.suggestedWeightKg : typeof r.baselineWeight === "number" ? r.baselineWeight : undefined;
  const category = typeof r.category === "string" ? r.category : "";
  const tag: ExerciseTag =
    r.tag === "compound" || r.tag === "isolation" || r.tag === "cardio" || r.tag === "core"
      ? r.tag
      : unit === "minutes"
        ? "cardio"
        : category === "core"
          ? "core"
          : category === "isolation"
            ? "isolation"
            : "compound";
  return { id, name, unit, targetSets, targetReps, targetMinutes, suggestedWeightKg, tag, hint: typeof r.hint === "string" ? r.hint : "" };
}

const ex = (e: Exercise): Exercise => e;

export const SPLIT_DAYS: Record<"fullbody" | "push-pull-legs" | "upper-lower", { id: string; label: string; short: string }[]> = {
  fullbody: [{ id: "default", label: "Full Body Session", short: "Full" }],
  "push-pull-legs": [
    { id: "push", label: "Push · Chest · Delts · Triceps", short: "Push" },
    { id: "pull", label: "Pull · Back · Biceps", short: "Pull" },
    { id: "legs", label: "Legs & Abs", short: "Legs" },
  ],
  "upper-lower": [
    { id: "upper", label: "Upper Body", short: "Upper" },
    { id: "lower", label: "Lower Body & Core", short: "Lower" },
  ],
};

export const SPLIT_PRESETS: Record<"fullbody" | "push-pull-legs" | "upper-lower", Record<string, Exercise[]>> = {
  fullbody: {
    default: [
      ex({ id: "squats", name: "Squats", unit: "reps", targetSets: 3, targetReps: 12, suggestedWeightKg: 50, tag: "compound", hint: "Legs + glutes foundation" }),
      ex({ id: "pushups", name: "Pushups / Bench Press", unit: "reps", targetSets: 3, targetReps: 10, suggestedWeightKg: 50, tag: "compound", hint: "Chest + triceps" }),
      ex({ id: "rows", name: "Rows", unit: "reps", targetSets: 3, targetReps: 9, suggestedWeightKg: 50, tag: "compound", hint: "Full-body pull" }),
      ex({ id: "rdl", name: "Romanian Deadlift", unit: "reps", targetSets: 3, targetReps: 10, suggestedWeightKg: 50, tag: "compound", hint: "Hinge, posterior chain" }),
      ex({ id: "pike", name: "Pike Pushups", unit: "reps", targetSets: 2, targetReps: 8, tag: "isolation", hint: "Shoulders" }),
      ex({ id: "lunges", name: "Lunges", unit: "reps", targetSets: 2, targetReps: 10, tag: "compound", hint: "Each leg — start 8/leg" }),
      ex({ id: "rope", name: "Jump Ropes", unit: "minutes", targetSets: 1, targetMinutes: 8, tag: "cardio", hint: "8 min cardio finisher" }),
    ],
  },
  "push-pull-legs": {
    push: [
      ex({ id: "bench", name: "Barbell / DB Bench Press", unit: "reps", targetSets: 4, targetReps: 10, suggestedWeightKg: 50, tag: "compound", hint: "Chest & anterior delts" }),
      ex({ id: "incline-press", name: "Incline Dumbbell Press", unit: "reps", targetSets: 3, targetReps: 10, suggestedWeightKg: 20, tag: "compound", hint: "Upper chest focus" }),
      ex({ id: "overhead-press", name: "Overhead Shoulder Press", unit: "reps", targetSets: 3, targetReps: 8, suggestedWeightKg: 35, tag: "compound", hint: "Shoulder strength" }),
      ex({ id: "lateral-raises", name: "Lateral Raises", unit: "reps", targetSets: 3, targetReps: 12, suggestedWeightKg: 10, tag: "isolation", hint: "Side delts width" }),
      ex({ id: "dips", name: "Dips / Tricep Pushdowns", unit: "reps", targetSets: 3, targetReps: 10, tag: "isolation", hint: "Tricep lockout" }),
    ],
    pull: [
      ex({ id: "pullups", name: "Pull-ups / Lat Pulldown", unit: "reps", targetSets: 4, targetReps: 8, tag: "compound", hint: "Lat width & vertical pull" }),
      ex({ id: "rows", name: "Barbell / Cable Rows", unit: "reps", targetSets: 4, targetReps: 10, suggestedWeightKg: 50, tag: "compound", hint: "Mid-back thickness" }),
      ex({ id: "face-pulls", name: "Face Pulls", unit: "reps", targetSets: 3, targetReps: 15, suggestedWeightKg: 20, tag: "isolation", hint: "Rear delts & rotator cuff" }),
      ex({ id: "bicep-curls", name: "Dumbbell Bicep Curls", unit: "reps", targetSets: 3, targetReps: 10, suggestedWeightKg: 14, tag: "isolation", hint: "Elbow flexion" }),
      ex({ id: "hammer-curls", name: "Hammer Curls", unit: "reps", targetSets: 2, targetReps: 10, suggestedWeightKg: 14, tag: "isolation", hint: "Brachialis & forearms" }),
    ],
    legs: [
      ex({ id: "squats", name: "Barbell / Goblet Squats", unit: "reps", targetSets: 4, targetReps: 10, suggestedWeightKg: 60, tag: "compound", hint: "Quad & core foundation" }),
      ex({ id: "rdl", name: "Romanian Deadlift", unit: "reps", targetSets: 3, targetReps: 10, suggestedWeightKg: 55, tag: "compound", hint: "Hamstring & glute hinge" }),
      ex({ id: "lunges", name: "Walking Lunges", unit: "reps", targetSets: 3, targetReps: 12, tag: "compound", hint: "Unilateral balance & quads" }),
      ex({ id: "leg-ext", name: "Leg Press / Extension", unit: "reps", targetSets: 3, targetReps: 12, tag: "isolation", hint: "Quad isolation" }),
      ex({ id: "calf-raises", name: "Standing Calf Raises", unit: "reps", targetSets: 3, targetReps: 15, tag: "isolation", hint: "Gastrocnemius volume" }),
      ex({ id: "plank", name: "Plank / Hanging Leg Raise", unit: "minutes", targetSets: 1, targetMinutes: 3, tag: "core", hint: "Core stability finisher" }),
    ],
  },
  "upper-lower": {
    upper: [
      ex({ id: "bench", name: "Bench Press", unit: "reps", targetSets: 4, targetReps: 10, suggestedWeightKg: 50, tag: "compound", hint: "Primary horizontal push" }),
      ex({ id: "rows", name: "Barbell / Cable Rows", unit: "reps", targetSets: 4, targetReps: 10, suggestedWeightKg: 50, tag: "compound", hint: "Horizontal pull" }),
      ex({ id: "overhead-press", name: "Overhead Press", unit: "reps", targetSets: 3, targetReps: 8, suggestedWeightKg: 35, tag: "compound", hint: "Vertical push" }),
      ex({ id: "pullups", name: "Pull-ups / Pulldowns", unit: "reps", targetSets: 3, targetReps: 8, tag: "compound", hint: "Vertical pull" }),
      ex({ id: "lateral-raises", name: "Lateral Raises", unit: "reps", targetSets: 2, targetReps: 12, suggestedWeightKg: 10, tag: "isolation", hint: "Deltoid finisher" }),
      ex({ id: "arm-superset", name: "Bicep Curl & Tricep Extension", unit: "reps", targetSets: 2, targetReps: 12, suggestedWeightKg: 14, tag: "isolation", hint: "Arm isolation superset" }),
    ],
    lower: [
      ex({ id: "squats", name: "Squats", unit: "reps", targetSets: 4, targetReps: 10, suggestedWeightKg: 60, tag: "compound", hint: "Primary lower compound" }),
      ex({ id: "rdl", name: "Romanian Deadlift", unit: "reps", targetSets: 3, targetReps: 10, suggestedWeightKg: 55, tag: "compound", hint: "Posterior chain" }),
      ex({ id: "lunges", name: "Bulgarian Split Squats / Lunges", unit: "reps", targetSets: 3, targetReps: 10, tag: "compound", hint: "Unilateral drive" }),
      ex({ id: "calf-raises", name: "Calf Raises", unit: "reps", targetSets: 3, targetReps: 15, tag: "isolation", hint: "Lower leg endurance" }),
      ex({ id: "plank", name: "Hanging Leg Raise / Plank", unit: "minutes", targetSets: 1, targetMinutes: 3, tag: "core", hint: "Core stability" }),
    ],
  },
};

/** Split-day tabs for any split; `custom` uses the user's named days. */
export function splitDayTabs(split: WorkoutSplit, customDays: { id: string; label: string }[]): { id: string; label: string; short: string }[] {
  if (split === "custom") {
    return customDays.length
      ? customDays.map((d, i) => ({ id: d.id, label: d.label, short: d.label.split(" ")[0] || `Day ${i + 1}` }))
      : [{ id: "day-1", label: "Day 1", short: "D1" }];
  }
  return SPLIT_DAYS[split];
}

/** Exercises for a split day: user library override wins, else preset. */
export function exercisesForDay(
  split: WorkoutSplit,
  dayId: string,
  library: Record<string, unknown[]> | undefined,
): Exercise[] {
  const override = library?.[dayId];
  if (Array.isArray(override)) {
    const list = override.map(normalizeExercise).filter((e): e is Exercise => e !== null);
    if (list.length) return list;
  }
  if (split === "custom") return [];
  return SPLIT_PRESETS[split]?.[dayId] ?? [];
}

/** Suggested tab for a given date — rotates through the split's days. */
export function suggestedDayId(tabs: { id: string }[], date: Date = new Date()): string {
  if (!tabs.length) return "default";
  const anchor = new Date(2024, 0, 1).getTime();
  const diff = Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - anchor) / 86_400_000);
  return tabs[((diff % tabs.length) + tabs.length) % tabs.length].id;
}

// Weight units ──

const KG_TO_LBS = 2.20462;

export function kgToDisplay(weightKg: number, unit: WeightUnit): number {
  return unit === "kg" ? weightKg : weightKg * KG_TO_LBS;
}

export function displayToKg(weight: number, unit: WeightUnit): number {
  return unit === "kg" ? weight : weight / KG_TO_LBS;
}

export function formatWeight(weightKg: number | null | undefined, unit: WeightUnit): string {
  if (weightKg == null) return "—";
  return `${Math.round(kgToDisplay(weightKg, unit) * 10) / 10} ${unit}`;
}

// Workout analytics ──

/** Epley estimated one-rep max. */
export function est1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return reps === 1 ? weightKg : weightKg * (1 + reps / 30);
}

export type BestSet = { weightKg: number; reps: number; e1rm: number; date: string };

/** Heaviest set (by estimated 1RM) ever logged for an exercise. */
export function prFor(logs: WorkoutLog, exerciseId: string): BestSet | null {
  let best: BestSet | null = null;
  for (const [date, day] of Object.entries(logs)) {
    const log = day[exerciseId];
    if (!log?.done) continue;
    for (const s of log.sets) {
      if (!s.weightKg || !s.reps) continue;
      const e = est1RM(s.weightKg, s.reps);
      if (!best || e > best.e1rm) best = { weightKg: s.weightKg, reps: s.reps, e1rm: e, date };
    }
  }
  return best;
}

/** Last session (any date < beforeDate) where this exercise was logged. */
export function lastSessionFor(logs: WorkoutLog, exerciseId: string, beforeDate: string): { date: string; sets: SetEntry[] } | null {
  let found: { date: string; sets: SetEntry[] } | null = null;
  for (const [date, day] of Object.entries(logs)) {
    if (date >= beforeDate) continue;
    const log = day[exerciseId];
    if (log?.done && log.sets.length) found = { date, sets: log.sets };
  }
  return found;
}

/** Volume (tonnage, kg) and session count per week for trailing weeks. */
export function weeklyWorkoutStats(logs: WorkoutLog, weeks = 4, now: Date = new Date()): { label: string; sessions: number; volumeKg: number }[] {
  const out: { label: string; sessions: number; volumeKg: number }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const days = weekDays(-w, now);
    let sessions = 0;
    let volumeKg = 0;
    for (const d of days) {
      const dayLog = logs[dateKey(d)];
      if (!dayLog) continue;
      let dayActive = false;
      for (const log of Object.values(dayLog)) {
        if (!log?.done) continue;
        dayActive = true;
        for (const s of log.sets) {
          if (s.weightKg && s.reps) volumeKg += s.weightKg * s.reps;
          else if (s.reps) volumeKg += s.reps; // bodyweight reps count lightly
        }
      }
      if (dayActive) sessions++;
    }
    out.push({ label: w === 0 ? "This wk" : `${w}w ago`, sessions, volumeKg: Math.round(volumeKg) });
  }
  return out;
}

/** Session dates (any exercise done) as date keys. */
export function workoutSessionDates(logs: WorkoutLog): string[] {
  return Object.entries(logs)
    .filter(([, day]) => Object.values(day).some((l) => l?.done))
    .map(([date]) => date);
}

// ─────────────────────────────────────────────────────────────────────────────
// Todos
// ─────────────────────────────────────────────────────────────────────────────

export type TodoPriority = "P1" | "P2" | "P3";
export type TodoTag = "Work" | "Health" | "Goal" | "Personal" | "Deep Work";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  date: string;
  priority: TodoPriority;
  tag: TodoTag;
  createdAt: number;
  completedAt?: number;
};

export const TODO_PRIORITIES: { id: TodoPriority; label: string; dot: string }[] = [
  { id: "P1", label: "Urgent", dot: "bg-red-500" },
  { id: "P2", label: "Medium", dot: "bg-amber-500" },
  { id: "P3", label: "Low", dot: "bg-slate-400" },
];

export const TODO_TAGS: TodoTag[] = ["Work", "Health", "Goal", "Personal", "Deep Work"];

export const TAG_COLORS: Record<TodoTag, string> = {
  Work: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Health: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Goal: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30",
  Personal: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  "Deep Work": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
};

// ─────────────────────────────────────────────────────────────────────────────
// Goals — milestones + daily metric
// ─────────────────────────────────────────────────────────────────────────────

export type Milestone = { id: string; title: string; done: boolean; doneAt: string | null };

export type WeeklyCommitmentStatus = "active" | "completed" | "carried" | "closed";
export type WeeklyCommitment = {
  id: string;
  text: string;
  weekOf: string;
  status: WeeklyCommitmentStatus;
  completedAt?: number;
  carriedFrom?: string;
};

export type GoalState = {
  hub?: string;
  visa?: string;
  /** Legacy v1 field; normalized into weeklyCommitments on read. */
  weeklyCommitment?: { text: string; weekOf: string; completedAt?: number };
  weeklyCommitments?: WeeklyCommitment[];
  metricByDay: Record<string, number>;
  milestonesByCategory: Partial<Record<GoalCategory, Milestone[]>>;
};

export const DEFAULT_GOAL_STATE: GoalState = { metricByDay: {}, milestonesByCategory: {} };

export function newMilestoneId(): string {
  return `ms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function normalizeWeeklyCommitments(state: GoalState): WeeklyCommitment[] {
  if (state.weeklyCommitments?.length) return state.weeklyCommitments;
  if (!state.weeklyCommitment?.text) return [];
  return [{
    id: `week-${state.weeklyCommitment.weekOf}`,
    text: state.weeklyCommitment.text,
    weekOf: state.weeklyCommitment.weekOf,
    status: state.weeklyCommitment.completedAt ? "completed" : "active",
    completedAt: state.weeklyCommitment.completedAt,
  }];
}

/** Default milestone set per category (also used to migrate v1 check indexes). */
export function defaultMilestonesFor(cat: GoalCategory): Milestone[] {
  return (GOAL_MILESTONES[cat] ?? GOAL_MILESTONES.custom).map((title, i) => ({
    id: `${cat}-${i}`,
    title,
    done: false,
    doneAt: null,
  }));
}

/** User milestones for a category, falling back to defaults. */
export function milestonesFor(state: GoalState, cat: GoalCategory): Milestone[] {
  const saved = state.milestonesByCategory?.[cat];
  return saved?.length ? saved : defaultMilestonesFor(cat);
}

/** Suggested cumulative goal totals per category — drives the ETA estimate. */
export const GOAL_TOTAL_PRESETS: Record<GoalCategory, number> = {
  relocation: 120,
  career: 150,
  fitness: 1800,
  weightloss: 90,
  learning: 2400,
  financial: 3000,
  custom: 100,
};

export function goalEtaDays(totalLogged: number, goalTotal: number | undefined, avgPerDay7: number): number | null {
  if (!goalTotal || goalTotal <= 0 || avgPerDay7 <= 0) return null;
  const remaining = Math.max(0, goalTotal - totalLogged);
  return Math.ceil(remaining / avgPerDay7);
}

// ─────────────────────────────────────────────────────────────────────────────
// Goal milestones defaults & snippet generator
// ─────────────────────────────────────────────────────────────────────────────

export const GOAL_MILESTONES: Record<GoalCategory, string[]> = {
  relocation: [
    "Recognized university degree (Anabin H+ confirmation)",
    "Concrete job offer from a target-country entity",
    "Minimum salary meeting the visa threshold",
    "Full Stack Tech Stack specification (matching position description)",
  ],
  fitness: [
    "Set baseline measurements (weight, body fat, key lifts)",
    "Complete 4 consecutive weeks of training",
    "Hit first major strength milestone",
    "Achieve target body composition or endurance goal",
  ],
  weightloss: [
    "Set a sustainable target weight",
    "Log seven consecutive daily weigh-ins",
    "Review the first weekly trend",
    "Reach the next healthy checkpoint",
  ],
  career: [
    "Update resume and LinkedIn to target role",
    "Complete 50 applications to target companies",
    "Land first technical interview",
    "Receive and accept an offer",
  ],
  learning: [
    "Choose primary skill / certification to pursue",
    "Complete foundational coursework or tutorial",
    "Build a portfolio project demonstrating the skill",
    "Get feedback from a peer or mentor",
  ],
  financial: [
    "Set monthly savings target and track it",
    "Build 3-month emergency fund",
    "Start one additional income stream",
    "Review and optimize monthly expenses",
  ],
  custom: [
    "Define your goal clearly (write it down)",
    "Break it into 4 weekly milestones",
    "Complete the first milestone",
    "Review and adjust the plan",
  ],
};

export const GOAL_SNIPPETS: Record<GoalCategory, (hub?: string) => string> = {
  relocation: (hub) =>
    `Hallo! I'm a Full Stack Engineer specializing in TypeScript (React, Node, NestJS, PostgreSQL). I love the tech ecosystem in ${hub ?? "your city"} and notice your team is scaling up. Would love to connect and share how my background aligns with your current architecture needs. Vielen Dank!`,
  fitness: () =>
    `Training update: ${new Date().toLocaleDateString()} — Every rep counts. Every session compounds. The version of me that shows up today is building the version of me that wins tomorrow.`,
  weightloss: () =>
    `Health check-in: ${new Date().toLocaleDateString()} — I am building a sustainable routine, one honest check-in at a time.`,
  career: () =>
    `Career development check-in: ${new Date().toLocaleDateString()} — Focused on continuous improvement. Building skills, shipping projects, and making connections that matter.`,
  learning: () =>
    `Learning update: ${new Date().toLocaleDateString()} — Today's focus: deep work on the core skill. Consistency beats intensity. 30 minutes of focused practice > 3 hours of distracted effort.`,
  financial: () =>
    `Financial check-in: ${new Date().toLocaleDateString()} — Tracking expenses, building savings, and investing in skills that generate returns. Small optimizations compound.`,
  custom: () =>
    `Daily reflection: ${new Date().toLocaleDateString()} — One step closer today. Progress isn't always visible, but it's always happening. Trust the process.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Motivation — quotes, journal, custom affirmations
// ─────────────────────────────────────────────────────────────────────────────

export const MOTIVATION_QUOTES: Record<MotivationStyle, { text: string; tag: string }[]> = {
  discipline: [
    { text: "Small daily wins compound into a life you're proud of.", tag: "Discipline" },
    { text: "You don't need motivation to start. You need a start to build momentum.", tag: "Action" },
    { text: "Discipline is choosing the future self over the current craving.", tag: "Focus" },
    { text: "Eat in the window. Work in the zone. Sleep like it's a skill.", tag: "Routine" },
    { text: "Future you is watching. Make them proud before lunch.", tag: "Accountability" },
    { text: "Consistency beats intensity. Show up again tomorrow.", tag: "Habit" },
    { text: "The hardest part is showing up. Once you're there, momentum takes over.", tag: "Start" },
    { text: "Every rep, every fast, every application — it all counts. Keep stacking.", tag: "Compound" },
  ],
  resilience: [
    { text: "Rejection is redirection — every 'no' funds the next 'yes'.", tag: "Resilience" },
    { text: "Fall seven times, stand up eight. The world belongs to those who persist.", tag: "Grit" },
    { text: "Setbacks are setups for comebacks. Keep moving.", tag: "Bounce Back" },
    { text: "They said it was impossible. Then someone did it — that someone is you.", tag: "Defiance" },
    { text: "The pain of discipline is nothing compared to the pain of regret.", tag: "Choice" },
    { text: "You've survived 100% of your worst days. That's a perfect record.", tag: "Track Record" },
    { text: "Pressure makes diamonds. Keep pressing.", tag: "Pressure" },
    { text: "No one is coming to save you. That's the best news — you have full control.", tag: "Ownership" },
  ],
  growth: [
    { text: "Growth begins at the edge of your comfort zone. Step further today.", tag: "Growth" },
    { text: "Every skill you master is a door that opens. Keep unlocking.", tag: "Skills" },
    { text: "The best investment you can make is in yourself.", tag: "Investment" },
    { text: "Compare yourself to who you were yesterday, not to who someone else is today.", tag: "Progress" },
    { text: "Learning never exhausts the mind. Keep sharpening.", tag: "Learning" },
    { text: "You're not behind. You're on your own timeline. Trust the process.", tag: "Patience" },
    { text: "Mistakes are proof that you're trying. Fail forward.", tag: "Experiment" },
    { text: "The compound effect of daily learning is unstoppable.", tag: "Compound" },
  ],
  health: [
    { text: "Your body is the only home you'll live in forever. Take care of it.", tag: "Body" },
    { text: "Movement is medicine. Every rep is a prescription.", tag: "Fitness" },
    { text: "Fast clean. Eat clean. Sleep clean. Repeat.", tag: "Routine" },
    { text: "Health is not a goal — it's a daily practice.", tag: "Daily" },
    { text: "The strongest muscle is your heart. Train it, feed it, rest it.", tag: "Heart" },
    { text: "You can't pour from an empty cup. Fill yours first.", tag: "Self-Care" },
    { text: "Sweat is just fat crying. Make it weep.", tag: "Grind" },
    { text: "Recovery is part of the workout. Rest like a pro.", tag: "Recovery" },
  ],
  career: [
    { text: "Apply like it's your job — until it gets you the job.", tag: "Outreach" },
    { text: "Your network is your net worth. Build it intentionally.", tag: "Network" },
    { text: "Every application is a lottery ticket. Buy more.", tag: "Volume" },
    { text: "Skills pay the bills. Keep stacking your toolkit.", tag: "Skills" },
    { text: "The best time to plant a tree was 20 years ago. Second best is now.", tag: "Start" },
    { text: "Don't wait for opportunity. Create it.", tag: "Initiative" },
    { text: "Your resume opens doors. Your skills walk through them.", tag: "Competence" },
    { text: "Rejection is just data. Analyze, adapt, apply again.", tag: "Iteration" },
  ],
  stoic: [
    { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", tag: "Marcus Aurelius" },
    { text: "The obstacle is the way. What blocks the path becomes the path.", tag: "Ryan Holiday" },
    { text: "Waste no more time arguing about what a good person should be. Be one.", tag: "Marcus Aurelius" },
    { text: "Difficulties strengthen the mind, as labor does the body.", tag: "Seneca" },
    { text: "It's not what happens to you, but how you react to it that matters.", tag: "Epictetus" },
    { text: "First say to yourself what you would be; and then do what you have to do.", tag: "Epictetus" },
    { text: "He who fears death will never do anything worthy of a living man.", tag: "Seneca" },
    { text: "The best revenge is not to be like your enemy.", tag: "Marcus Aurelius" },
  ],
};

export type JournalEntry = {
  win: string;
  learned: string;
  focus: string;
  updatedAt: number;
};

/** dateKey → entry */
export type JournalMap = Record<string, JournalEntry>;

export type CustomQuote = {
  id: string;
  text: string;
  tag: string;
  createdAt: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Recent activity feed (hub)
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityKind = "fast" | "workout" | "todo" | "goal" | "journal";

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  at: number;
  title: string;
  detail?: string;
};

const ACTIVITY_WINDOW = 48 * 3600_000;

export function buildRecentActivity(
  inputs: {
    fastHistory: FastHistoryEntry[];
    workouts: WorkoutLog;
    todos: Todo[];
    metricByDay: Record<string, number>;
    metricLabel: string;
    journal: JournalMap;
  },
  now: number = Date.now(),
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const cutoff = now - ACTIVITY_WINDOW;

  for (const h of inputs.fastHistory) {
    if (h.end < cutoff || h.end > now + 3600_000) continue;
    const hrs = Math.round(((h.end - h.start) / 3600_000) * 10) / 10;
    events.push({
      id: `fast-${h.id}`,
      kind: "fast",
      at: h.end,
      title: `Completed a ${hrs}h fast`,
      detail: h.source === "manual" ? "logged manually" : h.source === "meal-window" ? "first and last meal logged" : protocolById(h.protocolId).label,
    });
  }

  for (const [date, day] of Object.entries(inputs.workouts)) {
    const doneCount = Object.values(day).filter((l) => l?.done).length;
    if (!doneCount) continue;
    const at = Date.parse(`${date}T18:00:00`);
    if (Number.isNaN(at) || at < cutoff || at > now + 3600_000) continue;
    const sets = Object.values(day).reduce((a, l) => a + (l?.done ? l.sets.length : 0), 0);
    events.push({
      id: `workout-${date}`,
      kind: "workout",
      at,
      title: `Workout session logged`,
      detail: `${doneCount} exercises · ${sets} sets`,
    });
  }

  for (const t of inputs.todos) {
    if (!t.done || !t.completedAt || t.completedAt < cutoff) continue;
    events.push({
      id: `todo-${t.id}`,
      kind: "todo",
      at: t.completedAt,
      title: `Task completed`,
      detail: t.text,
    });
  }

  for (const [date, n] of Object.entries(inputs.metricByDay)) {
    if (!n) continue;
    const at = Date.parse(`${date}T20:00:00`);
    if (Number.isNaN(at) || at < cutoff) continue;
    events.push({
      id: `goal-${date}`,
      kind: "goal",
      at,
      title: `${inputs.metricLabel} logged`,
      detail: `${n} today`,
    });
  }

  for (const [date, j] of Object.entries(inputs.journal)) {
    if (!j?.updatedAt || j.updatedAt < cutoff) continue;
    events.push({
      id: `journal-${date}`,
      kind: "journal",
      at: j.updatedAt,
      title: "Reflection journaled",
      detail: j.win || j.learned || j.focus,
    });
  }

  return events.sort((a, b) => b.at - a.at).slice(0, 12);
}

export function relativeTime(at: number, now: number = Date.now()): string {
  const diff = now - at;
  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Week-in-Review — cross-tracker digest with week-over-week deltas
// ─────────────────────────────────────────────────────────────────────────────

export type WeekReview = {
  /** Trailing 7 days ending today (inclusive). */
  fastHours: number;
  prevFastHours: number;
  sessions: number;
  prevSessions: number;
  volumeKg: number;
  prevVolumeKg: number;
  tasksCompleted: number;
  prevTasksCompleted: number;
  metricTotal: number;
  prevMetricTotal: number;
  /** Days with at least one anchor completed. */
  activeDays: number;
  journalEntries: number;
};

function weekWindow(now: Date, offsetWeeks: number): { start: Date; end: Date } {
  const days = weekDays(offsetWeeks, now);
  return { start: days[0], end: days[6] };
}

function inRange(dateKeyStr: string, start: Date, end: Date): boolean {
  const k0 = dateKey(start);
  const k1 = dateKey(end);
  return dateKeyStr >= k0 && dateKeyStr <= k1;
}

/**
 * Aggregate the trailing week vs the week before it, across fasting,
 * workouts, todos, the daily goal metric, and the journal.
 */
export function buildWeekReview(
  inputs: {
    fastHistory: FastHistoryEntry[];
    workouts: WorkoutLog;
    todos: Todo[];
    metricByDay: Record<string, number>;
    journal: JournalMap;
  },
  now: Date = new Date(),
): WeekReview {
  const thisWeek = weekWindow(now, 0);
  const lastWeek = weekWindow(now, -1);

  const sumFast = (w: { start: Date; end: Date }) =>
    inputs.fastHistory
      .filter((h) => {
        const k = h.mealDate ?? dateKey(new Date(h.end));
        return k >= dateKey(w.start) && k <= dateKey(w.end);
      })
      .reduce((a, h) => a + (h.end - h.start) / 3600_000, 0);

  const workoutWeek = (w: { start: Date; end: Date }) => {
    let sessions = 0;
    let volumeKg = 0;
    for (const d of weekDays(0, w.start)) {
      const dayLog = inputs.workouts[dateKey(d)];
      if (!dayLog) continue;
      let active = false;
      for (const log of Object.values(dayLog)) {
        if (!log?.done) continue;
        active = true;
        for (const s of log.sets) {
          if (s.weightKg && s.reps) volumeKg += s.weightKg * s.reps;
          else if (s.reps) volumeKg += s.reps;
        }
      }
      if (active) sessions++;
    }
    return { sessions, volumeKg: Math.round(volumeKg) };
  };

  const countCompleted = (w: { start: Date; end: Date }) =>
    inputs.todos.filter((t) => {
      if (!t.done || !t.completedAt) return false;
      const k = dateKey(new Date(t.completedAt));
      return k >= dateKey(w.start) && k <= dateKey(w.end);
    }).length;

  const sumMetric = (w: { start: Date; end: Date }) =>
    Object.entries(inputs.metricByDay)
      .filter(([k]) => inRange(k, w.start, w.end))
      .reduce((a, [, n]) => a + n, 0);

  const countJournal = (w: { start: Date; end: Date }) =>
    Object.entries(inputs.journal).filter(([k]) => inRange(k, w.start, w.end)).length;

  const w1 = workoutWeek(thisWeek);
  const w0 = workoutWeek(lastWeek);

  // Active days: union of any anchor activity per day this week.
  const activeDayKeys = new Set<string>();
  for (const h of inputs.fastHistory) {
    const k = h.mealDate ?? dateKey(new Date(h.end));
    if (inRange(k, thisWeek.start, thisWeek.end)) activeDayKeys.add(k);
  }
  for (const k of Object.keys(inputs.workouts)) {
    if (Object.values(inputs.workouts[k]).some((l) => l?.done) && inRange(k, thisWeek.start, thisWeek.end)) activeDayKeys.add(k);
  }
  for (const t of inputs.todos) {
    if (t.done && t.completedAt) {
      const k = dateKey(new Date(t.completedAt));
      if (inRange(k, thisWeek.start, thisWeek.end)) activeDayKeys.add(k);
    }
  }
  for (const [k, n] of Object.entries(inputs.metricByDay)) {
    if (n > 0 && inRange(k, thisWeek.start, thisWeek.end)) activeDayKeys.add(k);
  }

  return {
    fastHours: Math.round(sumFast(thisWeek) * 10) / 10,
    prevFastHours: Math.round(sumFast(lastWeek) * 10) / 10,
    sessions: w1.sessions,
    prevSessions: w0.sessions,
    volumeKg: w1.volumeKg,
    prevVolumeKg: w0.volumeKg,
    tasksCompleted: countCompleted(thisWeek),
    prevTasksCompleted: countCompleted(lastWeek),
    metricTotal: sumMetric(thisWeek),
    prevMetricTotal: sumMetric(lastWeek),
    activeDays: activeDayKeys.size,
    journalEntries: countJournal(thisWeek),
  };
}

/** Formatted delta like "+2.5h" / "−3" / "new"; positive is good by default. */
export function formatDelta(current: number, previous: number, unit = "", moreIsBetter = true): { text: string; good: boolean } {
  const diff = current - previous;
  const abs = Math.abs(Math.round(diff * 10) / 10);
  if (previous === 0 && current === 0) return { text: `0${unit}`, good: true };
  if (previous === 0) return { text: `+${abs}${unit}`, good: moreIsBetter };
  if (diff === 0) return { text: `=${unit}`.replace("=", "±0"), good: true };
  const arrow = diff > 0 ? "+" : "−";
  return { text: `${arrow}${abs}${unit}`, good: moreIsBetter ? diff > 0 : diff < 0 };
}

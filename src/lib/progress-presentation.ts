export const PROGRESS_METRICS = {
  sets: {
    label: "Recorded sets",
    unit: "sets",
    href: "/workout-tracking",
    action: "Log exercise",
    key: "sets",
    bars: true,
  },
  weight: {
    label: "Weight",
    unit: "kg",
    href: "/weight-loss",
    action: "Record weight",
    key: "weight",
    bars: false,
  },
  energy: {
    label: "Recorded energy",
    unit: "kcal",
    href: "/food",
    action: "Add food",
    key: "energy",
    bars: true,
  },
  protein: {
    label: "Recorded protein",
    unit: "g",
    href: "/food",
    action: "Add food",
    key: "protein",
    bars: true,
  },
  exercise: {
    label: "Recorded exercise",
    unit: "min",
    href: "/workout-tracking",
    action: "Log exercise",
    key: "exerciseMinutes",
    bars: true,
  },
  fasting: {
    label: "Recorded fasting",
    unit: "hours",
    href: "/intermittent-fasting?view=window",
    action: "Record eating window",
    key: "fastHours",
    bars: false,
  },
  water: {
    label: "Recorded water",
    unit: "glasses",
    href: "/intermittent-fasting",
    action: "Record water",
    key: "water",
    bars: true,
  },
  sleep: {
    label: "Recorded sleep",
    unit: "hours",
    href: "/health?view=recovery",
    action: "Record sleep",
    key: "sleep",
    bars: false,
  },
  focus: {
    label: "Completed focus",
    unit: "min",
    href: "/plan?view=focus",
    action: "Start focus",
    key: "focus",
    bars: true,
  },
  study: {
    label: "Completed study",
    unit: "min",
    href: "/roadmap",
    action: "Open Roadmap",
    key: "study",
    bars: true,
  },
  tasks: {
    label: "Completed tasks",
    unit: "tasks",
    href: "/todo",
    action: "Open Tasks",
    key: "tasks",
    bars: true,
  },
  goal: {
    label: "Goal metric",
    unit: "units",
    href: "/goal?view=metrics",
    action: "Log progress",
    key: "goalMetric",
    bars: false,
  },
  routine: {
    label: "Completed occurrences",
    unit: "records",
    href: "/routine",
    action: "Open routines",
    key: "routine",
    bars: true,
  },
  reflection: {
    label: "Saved reflections",
    unit: "entries",
    href: "/log?view=journal",
    action: "Write reflection",
    key: "journal",
    bars: true,
  },
} as const;
export type ProgressMetric = keyof typeof PROGRESS_METRICS;
export type ProgressReading = { date: string } & Partial<
  Record<
    (typeof PROGRESS_METRICS)[ProgressMetric]["key"],
    number | boolean | null
  >
>;

export function progressMetric(
  path: string,
  view?: string | null,
): ProgressMetric | null {
  if (
    path === "/food" &&
    ["saved", "strategy", "insights"].includes(view ?? "")
  )
    return null;
  if (path === "/workout-tracking" && view === "plan") return null;
  if (path === "/routine" && view === "notifications") return null;
  if (
    path === "/intermittent-fasting" &&
    ["window", "history"].includes(view ?? "")
  )
    return "fasting";
  if (path === "/log") return null;
  if (path === "/health" && view === "connections") return null;
  if (path === "/health" && view === "recovery") return "sleep";
  const routes: Record<string, ProgressMetric> = {
    "/hub": "focus",
    "/trackers": "focus",
    "/plan": "focus",
    "/todo": "tasks",
    "/goal": "goal",
    "/roadmap": "study",
    "/health": "weight",
    "/food": "energy",
    "/weight-loss": "weight",
    "/workout-tracking": "sets",
    "/intermittent-fasting": "water",
    "/routine": "routine",
    "/review": "reflection",
  };
  return routes[path] ?? null;
}

export function metricPoints(
  days: ProgressReading[],
  metric: ProgressMetric,
  weightUnit: "kg" | "lb" | "lbs" = "kg",
) {
  return days.map((day) => {
    const reading = day[PROGRESS_METRICS[metric].key];
    let value =
      metric === "reflection" && typeof reading === "boolean"
        ? Number(reading)
        : typeof reading === "number" &&
            Number.isFinite(reading) &&
            reading >= 0
          ? reading
          : null;
    if (metric === "weight" && value !== null && weightUnit !== "kg")
      value *= 2.20462262185;
    return { date: day.date, value };
  });
}

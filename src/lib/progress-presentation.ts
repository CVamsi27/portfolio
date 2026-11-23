export const PROGRESS_METRICS = {
  sets: {
    label: "Synced activity",
    unit: "sets",
    href: "/health",
    action: "Open Google Health",
    key: "sets",
    bars: true,
  },
  weight: {
    label: "Weight",
    unit: "kg",
    href: "/health",
    action: "Open Google Health",
    key: "weight",
    bars: false,
  },
  energy: {
    label: "Active calories",
    unit: "kcal",
    href: "/health",
    action: "Open Google Health",
    key: "energy",
    bars: true,
  },
  protein: {
    label: "Historical protein",
    unit: "g",
    href: "/health",
    action: "Open Google Health",
    key: "protein",
    bars: true,
  },
  exercise: {
    label: "Synced exercise",
    unit: "min",
    href: "/health",
    action: "Open Google Health",
    key: "exerciseMinutes",
    bars: true,
  },
  fasting: {
    label: "Historical fasting",
    unit: "hours",
    href: "/health",
    action: "Open Google Health",
    key: "fastHours",
    bars: false,
  },
  water: {
    label: "Synced hydration",
    unit: "glasses",
    href: "/health",
    action: "Open Google Health",
    key: "water",
    bars: true,
  },
  sleep: {
    label: "Synced sleep",
    unit: "hours",
    href: "/health",
    action: "Open Google Health",
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

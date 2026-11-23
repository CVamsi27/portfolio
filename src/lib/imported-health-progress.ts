import type { HealthRecordType } from "./health-connect";

export type ImportedReading = {
  id: string;
  type: string;
  date: string;
  value: number;
  unit: string;
  source: string;
  measuredAt: string;
  updatedAt: number;
  deleted?: boolean;
  startAt?: string;
  endAt?: string;
  stages?: Array<{ stage: string; startAt: string; endAt: string }>;
  measurementKind?: string;
  activityType?: string;
  title?: string;
};

export type HealthSourceSelection = Partial<Record<HealthRecordType, string>>;

export type SleepStageBreakdown = {
  date: string;
  deep: number;
  rem: number;
  light: number;
  sleeping: number;
  awake: number;
};

export type ExerciseSessionItem = {
  id: string;
  date: string;
  minutes: number;
  activityType: string;
  title: string;
  source: string;
  measuredAt: string;
};

const ALL_TYPES = [
  "weight",
  "steps",
  "sleep",
  "exercise",
  "active_calories",
  "hydration",
  "resting_hr",
] as const satisfies readonly HealthRecordType[];

const validDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !date.startsWith("0000-") &&
  Number.isFinite(Date.parse(`${date}T12:00:00Z`)) &&
  new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;

function valid(row: ImportedReading) {
  if (
    !row ||
    row.deleted ||
    !validDate(row.date) ||
    !row.id ||
    !row.source ||
    !Number.isFinite(Date.parse(row.measuredAt)) ||
    !Number.isFinite(row.updatedAt) ||
    !Number.isFinite(row.value) ||
    row.value < 0
  )
    return false;
  switch (row.type) {
    case "weight":
      return row.unit === "kg" && row.value > 0 && row.value <= 1000;
    case "steps":
      return (
        row.unit === "count" &&
        Number.isInteger(row.value) &&
        row.value <= 1000000
      );
    case "sleep":
      return row.unit === "minutes" && row.value <= 2880;
    case "exercise":
      return row.unit === "minutes" && row.value <= 1440;
    case "active_calories":
      return row.unit === "kcal" && row.value <= 50000;
    case "hydration":
      return row.unit === "ml" && row.value <= 50000;
    case "resting_hr":
      return row.unit === "bpm" && row.value >= 20 && row.value <= 260;
    default:
      return false;
  }
}

export function importedHealthProgress(
  records: ImportedReading[],
  from: string,
  to: string,
  selection: string | HealthSourceSelection = {},
) {
  if (!validDate(from) || !validDate(to) || from > to)
    throw Error("Choose a valid imported health date range.");
  const count = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  if (count > 90)
    throw Error("Choose up to 90 days of imported health records.");
  const unique = new Map<string, ImportedReading>();
  for (const row of records) {
    if (
      !row ||
      typeof row.id !== "string" ||
      typeof row.source !== "string" ||
      !Number.isFinite(row.updatedAt)
    )
      continue;
    const key = JSON.stringify([row.type, row.source, row.id]);
    const prior = unique.get(key);
    if (
      !prior ||
      row.updatedAt > prior.updatedAt ||
      (row.updatedAt === prior.updatedAt && row.deleted)
    )
      unique.set(key, row);
  }
  const active = [...unique.values()].filter(
    (row) => valid(row) && row.date >= from && row.date <= to,
  );
  const options = Object.fromEntries(
    ALL_TYPES.map((type) => [
      type,
      [
        ...new Set(
          active.filter((row) => row.type === type).map((row) => row.source),
        ),
      ].sort(),
    ]),
  ) as Record<HealthRecordType, string[]>;
  const chosen = Object.fromEntries(
    ALL_TYPES.map((type) => [
      type,
      typeof selection === "string"
        ? selection
        : (selection[type] ?? options[type][0] ?? ""),
    ]),
  ) as Record<HealthRecordType, string>;
  const days = Array.from({ length: count }, (_, i) =>
    new Date(Date.parse(from) + i * 86400000).toISOString().slice(0, 10),
  );
  const notes: string[] = [];

  const points = (type: HealthRecordType) =>
    days.map((date) => {
      const rows = active.filter(
        (row) =>
          row.type === type && row.source === chosen[type] && row.date === date,
      );
      if (!rows.length) return { date, value: null };
      if (type === "exercise") {
        return {
          date,
          value: Math.round(rows.reduce((sum, row) => sum + row.value, 0)),
        };
      }
      if (type !== "sleep") {
        rows.sort((a, b) =>
          type === "steps" || type === "active_calories" || type === "hydration"
            ? b.updatedAt - a.updatedAt ||
              Date.parse(b.measuredAt) - Date.parse(a.measuredAt)
            : Date.parse(b.measuredAt) - Date.parse(a.measuredAt) ||
              b.updatedAt - a.updatedAt,
        );
        return { date, value: rows[0].value };
      }
      if (rows.some((row) => row.measurementKind === "partial-stage-duration"))
        notes.push(`${date}: sleep includes partial stage coverage.`);
      if (rows.length === 1) return { date, value: rows[0].value };
      const intervals = rows
        .map((row) => ({
          row,
          start: Date.parse(row.startAt ?? ""),
          end: Date.parse(row.endAt ?? ""),
        }))
        .sort((a, b) => a.start - b.start);
      if (
        intervals.some(
          (x, i) =>
            !Number.isFinite(x.start) ||
            !Number.isFinite(x.end) ||
            x.end <= x.start ||
            (i > 0 && x.start < intervals[i - 1].end),
        )
      ) {
        notes.push(
          `${date}: overlapping or unbounded sleep sessions need review; their durations were not added.`,
        );
        return { date, value: null };
      }
      return { date, value: rows.reduce((sum, row) => sum + row.value, 0) };
    });

  const sleepStagesByDate: Record<string, SleepStageBreakdown> = {};
  for (const date of days) {
    const rows = active.filter(
      (row) =>
        row.type === "sleep" &&
        row.source === chosen.sleep &&
        row.date === date &&
        Array.isArray(row.stages) &&
        row.stages.length > 0,
    );
    if (!rows.length) continue;
    const totals: SleepStageBreakdown = {
      date,
      deep: 0,
      rem: 0,
      light: 0,
      sleeping: 0,
      awake: 0,
    };
    for (const row of rows) {
      for (const stage of row.stages ?? []) {
        const mins = Math.max(
          0,
          (Date.parse(stage.endAt) - Date.parse(stage.startAt)) / 60000,
        );
        if (!Number.isFinite(mins)) continue;
        if (stage.stage === "deep") totals.deep += mins;
        else if (stage.stage === "rem") totals.rem += mins;
        else if (stage.stage === "light") totals.light += mins;
        else if (stage.stage === "sleeping") totals.sleeping += mins;
        else if (stage.stage === "awake" || stage.stage === "out-of-bed")
          totals.awake += mins;
      }
    }
    sleepStagesByDate[date] = {
      date,
      deep: Math.round(totals.deep),
      rem: Math.round(totals.rem),
      light: Math.round(totals.light),
      sleeping: Math.round(totals.sleeping),
      awake: Math.round(totals.awake),
    };
  }

  const exerciseSessionsByDate: Record<string, ExerciseSessionItem[]> = {};
  for (const row of active) {
    if (row.type !== "exercise") continue;
    if (chosen.exercise && row.source !== chosen.exercise) continue;
    const list = (exerciseSessionsByDate[row.date] ??= []);
    list.push({
      id: row.id,
      date: row.date,
      minutes: Math.round(row.value),
      activityType: row.activityType || "Workout",
      title: row.title || row.activityType || "Workout",
      source: row.source,
      measuredAt: row.measuredAt,
    });
  }

  return {
    weight: points("weight"),
    steps: points("steps"),
    sleep: points("sleep"),
    exercise: points("exercise"),
    active_calories: points("active_calories"),
    hydration: points("hydration"),
    resting_hr: points("resting_hr"),
    sleepStagesByDate,
    exerciseSessionsByDate,
    notes,
    sources: [...new Set(active.map((row) => row.source))].sort(),
    options,
    chosen,
  };
}

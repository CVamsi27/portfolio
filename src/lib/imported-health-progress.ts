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
  measurementKind?: string;
};
export type HealthSourceSelection = Partial<
  Record<"weight" | "steps" | "sleep", string>
>;
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
    !Number.isFinite(row.value)
  )
    return false;
  return row.type === "weight"
    ? row.unit === "kg" && row.value > 0 && row.value <= 1000
    : row.type === "steps"
      ? row.unit === "count" &&
        Number.isInteger(row.value) &&
        row.value >= 0 &&
        row.value <= 1000000
      : row.type === "sleep" &&
        row.unit === "minutes" &&
        row.value >= 0 &&
        row.value <= 2880;
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
  const types = ["weight", "steps", "sleep"] as const;
  const options = Object.fromEntries(
    types.map((type) => [
      type,
      [
        ...new Set(
          active.filter((row) => row.type === type).map((row) => row.source),
        ),
      ].sort(),
    ]),
  ) as Record<(typeof types)[number], string[]>;
  const chosen = Object.fromEntries(
    types.map((type) => [
      type,
      typeof selection === "string"
        ? selection
        : (selection[type] ?? options[type][0] ?? ""),
    ]),
  ) as Record<(typeof types)[number], string>;
  const days = Array.from({ length: count }, (_, i) =>
    new Date(Date.parse(from) + i * 86400000).toISOString().slice(0, 10),
  );
  const notes: string[] = [];
  const points = (type: (typeof types)[number]) =>
    days.map((date) => {
      const rows = active.filter(
        (row) =>
          row.type === type && row.source === chosen[type] && row.date === date,
      );
      if (!rows.length) return { date, value: null };
      if (type !== "sleep") {
        rows.sort((a, b) =>
          type === "steps"
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
  const weight = points("weight"),
    steps = points("steps"),
    sleep = points("sleep");
  return {
    weight,
    steps,
    sleep,
    notes,
    sources: [...new Set(active.map((row) => row.source))].sort(),
    options,
    chosen,
  };
}

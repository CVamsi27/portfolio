import {
  scaleNutrients,
  validEntry,
  type FoodEntry,
  type Target,
} from "./nutrition.ts";

export type NutritionProgram = {
  id: string;
  startDate: string;
  mode: "manual" | "flexible";
  goal: "loss" | "maintain" | "gain";
  /** Sunday first. Each amount is entered by the user, never auto-generated. */
  days: Array<{ energy: number; protein: number; carbs: number; fat: number }>;
  updatedAt: number;
  deleted?: boolean;
};
export type NutritionDay = {
  id: string;
  status: "partial" | "complete" | "estimated" | "fasting";
  updatedAt: number;
  deleted?: boolean;
};
function validDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}
function validRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.updatedAt === "number" &&
    Number.isFinite(record.updatedAt) &&
    record.updatedAt >= 0 &&
    (record.deleted === undefined || typeof record.deleted === "boolean")
  );
}
export function validProgram(value: unknown): value is NutritionProgram {
  if (!validRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    validDate(value.startDate) &&
    typeof value.mode === "string" &&
    ["manual", "flexible"].includes(value.mode) &&
    typeof value.goal === "string" &&
    ["loss", "maintain", "gain"].includes(value.goal) &&
    Array.isArray(value.days) &&
    value.days.length === 7 &&
    value.days.every(
      (day) =>
        day &&
        typeof day === "object" &&
        ["energy", "protein", "carbs", "fat"].every(
          (key) =>
            typeof day[key] === "number" &&
            Number.isFinite(day[key]) &&
            (key === "energy" ? day[key] > 0 : day[key] >= 0),
        ),
    )
  );
}
export function validNutritionDay(value: unknown): value is NutritionDay {
  return (
    validRecord(value) &&
    validDate(value.id) &&
    typeof value.status === "string" &&
    ["partial", "complete", "estimated", "fasting"].includes(value.status)
  );
}
export function programForDate(
  records: Record<string, NutritionProgram>,
  date: string,
): NutritionProgram | null {
  if (!validDate(date)) return null;
  return (
    Object.values(records)
      .filter(
        (program) =>
          validProgram(program) &&
          !program.deleted &&
          program.startDate <= date,
      )
      .sort(
        (a, b) =>
          b.startDate.localeCompare(a.startDate) ||
          b.updatedAt - a.updatedAt ||
          b.id.localeCompare(a.id),
      )[0] ?? null
  );
}
export function dayQuality(
  date: string,
  entries: FoodEntry[],
  dayRecord?: NutritionDay,
): {
  status: NutritionDay["status"] | "not-logged";
  eligible: boolean;
  reason: string;
  energy: number | null;
} {
  const dated = entries.filter((entry) => entry.date === date);
  const active = dated.filter((entry) => !entry.deleted);
  const confirmed =
    validNutritionDay(dayRecord) && !dayRecord.deleted && dayRecord.id === date;
  const corrected =
    confirmed && dated.some((entry) => entry.updatedAt > dayRecord.updatedAt);
  const status =
    confirmed && !corrected
      ? dayRecord.status
      : active.length
        ? "partial"
        : "not-logged";
  const known =
    active.length > 0 &&
    active.every(
      (entry) =>
        validEntry(entry) && typeof entry.nutrients.energy === "number",
    );
  const total = known
    ? active.reduce(
        (sum, entry) =>
          sum +
          (scaleNutrients(entry.nutrients, entry.quantity, entry.basisAmount)
            .energy ?? 0),
        0,
      )
    : null;
  const energy = total !== null && Number.isFinite(total) ? total : null;
  if (status === "fasting")
    return active.length
      ? {
          status,
          eligible: false,
          reason:
            "Food is logged. Remove the fasting confirmation or reconcile these entries.",
          energy,
        }
      : {
          status,
          eligible: true,
          reason: "You explicitly confirmed no caloric intake for this date.",
          energy: 0,
        };
  if (corrected)
    return {
      status,
      eligible: false,
      reason:
        "Food records changed after confirmation. Review this date again.",
      energy,
    };
  if (!active.length)
    return {
      status,
      eligible: false,
      reason: "No food logged. An empty log does not confirm fasting.",
      energy: null,
    };
  if (status === "estimated")
    return {
      status,
      eligible: false,
      reason:
        "Intake includes estimates; kept separate from known complete days.",
      energy,
    };
  if (status !== "complete")
    return {
      status,
      eligible: false,
      reason: "Review all meals and drinks before marking this day complete.",
      energy,
    };
  if (energy === null)
    return {
      status,
      eligible: false,
      reason:
        "Some entries have unknown calories. Resolve them before using complete-day intake.",
      energy: null,
    };
  return {
    status,
    eligible: true,
    reason:
      "Reviewed day with known calories. Micronutrient coverage is assessed separately.",
    energy,
  };
}

/** Apply the user's effective weekday program without changing historical reference records. */
export function nutritionTargetsForDate(
  programs: Record<string, NutritionProgram>,
  date: string,
  references: Record<string, Target>,
): { targets: Record<string, Target>; program: NutritionProgram | null } {
  const program = programForDate(programs, date);
  const targets = { ...references };
  if (program) {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    for (const key of ["energy", "protein", "carbs", "fat"] as const) {
      targets[key] = {
        id: key,
        amount: program.days[weekday][key],
        kind: "reference",
        updatedAt: program.updatedAt,
      };
    }
  }
  return { targets, program };
}

export function canEditNutritionProgram(
  configured: boolean,
  flag: string | undefined,
) {
  return !configured || flag === "true";
}

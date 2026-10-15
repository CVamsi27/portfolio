import { isCalendarDate } from "./personal-timetable.ts";
export const jobKinds = [
  "study",
  "project",
  "applications",
  "oss",
  "network",
  "coding",
  "speaking",
  "assessment",
  "german",
  "review",
  "funnel",
  "mock",
  "documents",
  "proof",
  "planning",
] as const;
export type JobKind = (typeof jobKinds)[number];
export interface JobAssignment {
  id: string;
  date: string;
  range: string;
  minutes: number;
  kind: JobKind;
  title: string;
  outcome: string;
  brief: string;
  steps: string[];
  deliverable: string;
  doneCheck: string;
  dependency: string;
  blocked: string;
}
export interface JobPlan {
  version: 1 | 2;
  effectiveOn: string;
  timezone: "Asia/Kolkata";
  weeklyMinutes: 3600;
  sourceDigest: string;
  days: Array<{ date: string; assignments: JobAssignment[] }>;
}
const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const safeMarkdown = (s: string) =>
  !/<\/?[a-z]|\]\(\s*(?!https:\/\/|2026-10-10-germany-(?:daily-curriculum|exams|campaign|detailed-roadmap-design)\.md[)#])[^)]/i.test(
    s,
  ) && !/https:\/\/[^\s)]+@/.test(s);
const minute = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
export function urgentJobSlots(date: string): Array<[string, JobKind]> {
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  if (weekday === 0) return [];
  if (weekday === 6)
    return [
      ["09:00-10:00", "funnel"],
      ["10:15-12:15", "mock"],
      [
        "13:00-14:00",
        ["2026-12-19", "2027-01-02"].includes(date) ? "proof" : "oss",
      ],
      ["14:15-14:45", "study"],
      ["14:45-15:00", "documents"],
      ["15:00-15:15", "planning"],
    ];
  return [
    ["08:00-11:00", "applications"],
    ["11:15-13:15", "project"],
    [weekday === 2 || weekday === 4 ? "14:00-16:00" : "14:00-15:00", "network"],
    ...([1, 3, 5].includes(weekday)
      ? [["15:00-16:00", "oss"] as [string, JobKind]]
      : []),
    ["16:00-16:30", "study"],
    ...(weekday === 3 || ["2026-12-18", "2027-01-01"].includes(date)
      ? [["16:45-18:45", "assessment"] as [string, JobKind]]
      : ([
          ["16:45-18:15", "coding"],
          ["18:15-18:45", "speaking"],
        ] as Array<[string, JobKind]>)),
    ["20:00-21:00", "german"],
    ["21:00-21:30", "review"],
  ];
}
export function isJobPlan(value: unknown): value is JobPlan {
  if (!value || typeof value !== "object") return false;
  const p = value as JobPlan;
  try {
    if (
      (p.version !== 1 && p.version !== 2) ||
      p.timezone !== "Asia/Kolkata" ||
      p.weeklyMinutes !== 3600 ||
      !isCalendarDate(p.effectiveOn) ||
      p.effectiveOn < "2026-10-15" ||
      p.effectiveOn > "2027-01-02" ||
      !/^[a-f0-9]{64}$/.test(p.sourceDigest) ||
      p.days.length !== 72
    )
      return false;
    return p.days.every((day, i) => {
      const n = Math.floor(i / 6) * 7 + (i % 6);
      const expected = new Date(Date.UTC(2026, 9, 12 + n))
        .toISOString()
        .slice(0, 10);
      const weekday = n % 7,
        saturday = weekday === 5,
        wednesday =
          weekday === 2 || ["2026-12-18", "2027-01-01"].includes(day.date);
      const urgent = p.version === 2 && day.date >= p.effectiveOn;
      const slots = urgent ? urgentJobSlots(day.date) : [];
      const kinds: readonly string[] = urgent
        ? slots.map(([, kind]) => kind)
        : saturday
          ? ["funnel", "mock", "documents", "proof", "planning"]
          : [
              "study",
              "project",
              "applications",
              weekday === 1 || weekday === 3 ? "network" : "oss",
              ...(wednesday ? ["assessment"] : ["coding", "speaking"]),
              "german",
              "review",
            ];
      if (day.date !== expected || day.assignments.length !== kinds.length)
        return false;
      let previousEnd = 0,
        total = 0;
      for (const [j, a] of day.assignments.entries()) {
        if (
          a.date !== day.date ||
          a.kind !== kinds[j] ||
          (urgent && a.range !== slots[j][0]) ||
          a.id !== `germany:2026:day:${day.date}:assignment:${a.kind}` ||
          !/^(?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d$/.test(a.range)
        )
          return false;
        const [start, end] = a.range.split("-").map(minute);
        if (
          start < previousEnd ||
          end <= start ||
          a.minutes !== end - start ||
          !Number.isInteger(a.minutes)
        )
          return false;
        if (
          ![
            a.title,
            a.outcome,
            a.brief,
            a.deliverable,
            a.doneCheck,
            a.dependency,
            a.blocked,
          ].every(text) ||
          !Array.isArray(a.steps) ||
          a.steps.length < 2 ||
          !a.steps.every(text) ||
          ![
            a.title,
            a.outcome,
            a.brief,
            a.deliverable,
            a.doneCheck,
            a.dependency,
            a.blocked,
            ...a.steps,
          ].every(safeMarkdown)
        )
          return false;
        if (a.kind === "assessment" && a.minutes !== 120) return false;
        previousEnd = end;
        total += a.minutes;
      }
      return total === (saturday ? 300 : 660);
    });
  } catch {
    return false;
  }
}
export function jobAssignments(
  plan: JobPlan | undefined,
  date: string,
): JobAssignment[] {
  if (!plan || date < plan.effectiveOn) return [];
  return plan.days.find((day) => day.date === date)?.assignments ?? [];
}
export function assignmentMarkdown(a: JobAssignment): string {
  return `${a.brief}\n\n${a.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n**Save:** ${a.deliverable}\n\n**Done when:** ${a.doneCheck}\n\n**Before starting:** ${a.dependency}\n\n**If blocked:** ${a.blocked}`;
}

export function jobEvidenceStatus(
  entry?: import("./career-roadmap.ts").CareerExecutionEntry,
): "planned" | "saved" | "verified" {
  if (
    !entry ||
    typeof entry.evidence?.value !== "string" ||
    entry.evidence.value.trim().length < 40 ||
    entry.evidence.value.trim().length > 2000 ||
    !Number.isFinite(Date.parse(entry.completedAt))
  )
    return "planned";
  return entry.verifiedAt &&
    Number.isFinite(Date.parse(entry.verifiedAt)) &&
    Date.parse(entry.verifiedAt) >= Date.parse(entry.completedAt)
    ? "verified"
    : "saved";
}
export function jobProgress(
  assignments: JobAssignment[],
  entries:
    | Record<string, import("./career-roadmap.ts").CareerExecutionEntry>
    | undefined,
) {
  let saved = 0,
    verified = 0;
  for (const a of assignments) {
    const status = jobEvidenceStatus(entries?.[a.id]);
    if (status === "verified") verified++;
    else if (status === "saved") saved++;
  }
  return { total: assignments.length, saved, verified };
}

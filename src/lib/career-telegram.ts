import {
  isJobPlan,
  jobAssignments,
  jobEvidenceStatus,
  studyDates,
  studyDaySlots,
  type JobAssignment,
  type JobKind,
  type JobPlan,
} from "./job-plan.ts";
import type { CareerExecutionEntry } from "./career-roadmap.ts";
import { isCalendarDate } from "./personal-timetable.ts";
import { scheduledInstant, zonedDate } from "./routine-reminders.ts";

export interface CareerTelegramPreferences {
  version: 1;
  enabled: boolean;
  cadence: "digest-and-learning" | "digest-only";
  digestTime: string;
  timezone: "Asia/Kolkata";
  catchUpMinutes: number;
  enabledAt: string | null;
}
export interface CareerTelegramNotification {
  id: string;
  kind: "career-digest" | "career-study" | "career-project";
  scheduledAt: number;
  date: string;
  assignmentId?: string;
  text: string;
}
export const DEFAULT_CAREER_TELEGRAM_PREFERENCES: CareerTelegramPreferences = {
  version: 1,
  enabled: false,
  cadence: "digest-and-learning",
  digestTime: "06:00",
  timezone: "Asia/Kolkata",
  catchUpMinutes: 10,
  enabledAt: null,
};
export function validCareerTelegramPreferences(
  value: unknown,
): value is CareerTelegramPreferences {
  if (!value || typeof value !== "object") return false;
  const prefs = value as CareerTelegramPreferences;
  return (
    prefs.version === 1 &&
    typeof prefs.enabled === "boolean" &&
    ["digest-and-learning", "digest-only"].includes(prefs.cadence) &&
    typeof prefs.digestTime === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(prefs.digestTime) &&
    prefs.timezone === "Asia/Kolkata" &&
    Number.isInteger(prefs.catchUpMinutes) &&
    prefs.catchUpMinutes >= 1 &&
    prefs.catchUpMinutes <= 10 &&
    (prefs.enabledAt === null
      ? !prefs.enabled
      : validActivationTime(prefs.enabledAt))
  );
}

function validActivationTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(
      value,
    ) &&
    isCalendarDate(value.slice(0, 10)) &&
    Number.isFinite(Date.parse(value))
  );
}

// The v3 validator fixes the dates and slots. Reuse them before loading its payload.
const supportedStudyDates = new Set(studyDates());

function careerTelegramContext(prefs: unknown, now: number) {
  if (
    !Number.isFinite(now) ||
    !Number.isFinite(new Date(now).getTime()) ||
    !validCareerTelegramPreferences(prefs) ||
    !prefs.enabled
  )
    return undefined;
  const date = zonedDate(now, prefs.timezone);
  if (!supportedStudyDates.has(date)) return undefined;
  return { prefs, date, enabledAt: Date.parse(prefs.enabledAt!) };
}

function notificationIsDue(
  at: number,
  enabledAt: number,
  catchUpMinutes: number,
  now: number,
) {
  return (
    Number.isFinite(at) &&
    at >= enabledAt &&
    at <= now &&
    now - at <= catchUpMinutes * 60_000
  );
}

/** Cheap eligibility only: evidence and the supported v3 plan still require validation. */
export function careerTelegramMayBeDue(prefs: unknown, now: number): boolean {
  const context = careerTelegramContext(prefs, now);
  if (!context) return false;
  const { date, prefs: preferences, enabledAt } = context;
  const times = [preferences.digestTime];
  if (preferences.cadence === "digest-and-learning")
    times.push(
      ...studyDaySlots(date)
        .filter(([, kind]) => kind === "study" || kind === "project")
        .map(([range]) => range.slice(0, 5)),
    );
  return times.some((time) =>
    notificationIsDue(
      scheduledInstant(date, time, preferences.timezone),
      enabledAt,
      preferences.catchUpMinutes,
      now,
    ),
  );
}

const kindLabels: Record<JobKind, string> = {
  study: "Study",
  project: "Project",
  applications: "Applications",
  oss: "Open source",
  network: "Networking",
  coding: "Coding practice",
  speaking: "Speaking practice",
  assessment: "Assessment",
  german: "German study",
  review: "Review",
  funnel: "Application review",
  mock: "Mock interview",
  documents: "Documents",
  proof: "Evidence review",
  planning: "Planning",
};

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  let end = limit - 1;
  if (/[\uD800-\uDBFF]/.test(text[end - 1])) end--;
  return `${text.slice(0, end)}…`;
}

function technicalText(value: string, limit: number): string {
  // These fields are technical labels, never a channel for contacts or secrets.
  const privateMaterial =
    /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}|\+[\d ()-]{7,}\d|\b\d{9,}:[a-z0-9_-]{10,}|\b(?:token|secret|password|chat[_-]?id)\s*[:=]\s*\S+|https?:\/\/\S+/i;
  if (privateMaterial.test(value))
    return "Technical details are available in the complete plan.";
  return truncate(value.replace(/\s+/g, " ").trim(), limit);
}

function message(body: string, date: string): string {
  const navigation = `\n\nToday: https://personal.buildora.work/hub?date=${date}\nComplete plan: https://personal.buildora.work/roadmap?view=plan`;
  return truncate(body, 3900 - navigation.length) + navigation;
}

function evidenceEntries(
  execution: unknown,
): Record<string, CareerExecutionEntry> {
  if (!execution || typeof execution !== "object") return {};
  const entries = (execution as { evidenceByItemId?: unknown })
    .evidenceByItemId;
  if (!entries || typeof entries !== "object" || Array.isArray(entries))
    return {};
  return Object.fromEntries(
    Object.entries(entries).filter(
      ([, entry]) =>
        entry &&
        typeof entry === "object" &&
        typeof entry.completedAt === "string" &&
        (entry.verifiedAt === undefined ||
          typeof entry.verifiedAt === "string") &&
        entry.evidence &&
        typeof entry.evidence === "object" &&
        typeof entry.evidence.value === "string",
    ),
  );
}

function assignmentMessage(
  assignment: JobAssignment,
  status: "planned" | "saved",
): string {
  return [
    `${kindLabels[assignment.kind]} · ${assignment.date} · ${assignment.range} IST`,
    technicalText(assignment.title, 700),
    `Output: ${technicalText(assignment.deliverable, 900)}`,
    `Failure case: ${technicalText(assignment.blocked, 900)}`,
    status === "saved"
      ? "Next: review saved evidence against the done check in the complete plan. Saved evidence is awaiting verification."
      : "Next: follow the complete plan and save evidence against its done check for review.",
  ].join("\n");
}

export function dueCareerNotifications(
  plan: JobPlan | undefined,
  execution: unknown,
  prefs: unknown,
  now: number,
): CareerTelegramNotification[] {
  const context = careerTelegramContext(prefs, now);
  if (!context || plan?.version !== 3 || !isJobPlan(plan)) return [];
  const { date, prefs: preferences, enabledAt } = context;
  const entries = evidenceEntries(execution);
  const assignments = jobAssignments(plan, date).filter(
    (assignment) => jobEvidenceStatus(entries[assignment.id]) !== "verified",
  );
  if (!assignments.length) return [];
  const due = (at: number) =>
    notificationIsDue(at, enabledAt, preferences.catchUpMinutes, now);
  const result: CareerTelegramNotification[] = [];
  const digestAt = scheduledInstant(
    date,
    preferences.digestTime,
    preferences.timezone,
  );
  if (due(digestAt)) {
    const lines = assignments.map((assignment) => {
      const learning =
        assignment.kind === "study" || assignment.kind === "project";
      const review =
        jobEvidenceStatus(entries[assignment.id]) === "saved"
          ? " · review saved evidence"
          : "";
      return `${assignment.range} · ${kindLabels[assignment.kind]}${learning ? `: ${technicalText(assignment.title, 180)}` : ""}${review}`;
    });
    result.push({
      id: `career:career-digest:${date}`,
      kind: "career-digest",
      scheduledAt: digestAt,
      date,
      text: message(
        `Daily plan · ${date} · IST\n${assignments.length} planned blocks to act on or review\n\n${lines.join("\n")}\n\nFollow each block's evidence check in the complete plan.`,
        date,
      ),
    });
  }
  if (preferences.cadence === "digest-and-learning")
    for (const assignment of assignments) {
      if (assignment.kind !== "study" && assignment.kind !== "project")
        continue;
      const scheduledAt = scheduledInstant(
        date,
        assignment.range.slice(0, 5),
        preferences.timezone,
      );
      if (!due(scheduledAt)) continue;
      const kind =
        assignment.kind === "study" ? "career-study" : "career-project";
      const status = jobEvidenceStatus(entries[assignment.id]);
      if (status === "verified") continue;
      result.push({
        id: `career:${kind}:${date}:${assignment.id}`,
        kind,
        scheduledAt,
        date,
        assignmentId: assignment.id,
        text: message(assignmentMessage(assignment, status), date),
      });
    }
  return result.sort(
    (a, b) => a.scheduledAt - b.scheduledAt || a.id.localeCompare(b.id),
  );
}

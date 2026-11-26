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
import {
  BALANCED_7AM_SCHEDULE_REVISION,
  HIRING_ENGINE_SCHEDULE_REVISION,
  INCOME_FIRST_SCHEDULE_REVISION,
  incomeFirstDaySlots,
  incomeFirstPersonalSchedule,
  isCalendarDate,
} from "./personal-timetable.ts";
import { sprintFocusForDate } from "../data/interview-ready-sprint.ts";
import { scheduledInstant, zonedDate } from "./routine-reminders.ts";

export type CareerTelegramPlanMode = "hiring-sprint" | "legacy-v3";

export interface CareerTelegramPreferences {
  version: 1;
  enabled: boolean;
  cadence: "digest-and-learning" | "digest-only";
  digestTime: string;
  timezone: "Asia/Kolkata";
  catchUpMinutes: number;
  enabledAt: string | null;
  planMode?: CareerTelegramPlanMode;
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
  digestTime: "07:00",
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
      : validActivationTime(prefs.enabledAt)) &&
    (prefs.planMode === undefined ||
      prefs.planMode === "hiring-sprint" ||
      prefs.planMode === "legacy-v3")
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

/** Cheap eligibility only: evidence and the supported plan still require validation. */
export function careerTelegramMayBeDue(prefs: unknown, now: number): boolean {
  const context = careerTelegramContext(prefs, now);
  if (!context) return false;
  const { date, prefs: preferences, enabledAt } = context;
  const times = [preferences.digestTime];
  if (preferences.cadence === "digest-and-learning") {
    const useSprint =
      date >= HIRING_ENGINE_SCHEDULE_REVISION.effectiveOn &&
      preferences.planMode !== "legacy-v3";
    const useLegacyV3 = preferences.planMode !== "hiring-sprint";

    if (useSprint) {
      times.push(
        ...incomeFirstDaySlots(date).map(([range]) => range.slice(0, 5)),
      );
    } else if (
      date >= INCOME_FIRST_SCHEDULE_REVISION.effectiveOn &&
      preferences.planMode !== "legacy-v3"
    ) {
      times.push(
        ...incomeFirstDaySlots(date)
          .filter(
            ([, kind]) =>
              kind === "study" || kind === "project" || kind === "coding",
          )
          .map(([range]) => range.slice(0, 5)),
      );
    }

    if (useLegacyV3) {
      times.push(
        ...[
          ...studyDaySlots(date),
          ...studyDaySlots(date, BALANCED_7AM_SCHEDULE_REVISION),
        ]
          .filter(([, kind]) => kind === "study" || kind === "project")
          .map(([range]) => range.slice(0, 5)),
      );
    }
  }
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

function sprintMessage(body: string, date: string): string {
  const navigation = `\n\nToday: https://personal.buildora.work/hub?date=${date}\nRoadmap: https://personal.buildora.work/roadmap?view=interview`;
  return truncate(body, 3900 - navigation.length) + navigation;
}

function dueHiringSprintNotifications(
  date: string,
  preferences: CareerTelegramPreferences,
  enabledAt: number,
  now: number,
): CareerTelegramNotification[] {
  const focus = sprintFocusForDate(date);
  const slots = incomeFirstDaySlots(date);
  const schedule = incomeFirstPersonalSchedule(date);
  if (!focus || !slots.length || !schedule) return [];

  const due = (at: number) =>
    notificationIsDue(at, enabledAt, preferences.catchUpMinutes, now);
  const result: CareerTelegramNotification[] = [];
  const digestAt = scheduledInstant(
    date,
    preferences.digestTime,
    preferences.timezone,
  );
  if (due(digestAt)) {
    const lines = slots.map(
      ([range]) =>
        `${range} · ${technicalText(schedule[range]?.label ?? range, 140)}`,
    );
    result.push({
      id: `career:career-digest:${date}`,
      kind: "career-digest",
      scheduledAt: digestAt,
      date,
      text: sprintMessage(
        [
          `Startup & CTO Sprint · ${date} · IST (${technicalText(focus.phase, 80)})`,
          `Focus: ${technicalText(focus.build, 260)}`,
          `Deliverable: ${technicalText(focus.deliverable, 240)}`,
          "",
          ...lines,
          "",
          "Rule: zero new side projects before offer; log real sends & follow-ups.",
        ].join("\n"),
        date,
      ),
    });
  }

  if (preferences.cadence === "digest-and-learning") {
    for (const [range, slotKind] of slots) {
      const scheduledAt = scheduledInstant(
        date,
        range.slice(0, 5),
        preferences.timezone,
      );
      if (!due(scheduledAt)) continue;
      const isSaturday = new Date(`${date}T12:00:00Z`).getUTCDay() === 6;

      let kind: "career-study" | "career-project";
      let slotKey: string;
      let headline: string;
      let actionLine: string;
      let nextLine: string;

      if (slotKind === "applications") {
        kind = "career-project";
        slotKey = "applications";
        headline = `Startup Pipeline & Founder Outreach · ${date} · ${range} IST`;
        actionLine =
          "Send 3 tailored apps across the 3-Lane Funnel (60% India/Global Remote · 25% Founding Direct · 15% EU/NL/DE), pairing >=60% with direct Founder/CTO notes.";
        nextLine = `Today focus: ${technicalText(focus.build, 220)}`;
      } else if (slotKind === "network") {
        kind = "career-project";
        slotKey = "network";
        headline = `Warm Referrals, Trojan-Horse Looms & Diagnostics · ${date} · ${range} IST`;
        actionLine =
          "Send 2 warm/referral messages + 1 Trojan-Horse 2-min product Loom or scoped RLS/BullMQ audit enquiry.";
        nextLine = `Deliverable: ${technicalText(focus.deliverable, 220)}`;
      } else if (slotKind === "project") {
        kind = "career-project";
        slotKey = "oss-proof";
        headline = `OSS & Proof Leverage (1h Hard Cap) · ${date} · ${range} IST`;
        actionLine =
          "Ship npm releases (rls-rehearsal / deployproof), open or advance upstream PRs (langfuse / twenty / cal.com), or record 3-min demos.";
        nextLine = `Gate check: ${technicalText(focus.evidence, 220)}`;
      } else if (slotKind === "coding") {
        kind = "career-study";
        slotKey = "drill";
        headline = `5-Round Startup Interview Drill · ${date} · ${range} IST`;
        actionLine = focus.weekdayRound
          ? `${technicalText(focus.weekdayRound, 180)} — 25m unaided -> 10m study.buildora.work -> 20m changed case -> 5m notes.`
          : "Run 1 timed startup drill: 25m unaided -> 10m reference -> 20m changed case -> 5m notes.";
        nextLine =
          "Keep DSA light (455+ banked) and prioritize TS feature build/debug & multi-tenant system design.";
      } else {
        kind = "career-study";
        slotKey = "review";
        headline = isSaturday
          ? `Weekly Funnel Audit & Timed Mock (2h Cap) · ${date} · ${range} IST`
          : `Follow-Ups, Pipeline Log & Queue Top 3 · ${date} · ${range} IST`;
        actionLine = isSaturday
          ? "Check the >=10% reply-rate gate across recent startups, run 1 timed startup mock interview, and lock Monday's top technical gap."
          : "Send 5-business-day follow-ups, log real applications/replies separately from drafts, update Resume Checkpoints, and queue tomorrow's top 3 startups.";
        nextLine = `Deliverable: ${technicalText(focus.deliverable, 220)}`;
      }

      const assignmentId = `hiring-sprint:${date}:${slotKey}`;
      result.push({
        id: `career:${kind}:${date}:${assignmentId}`,
        kind,
        scheduledAt,
        date,
        assignmentId,
        text: sprintMessage([headline, actionLine, nextLine].join("\n"), date),
      });
    }
  }

  return result.sort(
    (a, b) => a.scheduledAt - b.scheduledAt || a.id.localeCompare(b.id),
  );
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
  plan: JobPlan | undefined | null,
  execution: unknown,
  prefs: unknown,
  now: number,
): CareerTelegramNotification[] {
  const context = careerTelegramContext(prefs, now);
  if (!context) return [];
  const { date, prefs: preferences, enabledAt } = context;

  const inSprintWindow = date >= HIRING_ENGINE_SCHEDULE_REVISION.effectiveOn;
  const useHiringSprint =
    inSprintWindow &&
    (preferences.planMode === "hiring-sprint" ||
      (preferences.planMode !== "legacy-v3" &&
        (plan === undefined ||
          plan === null ||
          (plan.version === 4 && isJobPlan(plan)))));

  if (useHiringSprint) {
    return dueHiringSprintNotifications(date, preferences, enabledAt, now);
  }

  if (
    !plan ||
    (plan.version !== 3 && plan.version !== 4) ||
    !isJobPlan(plan)
  )
    return [];

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
        assignment.kind === "study" ||
        assignment.kind === "project" ||
        (plan.version === 4 && assignment.kind === "coding");
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
      const isLearning =
        assignment.kind === "study" ||
        assignment.kind === "project" ||
        (plan.version === 4 && assignment.kind === "coding");
      if (!isLearning) continue;
      const scheduledAt = scheduledInstant(
        date,
        assignment.range.slice(0, 5),
        preferences.timezone,
      );
      if (!due(scheduledAt)) continue;
      const kind =
        assignment.kind === "project" ? "career-project" : "career-study";
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

import {
  isCalendarDate,
  personalSchedule,
  TIMETABLE_OWNER_EMAIL,
} from "./personal-timetable.ts";
import {
  canCompleteEvidence,
  type CareerChecklistItem,
  type CareerEvidence,
  type CareerExecutionState,
} from "./career-roadmap.ts";
import {
  isGermanyExecution,
  annotateGermanySchedule,
  type GermanyExecution,
} from "./germany-execution.ts";
export interface GermanyWeek {
  number: number;
  start: string;
  end: string;
  study: string;
  deliverable: string;
  campaign: string;
  items: CareerChecklistItem[];
}
export interface GermanyRoadmap {
  version: 1;
  execution?: GermanyExecution;
  reviewedOn: string;
  startDate: string;
  endDate: string;
  target: string;
  sourceDigest: string;
  weeks: GermanyWeek[];
  allocations: Array<{ label: string; hours: number }>;
  sections: Array<{ title: string; content: string }>;
  sources: Array<{ label: string; url: string }>;
}
export function campaignPosition(
  plan: Pick<GermanyRoadmap, "startDate" | "endDate">,
  date: string,
): { stage: "before" | "active" | "after"; week: number } {
  if (!isCalendarDate(date)) throw new Error("Invalid calendar date");
  if (date < plan.startDate) return { stage: "before", week: 1 };
  if (date > plan.endDate) return { stage: "after", week: 12 };
  return {
    stage: "active",
    week:
      Math.floor(
        (Date.parse(`${date}T12:00:00Z`) -
          Date.parse(`${plan.startDate}T12:00:00Z`)) /
          604800000,
      ) + 1,
  };
}

function urgentWeeklyTargets(plan: GermanyRoadmap): Record<string, number> {
  const hours = (label: string) => {
    const matches = plan.allocations.filter(
      (allocation) => allocation.label === label,
    );
    if (
      matches.length !== 1 ||
      !Number.isFinite(matches[0].hours) ||
      matches[0].hours < 0
    )
      throw new Error(`Urgent campaign requires one valid allocation for ${label}`);
    return matches[0].hours;
  };
  return {
    applicationHours: hours("Applications and qualification"),
    networkingHours: hours("Hiring conversations and outreach"),
    interviewHours: hours("Interviews and practical preparation"),
    projectHours: hours("Project proof or paid delivery"),
    ossHours: hours("OSS contribution"),
    focusedStudyHours: hours("Targeted study"),
    germanPracticeMinutes: hours("German") * 60,
    reviewHours: hours("Documents, review and planning"),
  };
}

export function mergeGermanyCareer(
  previous: Record<string, unknown>,
  plan: GermanyRoadmap,
): Record<string, unknown> {
  const urgent = plan.execution?.jobPlan?.version === 2;
  const targets = urgent ? urgentWeeklyTargets(plan) : GERMANY_WEEKLY_TARGETS;
  const checklistUpdates = urgent
    ? {
        ...GERMANY_CHECKLIST_UPDATES,
        "germany-language": {
          ...GERMANY_CHECKLIST_UPDATES["germany-language"],
          text: `Practice German for ${targets.germanPracticeMinutes / 5} minutes each weekday; record listening, speaking and writing. Claim a certified level only after earning it.`,
        },
      }
    : GERMANY_CHECKLIST_UPDATES;
  const checklist = Array.isArray(previous.germanyChecklist)
    ? previous.germanyChecklist.map((item) => {
        if (!item || typeof item !== "object") return item;
        const record = item as Record<string, unknown>;
        const replacement = checklistUpdates[String(record.id)];
        return replacement
          ? {
              ...record,
              ...replacement,
              ...(record.done &&
              (record.text !== replacement.text ||
                record.link !== replacement.link)
                ? { reviewRequired: true }
                : {}),
              criteriaReviewedOn: plan.reviewedOn,
            }
          : record;
      })
    : previous.germanyChecklist;
  const previousTargets =
    (previous.weeklyTargets as Record<string, number>) ?? {};
  const superseded = new Set([
    "ossPRs",
    "leetcodeProblems",
    "studyHours",
    "germanHours",
    "applications",
    ...(urgent ? Object.keys(GERMANY_WEEKLY_TARGETS) : []),
  ]);
  const verification = previous.verificationChecklist as
    | { items?: Array<{ id: string; text: string }> }
    | undefined;
  return {
    ...previous,
    germanyRoadmap: plan,
    reviewedOn: plan.reviewedOn,
    ...(checklist ? { germanyChecklist: checklist } : {}),
    legacyWeeklyTargets: previous.legacyWeeklyTargets ?? previousTargets,
    weeklyTargets: {
      ...Object.fromEntries(
        Object.entries(previousTargets).filter(([key]) => !superseded.has(key)),
      ),
      ...targets,
    },
    ...(verification?.items
      ? {
          verificationChecklist: {
            ...verification,
            items: verification.items.map((item) => ({
              ...item,
              text: GERMANY_VERIFICATION_UPDATES[item.id] ?? item.text,
            })),
          },
        }
      : {}),
    daySchedule: {
      timezone: "Asia/Kolkata",
      effectiveOn: plan.execution?.jobPlan?.effectiveOn ?? "2026-10-12",
      note: "Date-aware weekday rotation, Saturday and recovery Sunday; use the shared timetable.",
      blocks: Object.entries(
        plan.execution?.jobPlan
          ? annotateGermanySchedule(
              plan.execution,
              plan.execution.jobPlan.effectiveOn,
              personalSchedule(
                TIMETABLE_OWNER_EMAIL,
                plan.execution.jobPlan.effectiveOn,
              )!,
            )
          : personalSchedule(TIMETABLE_OWNER_EMAIL, "2026-10-12")!,
      ).map(([time, block]) => ({ time, ...block, type: "work" })),
    },
  };
}
export function alignCampaignTimetable<
  T extends { days: Array<{ date: string; schedule?: unknown }> },
>(email: string | null | undefined, timetable: T, plan?: GermanyRoadmap): T {
  if (plan?.execution?.jobPlan) {
    if (email?.trim().toLowerCase() !== TIMETABLE_OWNER_EMAIL) return timetable;
    const e = plan.execution,
      job = e.jobPlan!;
    return {
      ...timetable,
      scheduleReviewedOn: plan.reviewedOn,
      scheduleEffectiveOn: job.effectiveOn,
      scheduleTimezone: job.timezone,
      scheduleBudgetMinutes: {
        weekday: 660,
        saturday: 300,
        sunday: 0,
        week: 3600,
      },
      scheduleBudget: {
        weekdayFocusedMinutes: 660,
        saturdayFocusedMinutes: 300,
        sundayFocusedMinutes: 0,
        weeklyFocusedMinutes: 3600,
        effectiveOn: job.effectiveOn,
      },
      days: timetable.days.map((day) =>
        day.date < job.effectiveOn || day.date > plan.endDate
          ? day
          : {
              ...day,
              schedule: annotateGermanySchedule(
                e,
                day.date,
                personalSchedule(email, day.date) ?? {},
              ),
            },
      ),
    };
  }
  if (
    !timetable.days.some(
      (day) =>
        day.date >= "2026-10-12" &&
        personalSchedule(email, day.date) !== undefined,
    )
  )
    return timetable;
  return {
    ...timetable,
    scheduleReviewedOn: "2026-10-10",
    scheduleEffectiveOn: "2026-10-12",
    scheduleTimezone: "Asia/Kolkata",
    scheduleBudgetMinutes: {
      weekday: 540,
      saturday: 300,
      sunday: 0,
      week: 3000,
    },
    scheduleBudget: {
      weekdayFocusedMinutes: 540,
      saturdayFocusedMinutes: 300,
      sundayFocusedMinutes: 0,
      weeklyFocusedMinutes: 3000,
      effectiveOn: "2026-10-12",
    },
    days: timetable.days.map((day) => {
      if (day.date < "2026-10-12") return day;
      const schedule = personalSchedule(email, day.date);
      return schedule === undefined ? day : { ...day, schedule };
    }),
  };
}

export function isGermanyRoadmap(value: unknown): value is GermanyRoadmap {
  if (!value || typeof value !== "object") return false;
  const p = value as GermanyRoadmap;
  if (
    p.version !== 1 ||
    (p.execution !== undefined && !isGermanyExecution(p.execution)) ||
    !isCalendarDate(p.startDate ?? "") ||
    !isCalendarDate(p.endDate ?? "") ||
    !isCalendarDate(p.reviewedOn ?? "") ||
    typeof p.target !== "string" ||
    !/^[a-f0-9]{64}$/.test(p.sourceDigest ?? "") ||
    !Array.isArray(p.weeks) ||
    p.weeks.length !== 12
  )
    return false;
  const start = Date.parse(`${p.startDate}T12:00:00Z`);
  if (Date.parse(`${p.endDate}T12:00:00Z`) - start !== 83 * 86400000)
    return false;
  return (
    p.weeks.every(
      (w, i) =>
        w.number === i + 1 &&
        w.start ===
          new Date(start + i * 7 * 86400000).toISOString().slice(0, 10) &&
        w.end ===
          new Date(start + (i * 7 + 6) * 86400000).toISOString().slice(0, 10) &&
        typeof w.study === "string" &&
        typeof w.deliverable === "string" &&
        typeof w.campaign === "string" &&
        Array.isArray(w.items) &&
        w.items.every(
          (item) =>
            typeof item.id === "string" &&
            typeof item.text === "string" &&
            typeof item.acceptanceCriteria === "string" &&
            item.evidenceType === "note",
        ),
    ) &&
    Array.isArray(p.allocations) &&
    p.allocations.every(
      (a) =>
        typeof a.label === "string" && Number.isFinite(a.hours) && a.hours >= 0,
    ) &&
    p.allocations.reduce((sum, a) => sum + a.hours, 0) ===
      (p.execution?.jobPlan ? 60 : 50) &&
    Array.isArray(p.sections) &&
    p.sections.every(
      (s) => typeof s.title === "string" && typeof s.content === "string",
    ) &&
    Array.isArray(p.sources) &&
    p.sources.every(
      (s) => typeof s.label === "string" && /^https:\/\//.test(s.url),
    )
  );
}

export function recordGermanyEvidence(
  state: CareerExecutionState,
  item: CareerChecklistItem,
  evidence: CareerEvidence,
  verify: boolean,
): CareerExecutionState {
  if (!canCompleteEvidence(item, evidence))
    throw new Error("Add evidence that satisfies the completion rule.");
  const old = state.evidenceByItemId[item.id];
  if (
    verify &&
    (!old ||
      old.evidence.value !== evidence.value ||
      old.evidence.sourceUrl !== evidence.sourceUrl)
  )
    throw new Error("Verify the saved evidence before changing it.");
  const now = new Date().toISOString();
  return {
    ...state,
    evidenceByItemId: {
      ...state.evidenceByItemId,
      [item.id]: {
        evidence,
        completedAt: old?.completedAt ?? now,
        ...(verify ? { verifiedAt: now } : {}),
      },
    },
  };
}

export const GERMANY_CHECKLIST_UPDATES: Record<
  string,
  { text: string; link?: string }
> = {
  "germany-degree": {
    text: "KL University (Koneru Lakshmaiah Education Foundation, Guntur) is H+ in Anabin (checked 17 October 2026) — the institution is recognized. Confirm the degree-level Anabin entry for the B.Tech and order a ZAB Statement of Comparability if it is not clearly equivalent; keep the certificate, transcripts and Anabin printouts together.",
    link: "https://zab.kmk.org/en/statement-comparability",
  },
  "germany-blue-card": {
    text: "Blue Card rules verified 17 October 2026: standard EUR 50,700 or qualifying reduced EUR 45,934.20, with required approvals and qualification conditions. Check the actual offer against the current rules and recheck annual figures for 2027.",
    link: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card",
  },
  "germany-documents": {
    text: "Build the responsible mission’s employment-route checklist: passport, offer/employer declaration, qualification and insurance evidence. Verify extra documents, legalization and translations for the actual route.",
    link: "https://india.diplo.de/in-en/service/2755736-2755736",
  },
  "germany-language": {
    text: "Practice beginner German for 45 minutes each weekday; record listening, speaking and writing. Claim a certified level only after earning it.",
    link: "https://www.goethe.de/en/spr/ueb.html",
  },
  "germany-budget": {
    text: "Compare dated net income, rent/deposit, insurance, flights, household costs and buffer in the canonical relocation plan. Do not assume a blocked account for every employment route.",
  },
  "germany-portfolio": {
    text: "Tailor the truthful CV and supported project proof to the actual vacancy. Keep titles, dates, language levels and claims consistent; follow the employer’s requested format.",
  },
};

export const GERMANY_WEEKLY_TARGETS: Record<string, number> = {
  focusedStudyHours: 7.5,
  projectHours: 11,
  applicationHours: 8.5,
  ossHours: 4.5,
  networkingHours: 3,
  interviewHours: 9,
  germanPracticeMinutes: 225,
  relocationHours: 1,
  reviewHours: 1.75,
  tailoredApplications: 10,
  mockInterviews: 2,
  publicProof: 2,
  qualityOutreach: 5,
  substantiveComments: 10,
  practiceArtifacts: 1,
};
export const GERMANY_VERIFICATION_UPDATES: Record<string, string> = {
  "verify-outreach":
    "Relevant personalized conversations recorded with context and actual response status; quality replaces quotas.",
  "verify-oss":
    "Prepare one focused contribution when ready; record submission, review and merge separately. Maintainers control review and merge.",
  "verify-germany":
    "Verify visa and relocation prerequisites in parallel; apply once truthful materials and role constraints are checked.",
  "verify-db":
    "Owner-scoped plan release preserves unrelated rows and passes exact database readback; website publication is verified separately.",
};

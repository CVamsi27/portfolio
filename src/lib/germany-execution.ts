import type { CareerExecutionState } from "./career-roadmap.ts";
import { isCalendarDate } from "./personal-timetable.ts";
export interface GermanyRound {
  id: string;
  title: string;
  dimensions: string[];
  passTotal: number;
  minimum3: number[];
  content: string;
  version: string;
}
export interface GermanyDay {
  id: string;
  date: string;
  week: number;
  title: string;
  blocks: Record<string, string>;
}
export interface GermanyCampaignWeek {
  number: number;
  application: string;
  tuesday: string;
  thursday: string;
  oss: { monday: string; wednesday: string; friday: string };
  german: string;
  germanCheck: string;
  relocation: string;
}
export interface GermanyExecution {
  version: 1;
  assessmentVersion: string;
  days: GermanyDay[];
  rounds: GermanyRound[];
  assessments: { id: string; date: string; time: string; content: string }[];
  companies: { id: string; title: string; status: string; action: string }[];
  weeks: GermanyCampaignWeek[];
  posts: { id: string; date: string; title: string; content: string }[];
  practices: { id: string; task: string; cases: string }[];
  guides: { id: string; title: string; content: string }[];
}
export interface GermanyExamAttempt {
  id: string;
  roundId: string;
  track: "frontend" | "backend" | "general";
  prompt: string;
  promptVersion: string;
  startedAt: string;
  finishedAt: string;
  focusedMinutes: number;
  tools: "unaided-runtime" | "official-docs" | "assisted";
  reviewerType: "self" | "human";
  reviewer: string;
  scores: (number | null)[];
  reasons: string[];
  criticalFailures: string;
  evidence: string;
  repair: string;
  retakeDate: string;
}

export function studyTaskUrl(url: string, date: string, task: string): string {
  try {
    const target = new URL(url);
    if (
      target.origin !== "https://study.buildora.work" ||
      !isCalendarDate(date) ||
      task !== `germany:2026:day:${date}`
    )
      return url;
    target.searchParams.set("roadmapDate", date);
    target.searchParams.set("roadmapTask", task);
    return target.toString();
  } catch {
    return url;
  }
}
const limits: Record<string, number> = {
  R0: 30,
  R1: 60,
  R2: 60,
  R3: 60,
  R4: 180,
  R5: 30,
  R6: 45,
};
export function scoreExam(
  round: GermanyRound,
  attempt: GermanyExamAttempt,
): {
  status: "passed" | "repair" | "unscored";
  total: number;
  eligible: boolean;
} {
  const total = attempt.scores.reduce<number>((sum, n) => sum + (n ?? 0), 0);
  const eligible =
    attempt.tools === "unaided-runtime" ||
    (attempt.tools === "official-docs" && ["R2", "R4"].includes(round.id));
  if (
    attempt.criticalFailures.trim() ||
    attempt.focusedMinutes > limits[round.id] ||
    (round.id !== "R4" &&
      (Date.parse(attempt.finishedAt) - Date.parse(attempt.startedAt)) / 60000 >
        limits[round.id])
  )
    return { status: "repair", total, eligible };
  if (
    attempt.scores.length !== round.dimensions.length ||
    attempt.scores.some((n) => n === null)
  )
    return { status: "unscored", total, eligible };
  const passed =
    attempt.scores.every((n) => Number.isInteger(n) && n! >= 2 && n! <= 4) &&
    round.minimum3.every((i) => attempt.scores[i]! >= 3) &&
    total >= round.passTotal &&
    !attempt.criticalFailures.trim() &&
    attempt.focusedMinutes <= limits[round.id];
  return { status: passed ? "passed" : "repair", total, eligible };
}
export function examReadiness(
  round: GermanyRound,
  attempts: GermanyExamAttempt[],
  version: string,
  track = "general",
): string {
  const matching = attempts.filter(
    (a) => a.roundId === round.id && a.track === track,
  );
  const current = matching.filter((a) => a.promptVersion === version);
  if (!current.length)
    return matching.length
      ? "Criteria changed · review earlier attempts"
      : "Pending";
  const latest = current[current.length - 1];
  if (scoreExam(round, latest).status === "repair") return "Repair needed";
  const passed = current.filter((a) => {
    const score = scoreExam(round, a);
    return score.status === "passed" && score.eligible;
  });
  const prompts = new Set(passed.map((a) => a.prompt.trim().toLowerCase()));
  if (prompts.size < 2) return `${prompts.size} of 2 changed-prompt passes`;
  return passed.some((a) => a.reviewerType === "human")
    ? "Reviewed readiness"
    : "Self-assessed readiness";
}
export function appendExamAttempt(
  state: CareerExecutionState,
  attempt: GermanyExamAttempt,
  round: GermanyRound,
  version: string,
): CareerExecutionState {
  const old = state.germanyExamAttempts ?? [];
  if (old.some((a) => a.id === attempt.id))
    throw new Error(
      "Duplicate attempt ID; earlier attempts cannot be overwritten.",
    );
  if (
    attempt.roundId !== round.id ||
    attempt.promptVersion !== version ||
    !attempt.id ||
    attempt.prompt.trim().length < 8
  )
    throw new Error("Choose the actual round and describe the changed prompt.");
  if (attempt.evidence.trim().length < 40 || attempt.evidence.length > 2000)
    throw new Error(
      "Evidence must describe the saved artifact and observed checks (40–2000 characters).",
    );
  if (
    !["unaided-runtime", "official-docs", "assisted"].includes(attempt.tools) ||
    !["self", "human"].includes(attempt.reviewerType) ||
    !attempt.reviewer.trim()
  )
    throw new Error("Record the tool policy and actual reviewer.");
  if (
    !["frontend", "backend", "general"].includes(attempt.track) ||
    (round.id === "R2"
      ? attempt.track === "general"
      : attempt.track !== "general")
  )
    throw new Error(
      "Select the practical frontend/backend track; other rounds use general.",
    );
  const start = Date.parse(attempt.startedAt),
    end = Date.parse(attempt.finishedAt);
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end < start ||
    !Number.isInteger(attempt.focusedMinutes) ||
    attempt.focusedMinutes < 1 ||
    attempt.focusedMinutes > (end - start) / 60000
  )
    throw new Error(
      "Record valid start/end times and focused minutes within that interval.",
    );
  if (
    attempt.scores.length !== round.dimensions.length ||
    attempt.reasons.length !== round.dimensions.length ||
    attempt.scores.some(
      (n) => n !== null && (!Number.isInteger(n) || n < 0 || n > 4),
    ) ||
    attempt.scores.some(
      (n, i) => n !== null && attempt.reasons[i].trim().length < 10,
    )
  )
    throw new Error(
      "Each scored dimension needs a score from 0 to 4 and an observed reason; leave unscored dimensions blank.",
    );
  if (
    !isCalendarDate(attempt.retakeDate) ||
    attempt.retakeDate < new Date(end).toISOString().slice(0, 10) ||
    attempt.repair.trim().length < 10
  )
    throw new Error(
      "Record a specific repair and a valid next practice/retake date.",
    );
  return {
    ...state,
    germanyExamAttempts: [
      ...old,
      {
        ...attempt,
        scores: [...attempt.scores],
        reasons: [...attempt.reasons],
      },
    ],
  };
}
export function isGermanyExecution(value: unknown): value is GermanyExecution {
  if (!value || typeof value !== "object") return false;
  const e = value as GermanyExecution;
  const text = (s: unknown) => typeof s === "string" && s.trim().length > 0;
  const hash = (s: unknown) =>
    typeof s === "string" && /^[a-f0-9]{64}$/.test(s);
  try {
    return (
      e.version === 1 &&
      hash(e.assessmentVersion) &&
      e.days.length === 60 &&
      new Set(e.days.map((d) => d.id)).size === 60 &&
      e.days.every(
        (d, i) =>
          isCalendarDate(d.date) &&
          d.id === `germany:2026:day:${d.date}` &&
          d.week === Math.floor(i / 5) + 1 &&
          d.date ===
            new Date(Date.UTC(2026, 9, 12 + Math.floor(i / 5) * 7 + (i % 5)))
              .toISOString()
              .slice(0, 10) &&
          text(d.title) &&
          text(d.blocks.study) &&
          text(d.blocks.project) &&
          (text(d.blocks.assessment) ||
            (text(d.blocks.practice) && text(d.blocks.speak))),
      ) &&
      e.rounds.length === 7 &&
      e.rounds.every(
        (r, i) =>
          r.id === "R" + i &&
          text(r.title) &&
          text(r.content) &&
          hash(r.version) &&
          r.dimensions.length >= 5 &&
          r.dimensions.every(text) &&
          Number.isInteger(r.passTotal) &&
          r.passTotal > 0 &&
          r.passTotal <= r.dimensions.length * 4 &&
          Array.isArray(r.minimum3) &&
          r.minimum3.every(
            (n) => Number.isInteger(n) && n >= 0 && n < r.dimensions.length,
          ),
      ) &&
      e.assessments.length === 24 &&
      new Set(e.assessments.map((a) => a.id)).size === 24 &&
      e.assessments.every(
        (a) =>
          /^[WE](0[1-9]|1[0-2])$/.test(a.id) &&
          isCalendarDate(a.date) &&
          a.date ===
            new Date(
              Date.UTC(
                2026,
                9,
                12 +
                  (Number(a.id.slice(1)) - 1) * 7 +
                  (a.id[0] === "W" ? 2 : 5),
              ),
            )
              .toISOString()
              .slice(0, 10) &&
          text(a.time) &&
          text(a.content),
      ) &&
      e.companies.length === 25 &&
      e.companies.every(
        (c, i) =>
          c.id === "DE" + String(i + 1).padStart(2, "0") &&
          [c.title, c.status, c.action].every(text),
      ) &&
      e.weeks.length === 12 &&
      e.weeks.every(
        (w, i) =>
          w.number === i + 1 &&
          [
            w.application,
            w.tuesday,
            w.thursday,
            w.oss.monday,
            w.oss.wednesday,
            w.oss.friday,
            w.german,
            w.germanCheck,
            w.relocation,
          ].every(text),
      ) &&
      e.posts.length === 12 &&
      e.posts.every(
        (p, i) =>
          p.id === "P" + String(i + 1).padStart(2, "0") &&
          p.date ===
            new Date(Date.UTC(2026, 9, 15 + i * 7))
              .toISOString()
              .slice(0, 10) &&
          [p.title, p.content].every(text),
      ) &&
      e.practices.length > 0 &&
      e.practices.every((p) => [p.id, p.task, p.cases].every(text)) &&
      e.guides.length === 4 &&
      e.guides.every((g) => [g.id, g.title, g.content].every(text))
    );
  } catch {
    return false;
  }
}
export function datedAssignments(
  execution: GermanyExecution,
  date: string,
): Record<string, string> {
  if (!isCalendarDate(date)) return {};
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  if (weekday === 0) return {};
  const offset = Math.floor(
    (Date.parse(date + "T12:00:00Z") - Date.parse("2026-10-12T12:00:00Z")) /
      604800000,
  );
  const week = execution.weeks[offset];
  if (!week) return {};
  if (weekday === 6) {
    const exam = execution.assessments.find((a) => a.date === date);
    const loop = [10, 12].includes(week.number);
    return {
      "09:00-10:00":
        "Review actual submissions, replies, stages and due dates; choose the next eligible roles.",
      "10:15-11:45": exam
        ? `${exam.id}: ${exam.content}`
        : "Changed-prompt retake and scoring.",
      "12:00-13:00": week.relocation,
      "14:30-15:30": loop
        ? "R6 behavioral form " +
          (week.number === 10 ? "A" : "B") +
          ": 45 minutes interview +15 scoring. Replaces proof packaging."
        : "Package the actual synthetic project proof, checks and limitations.",
      "15:30-16:00": loop
        ? "Score R3 and R5 for ten minutes each; use ten minutes to plan the next replacements."
        : "Review evidence and replace lower-priority work with the top failed-round repair.",
    };
  }
  const day = execution.days.find((d) => d.date === date);
  if (!day) return {};
  return {
    "08:30-10:00": day.blocks.study,
    "10:15-12:15": day.blocks.project,
    "12:30-14:00": week.application,
    "14:30-16:00":
      weekday === 2
        ? week.tuesday
        : weekday === 4
          ? week.thursday
          : week.oss[
              weekday === 1 ? "monday" : weekday === 3 ? "wednesday" : "friday"
            ],
    "16:15-17:15": day.blocks.assessment
      ? day.blocks.assessment + " · 16:15–17:45 (includes the speaking block)"
      : day.blocks.practice,
    "17:15-17:45": day.blocks.assessment
      ? "Continue the same assessment and scoring; no separate speaking task."
      : day.blocks.speak,
    "20:30-21:15":
      week.german + (weekday === 5 ? " Friday check: " + week.germanCheck : ""),
    "21:15-21:30":
      "Recall the mechanism without notes, correct one misconception and choose the next specific task.",
  };
}
export interface GermanyCompanyRecord {
  stage:
    | "research"
    | "prepared"
    | "submitted"
    | "screen"
    | "technical"
    | "offer"
    | "rejected"
    | "closed";
  eligibility: "unknown" | "eligible" | "ineligible";
  roleUrl: string;
  checkedOn: string;
  confirmation: string;
  note: string;
}
export function recordGermanyCompany(
  state: CareerExecutionState,
  id: string,
  record: GermanyCompanyRecord,
): CareerExecutionState {
  if (
    !/^DE(0[1-9]|1[0-9]|2[0-5])$/.test(id) ||
    ![
      "research",
      "prepared",
      "submitted",
      "screen",
      "technical",
      "offer",
      "rejected",
      "closed",
    ].includes(record.stage) ||
    !["unknown", "eligible", "ineligible"].includes(record.eligibility) ||
    !isCalendarDate(record.checkedOn)
  )
    throw new Error(
      "Select a valid company stage, eligibility and check date.",
    );
  try {
    if (new URL(record.roleUrl).protocol !== "https:") throw new Error();
  } catch {
    throw new Error("Record the exact HTTPS role/source URL.");
  }
  if (record.note.trim().length < 40 || record.note.length > 2000)
    throw new Error(
      "Describe the actual fit check, uncertainty and next action (40–2000 characters).",
    );
  if (
    ["submitted", "screen", "technical", "offer", "rejected"].includes(
      record.stage,
    ) &&
    record.confirmation.trim().length < 10
  )
    throw new Error(
      "An actual application stage needs a receipt/message confirmation reference.",
    );
  return {
    ...state,
    germanyCompanyRecords: {
      ...state.germanyCompanyRecords,
      [id]: { ...record },
    },
  };
}
export function annotateGermanySchedule<
  T extends Record<
    string,
    | string
    | { label: string; minutes?: number; work?: boolean; output?: string }
  >,
>(execution: GermanyExecution, date: string, schedule: T): T {
  const assignments = datedAssignments(execution, date),
    assessment = execution.days.find((d) => d.date === date)?.blocks.assessment;
  const labels: Record<string, string> = assessment
    ? {
        "16:15-17:15": "Interview assessment · continues to 17:45",
        "17:15-17:45": "Continue assessment and scoring",
      }
    : {};
  if (["2026-12-19", "2027-01-02"].includes(date)) {
    labels["14:30-15:30"] = "Behavioral exam and scoring";
    labels["15:30-16:00"] = "Score design/defense and plan";
  }
  return Object.fromEntries(
    Object.entries(schedule).map(([range, block]) => [
      range,
      typeof block === "string" || !assignments[range]
        ? block
        : {
            ...block,
            label: labels[range] ?? block.label,
            output: assignments[range],
          },
    ]),
  ) as T;
}

export type CareerEvidenceType = "note" | "recording" | "commit" | "url" | "application" | "screenshot" | "manual-confirmation";

export interface CareerEvidence {
  value: string;
  sourceUrl?: string;
  confirmed?: boolean;
  reflection?: string;
}

export interface CareerChecklistItem {
  id: string;
  text: string;
  evidenceType: CareerEvidenceType;
  acceptanceCriteria: string;
  instructions?: string[];
  estimatedMinutes: number;
}

export interface CareerCurriculumDay {
  id: string;
  day: number;
  date: string;
  chapters: Array<{ id: string; studyUrl: string }>;
  checklist: CareerChecklistItem[];
}

export interface CareerCurriculum {
  version: number;
  startDate: string;
  endDate: string;
  chapterCount: number;
  days: CareerCurriculumDay[];
}

export interface CareerExecutionEntry {
  evidence: CareerEvidence;
  completedAt: string;
  verifiedAt?: string;
  carriedForwardTo?: string;
}

export interface ArchivedCareerItem {
  id: string;
  archivedAt: string;
  reason: string;
}

export interface LegacyCompletionClaim {
  id: string;
  date: string;
  text: string;
  claimedDone: true;
}

export interface CareerExecutionState {
  version: 1;
  evidenceByItemId: Record<string, CareerExecutionEntry>;
  archivedItems: ArchivedCareerItem[];
  legacyClaims?: LegacyCompletionClaim[];
}

export interface CareerTodo {
  id: string;
  text: string;
  done: boolean;
  date?: string;
  priority?: "P1" | "P2" | "P3";
  tag?: string;
  createdAt?: number;
  [key: string]: unknown;
}

const PLANNER_TODO_PREFIX = "career-plan:";
const ALLOWED_ROW_KEYS = new Set([
  "timetable_100_days",
  "career_command_center",
  "career_execution_state",
  "todos",
  "reminders",
]);

export const DEFAULT_CAREER_REMINDERS = {
  morning: { enabled: false, time: "07:00" },
  study: { enabled: false, time: "10:25" },
  roleResearch: { enabled: false, time: "12:25" },
  interview: { enabled: false, time: "17:25" },
  eveningReview: { enabled: false, time: "20:30" },
  windDown: { enabled: false, time: "21:30" },
};

export function mergeCareerReminders(previous: unknown): typeof DEFAULT_CAREER_REMINDERS & Record<string, unknown> {
  const source = previous && typeof previous === "object" ? previous as Record<string, unknown> : {};
  const merged: Record<string, unknown> = { ...source };
  for (const [key, fallback] of Object.entries(DEFAULT_CAREER_REMINDERS)) {
    const slot = source[key];
    merged[key] = slot && typeof slot === "object" && typeof (slot as { enabled?: unknown }).enabled === "boolean" && typeof (slot as { time?: unknown }).time === "string"
      ? slot
      : fallback;
  }
  return merged as typeof DEFAULT_CAREER_REMINDERS & Record<string, unknown>;
}

export const EMPTY_CAREER_EXECUTION_STATE: CareerExecutionState = {
  version: 1,
  evidenceByItemId: {},
  archivedItems: [],
  legacyClaims: [],
};

function validHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function canCompleteEvidence(item: Pick<CareerChecklistItem, "evidenceType">, evidence: CareerEvidence): boolean {
  if (!evidence || typeof evidence.value !== "string" || evidence.value.trim().length > 2_000) return false;
  const value = evidence.value.trim();
  switch (item.evidenceType) {
    case "note":
      return value.length >= 40;
    case "recording":
      return value.length >= 40 || validHttpUrl(value);
    case "commit":
      return /^[a-f0-9]{40}$/i.test(value) || /github\.com\/.+\/commit\/[a-f0-9]{7,40}(?:[/?#]|$)/i.test(value);
    case "url":
    case "screenshot":
      return validHttpUrl(evidence.sourceUrl ?? value);
    case "application":
      return /company\s*:\s*\S+/i.test(value) && (/application\s*id\s*:\s*\S+/i.test(value) || validHttpUrl(evidence.sourceUrl));
    case "manual-confirmation":
      return evidence.confirmed === true && value.length > 0;
    default:
      return false;
  }
}

function normalizeState(value: unknown): CareerExecutionState {
  if (!value || typeof value !== "object") return structuredClone(EMPTY_CAREER_EXECUTION_STATE);
  const record = value as Partial<CareerExecutionState>;
  return {
    version: 1,
    evidenceByItemId: record.evidenceByItemId && typeof record.evidenceByItemId === "object" ? record.evidenceByItemId : {},
    archivedItems: Array.isArray(record.archivedItems) ? record.archivedItems : [],
    legacyClaims: Array.isArray(record.legacyClaims) ? record.legacyClaims : [],
  };
}

export function mergeExecutionState(previous: unknown, nextChecklistIds: string[], archivedAt = new Date().toISOString()): CareerExecutionState {
  const current = normalizeState(previous);
  const nextIds = new Set(nextChecklistIds);
  const preserved: Record<string, CareerExecutionEntry> = {};
  const archived = [...current.archivedItems];
  for (const [id, entry] of Object.entries(current.evidenceByItemId)) {
    if (nextIds.has(id)) preserved[id] = entry;
    else archived.push({ id, archivedAt, reason: "Removed from generated curriculum" });
  }
  const uniqueArchives = new Map(archived.map(item => [item.id, item]));
  return { version: 1, evidenceByItemId: preserved, archivedItems: [...uniqueArchives.values()], legacyClaims: current.legacyClaims };
}

export function buildPlannerTodos(curriculum: { days: Array<{ day: number; date: string; title?: string }> }, existingTodos: CareerTodo[]): CareerTodo[] {
  const priorById = new Map(existingTodos.filter(todo => todo.id.startsWith(PLANNER_TODO_PREFIX)).map(todo => [todo.id, todo]));
  const personalTodos = existingTodos.filter(todo => !todo.id.startsWith(PLANNER_TODO_PREFIX));
  const plannerTodos = curriculum.days.map(day => {
    const id = `${PLANNER_TODO_PREFIX}${day.date}`;
    const prior = priorById.get(id);
    return {
      id,
      text: `[Day ${day.day}] ${day.title ?? "Career roadmap"}`,
      done: prior?.done ?? false,
      date: day.date,
      priority: prior?.priority ?? "P1",
      tag: prior?.tag ?? "Goal",
      createdAt: prior?.createdAt ?? Date.parse(`${day.date}T12:00:00.000Z`),
    } satisfies CareerTodo;
  });
  return [...personalTodos, ...plannerTodos];
}

function expectedDate(startDate: string, offset: number): string {
  const date = new Date(`${startDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function validateSeedPayload(payload: {
  ownerEmail: string;
  curriculum: CareerCurriculum;
  rows?: Array<{ key: string; user_id?: string; value: unknown }>;
}, expectedOwnerEmail: string): true {
  if (!expectedOwnerEmail.trim() || payload.ownerEmail.trim().toLowerCase() !== expectedOwnerEmail.trim().toLowerCase()) {
    throw new Error("Career seed owner does not match the configured owner account.");
  }
  const curriculum = payload.curriculum;
  if (curriculum.version !== 1 || curriculum.startDate !== "2026-09-30" || curriculum.endDate !== "2027-01-07" || curriculum.days.length !== 100) {
    throw new Error("Career seed curriculum version or date range is invalid.");
  }
  const dayIds = new Set<string>();
  const dates = new Set<string>();
  const chapterIds = new Set<string>();
  const checklistIds = new Set<string>();
  let chapterCount = 0;
  for (const [index, day] of curriculum.days.entries()) {
    if (day.date !== expectedDate(curriculum.startDate, index)) throw new Error(`Invalid date at career day ${index + 1}.`);
    if (dayIds.has(day.id) || dates.has(day.date)) throw new Error(`Duplicate career day ${day.id}.`);
    dayIds.add(day.id);
    dates.add(day.date);
    for (const chapter of day.chapters) {
      if (chapterIds.has(chapter.id)) throw new Error(`Duplicate study chapter ${chapter.id}.`);
      chapterIds.add(chapter.id);
      chapterCount += 1;
      const url = new URL(chapter.studyUrl);
      if (url.protocol !== "https:" || url.hostname !== "study.buildora.work") throw new Error(`Invalid study chapter link ${chapter.studyUrl}.`);
    }
    for (const item of day.checklist) {
      if (checklistIds.has(item.id)) throw new Error(`Duplicate checklist item ${item.id}.`);
      if (!item.evidenceType || !item.acceptanceCriteria) throw new Error(`Checklist evidence contract is missing for ${item.id}.`);
      checklistIds.add(item.id);
    }
  }
  if (chapterCount !== curriculum.chapterCount) throw new Error("Career seed chapter count does not match its assignments.");
  for (const row of payload.rows ?? []) {
    if (!ALLOWED_ROW_KEYS.has(row.key)) throw new Error(`Career seed row key is not allowed: ${row.key}.`);
    if (row.user_id && row.user_id !== payload.ownerEmail && !/^[0-9a-f-]{36}$/i.test(row.user_id)) throw new Error("Career seed row has an invalid user ID.");
  }
  return true;
}

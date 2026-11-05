import { isCalendarDate } from "./personal-timetable.ts";

export const CAREER_COLLECTIONS = [
  "career:research",
  "career:opportunities",
  "career:activities",
] as const;
export type CareerCollection = (typeof CAREER_COLLECTIONS)[number];
export const CAREER_STAGES = [
  "research",
  "clarify",
  "ready",
  "applied",
  "interview",
  "offer",
  "won",
  "closed",
] as const;
export type CareerStage = (typeof CAREER_STAGES)[number];
export const CAREER_ACTIVITY_KINDS = [
  "application",
  "outreach",
  "conversation",
  "reply",
  "interview",
  "proposal",
  "agreement",
  "payment",
  "note",
  "delivery",
  "offer",
] as const;
export type CareerActivityKind = (typeof CAREER_ACTIVITY_KINDS)[number];
type Dated = { updatedAt: number; deleted?: boolean };
export interface CareerResearchRole extends Dated {
  sourceUpdatedAt?: number;
  id: string;
  company: string;
  title: string;
  roleUrl: string;
  kind: "employment" | "contract";
  location: string;
  availability: "active" | "expired" | "uncertain";
  checkedOn: string;
  eligibility: "eligible" | "clarify" | "ineligible";
  eligibilityEvidence: string;
  fit: string[];
  gaps: string[];
  questions: string[];
  suggestedAction: string;
  rank: number;
  compensation: string;
  contacts: Array<{ name: string; url: string }>;
  draft: string;
}
export interface CareerResearchSnapshotV1 {
  schemaVersion: 1;
  exportedAt: string;
  roles: CareerResearchRole[];
}
export interface CareerOpportunity extends Dated {
  id: string;
  stage: CareerStage;
  priority: number;
  draft: string;
  notes: string;
  nextAction: string;
  followUpOn: string | null;
  scope: string;
  terms: string;
  weeklyHours: string;
  startOn: string | null;
  firstPaymentOn: string | null;
}
export interface CareerActivity extends Dated {
  id: string;
  opportunityId: string;
  kind: CareerActivityKind;
  date: string;
  reference: string;
  note: string;
  scheduledAt?: string;
  amount?: number;
  currency?: string;
  done?: boolean;
}
export type CareerResearch = Record<string, CareerResearchRole>;
export type CareerOpportunities = Record<string, CareerOpportunity>;
export type CareerActivities = Record<string, CareerActivity>;

const object = (v: unknown): v is Record<string, unknown> =>
  Boolean(v && typeof v === "object" && !Array.isArray(v));
const text = (v: unknown, min = 0, max = 2000): v is string =>
  typeof v === "string" && v.trim().length >= min && v.length <= max;
const identifier = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[A-Za-z0-9_-]{1,100}$/.test(v) &&
  !["__proto__", "constructor", "prototype"].includes(v);
const timestamp = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const rank = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 10000;
const date = (v: unknown): v is string =>
  typeof v === "string" && isCalendarDate(v);
const nullableDate = (v: unknown) => v === null || date(v);
const strings = (v: unknown) =>
  Array.isArray(v) && v.length <= 30 && v.every((s) => text(s, 1));
const dated = (v: Record<string, unknown>) =>
  timestamp(v.updatedAt) &&
  (v.deleted === undefined || typeof v.deleted === "boolean");

export function safeCareerUrl(
  value: unknown,
  contact = false,
): value is string {
  if (!text(value, 1, 2000) || /[\r\n\u0000-\u001f]|%0[ad]/i.test(value))
    return false;
  try {
    const url = new URL(value);
    if (contact && url.protocol === "mailto:")
      return /^mailto:[^\s?@]+@[^\s?@]+\.[^\s?@]+$/i.test(value);
    return (
      url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function canonicalRoleUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()])
    if (/^utm_/i.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  return url.toString().replace(/\/$/, "");
}

export function validResearchRole(value: unknown): value is CareerResearchRole {
  if (!object(value)) return false;
  return (
    identifier(value.id) &&
    dated(value) &&
    text(value.company, 1, 300) &&
    text(value.title, 1, 300) &&
    safeCareerUrl(value.roleUrl) &&
    typeof value.kind === "string" &&
    ["employment", "contract"].includes(value.kind) &&
    text(value.location, 1, 500) &&
    typeof value.availability === "string" &&
    ["active", "expired", "uncertain"].includes(value.availability) &&
    date(value.checkedOn) &&
    typeof value.eligibility === "string" &&
    ["eligible", "clarify", "ineligible"].includes(value.eligibility) &&
    text(value.eligibilityEvidence, 1) &&
    strings(value.fit) &&
    strings(value.gaps) &&
    strings(value.questions) &&
    text(value.suggestedAction, 1) &&
    rank(value.rank) &&
    text(value.compensation, 0, 2000) &&
    text(value.draft, 0, 20000) &&
    (value.sourceUpdatedAt === undefined || timestamp(value.sourceUpdatedAt)) &&
    Array.isArray(value.contacts) &&
    value.contacts.length <= 20 &&
    value.contacts.every(
      (c) => object(c) && text(c.name, 1, 300) && safeCareerUrl(c.url, true),
    )
  );
}

export function validOpportunity(value: unknown): value is CareerOpportunity {
  if (!object(value)) return false;
  return (
    identifier(value.id) &&
    dated(value) &&
    CAREER_STAGES.includes(value.stage as CareerStage) &&
    rank(value.priority) &&
    text(value.draft, 0, 20000) &&
    text(value.notes, 0, 10000) &&
    text(value.nextAction, 0) &&
    nullableDate(value.followUpOn) &&
    text(value.scope, 0, 5000) &&
    text(value.terms, 0, 5000) &&
    text(value.weeklyHours, 0, 300) &&
    nullableDate(value.startOn) &&
    nullableDate(value.firstPaymentOn)
  );
}

export function validActivity(value: unknown): value is CareerActivity {
  if (
    !object(value) ||
    !identifier(value.id) ||
    !identifier(value.opportunityId) ||
    !dated(value) ||
    !CAREER_ACTIVITY_KINDS.includes(value.kind as CareerActivityKind) ||
    !date(value.date) ||
    !text(value.reference, value.kind === "note" ? 0 : 1) ||
    !text(value.note, 0, 10000) ||
    (value.done !== undefined && typeof value.done !== "boolean")
  )
    return false;
  if (
    value.scheduledAt !== undefined &&
    (!text(value.scheduledAt, 20, 40) ||
      !/T.*(?:Z|[+-]\d\d:\d\d)$/.test(value.scheduledAt) ||
      !Number.isFinite(Date.parse(value.scheduledAt)))
  )
    return false;
  if (value.kind === "payment")
    return (
      typeof value.amount === "number" &&
      Number.isFinite(value.amount) &&
      value.amount > 0 &&
      value.amount <= 1e12 &&
      typeof value.currency === "string" &&
      /^[A-Z]{3}$/.test(value.currency)
    );
  return (
    (value.amount === undefined ||
      (typeof value.amount === "number" &&
        Number.isFinite(value.amount) &&
        value.amount >= 0)) &&
    (value.currency === undefined ||
      (typeof value.currency === "string" && /^[A-Z]{3}$/.test(value.currency)))
  );
}

export function validCareerCollection(key: string, value: unknown): boolean {
  if (!object(value) || Object.keys(value).length > 2000) return false;
  const validate =
    key === "career:research"
      ? validResearchRole
      : key === "career:opportunities"
        ? validOpportunity
        : key === "career:activities"
          ? validActivity
          : null;
  return Boolean(
    validate &&
      Object.entries(value).every(
        ([id, record]) =>
          identifier(id) &&
          object(record) &&
          record.id === id &&
          validate(record),
      ),
  );
}

export function parseResearchSnapshot(
  value: unknown,
): CareerResearchSnapshotV1 {
  if (
    !object(value) ||
    value.schemaVersion !== 1 ||
    !text(value.exportedAt, 20, 40) ||
    !Number.isFinite(Date.parse(value.exportedAt)) ||
    !Array.isArray(value.roles) ||
    value.roles.length > 500
  )
    throw new Error(
      "Choose a version 1 career research snapshot with a valid export date and up to 500 roles.",
    );
  const ids = new Set<string>(),
    urls = new Set<string>();
  for (const role of value.roles) {
    if (!validResearchRole(role) || role.deleted)
      throw new Error(
        "Every role needs an exact HTTPS vacancy URL, source date, eligibility evidence and valid research fields. Nothing imported.",
      );
    const url = canonicalRoleUrl(role.roleUrl);
    if (ids.has(role.id) || urls.has(url))
      throw new Error(
        "The snapshot contains duplicate role IDs or vacancy URLs. Nothing imported.",
      );
    ids.add(role.id);
    urls.add(url);
  }
  return value as unknown as CareerResearchSnapshotV1;
}

function sameFacts(a: CareerResearchRole, b: CareerResearchRole): boolean {
  const fields: Array<keyof CareerResearchRole> = [
    "id",
    "company",
    "title",
    "roleUrl",
    "kind",
    "location",
    "availability",
    "checkedOn",
    "eligibility",
    "eligibilityEvidence",
    "fit",
    "gaps",
    "questions",
    "suggestedAction",
    "rank",
    "compensation",
    "contacts",
    "draft",
  ];
  return fields.every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));
}
export type ResearchImportChange = {
  role: CareerResearchRole;
  change: "added" | "changed" | "duplicate" | "older" | "conflict";
};
export function previewResearchImport(
  snapshot: CareerResearchSnapshotV1,
  current: CareerResearch,
): ResearchImportChange[] {
  parseResearchSnapshot(snapshot);
  return snapshot.roles.map((role) => {
    const prior = current[role.id];
    if (
      prior &&
      canonicalRoleUrl(prior.roleUrl) !== canonicalRoleUrl(role.roleUrl)
    )
      return { role, change: "conflict" };
    if (
      !prior &&
      Object.values(current).some(
        (r) => canonicalRoleUrl(r.roleUrl) === canonicalRoleUrl(role.roleUrl),
      )
    )
      return { role, change: "duplicate" };
    if (!prior) return { role, change: "added" };
    if (sameFacts(prior, role)) return { role, change: "duplicate" };
    if (
      role.checkedOn < prior.checkedOn ||
      (role.checkedOn === prior.checkedOn &&
        (role.sourceUpdatedAt ?? role.updatedAt) <
          (prior.sourceUpdatedAt ?? prior.updatedAt))
    )
      return { role, change: "older" };
    return { role, change: "changed" };
  });
}
export function applyResearchImport(
  current: CareerResearch,
  snapshot: CareerResearchSnapshotV1,
  selectedIds: string[],
): CareerResearch {
  const selected = new Set(selectedIds);
  const changes = previewResearchImport(snapshot, current).filter(
    (r) => selected.has(r.role.id) && ["added", "changed"].includes(r.change),
  );
  if (!changes.length) return current;
  return {
    ...current,
    ...Object.fromEntries(
      changes.map(({ role }) => [
        role.id,
        {
          ...structuredClone(role),
          sourceUpdatedAt: role.sourceUpdatedAt ?? role.updatedAt,
          updatedAt: Math.max(
            role.updatedAt,
            (current[role.id]?.updatedAt ?? -1) + 1,
          ),
        },
      ]),
    ),
  };
}
export function newOpportunity(
  role: CareerResearchRole,
  now = Date.now(),
): CareerOpportunity {
  return {
    id: role.id,
    stage:
      role.eligibility === "eligible" && role.availability === "active"
        ? "ready"
        : "clarify",
    priority: role.rank,
    draft: role.draft,
    notes: "",
    nextAction: role.suggestedAction,
    followUpOn: null,
    scope: "",
    terms: "",
    weeklyHours: "",
    startOn: null,
    firstPaymentOn: null,
    updatedAt: now,
  };
}
export function addBusinessDays(value: string, count: number): string {
  if (!date(value) || !Number.isInteger(count) || count < 0 || count > 365)
    throw new Error("Choose a valid date and weekday interval.");
  const cursor = new Date(value + "T12:00:00Z");
  for (let left = count; left > 0; ) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (![0, 6].includes(cursor.getUTCDay())) left--;
  }
  return cursor.toISOString().slice(0, 10);
}
export function availabilityNeedsReview(
  role: CareerResearchRole,
  today: string,
): boolean {
  return (
    role.checkedOn > today ||
    !date(today) ||
    !date(role.checkedOn) ||
    Date.parse(today + "T12:00:00Z") -
      Date.parse(role.checkedOn + "T12:00:00Z") >
      7 * 86400000
  );
}

export function recordCareerActivity(
  opportunities: CareerOpportunities,
  activities: CareerActivities,
  activity: CareerActivity,
): { opportunities: CareerOpportunities; activities: CareerActivities } {
  if (!validActivity(activity))
    throw new Error(
      "Record a valid date and confirmation reference. Payments also need a positive amount and three-letter currency.",
    );
  const prior = opportunities[activity.opportunityId];
  if (!prior || prior.deleted)
    throw new Error(
      "Choose an existing opportunity before recording an action.",
    );
  let next = {
    ...prior,
    updatedAt: Math.max(prior.updatedAt + 1, activity.updatedAt),
  };
  const followUpKinds = [
    "application",
    "outreach",
    "proposal",
    "reply",
    "conversation",
    "interview",
    "offer",
    "agreement",
  ];
  const clearsFollowUp = (event: CareerActivity) =>
    ["reply", "conversation", "interview", "offer", "agreement"].includes(
      event.kind,
    );
  const latestFollowUpEvent = [
    ...Object.values(activities).filter(
      (a) =>
        !a.deleted &&
        a.id !== activity.id &&
        a.opportunityId === activity.opportunityId &&
        followUpKinds.includes(a.kind),
    ),
    activity,
  ].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      Number(clearsFollowUp(b)) - Number(clearsFollowUp(a)) ||
      b.updatedAt - a.updatedAt,
  )[0];
  const advance = (stage: CareerStage) => {
    if (
      prior.stage !== "closed" &&
      CAREER_STAGES.indexOf(stage) > CAREER_STAGES.indexOf(prior.stage)
    )
      next.stage = stage;
  };
  if (activity.kind === "application") advance("applied");
  if (activity.kind === "interview") advance("interview");
  if (activity.kind === "offer") advance("offer");
  if (activity.kind === "agreement") advance("won");
  if (
    latestFollowUpEvent.id === activity.id &&
    ["application", "outreach", "proposal"].includes(activity.kind) &&
    !["closed", "won"].includes(next.stage)
  )
    next.followUpOn = addBusinessDays(activity.date, 5);
  if (
    (latestFollowUpEvent.id === activity.id && clearsFollowUp(activity)) ||
    ["closed", "won"].includes(next.stage)
  )
    next.followUpOn = null;
  next = { ...next };
  return {
    opportunities: { ...opportunities, [next.id]: next },
    activities: { ...activities, [activity.id]: { ...activity } },
  };
}

export interface CareerNextAction {
  id: string;
  opportunityId: string;
  company: string;
  title: string;
  minutes: number;
  reason: string;
  href: string;
}
export function nextCareerActions(
  research: CareerResearch,
  opportunities: CareerOpportunities,
  activities: CareerActivities,
  today: string,
): CareerNextAction[] {
  if (!date(today)) return [];
  const candidates: Array<
    CareerNextAction & { order: number; rank: number; due: string }
  > = [];
  for (const role of Object.values(research)) {
    const opportunity = opportunities[role.id] ?? newOpportunity(role, 0);
    if (role.deleted || opportunity.deleted || opportunity.stage === "closed")
      continue;
    const base = {
      opportunityId: role.id,
      company: role.company,
      href: `/roadmap?view=opportunities&role=${encodeURIComponent(role.id)}&date=${today}`,
      rank: opportunity.priority,
    };
    const dueDate = (a: CareerActivity) =>
      a.scheduledAt
        ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
            new Date(a.scheduledAt),
          )
        : a.date;
    const scheduled = Object.values(activities)
      .filter(
        (a) =>
          !a.deleted &&
          !a.done &&
          a.opportunityId === role.id &&
          ["interview", "delivery"].includes(a.kind) &&
          dueDate(a) <= today,
      )
      .sort((a, b) =>
        (a.scheduledAt ?? a.date).localeCompare(b.scheduledAt ?? b.date),
      );
    if (scheduled.length) {
      const event = scheduled[0];
      candidates.push({
        ...base,
        id: event.id,
        title:
          event.kind === "interview"
            ? "Prepare for the scheduled interview"
            : "Deliver the agreed paid work",
        minutes: event.kind === "interview" ? 60 : 60,
        reason:
          event.note ||
          `Scheduled for ${event.date}; record the outcome when finished.`,
        order: 0,
        due: event.scheduledAt ?? event.date,
      });
    } else if (opportunity.stage === "won") {
      continue;
    } else if (opportunity.followUpOn && opportunity.followUpOn <= today) {
      candidates.push({
        ...base,
        id: `followup-${role.id}`,
        title: "Follow up on the last conversation",
        minutes: 15,
        reason: `Follow-up due ${opportunity.followUpOn}`,
        order: 1,
        due: opportunity.followUpOn,
      });
    } else if (
      role.eligibility !== "ineligible" &&
      role.availability !== "expired" &&
      ["research", "clarify", "ready"].includes(opportunity.stage)
    ) {
      const recheck = availabilityNeedsReview(role, today);
      const ready =
        role.eligibility === "eligible" &&
        role.availability === "active" &&
        opportunity.stage !== "clarify";
      candidates.push({
        ...base,
        id: `prepare-${role.id}`,
        title: recheck
          ? "Recheck the opening and eligibility"
          : ready
            ? "Prepare and send a tailored application"
            : "Clarify the role requirements",
        minutes: ready && !recheck ? 45 : 15,
        reason: recheck
          ? `Last checked ${role.checkedOn}; availability needs review.`
          : opportunity.nextAction || role.suggestedAction,
        order: ready ? 2 : 3,
        due: today,
      });
    }
  }
  return candidates
    .sort(
      (a, b) =>
        a.order - b.order ||
        a.due.localeCompare(b.due) ||
        a.rank - b.rank ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 3)
    .map(({ order: _order, rank: _rank, due: _due, ...action }) => action);
}

export interface CareerWeeklyReview {
  start: string;
  end: string;
  applications: number;
  outreaches: number;
  conversations: number;
  proposals: number;
  interviews: number;
  agreements: number;
  payments: Record<string, number>;
  matureOutreach: number;
  checkpointDue: boolean;
  hasBookedConversation: boolean;
}
export function careerReview(
  activities: CareerActivities,
  today: string,
): CareerWeeklyReview {
  if (!date(today)) throw new Error("Choose a valid review date.");
  const cursor = new Date(today + "T12:00:00Z");
  cursor.setUTCDate(cursor.getUTCDate() - ((cursor.getUTCDay() + 6) % 7));
  const start = cursor.toISOString().slice(0, 10);
  const events = Object.values(activities).filter((a) => !a.deleted);
  const weekly = events.filter((a) => a.date >= start && a.date <= today);
  const count = (kind: CareerActivityKind) =>
    weekly.filter((a) => a.kind === kind).length;
  const cutoff = addBusinessDays(today, 0);
  const mature = events.filter(
    (a) =>
      ["application", "outreach"].includes(a.kind) &&
      addBusinessDays(a.date, 5) <= cutoff,
  );
  const payments: Record<string, number> = {};
  for (const event of weekly)
    if (event.kind === "payment" && event.currency && event.amount)
      payments[event.currency] = (payments[event.currency] ?? 0) + event.amount;
  const hasBookedConversation = events.some(
    (a) =>
      ["conversation", "interview"].includes(a.kind) &&
      (a.kind === "interview" || a.date <= today) &&
      mature.some(
        (sent) => sent.opportunityId === a.opportunityId && a.date >= sent.date,
      ),
  );
  return {
    start,
    end: today,
    applications: count("application"),
    outreaches: count("outreach"),
    conversations: count("conversation"),
    proposals: count("proposal"),
    interviews: count("interview"),
    agreements: count("agreement"),
    payments,
    matureOutreach: mature.length,
    hasBookedConversation,
    checkpointDue:
      today >= "2026-11-13" && mature.length > 0 && !hasBookedConversation,
  };
}

export function adaptLegacyCompanyRecords(
  records: Record<string, unknown>,
  research: CareerResearch,
  now = Date.now(),
): { opportunities: CareerOpportunities; unmatched: string[] } {
  const opportunities: CareerOpportunities = {},
    unmatched: string[] = [];
  const stages: Record<string, CareerStage> = {
    research: "research",
    prepared: "ready",
    submitted: "applied",
    screen: "interview",
    technical: "interview",
    offer: "offer",
    rejected: "closed",
    closed: "closed",
  };
  for (const [legacyId, record] of Object.entries(records)) {
    if (
      !object(record) ||
      !safeCareerUrl(record.roleUrl) ||
      !stages[String(record.stage)]
    ) {
      unmatched.push(legacyId);
      continue;
    }
    const matches = Object.values(research).filter(
      (r) =>
        canonicalRoleUrl(r.roleUrl) ===
        canonicalRoleUrl(record.roleUrl as string),
    );
    if (matches.length !== 1 || opportunities[matches[0].id]) {
      unmatched.push(legacyId);
      continue;
    }
    const role = matches[0];
    opportunities[role.id] = {
      ...newOpportunity(role, now),
      stage: stages[String(record.stage)],
      notes: [
        `Legacy record ${legacyId} · original stage ${String(record.stage)}`,
        String(record.note ?? ""),
        String(record.confirmation ?? ""),
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }
  return { opportunities, unmatched };
}
export function careerWritesEnabled(
  configured: boolean,
  flag: string | undefined,
): boolean {
  return !configured || flag === "true";
}
export function trackerKeyWritesEnabled(
  key: string,
  configured: boolean,
  flag: string | undefined,
): boolean {
  return (
    !(CAREER_COLLECTIONS as readonly string[]).includes(key) ||
    careerWritesEnabled(configured, flag)
  );
}

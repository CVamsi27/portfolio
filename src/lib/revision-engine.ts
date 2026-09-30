"use client";

import curriculum from "@/data/career-curriculum.json";
import type { CompletedChapterRecord } from "@/lib/study-focus";

/**
 * Spaced Repetition System (SRS) intervals based on the Ebbinghaus forgetting curve.
 * Level 0: 1 day (Initial consolidation)
 * Level 1: 3 days (Short-term reinforcement)
 * Level 2: 7 days (Weekly retention)
 * Level 3: 14 days (Bi-weekly recall)
 * Level 4: 30 days (Monthly invariant check)
 * Level 5: 60 days (Long-term semantic mastery)
 */
export const SRS_INTERVAL_DAYS = [1, 3, 7, 14, 30, 60] as const;

export type RetentionRating = "hard" | "good" | "easy";

export interface ExtendedCompletedChapter extends CompletedChapterRecord {
  starred?: boolean;
  revisionCount?: number;
  lastRevisedAt?: string;
  nextRevisionDueAt?: string;
  revisionStage?: number; // 0 to 5
  lastRating?: RetentionRating;
}

export interface CurriculumDayRef {
  day: number;
  date: string;
  topic: string;
  title: string;
  mission: string;
  practiceTask: string;
  interviewQuestions: string[];
  chapters: Array<{
    id: string;
    title: string;
    studyUrl: string;
    stack?: string;
    estimatedMinutes?: number;
  }>;
}

export interface RevisionStatus {
  isDue: boolean;
  daysOverdue: number;
  daysUntilDue: number;
  stage: number;
  intervalDays: number;
  nextDueFormatted: string;
}

export interface HighYieldFlashcard {
  chapterId: string;
  chapterTitle: string;
  stack: string;
  day: number;
  date: string;
  interviewQuestion: string;
  practiceTask: string;
  mission: string;
  studyUrl: string;
  notes?: string;
  timesRevised: number;
  stage: number;
  starred: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calculates whether a chapter is due for spaced repetition revision.
 */
export function getRevisionStatus(
  record: ExtendedCompletedChapter,
  now = Date.now()
): RevisionStatus {
  const stage = Math.min(Math.max(record.revisionStage ?? 0, 0), SRS_INTERVAL_DAYS.length - 1);
  const intervalDays = SRS_INTERVAL_DAYS[stage];

  let dueTimestamp: number;
  if (record.nextRevisionDueAt) {
    const parsed = new Date(record.nextRevisionDueAt).getTime();
    dueTimestamp = isNaN(parsed) ? now : parsed;
  } else if (record.lastRevisedAt) {
    const lastRev = new Date(record.lastRevisedAt).getTime();
    dueTimestamp = (isNaN(lastRev) ? now : lastRev) + intervalDays * DAY_MS;
  } else {
    const completed = new Date(record.completedAt).getTime();
    dueTimestamp = (isNaN(completed) ? now : completed) + intervalDays * DAY_MS;
  }

  const diffMs = now - dueTimestamp;
  const isDue = diffMs >= 0;
  const daysOverdue = isDue ? Math.floor(diffMs / DAY_MS) : 0;
  const daysUntilDue = !isDue ? Math.ceil(-diffMs / DAY_MS) : 0;

  const nextDueDate = new Date(dueTimestamp);
  const nextDueFormatted = isNaN(nextDueDate.getTime())
    ? "Today"
    : nextDueDate.toISOString().slice(0, 10);

  return {
    isDue,
    daysOverdue,
    daysUntilDue,
    stage,
    intervalDays,
    nextDueFormatted,
  };
}

/**
 * Returns all completed chapters that are currently due for spaced repetition revision.
 */
export function getDueRevisionItems(
  records: ExtendedCompletedChapter[],
  now = Date.now()
): ExtendedCompletedChapter[] {
  return (records || [])
    .filter((r) => getRevisionStatus(r, now).isDue)
    .sort((a, b) => {
      // Prioritize starred topics, then most overdue
      if (a.starred && !b.starred) return -1;
      if (!a.starred && b.starred) return 1;
      const statA = getRevisionStatus(a, now);
      const statB = getRevisionStatus(b, now);
      return statB.daysOverdue - statA.daysOverdue;
    });
}

/**
 * Returns all completed chapters marked as Starred / High-Yield.
 */
export function getStarredItems(
  records: ExtendedCompletedChapter[]
): ExtendedCompletedChapter[] {
  return (records || []).filter((r) => Boolean(r.starred));
}

/**
 * Records a completed revision drill, calculates next SRS interval, and advances stage.
 */
export function recordRevision(
  records: ExtendedCompletedChapter[],
  chapterId: string,
  rating: RetentionRating,
  notesUpdate?: string,
  now = Date.now()
): ExtendedCompletedChapter[] {
  return (records || []).map((item) => {
    if (item.chapterId !== chapterId) return item;

    const currentStage = item.revisionStage ?? 0;
    let nextStage: number;

    if (rating === "hard") {
      // Reinforce: Reset to 1-day interval
      nextStage = 0;
    } else if (rating === "good") {
      // Advance by 1 stage
      nextStage = Math.min(currentStage + 1, SRS_INTERVAL_DAYS.length - 1);
    } else {
      // "easy": Advance by 1 or 2 stages
      nextStage = Math.min(currentStage + (currentStage < 2 ? 2 : 1), SRS_INTERVAL_DAYS.length - 1);
    }

    const intervalDays = SRS_INTERVAL_DAYS[nextStage];
    const nextDueTimestamp = now + intervalDays * DAY_MS;

    return {
      ...item,
      revisionStage: nextStage,
      revisionCount: (item.revisionCount || 0) + 1,
      lastRevisedAt: new Date(now).toISOString(),
      nextRevisionDueAt: new Date(nextDueTimestamp).toISOString(),
      lastRating: rating,
      notes: notesUpdate !== undefined ? notesUpdate : item.notes,
    };
  });
}

/**
 * Toggles the starred/important flag on a chapter.
 */
export function toggleChapterStar(
  records: ExtendedCompletedChapter[],
  chapterId: string
): ExtendedCompletedChapter[] {
  return (records || []).map((item) => {
    if (item.chapterId !== chapterId) return item;
    return {
      ...item,
      starred: !item.starred,
    };
  });
}

/**
 * Looks up curriculum day data for a given chapter ID.
 */
export function findDayForChapter(chapterId: string): CurriculumDayRef | null {
  for (const rawDay of curriculum.days) {
    const chapters = rawDay.chapters || [];
    const match = chapters.find((ch) => ch.id === chapterId);
    if (match || rawDay.chapterId === chapterId) {
      return {
        day: rawDay.day,
        date: rawDay.date,
        topic: rawDay.topic || "General",
        title: rawDay.title || match?.title || "Chapter",
        mission: rawDay.mission || "Master the core invariants and architectural trade-offs.",
        practiceTask: rawDay.practiceTask || "Implement and verify a production pattern.",
        interviewQuestions: rawDay.interviewQuestions || (rawDay.interviewQuestion ? [rawDay.interviewQuestion] : []),
        chapters: rawDay.chapters || [],
      };
    }
  }
  return null;
}

/**
 * Generates an active recall flashcard from curriculum data and recorded study notes.
 */
export function buildFlashcard(
  record: ExtendedCompletedChapter
): HighYieldFlashcard {
  const dayRef = findDayForChapter(record.chapterId);
  const questions = dayRef?.interviewQuestions || [];
  const primaryQuestion =
    questions.length > 0
      ? questions[Math.floor(Math.random() * questions.length)]
      : `What are the critical architectural invariants, trade-offs, and failure modes of ${record.chapterTitle}?`;

  const fallbackUrl = `https://study.buildora.work/${record.chapterId}`;
  const dayChapter = dayRef?.chapters?.find((c) => c.id === record.chapterId);

  return {
    chapterId: record.chapterId,
    chapterTitle: record.chapterTitle,
    stack: record.stack || dayRef?.topic || "Full-Stack",
    day: record.day || dayRef?.day || 1,
    date: record.date || dayRef?.date || "",
    interviewQuestion: primaryQuestion,
    practiceTask: dayRef?.practiceTask || "Verify this invariant with a failing and passing unit test.",
    mission: dayRef?.mission || "Recall and state the invariant before looking at notes.",
    studyUrl: dayChapter?.studyUrl || fallbackUrl,
    notes: record.notes,
    timesRevised: record.revisionCount || 0,
    stage: record.revisionStage || 0,
    starred: Boolean(record.starred),
  };
}

/**
 * High-yield curated topics from the curriculum for instant roulette drilling.
 */
export const HIGH_YIELD_CURRICULUM_PRESETS = [
  {
    topic: "30-architecture",
    title: "Transactional Outbox Pattern & Idempotency",
    chapterId: "30-architecture/30.3-infra-patterns/01-transactional-outbox.md",
    studyUrl: "https://study.buildora.work/30-architecture",
    question: "How does the Transactional Outbox prevent dual-write failure between PostgreSQL and Kafka/RabbitMQ?",
    answer: "Atomically writes the domain event to an `outbox` table in the SAME database transaction as the business entity. A polling publisher or Debezium CDC worker tails the WAL to publish with at-least-once delivery, combined with idempotency keys at consumers.",
  },
  {
    topic: "20-backend",
    title: "PostgreSQL Row-Level Security (RLS) & Multi-Tenancy",
    chapterId: "20-backend/20.3-database/04-rls-multi-tenancy.md",
    studyUrl: "https://study.buildora.work/20-backend",
    question: "Why is kernel-level RLS superior to application-layer `where tenant_id = ?` query filtering?",
    answer: "Application-level filters fail on forgotten where-clauses in complex joins or third-party ORMs. Postgres RLS enforces tenant isolation at the database engine level via `SET LOCAL app.current_tenant_id`, making cross-tenant data leaks impossible even under buggy application queries.",
  },
  {
    topic: "10-frontend",
    title: "React 19 Server Components vs Client Island Serialization",
    chapterId: "10-frontend/10.3-react/08-server-components-internals.md",
    studyUrl: "https://study.buildora.work/10-frontend",
    question: "What exact data can and cannot be passed across the Server-to-Client Component boundary in React 19?",
    answer: "Only JSON-serializable primitives, plain objects, arrays, Promises, and React elements can cross the wire. Functions, class instances, Symbols, and non-serializable DOM references cannot cross because props must serialize into the flight stream payload.",
  },
  {
    topic: "30-architecture",
    title: "GoF Observer & Event-Driven Reactive Systems",
    chapterId: "30-architecture/30.1-design-patterns/08-observer.md",
    studyUrl: "https://study.buildora.work/30-architecture",
    question: "How do you prevent memory leaks in the GoF Observer pattern in long-running Node.js or browser services?",
    answer: "Every `subscribe()` must return an explicit `unsubscribe()` disposable cleanup function, or use `AbortSignal` with `{ signal: controller.signal }`. In React, cleanup must execute in `useEffect` return blocks; in Node, listeners must be unhooked on process shutdown.",
  },
  {
    topic: "20-backend",
    title: "Postgres Advisory Locks & Concurrency Control",
    chapterId: "20-backend/20.3-database/07-advisory-locks.md",
    studyUrl: "https://study.buildora.work/20-backend",
    question: "When should you prefer pg_advisory_xact_lock over SELECT ... FOR UPDATE?",
    answer: "Use advisory locks when you need to serialize operations across business domains or tables where a specific target row does not yet exist (e.g. preventing duplicate appointment bookings or invoice generation under high race-condition concurrency).",
  },
];

/**
 * Calculates aggregate retention and revision metrics.
 */
export function getRevisionMetrics(
  records: ExtendedCompletedChapter[],
  now = Date.now()
) {
  const totalMastered = (records || []).length;
  let dueTodayCount = 0;
  let upcomingCount = 0;
  let starredCount = 0;
  let totalRevisionsDone = 0;
  let masteredStageCount = 0; // Stage 4 or 5

  for (const r of records || []) {
    if (r.starred) starredCount++;
    totalRevisionsDone += r.revisionCount || 0;
    if ((r.revisionStage || 0) >= 4) {
      masteredStageCount++;
    }

    const stat = getRevisionStatus(r, now);
    if (stat.isDue) {
      dueTodayCount++;
    } else {
      upcomingCount++;
    }
  }

  const retentionRate =
    totalMastered > 0
      ? Math.round(((totalMastered - dueTodayCount) / totalMastered) * 100)
      : 100;

  return {
    totalMastered,
    dueTodayCount,
    upcomingCount,
    starredCount,
    totalRevisionsDone,
    masteredStageCount,
    retentionRate,
  };
}

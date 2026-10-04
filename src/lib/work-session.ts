import type { FocusActiveState } from "./focus-sprint";
import type { ActiveStudySession } from "./study-focus";
export type WorkSession =
  | { kind: "focus"; session: FocusActiveState }
  | { kind: "study"; session: ActiveStudySession };
export type WorkState = { version: 1; current: WorkSession | null };
export function validWorkState(value: unknown): value is WorkState | null {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  const record = value as WorkState;
  if (record.version !== 1) return false;
  if (record.current === null) return true;
  const current = record.current;
  if (
    !current ||
    !["focus", "study"].includes(current.kind) ||
    !current.session
  )
    return false;
  const s = current.session;
  if (
    typeof s.id !== "string" ||
    !s.id ||
    !Number.isFinite(s.startedAt) ||
    !Number.isFinite(s.pausedMs) ||
    s.pausedMs < 0 ||
    (s.pausedAt !== undefined && !Number.isFinite(s.pausedAt))
  )
    return false;
  return current.kind === "focus"
    ? typeof current.session.label === "string" &&
        (current.session.taskId === undefined ||
          typeof current.session.taskId === "string") &&
        (current.session.returnTo === undefined ||
          typeof current.session.returnTo === "string")
    : typeof current.session.chapterId === "string" &&
        typeof current.session.chapterTitle === "string" &&
        typeof current.session.date === "string" &&
        Number.isFinite(current.session.targetMinutes) &&
        current.session.targetMinutes > 0;
}

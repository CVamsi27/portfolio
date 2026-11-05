import { isCalendarDate } from "./personal-timetable.ts";
import {
  newOpportunity,
  validResearchRole,
  type CareerOpportunity,
  type CareerResearchRole,
} from "./career-workflow.ts";

export type CareerResearchCheck = Pick<
  CareerResearchRole,
  "checkedOn" | "availability" | "eligibility" | "eligibilityEvidence"
>;

/** Existing local stages can be retained offline; an absent remote row is not a known default until sync succeeds. */
export function canPreservePreparationStage(
  configured: boolean,
  stageExists: boolean,
  syncStatus: string,
): boolean {
  return !configured || stageExists || syncStatus === "synced";
}

/** Preserve a derived stage without outranking any actual user edit from another device. */
export function preservedPreparationStage(
  role: CareerResearchRole,
  current?: CareerOpportunity,
): CareerOpportunity {
  return current ?? newOpportunity(role, 0);
}

/** A user-confirmed check changes research facts only, never pipeline records. */
export function updateResearchCheck(
  role: CareerResearchRole,
  check: CareerResearchCheck,
  today: string,
  now = Date.now(),
): CareerResearchRole {
  if (
    !isCalendarDate(today) ||
    !isCalendarDate(check.checkedOn) ||
    check.checkedOn > today
  )
    throw new Error("Choose the actual check date, today or earlier.");
  const updatedAt = Math.max(now, role.updatedAt + 1);
  const next = {
    ...role,
    checkedOn: check.checkedOn,
    availability: check.availability,
    eligibility: check.eligibility,
    eligibilityEvidence:
      typeof check.eligibilityEvidence === "string"
        ? check.eligibilityEvidence.trim()
        : "",
    updatedAt,
    sourceUpdatedAt: updatedAt,
  };
  if (!validResearchRole(next) || role.deleted)
    throw new Error(
      "Record valid availability, eligibility and the employer evidence or remaining question.",
    );
  return next;
}

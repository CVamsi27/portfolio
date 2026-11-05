import {
  availabilityNeedsReview,
  newOpportunity,
  type CareerResearchRole,
  type CareerOpportunity,
  type CareerResearch,
  type CareerOpportunities,
} from "./career-workflow.ts";

export const CAREER_STAGE_LABELS = {
  research: "Review fit",
  clarify: "Needs clarification",
  ready: "Ready to apply",
  applied: "Application sent",
  interview: "Interview process",
  offer: "Offer received",
  won: "Work agreed",
  closed: "Closed",
} as const;
export const CAREER_QUEUE_VIEWS = [
  "all",
  "ready",
  "followups",
  "contracts",
  "recheck",
] as const;
export type CareerQueueView = (typeof CAREER_QUEUE_VIEWS)[number];
export const CAREER_QUEUE_LABELS: Record<CareerQueueView, string> = {
  all: "All",
  ready: "Ready to apply",
  followups: "Follow-ups",
  contracts: "Contracts",
  recheck: "Needs recheck",
};

export function canPrepareApplication(
  role: CareerResearchRole,
  opportunity: CareerOpportunity,
  today: string,
): boolean {
  return (
    !role.deleted &&
    !opportunity.deleted &&
    ["research", "ready"].includes(opportunity.stage) &&
    role.availability === "active" &&
    role.eligibility === "eligible" &&
    !availabilityNeedsReview(role, today)
  );
}

export function matchesCareerQueue(
  role: CareerResearchRole,
  opportunity: CareerOpportunity,
  today: string,
  view: CareerQueueView,
): boolean {
  if (role.deleted || opportunity.deleted) return false;
  if (view === "all") return true;
  if (opportunity.stage === "closed") return false;
  if (view === "ready") return canPrepareApplication(role, opportunity, today);
  if (view === "followups")
    return (
      opportunity.stage !== "won" &&
      Boolean(opportunity.followUpOn && opportunity.followUpOn <= today)
    );
  if (view === "contracts") return role.kind === "contract";
  return (
    ["research", "clarify", "ready"].includes(opportunity.stage) &&
    role.availability !== "expired" &&
    (role.availability === "uncertain" || availabilityNeedsReview(role, today))
  );
}

export function careerQueueCounts(
  research: CareerResearch,
  opportunities: CareerOpportunities,
  today: string,
): Record<CareerQueueView, number> {
  return Object.fromEntries(
    CAREER_QUEUE_VIEWS.map((view) => [
      view,
      Object.values(research).filter((role) =>
        matchesCareerQueue(
          role,
          opportunities[role.id] ?? newOpportunity(role, 0),
          today,
          view,
        ),
      ).length,
    ]),
  ) as Record<CareerQueueView, number>;
}

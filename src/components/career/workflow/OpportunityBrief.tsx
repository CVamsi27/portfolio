import { ArrowRight } from "lucide-react";
import { CAREER_STAGE_LABELS } from "@/lib/career-queue";
import {
  availabilityNeedsReview,
  type CareerOpportunity,
  type CareerResearchRole,
} from "@/lib/career-workflow";

export default function OpportunityBrief({
  role,
  opportunity,
  today,
  onOpen,
}: {
  role: CareerResearchRole;
  opportunity: CareerOpportunity;
  today: string;
  onOpen: () => void;
}) {
  const question = role.questions[0] ?? role.gaps[0];
  return (
    <aside
      className="career-reading-pane career-ink"
      aria-label="Role brief"
      id="career-role-brief"
    >
      <header className="career-reading-heading">
        <div className="career-reading-meta">
          <span>{role.kind === "contract" ? "Contract" : "Employment"}</span>
          <span>
            {availabilityNeedsReview(role, today)
              ? "Recheck source · "
              : "Checked "}
            <time dateTime={role.checkedOn}>{role.checkedOn}</time>
          </span>
        </div>
        <h3>{role.company}</h3>
        <p>{role.title}</p>
        <p className="career-ink-muted">{role.location}</p>
      </header>
      <dl className="career-reading-facts">
        <div>
          <dt>Opening</dt>
          <dd>
            {
              { active: "Open", uncertain: "Unconfirmed", expired: "Closed" }[
                role.availability
              ]
            }
          </dd>
        </div>
        <div>
          <dt>Eligibility</dt>
          <dd>
            {
              {
                eligible: "Eligible",
                clarify: "Needs clarification",
                ineligible: "Not eligible",
              }[role.eligibility]
            }
          </dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd>{CAREER_STAGE_LABELS[opportunity.stage]}</dd>
        </div>
      </dl>
      <section className="career-reading-next">
        <h4>Next action</h4>
        <p>{opportunity.nextAction || role.suggestedAction}</p>
        {opportunity.followUpOn && (
          <p className="career-ink-muted">
            Follow up{" "}
            <time dateTime={opportunity.followUpOn}>
              {opportunity.followUpOn}
            </time>
          </p>
        )}
        <button className="career-ink-action" onClick={onOpen}>
          Open opportunity <ArrowRight size={16} aria-hidden />
        </button>
      </section>
      {(role.fit[0] || question) && (
        <dl className="career-reading-evidence">
          {role.fit[0] && (
            <div>
              <dt>What fits</dt>
              <dd>{role.fit[0]}</dd>
            </div>
          )}
          {question && (
            <div>
              <dt>Still to confirm</dt>
              <dd>{question}</dd>
            </div>
          )}
        </dl>
      )}
    </aside>
  );
}

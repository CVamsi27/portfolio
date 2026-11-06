"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCareerWorkflow } from "@/lib/career-workflow-store";
import { nextCareerActions } from "@/lib/career-workflow";
import "@/app/career-workflow.css";
import "@/app/career-desk.css";

export default function CareerNextActions({ date }: { date: string }) {
  const { research, opportunities, activities, enabled } = useCareerWorkflow();
  const [first, ...later] = nextCareerActions(
    research.value,
    opportunities.value,
    activities.value,
    date,
  );
  const hasResearch = Object.values(research.value).some(
    (role) => !role.deleted,
  );
  if (!enabled && !hasResearch) return null;
  const role = first ? research.value[first.opportunityId] : undefined;
  const fit = role?.fit[0];
  const question = role?.questions[0] ?? role?.gaps[0];

  return (
    <section
      aria-label="Career next actions"
      className="career-docket"
      data-testid="career-next-actions"
    >
      <header className="career-docket-header">
        <div>
          <h2>Career next actions</h2>
          <p>Income checkpoint · 30 November</p>
        </div>
        <Link
          className="career-button career-button-quiet"
          href={`/roadmap?view=opportunities&date=${date}`}
        >
          Career queue <ArrowRight size={15} aria-hidden />
        </Link>
      </header>
      {first ? (
        <ol className="career-docket-list">
          <li className="career-docket-lead career-ink">
            <div className="career-docket-task">
              <p className="career-reading-meta">
                <span>First task</span>
                <span>About {first.minutes} min</span>
              </p>
              <h3>{first.company}</h3>
              {role && <p className="career-docket-role">{role.title}</p>}
              <p className="career-docket-title">{first.title}</p>
              <p className="career-ink-muted">{first.reason}</p>
              <Link className="career-ink-action" href={first.href}>
                Open opportunity <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            {(fit || question) && (
              <dl className="career-docket-reference career-reading-evidence">
                {fit && (
                  <div>
                    <dt>Role evidence</dt>
                    <dd>{fit}</dd>
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
          </li>
          {later.map((action, index) => (
            <li className="career-docket-row" key={action.id}>
              <span className="career-docket-order" aria-hidden>
                {index + 2}
              </span>
              <div>
                <h3>{action.company}</h3>
                <p>{research.value[action.opportunityId]?.title}</p>
              </div>
              <div className="career-docket-row-task">
                <strong>{action.title}</strong>
                <p>
                  {action.reason} · About {action.minutes} min
                </p>
              </div>
              <Link
                className="career-button career-button-quiet"
                href={action.href}
              >
                Open opportunity <ArrowRight size={15} aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="career-docket-empty">
          <p>
            {hasResearch
              ? "No career actions are due. Check the queue for your next move."
              : "Import your shortlist or add a role or contract."}
          </p>
          <div className="career-actions">
            <Link
              className="career-button career-button-primary"
              href="/roadmap?view=opportunities&import=1"
            >
              Import research
            </Link>
            <Link
              className="career-button career-button-quiet"
              href="/roadmap?view=opportunities&add=1"
            >
              Add an opportunity
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

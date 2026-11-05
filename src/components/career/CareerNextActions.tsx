"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCareerWorkflow } from "@/lib/career-workflow-store";
import { nextCareerActions } from "@/lib/career-workflow";
import "@/app/career-workflow.css";

export default function CareerNextActions({ date }: { date: string }) {
  const { research, opportunities, activities, enabled } = useCareerWorkflow();
  const actions = nextCareerActions(
    research.value,
    opportunities.value,
    activities.value,
    date,
  );
  const hasResearch = Object.values(research.value).some(
    (role) => !role.deleted,
  );
  if (!enabled && !hasResearch) return null;
  return (
    <section
      aria-label="Career next actions"
      className="career-brief"
      data-testid="career-next-actions"
    >
      <header className="career-brief-header">
        <div>
          <h2>Career next actions</h2>
          <p>Income checkpoint · 30 November</p>
        </div>
        <Link
          className="career-button career-button-quiet"
          href={`/roadmap?view=opportunities&date=${date}`}
        >
          Career queue <ArrowUpRight size={15} aria-hidden />
        </Link>
      </header>
      {actions.length ? (
        <ol className="career-brief-list">
          {actions.map((action, index) => (
            <li
              key={action.id}
              className={
                index === 0 ? "career-brief-lead" : "career-brief-next"
              }
            >
              <span className="career-brief-order">
                {index === 0 ? "First up" : index === 1 ? "Then" : "After that"}
              </span>
              <p className="career-brief-company">
                {action.company}
                <span className="career-brief-role">
                  {research.value[action.opportunityId]?.title}
                </span>
              </p>
              <h3>{action.title}</h3>
              <p className="career-brief-reason">{action.reason}</p>
              <div className="career-brief-action">
                <span>About {action.minutes} min</span>
                <Link
                  className={`career-button ${index === 0 ? "career-button-primary" : "career-button-quiet"}`}
                  href={action.href}
                >
                  Open opportunity{" "}
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="career-stack">
          <p className="text-sm text-muted-foreground">
            {hasResearch
              ? "No career actions are due. Review your queue or record the next conversation."
              : "Bring your researched roles here, or add one concrete opportunity to get started."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-action min-h-11"
              href="/roadmap?view=opportunities&import=1"
            >
              Import research
            </Link>
            <Link
              className="inline-action min-h-11"
              href="/roadmap?view=opportunities&add=1"
            >
              Add an opportunity
            </Link>
          </div>
        </div>
      )}
      <p className="career-brief-footnote">
        Record applications after sending. Interviews and paid delivery take
        priority over preparation.
      </p>
    </section>
  );
}

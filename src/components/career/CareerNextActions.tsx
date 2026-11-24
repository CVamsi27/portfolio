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
      className="career-docket rounded-2xl border border-border/70 bg-card/90 p-4 space-y-3"
      data-testid="career-next-actions"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold tracking-tight text-foreground">
            Career next actions
          </h2>
          <p className="text-xs text-muted-foreground">
            Phase 0 Sprint · 23 Nov – 4 Dec 2026
          </p>
        </div>
        <Link
          className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          href={`/roadmap?view=opportunities&date=${date}`}
        >
          Career queue <ArrowRight size={13} aria-hidden />
        </Link>
      </header>
      {first ? (
        <ol className="space-y-2.5">
          <li className="rounded-xl border border-primary/25 bg-primary/[0.06] p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
              <span className="uppercase tracking-wider text-primary font-semibold">
                First task
              </span>
              <span className="tabular-nums">About {first.minutes} min</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground leading-snug">
                {first.company}
              </h3>
              {role && (
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  {role.title}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground leading-snug">
                {first.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {first.reason}
              </p>
            </div>
            {(fit || question) && (
              <dl className="grid gap-2 border-t border-border/50 pt-2.5 text-xs">
                {fit && (
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground">
                      Role evidence
                    </dt>
                    <dd className="text-foreground/90 mt-0.5 leading-snug">
                      {fit}
                    </dd>
                  </div>
                )}
                {question && (
                  <div>
                    <dt className="text-[11px] font-medium text-muted-foreground">
                      Still to confirm
                    </dt>
                    <dd className="text-foreground/90 mt-0.5 leading-snug">
                      {question}
                    </dd>
                  </div>
                )}
              </dl>
            )}
            <Link
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              href={first.href}
            >
              Open opportunity <ArrowRight size={14} aria-hidden />
            </Link>
          </li>
          {later.map((action, index) => (
            <li
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 bg-background/60 px-3 py-2.5"
              key={action.id}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground mt-0.5"
                  aria-hidden
                >
                  {index + 2}
                </span>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-foreground truncate">
                    {action.company}
                    {research.value[action.opportunityId]?.title
                      ? ` · ${research.value[action.opportunityId]?.title}`
                      : ""}
                  </h3>
                  <p className="text-xs text-foreground/90 font-medium leading-snug mt-0.5">
                    {action.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {action.reason} · About {action.minutes} min
                  </p>
                </div>
              </div>
              <Link
                className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary"
                href={action.href}
              >
                Open opportunity <ArrowRight size={13} aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-3.5 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {hasResearch
              ? "No career actions are due. Check the queue for your next move."
              : "Import your shortlist or add a role or contract."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-9 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
              href="/roadmap?view=opportunities&import=1"
            >
              Import research
            </Link>
            <Link
              className="inline-flex min-h-9 items-center rounded-lg border border-border/70 bg-background px-3 text-xs font-medium text-foreground hover:border-primary/40"
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

"use client";
import Link from "next/link";
import { useCareerWorkflow } from "@/lib/career-workflow-store";
import { careerReview } from "@/lib/career-workflow";
import "@/app/career-workflow.css";

export default function CareerOutcomesSummary({ date }: { date: string }) {
  const { activities, research, enabled } = useCareerWorkflow();
  if (
    !enabled &&
    !Object.keys(activities.value).length &&
    !Object.keys(research.value).length
  )
    return null;
  const review = careerReview(activities.value, date);
  const items: Array<[string, number]> = [
    ["Applications", review.applications],
    ["Outreach messages", review.outreaches],
    ["Proposals", review.proposals],
    ["Conversations", review.conversations],
    ["Interviews booked", review.interviews],
    ["Work agreed", review.agreements],
  ];
  const paymentEntries = Object.entries(review.payments);

  return (
    <section
      aria-label="Career outcomes"
      className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
            Career outcomes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Week of {review.start} · recorded through {date}
          </p>
        </div>
        <Link
          className="inline-flex min-h-9 items-center rounded-xl border border-border/70 bg-background px-3.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          href={`/roadmap?view=weekly-review&date=${date}`}
        >
          Review career outcomes
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-border/50 bg-muted/25 px-3 py-2.5"
          >
            <dt className="text-[11px] font-medium text-muted-foreground truncate">
              {label}
            </dt>
            <dd
              className={`mt-1 text-xl font-bold tabular-nums tracking-tight ${
                value > 0 ? "text-foreground" : "text-muted-foreground/70"
              }`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border/50 pt-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-xs font-semibold text-foreground">
            Money received
          </h3>
          {paymentEntries.length ? (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {paymentEntries.map(([currency, amount]) => (
                <li key={currency}>
                  {currency}{" "}
                  {amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              No payment recorded this week.
            </p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Actual recorded actions only · currencies stay separate.
        </p>
      </div>
    </section>
  );
}

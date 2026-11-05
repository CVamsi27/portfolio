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
  return (
    <section aria-label="Career outcomes" className="career-outcomes">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">
            Career outcomes
          </h2>
          <p className="text-sm text-muted-foreground">
            Week of {review.start} · recorded through {date}
          </p>
        </div>
        <Link
          className="inline-action min-h-11"
          href={`/roadmap?view=weekly-review&date=${date}`}
        >
          Review career outcomes
        </Link>
      </div>
      <dl className="career-stat-ledger">
        {[
          ["Applications", review.applications],
          ["Conversations", review.conversations],
          ["Proposals", review.proposals],
          ["Outreach messages", review.outreaches],
          ["Interviews booked", review.interviews],
          ["Work agreed", review.agreements],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-2xl font-semibold mt-1">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="career-income-row">
        <h3 className="font-semibold text-sm">Money received</h3>
        {Object.keys(review.payments).length ? (
          <ul className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
            {Object.entries(review.payments).map(([currency, amount]) => (
              <li key={currency}>
                {currency}{" "}
                {amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No payment recorded this week.
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Actual recorded actions only. Drafts, offers and unpaid invoices do not
        count as income. Currencies remain separate.
      </p>
    </section>
  );
}

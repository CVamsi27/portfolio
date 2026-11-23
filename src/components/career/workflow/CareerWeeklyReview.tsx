"use client";

import Link from "next/link";
import {
  careerReview,
  newOpportunity,
  type CareerResearch,
  type CareerOpportunities,
  type CareerActivities,
} from "@/lib/career-workflow";
import ProgressBar from "@/components/charts/ProgressBar";

export default function CareerWeeklyReview({
  research,
  opportunities,
  activities,
  today,
}: {
  research: CareerResearch;
  opportunities: CareerOpportunities;
  activities: CareerActivities;
  today: string;
}) {
  const review = careerReview(activities, today);
  const followUps = Object.values(research).filter((role) => {
    const record = opportunities[role.id] ?? newOpportunity(role, 0);
    return (
      !role.deleted &&
      record.stage !== "closed" &&
      !record.deleted &&
      record.followUpOn &&
      record.followUpOn <= today
    );
  });
  return (
    <div className="career-stack">
      <div className="career-heading">
        <div>
          <h2>Review actual outcomes</h2>
          <p className="career-help">
            Week of {review.start} · recorded through {today}. Drafts and
            preparation hours do not count as sent work.
          </p>
        </div>
        <Link className="career-button" href={`/plan?date=${today}&view=week`}>
          Plan next week
        </Link>
      </div>
      <dl className="career-stat-ledger">
        {[
          ["Applications", review.applications],
          ["Outreach messages", review.outreaches],
          ["Conversations", review.conversations],
          ["Proposals", review.proposals],
          ["Interviews booked", review.interviews],
          ["Work agreed", review.agreements],
        ].map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <section className="career-review-section">
        <h3>Money received</h3>
        <p className="career-help">
          Amounts remain in their original currency. Offers, proposals and
          invoices are separate from payment.
        </p>
        {Object.entries(review.payments).length ? (
          <ul>
            {Object.entries(review.payments).map(([currency, amount]) => (
              <li key={currency} className="font-semibold">
                {currency}{" "}
                {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </li>
            ))}
          </ul>
        ) : (
          <p className="career-help">No payment recorded this week.</p>
        )}
      </section>
      <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-3">
        <h3 className="font-display text-sm font-semibold">
          Weekly targets progress (Week of {review.start})
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ProgressBar
            label="Applications"
            value={review.applications}
            max={15}
            tone="primary"
          />
          <ProgressBar
            label="Warm / referrals"
            value={review.outreaches}
            max={10}
            tone="sky"
          />
          <ProgressBar
            label="Contracts"
            value={review.proposals}
            max={5}
            tone="amber"
          />
          <ProgressBar
            label="Interviews"
            value={review.interviews}
            max={2}
            tone="emerald"
          />
        </div>
      </section>
      <section className="career-review-section">
        <h3>5-day cohort &amp; Phase 0 gate (4 December)</h3>
        <p className="career-help">
          {review.matureOutreach} application or outreach records are at least
          five weekdays old. Recent pending applications remain pending.
        </p>
        <p className="career-help">
          {review.checkpointDue && !review.hasBookedConversation
            ? "No booked interview or client conversation is recorded for that mature cohort. Audit your CV tailoring (--focus) and outreach message before sending the next 15-application batch."
            : review.hasBookedConversation
              ? "A conversation or interview is recorded for the reviewed cohort. Protect round prep (5-round study.buildora.work rotation) and follow up on pending leads after 5 business days."
              : "Check reply rate once your first 15 applications from 23 November pass five business days; target ≥10% reply rate before scaling volume."}
        </p>
      </section>
      <section className="career-stack">
        <h3>Follow-ups due</h3>
        {followUps.length ? (
          <ul className="career-import-list">
            {followUps.map((role) => (
              <li key={role.id}>
                <Link
                  className="career-button"
                  href={`/roadmap?view=opportunities&role=${encodeURIComponent(role.id)}`}
                >
                  {role.company} · {opportunities[role.id].followUpOn}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="career-help">
            No follow-ups due. Choose the next qualified opportunity or record
            the latest reply.
          </p>
        )}
      </section>
    </div>
  );
}

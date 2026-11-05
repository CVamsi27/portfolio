"use client";

import Link from "next/link";
import {
  careerReview,
  newOpportunity,
  type CareerResearch,
  type CareerOpportunities,
  type CareerActivities,
} from "@/lib/career-workflow";

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
      <section className="career-review-section">
        <h3>13 November checkpoint</h3>
        <p className="career-help">
          {review.matureOutreach} application or outreach records are at least
          five weekdays old. Recent pending applications remain pending.
        </p>
        <p className="career-help">
          {review.checkpointDue && !review.hasBookedConversation
            ? "No booked interview or client conversation is recorded for that mature cohort. Review one CV/message batch with a trusted former colleague and shift the proof block toward warm paid-work outreach."
            : review.hasBookedConversation
              ? "A conversation or interview is recorded for the reviewed cohort. Prepare for its actual requirements and retain the remaining pending records."
              : "Review this cohort on 13 November. Check actual replies and booked conversations before changing your approach."}
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

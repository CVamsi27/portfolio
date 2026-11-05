"use client";

import { useState } from "react";
import { ExternalLink, Copy } from "lucide-react";
import Modal from "@/components/trackers/Modal";
import {
  recordCareerActivity,
  availabilityNeedsReview,
  type CareerResearchRole,
  type CareerOpportunity,
  type CareerActivity,
  type CareerActivityKind,
} from "@/lib/career-workflow";
import ActivityForm, { activityLabels } from "./ActivityForm";
import ResearchCheckForm from "./ResearchCheckForm";
import { CAREER_STAGE_LABELS, canPrepareApplication } from "@/lib/career-queue";
import type { CareerResearchCheck } from "@/lib/career-research";

export default function OpportunityDetail({
  role,
  opportunity,
  activities,
  today,
  enabled,
  onClose,
  onSave,
  onActivity,
  onResearchCheck,
}: {
  role: CareerResearchRole;
  opportunity: CareerOpportunity;
  activities: CareerActivity[];
  today: string;
  enabled: boolean;
  onClose: () => void;
  onSave: (record: CareerOpportunity) => void;
  onActivity: (activity: CareerActivity) => void;
  onResearchCheck: (check: CareerResearchCheck) => void;
}) {
  const [draft, setDraft] = useState(opportunity.draft);
  const [followUp, setFollowUp] = useState(opportunity.followUpOn ?? "");
  const [activityKind, setActivityKind] = useState<CareerActivityKind | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  return (
    <Modal
      open
      onClose={onClose}
      title={`${role.company} · ${role.title}`}
      className="sm:max-w-3xl career-role-sheet"
    >
      <div className="career-stack career-detail">
        <dl className="career-facts">
          <div>
            <dt>Vacancy</dt>
            <dd>
              {role.availability}
              {availabilityNeedsReview(role, today) ? " · Recheck needed" : ""}
            </dd>
          </div>
          <div>
            <dt>Eligibility</dt>
            <dd>
              {role.eligibility === "clarify"
                ? "Needs clarification"
                : role.eligibility}
            </dd>
          </div>
          <div>
            <dt>Actual stage</dt>
            <dd>{CAREER_STAGE_LABELS[opportunity.stage]}</dd>
          </div>
        </dl>
        <p className="career-help">
          {role.location} ·{" "}
          {role.kind === "contract" ? "Contract" : "Employment"} · Source
          checked {role.checkedOn}
        </p>
        <div className="career-actions">
          <a
            className="career-button career-button-primary"
            href={role.roleUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open role <ExternalLink size={15} aria-hidden />
          </a>
          <button
            className="career-button career-button-quiet"
            disabled={!enabled}
            aria-expanded={checking}
            onClick={() => setChecking((previous) => !previous)}
          >
            {checking ? "Close research check" : "Record research check"}
          </button>
          {["research", "clarify"].includes(opportunity.stage) && (
            <button
              className="career-button"
              disabled={
                !enabled ||
                !canPrepareApplication(
                  role,
                  { ...opportunity, stage: "ready" },
                  today,
                )
              }
              onClick={() => {
                try {
                  onSave({
                    ...opportunity,
                    stage: "ready",
                    updatedAt: Date.now(),
                  });
                  setMessage("Ready to apply. Nothing sent.");
                  setError("");
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Check the current opening before marking it ready.",
                  );
                }
              }}
            >
              Mark ready to apply
            </button>
          )}
        </div>
        {checking && (
          <ResearchCheckForm
            role={role}
            today={today}
            enabled={enabled}
            onCancel={() => setChecking(false)}
            onSave={(check) => {
              onResearchCheck(check);
              setChecking(false);
              setMessage("Research check saved");
              setError("");
            }}
          />
        )}
        <section className="career-detail-section">
          <h3>Source and fit</h3>
          <a href={role.roleUrl} target="_blank" rel="noopener noreferrer">
            Original role posting
          </a>
          <p className="career-help">{role.eligibilityEvidence}</p>
          {role.fit.length > 0 && (
            <ul>
              {role.fit.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
          {(role.gaps.length > 0 || role.questions.length > 0) && (
            <>
              <h3>Clarify before investing more time</h3>
              <ul>
                {[...role.gaps, ...role.questions].map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </>
          )}
          <p className="career-help">
            Compensation: {role.compensation || "Not confirmed"}
          </p>
          {role.contacts.length > 0 && (
            <div className="career-actions">
              {role.contacts.map((contact, i) => (
                <a
                  key={i}
                  href={contact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {contact.name}
                </a>
              ))}
            </div>
          )}
        </section>
        <form
          className="career-detail-section"
          onSubmit={(event) => {
            event.preventDefault();
            const f = new FormData(event.currentTarget);
            const value = (key: string) => String(f.get(key) ?? "").trim();
            try {
              onSave({
                ...opportunity,
                draft,
                followUpOn: followUp || null,
                notes: value("notes"),
                nextAction: value("nextAction"),
                priority: Number(value("priority")),
                scope: value("scope"),
                terms: value("terms"),
                weeklyHours: value("weeklyHours"),
                startOn: value("startOn") || null,
                firstPaymentOn: value("firstPaymentOn") || null,
                updatedAt: Date.now(),
              });
              setMessage("Opportunity saved");
              setError("");
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Check the opportunity details.",
              );
            }
          }}
        >
          <fieldset className="career-stack" disabled={!enabled}>
            <label className="career-label">
              Application draft
              <textarea
                className="career-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={20000}
                rows={6}
              />
            </label>
            <div className="career-actions">
              <button
                className="career-button"
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(draft);
                    setMessage("Draft copied. Nothing sent.");
                  } catch {
                    setMessage(
                      "Copy is unavailable. Select the draft text to copy it.",
                    );
                  }
                }}
              >
                <Copy size={15} aria-hidden />
                Copy draft
              </button>
              <p className="career-help">
                Editing or copying never counts as an application.
              </p>
            </div>
            <label className="career-label">
              Next action
              <input
                className="career-input"
                name="nextAction"
                defaultValue={opportunity.nextAction}
                maxLength={2000}
              />
            </label>
            <div className="career-form-grid">
              <label className="career-label">
                Follow up on
                <input
                  className="career-input"
                  type="date"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                />
              </label>
              <label className="career-label">
                Queue priority
                <input
                  className="career-input"
                  type="number"
                  name="priority"
                  defaultValue={opportunity.priority}
                  min={0}
                  max={10000}
                  required
                />
              </label>
            </div>
            <button
              className="career-button"
              type="button"
              disabled={["closed", "won"].includes(opportunity.stage)}
              onClick={() => {
                if (!followUp) {
                  setError("Choose a follow-up date first.");
                  return;
                }
                try {
                  onSave({
                    ...opportunity,
                    followUpOn: followUp,
                    updatedAt: Date.now(),
                  });
                  setMessage("Follow-up scheduled");
                  setError("");
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Follow-up could not be saved.",
                  );
                }
              }}
            >
              Schedule follow-up
            </button>
            <label className="career-label">
              Private opportunity notes
              <textarea
                className="career-input"
                name="notes"
                defaultValue={opportunity.notes}
                maxLength={10000}
              />
            </label>
            <details>
              <summary className="min-h-11 cursor-pointer text-sm font-semibold">
                {role.kind === "contract"
                  ? "Contract scope and payment"
                  : "Start and payment details"}
              </summary>
              <div className="career-stack pt-3">
                <label className="career-label">
                  Paid scope
                  <textarea
                    className="career-input"
                    name="scope"
                    defaultValue={opportunity.scope}
                    maxLength={5000}
                    placeholder="One agreed outcome and its acceptance check"
                  />
                </label>
                <label className="career-label">
                  Proposed or agreed terms
                  <textarea
                    className="career-input"
                    name="terms"
                    defaultValue={opportunity.terms}
                    maxLength={5000}
                    placeholder="Amount, currency, period and approval/payment terms"
                  />
                </label>
                <label className="career-label">
                  Weekly hours
                  <input
                    className="career-input"
                    name="weeklyHours"
                    defaultValue={opportunity.weeklyHours}
                    maxLength={300}
                  />
                </label>
                <div className="career-form-grid">
                  <label className="career-label">
                    Intended start
                    <input
                      className="career-input"
                      name="startOn"
                      type="date"
                      defaultValue={opportunity.startOn ?? ""}
                    />
                  </label>
                  <label className="career-label">
                    First-payment date
                    <input
                      className="career-input"
                      name="firstPaymentOn"
                      type="date"
                      defaultValue={opportunity.firstPaymentOn ?? ""}
                    />
                  </label>
                </div>
              </div>
            </details>
            <button
              className="career-button career-button-primary"
              type="submit"
            >
              Save opportunity
            </button>
          </fieldset>
        </form>
        <section className="career-detail-section">
          <h3>Actual activity</h3>
          <p className="career-help">
            Use the date and confirmation of what happened. A proposal or offer
            is separate from money received.
          </p>
          <div className="career-actions">
            <button
              className="career-button career-button-primary"
              disabled={!enabled}
              onClick={() => setActivityKind("application")}
            >
              Record application
            </button>
            <button
              className="career-button"
              disabled={!enabled}
              onClick={() => setActivityKind("conversation")}
            >
              Record conversation
            </button>
            <button
              className="career-button"
              disabled={!enabled}
              onClick={() => setActivityKind("outreach")}
            >
              Record outreach
            </button>
            <button
              className="career-button"
              disabled={!enabled}
              onClick={() =>
                setActivityKind(
                  role.kind === "contract" ? "proposal" : "interview",
                )
              }
            >
              More activity
            </button>
          </div>
          {activityKind && (
            <ActivityForm
              key={activityKind}
              kind={activityKind}
              opportunityId={role.id}
              today={today}
              enabled={enabled}
              onCancel={() => setActivityKind(null)}
              onSave={(activity) => {
                const next = recordCareerActivity(
                  { [opportunity.id]: opportunity },
                  Object.fromEntries(
                    activities.map((event) => [event.id, event]),
                  ),
                  activity,
                ).opportunities[opportunity.id];
                onActivity(activity);
                setFollowUp(next.followUpOn ?? "");
                setMessage(
                  activity.kind === "application"
                    ? "Application recorded"
                    : `${activityLabels[activity.kind]} recorded`,
                );
              }}
            />
          )}
          {activities.length > 0 ? (
            <ul className="career-activity-history">
              {activities.map((activity) => (
                <li key={activity.id}>
                  <strong>{activityLabels[activity.kind]}</strong>
                  <span className="career-help">
                    {activity.date}
                    {activity.scheduledAt
                      ? ` · ${new Date(activity.scheduledAt).toLocaleString()}`
                      : ""}
                    {activity.kind === "payment"
                      ? ` · ${activity.amount} ${activity.currency}`
                      : ""}
                  </span>
                  {activity.note && (
                    <p className="career-help">{activity.note}</p>
                  )}
                  <p className="career-help">{activity.reference}</p>
                  {["interview", "delivery"].includes(activity.kind) &&
                    activity.scheduledAt &&
                    !activity.done && (
                      <button
                        className="career-button mt-2"
                        disabled={!enabled}
                        onClick={() => {
                          try {
                            onActivity({
                              ...activity,
                              done: true,
                              updatedAt: Date.now(),
                            });
                            setMessage("Scheduled activity marked complete");
                          } catch (e) {
                            setError(
                              e instanceof Error
                                ? e.message
                                : "Activity could not be updated.",
                            );
                          }
                        }}
                      >
                        Mark activity complete
                      </button>
                    )}
                  {activity.done && (
                    <span className="career-badge mt-2">Completed</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="career-help">
              No activity recorded. This opportunity is still unsent.
            </p>
          )}
        </section>
        <div className="career-actions">
          <button
            className="career-button"
            disabled={!enabled}
            onClick={() => {
              try {
                onSave({
                  ...opportunity,
                  stage: opportunity.stage === "closed" ? "research" : "closed",
                  followUpOn: null,
                  updatedAt: Date.now(),
                });
                setFollowUp("");
                setMessage(
                  opportunity.stage === "closed"
                    ? "Opportunity reopened"
                    : "Opportunity closed; follow-up stopped",
                );
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Opportunity could not be updated.",
                );
              }
            }}
          >
            {opportunity.stage === "closed"
              ? "Reopen opportunity"
              : "Close opportunity"}
          </button>
          <button className="career-button" onClick={onClose}>
            Back to queue
          </button>
        </div>
        {message && (
          <p role="status" className="career-banner">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="career-error">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

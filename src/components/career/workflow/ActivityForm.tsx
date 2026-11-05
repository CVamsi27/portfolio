"use client";

import { useState } from "react";
import {
  CAREER_ACTIVITY_KINDS,
  type CareerActivity,
  type CareerActivityKind,
} from "@/lib/career-workflow";

export const activityLabels: Record<CareerActivityKind, string> = {
  application: "Application",
  outreach: "Outreach message",
  conversation: "Conversation",
  reply: "Reply received",
  interview: "Interview booked",
  proposal: "Proposal",
  agreement: "Work agreed",
  payment: "Payment received",
  note: "Private note",
  delivery: "Paid delivery scheduled",
  offer: "Offer received",
};

export default function ActivityForm({
  kind,
  opportunityId,
  today,
  enabled,
  onSave,
  onCancel,
}: {
  kind: CareerActivityKind;
  opportunityId: string;
  today: string;
  enabled: boolean;
  onSave: (activity: CareerActivity) => void;
  onCancel: () => void;
}) {
  const [selectedKind, setSelectedKind] = useState(kind);
  const [error, setError] = useState("");
  return (
    <form
      className="career-activity"
      aria-label="Record actual activity"
      onSubmit={(event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        const text = (name: string) => String(f.get(name) ?? "").trim();
        try {
          onSave({
            id: crypto.randomUUID(),
            opportunityId,
            kind: selectedKind,
            date: text("date"),
            reference: text("reference"),
            note: text("note"),
            updatedAt: Date.now(),
            ...(text("scheduledAt")
              ? { scheduledAt: new Date(text("scheduledAt")).toISOString() }
              : {}),
            ...(selectedKind === "payment"
              ? {
                  amount: Number(text("amount")),
                  currency: text("currency").toUpperCase(),
                }
              : {}),
          });
          onCancel();
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Check the activity details.",
          );
        }
      }}
    >
      <h3>Record what actually happened</h3>
      <p className="career-help">
        This saves a private record. It does not send a message, application or
        payment.
      </p>
      <fieldset className="career-stack" disabled={!enabled}>
        <div className="career-form-grid">
          <label className="career-label">
            Activity type
            <select
              className="career-input"
              value={selectedKind}
              onChange={(e) =>
                setSelectedKind(e.target.value as CareerActivityKind)
              }
            >
              {CAREER_ACTIVITY_KINDS.map((value) => (
                <option key={value} value={value}>
                  {activityLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="career-label">
            Activity date
            <input
              className="career-input"
              name="date"
              type="date"
              defaultValue={today}
              required
            />
          </label>
        </div>
        <label className="career-label">
          Confirmation reference
          <input
            className="career-input"
            name="reference"
            required={selectedKind !== "note"}
            maxLength={2000}
            placeholder="Receipt, message link, or a specific note of the actual conversation"
          />
        </label>
        {["interview", "delivery"].includes(selectedKind) && (
          <label className="career-label">
            Scheduled time (device timezone)
            <input
              className="career-input"
              name="scheduledAt"
              type="datetime-local"
              required
            />
          </label>
        )}
        {selectedKind === "payment" && (
          <div className="career-form-grid">
            <label className="career-label">
              Amount received
              <input
                className="career-input"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </label>
            <label className="career-label">
              Currency
              <input
                className="career-input"
                name="currency"
                pattern="[A-Za-z]{3}"
                maxLength={3}
                required
                placeholder="INR / USD / EUR"
              />
            </label>
          </div>
        )}
        <label className="career-label">
          Activity note
          <textarea
            className="career-input"
            name="note"
            maxLength={10000}
            placeholder="Actual outcome, remaining question and next step"
          />
        </label>
        {error && (
          <p role="alert" className="career-error">
            {error}
          </p>
        )}
        <div className="career-actions">
          <button className="career-button career-button-primary" type="submit">
            Save activity
          </button>
          <button className="career-button" type="button" onClick={onCancel}>
            Cancel activity
          </button>
        </div>
      </fieldset>
    </form>
  );
}

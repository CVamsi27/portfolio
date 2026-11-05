"use client";
import { useState } from "react";
import type { CareerResearchRole } from "@/lib/career-workflow";
import type { CareerResearchCheck } from "@/lib/career-research";

export default function ResearchCheckForm({
  role,
  today,
  enabled,
  onSave,
  onCancel,
}: {
  role: CareerResearchRole;
  today: string;
  enabled: boolean;
  onSave: (check: CareerResearchCheck) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <form
      className="career-activity"
      aria-label="Record research check"
      onSubmit={(event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        const value = (key: string) => String(f.get(key) ?? "");
        try {
          onSave({
            checkedOn: value("checkedOn"),
            availability: value(
              "availability",
            ) as CareerResearchCheck["availability"],
            eligibility: value(
              "eligibility",
            ) as CareerResearchCheck["eligibility"],
            eligibilityEvidence: value("evidence"),
          });
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Check the date and employer evidence.",
          );
        }
      }}
    >
      <h3>Record your employer check</h3>
      <p className="career-help">
        Use the employer&apos;s current page or reply. This changes research
        facts; your application stage, draft and follow-up stay unchanged.
      </p>
      <fieldset className="career-stack" disabled={!enabled}>
        <div className="career-form-grid">
          <label className="career-label">
            Checked on
            <input
              className="career-input"
              name="checkedOn"
              type="date"
              defaultValue={today}
              max={today}
              required
            />
          </label>
          <label className="career-label">
            Checked availability
            <select
              className="career-input"
              name="availability"
              defaultValue={role.availability}
            >
              <option value="active">Opening active</option>
              <option value="uncertain">Not confirmed</option>
              <option value="expired">Opening closed</option>
            </select>
          </label>
          <label className="career-label">
            Checked eligibility
            <select
              className="career-input"
              name="eligibility"
              defaultValue={role.eligibility}
            >
              <option value="eligible">Eligible</option>
              <option value="clarify">Needs clarification</option>
              <option value="ineligible">Not eligible</option>
            </select>
          </label>
        </div>
        <label className="career-label">
          Check evidence or remaining question
          <textarea
            className="career-input"
            name="evidence"
            defaultValue={role.eligibilityEvidence}
            maxLength={2000}
            required
            rows={3}
          />
        </label>
        {error && (
          <p role="alert" className="career-error">
            {error}
          </p>
        )}
        <div className="career-actions">
          <button className="career-button career-button-primary" type="submit">
            Save research check
          </button>
          <button className="career-button" type="button" onClick={onCancel}>
            Cancel check
          </button>
        </div>
      </fieldset>
    </form>
  );
}

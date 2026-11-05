"use client";

import { useState } from "react";
import Modal from "@/components/trackers/Modal";
import type { CareerResearchRole } from "@/lib/career-workflow";

export default function OpportunityForm({
  open,
  onClose,
  today,
  enabled,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  today: string;
  enabled: boolean;
  onSave: (role: CareerResearchRole) => void;
}) {
  const [error, setError] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add an opportunity"
      className="sm:max-w-xl"
    >
      <form
        className="career-stack"
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          const value = (key: string) => String(values.get(key) ?? "").trim();
          try {
            onSave({
              id: `manual-${crypto.randomUUID()}`,
              company: value("company"),
              title: value("title"),
              roleUrl: value("url"),
              kind: value("kind") as CareerResearchRole["kind"],
              location: value("location"),
              availability: value(
                "availability",
              ) as CareerResearchRole["availability"],
              checkedOn: value("checkedOn"),
              eligibility: value(
                "eligibility",
              ) as CareerResearchRole["eligibility"],
              eligibilityEvidence: value("eligibilityEvidence"),
              fit: [],
              gaps: [],
              questions: [],
              suggestedAction:
                "Check the role requirements and decide the next step",
              rank: 100,
              compensation: value("compensation") || "Not confirmed",
              contacts: [],
              draft: "",
              updatedAt: Date.now(),
            });
            onClose();
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Check the opportunity details.",
            );
          }
        }}
      >
        <p className="career-help">
          Record the exact opening or client brief. Unknown eligibility remains
          a question to resolve.
        </p>
        <fieldset className="career-stack" disabled={!enabled}>
          <label className="career-label">
            Company or client
            <input
              className="career-input"
              name="company"
              required
              maxLength={200}
            />
          </label>
          <label className="career-label">
            Role or paid outcome
            <input
              className="career-input"
              name="title"
              required
              maxLength={300}
            />
          </label>
          <label className="career-label">
            Exact role or brief URL
            <input
              className="career-input"
              name="url"
              type="url"
              required
              placeholder="https://…"
            />
          </label>
          <div className="career-form-grid">
            <label className="career-label">
              Engagement
              <select className="career-input" name="kind">
                <option value="employment">Employment</option>
                <option value="contract">Contract</option>
              </select>
            </label>
            <label className="career-label">
              Location
              <input
                className="career-input"
                name="location"
                required
                placeholder="Remote India / Hyderabad"
              />
            </label>
            <label className="career-label">
              Vacancy availability
              <select className="career-input" name="availability">
                <option value="uncertain">Unconfirmed</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </label>
            <label className="career-label">
              Checked on
              <input
                className="career-input"
                name="checkedOn"
                type="date"
                required
                defaultValue={today}
                max={today}
              />
            </label>
            <label className="career-label">
              Location eligibility
              <select className="career-input" name="eligibility">
                <option value="clarify">Needs clarification</option>
                <option value="eligible">Eligible</option>
                <option value="ineligible">Ineligible</option>
              </select>
            </label>
            <label className="career-label">
              Compensation terms
              <input
                className="career-input"
                name="compensation"
                maxLength={1000}
                placeholder="Currency, period, or not confirmed"
              />
            </label>
          </div>
          <label className="career-label">
            Eligibility evidence or question
            <textarea
              className="career-input"
              name="eligibilityEvidence"
              required
              maxLength={2000}
              placeholder="What does the employer explicitly permit, or what needs checking?"
            />
          </label>
          {error && (
            <p role="alert" className="career-error">
              {error}
            </p>
          )}
          <button className="career-button career-button-primary" type="submit">
            Save opportunity
          </button>
        </fieldset>
      </form>
    </Modal>
  );
}

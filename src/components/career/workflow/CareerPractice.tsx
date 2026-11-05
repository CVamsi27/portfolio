"use client";

import { useState } from "react";
import Link from "next/link";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import {
  EMPTY_CAREER_EXECUTION_STATE,
  type CareerExecutionState,
} from "@/lib/career-roadmap";
import type { CareerResearchRole } from "@/lib/career-workflow";

type PracticeRecord = {
  opportunityId: string;
  original: string;
  assistance: string;
  correction: string;
  changedCase: string;
};
function readPractice(value: string): PracticeRecord | null {
  try {
    const result = JSON.parse(value);
    return result &&
      typeof result.original === "string" &&
      typeof result.correction === "string" &&
      typeof result.changedCase === "string" &&
      typeof result.assistance === "string"
      ? result
      : null;
  } catch {
    return null;
  }
}

export default function CareerPractice({
  roles,
  enabled,
}: {
  roles: CareerResearchRole[];
  enabled: boolean;
}) {
  const execution = useSyncedStorage<CareerExecutionState>(
    "career_execution_state",
    EMPTY_CAREER_EXECUTION_STATE,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [target, setTarget] = useState("");
  const selected = roles.find((role) => role.id === target);
  const practices = Object.entries(execution.value.evidenceByItemId ?? {})
    .filter(([id]) => id.startsWith("career:practice:"))
    .sort(([, a], [, b]) => b.completedAt.localeCompare(a.completedAt));
  return (
    <div className="career-stack">
      <div className="career-heading">
        <div>
          <h2>Practice from a real gap</h2>
          <p className="career-help">
            One original attempt, one repair and a changed case. Keep assisted
            work visible. Interviews and paid work replace this block.
          </p>
        </div>
        <Link
          className="career-button"
          href="/roadmap?view=execution&panel=exams"
        >
          Existing assessments
        </Link>
      </div>
      <form
        className="career-empty"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const text = (name: string) => String(data.get(name) ?? "").trim();
          const record: PracticeRecord = {
            opportunityId: target,
            original: text("original"),
            assistance: text("assistance"),
            correction: text("correction"),
            changedCase: text("changedCase"),
          };
          const value = JSON.stringify(record);
          if (value.length > 2000) {
            setError("Keep this evidence record under 2,000 characters.");
            return;
          }
          const id = `career:practice:${crypto.randomUUID()}`;
          execution.setValue((previous) => ({
            ...previous,
            evidenceByItemId: {
              ...previous.evidenceByItemId,
              [id]: {
                evidence: {
                  value,
                  ...(selected ? { sourceUrl: selected.roleUrl } : {}),
                },
                completedAt: new Date().toISOString(),
              },
            },
          }));
          setMessage("Practice saved");
          setError("");
          form.reset();
          setTarget("");
        }}
      >
        <fieldset className="career-stack" disabled={!enabled}>
          <label className="career-label">
            Target opportunity
            <select
              className="career-input"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">An observed interview gap</option>
              {roles.map((role) => (
                <option value={role.id} key={role.id}>
                  {role.company} · {role.title}
                </option>
              ))}
            </select>
          </label>
          {selected && selected.gaps.length > 0 && (
            <p className="career-banner">
              Known gaps: {selected.gaps.join(" · ")}
            </p>
          )}
          <label className="career-label">
            Original attempt
            <textarea
              className="career-input"
              name="original"
              required
              minLength={10}
              maxLength={600}
              placeholder="What did you attempt before looking up the solution?"
            />
          </label>
          <label className="career-label">
            Assistance used
            <select className="career-input" name="assistance">
              <option value="unaided">Unaided</option>
              <option value="official-docs">Official documentation</option>
              <option value="assisted">AI or another person</option>
            </select>
          </label>
          <label className="career-label">
            Correction
            <textarea
              className="career-input"
              name="correction"
              required
              minLength={10}
              maxLength={500}
              placeholder="What failed, and what changed?"
            />
          </label>
          <label className="career-label">
            Changed-case result
            <textarea
              className="career-input"
              name="changedCase"
              required
              minLength={10}
              maxLength={600}
              placeholder="Change one input or assumption and record the actual result."
            />
          </label>
          {error && (
            <p role="alert" className="career-error">
              {error}
            </p>
          )}
          <button className="career-button career-button-primary" type="submit">
            Save practice
          </button>
        </fieldset>
        {message && (
          <p role="status" className="career-banner">
            {message}
          </p>
        )}
      </form>
      <section className="career-stack">
        <h3>Saved attempts</h3>
        {practices.length ? (
          practices.map(([id, entry]) => {
            const record = readPractice(entry.evidence.value);
            return (
              <article className="career-empty" key={id}>
                <p className="career-help">
                  {entry.completedAt.slice(0, 10)} ·{" "}
                  {record?.assistance ?? "See original evidence"} · Evidence
                  saved, unverified
                </p>
                {record ? (
                  <>
                    <h3>
                      {roles.find((role) => role.id === record.opportunityId)
                        ?.company ?? "Interview gap"}
                    </h3>
                    <p className="career-help">Original: {record.original}</p>
                    <p className="career-help">
                      Correction: {record.correction}
                    </p>
                    <p className="career-help">
                      Changed case: {record.changedCase}
                    </p>
                  </>
                ) : (
                  <p className="career-help">{entry.evidence.value}</p>
                )}
              </article>
            );
          })
        ) : (
          <p className="career-help">
            No attempts recorded here yet. Your earlier assessment evidence
            remains in Resources.
          </p>
        )}
      </section>
    </div>
  );
}

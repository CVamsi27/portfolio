"use client";
import { useState } from "react";
import type {
  CareerChecklistItem,
  CareerEvidence,
  CareerExecutionState,
} from "@/lib/career-roadmap";
export default function EvidenceItem({
  item,
  state,
  onEvidence,
}: {
  item: CareerChecklistItem;
  state: CareerExecutionState;
  onEvidence: (
    item: CareerChecklistItem,
    evidence: CareerEvidence,
    verify: boolean,
  ) => void;
}) {
  const entry = state.evidenceByItemId[item.id];
  const [editing, setEditing] = useState(false),
    [value, setValue] = useState(entry?.evidence.value ?? ""),
    [error, setError] = useState("");
  return (
    <li
      className="min-w-0 rounded-xl border border-border p-4 space-y-2"
      data-testid={item.id}
    >
      <p className="font-medium text-sm leading-relaxed break-words">
        {item.text}
      </p>
      <p className="text-xs text-muted-foreground" role="status">
        {entry?.verifiedAt
          ? "Verified evidence"
          : entry
            ? "Evidence saved · needs verification"
            : "Planned · evidence missing"}
      </p>
      <button
        type="button"
        className="inline-action min-h-11"
        onClick={() => {
          setValue(entry?.evidence.value ?? "");
          setEditing(!editing);
          setError("");
        }}
      >
        {editing
          ? "Close evidence"
          : entry
            ? "Review evidence"
            : "Add evidence"}
      </button>
      {editing && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {item.acceptanceCriteria}
          </p>
          <label className="block text-sm">
            Result and checks
            <textarea
              maxLength={2000}
              className="mt-1 w-full min-h-28 rounded-lg border border-border bg-background p-3"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-action min-h-11"
              onClick={() => {
                try {
                  onEvidence(item, { value }, false);
                  setError("");
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Evidence could not be saved",
                  );
                }
              }}
            >
              Save evidence
            </button>
            {entry && (
              <button
                type="button"
                className="inline-action min-h-11"
                disabled={value !== entry.evidence.value}
                onClick={() => {
                  try {
                    onEvidence(item, entry.evidence, true);
                    setError("");
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Evidence could not be verified",
                    );
                  }
                }}
              >
                Verify saved evidence
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

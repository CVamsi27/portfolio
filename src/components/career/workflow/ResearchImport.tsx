"use client";

import { useState } from "react";
import Modal from "@/components/trackers/Modal";
import {
  parseResearchSnapshot,
  previewResearchImport,
  type CareerResearchRole,
  type CareerResearchSnapshotV1,
} from "@/lib/career-workflow";

export default function ResearchImport({
  open,
  onClose,
  research,
  enabled,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  research: Record<string, CareerResearchRole>;
  enabled: boolean;
  onImport: (snapshot: CareerResearchSnapshotV1, selectedIds: string[]) => void;
}) {
  const [snapshot, setSnapshot] = useState<CareerResearchSnapshotV1 | null>(
    null,
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const rows = snapshot ? previewResearchImport(snapshot, research) : [];
  const labels = {
    added: "Added",
    changed: "Changed",
    duplicate: "Duplicate",
    older: "Older check",
    conflict: "Different vacancy",
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review research import"
      className="sm:max-w-2xl"
    >
      <div className="career-stack">
        <p className="career-help">
          Choose a reviewed career-ops snapshot. Only selected research facts
          change. Your drafts, actual stages, activities and payments stay
          yours.
        </p>
        <label className="career-label">
          Research snapshot file
          <input
            className="career-input"
            type="file"
            accept=".json,application/json"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              setSnapshot(null);
              setSelected([]);
              setError("");
              if (!file) return;
              try {
                if (file.size > 2_000_000)
                  throw new Error("Choose a snapshot smaller than 2 MB.");
                const next = parseResearchSnapshot(
                  JSON.parse(await file.text()),
                );
                setSnapshot(next);
                setSelected(
                  previewResearchImport(next, research)
                    .filter((row) => ["added", "changed"].includes(row.change))
                    .map((row) => row.role.id),
                );
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "That file could not be read. Nothing imported.",
                );
              }
            }}
          />
        </label>
        {snapshot && (
          <>
            <p className="career-help">
              Exported {new Date(snapshot.exportedAt).toLocaleString()} ·{" "}
              {rows.length} opportunities
            </p>
            <ul className="career-import-list">
              {rows.map(({ role, change }) => (
                <li key={role.id}>
                  <label className="career-import-choice">
                    <input
                      type="checkbox"
                      checked={selected.includes(role.id)}
                      disabled={
                        !enabled || !["added", "changed"].includes(change)
                      }
                      onChange={(e) =>
                        setSelected((previous) =>
                          e.target.checked
                            ? [...previous, role.id]
                            : previous.filter((id) => id !== role.id),
                        )
                      }
                    />
                    <span>
                      <strong>{role.company}</strong>
                      <span className="career-help">{role.title}</span>
                    </span>
                    <span className="career-badge">{labels[change]}</span>
                  </label>
                </li>
              ))}
            </ul>
            {!rows.some((row) => ["added", "changed"].includes(row.change)) && (
              <p role="status" className="career-help">
                No newer facts to import. Existing records will stay unchanged.
              </p>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="career-error">
            {error}
          </p>
        )}
        <div className="career-actions">
          <button
            className="career-button career-button-primary"
            disabled={!enabled || !snapshot || !selected.length}
            onClick={() => {
              if (!snapshot) return;
              try {
                onImport(snapshot, selected);
                onClose();
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Import failed. Your existing records remain available.",
                );
              }
            }}
          >
            Apply selected changes
          </button>
          <button className="career-button" onClick={onClose}>
            Cancel import
          </button>
        </div>
      </div>
    </Modal>
  );
}

"use client";
import { useState } from "react";
import type { GermanyCompanyRecord } from "@/lib/germany-execution";
const field =
  "block mt-1 w-full min-h-11 rounded-lg border border-border bg-background p-2";
export default function GermanyCompanyForm({
  record,
  onSave,
}: {
  record?: GermanyCompanyRecord;
  onSave: (record: GermanyCompanyRecord) => void;
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-sm">
        Actual stage: {record?.stage ?? "not recorded"} · Eligibility:{" "}
        {record?.eligibility ?? "unknown"}
        {record ? " · Checked " + record.checkedOn : ""}
      </p>
      {record && <p className="text-sm">{record.note}</p>}
      <button className="inline-action min-h-11" onClick={() => setOpen(!open)}>
        {record ? "Update actual stage" : "Record eligibility and stage"}
      </button>
      {open && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const f = new FormData(event.currentTarget);
            const value = (key: string) => String(f.get(key) ?? "");
            try {
              onSave({
                stage: value("stage") as GermanyCompanyRecord["stage"],
                eligibility: value(
                  "eligibility",
                ) as GermanyCompanyRecord["eligibility"],
                checkedOn: value("date"),
                roleUrl: value("url"),
                confirmation: value("confirmation"),
                note: value("note"),
              });
              setError("");
              setOpen(false);
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Check the stage record.",
              );
            }
          }}
        >
          <label className="block text-sm">
            Actual application stage
            <select
              name="stage"
              className={field}
              defaultValue={record?.stage ?? "research"}
            >
              {[
                "research",
                "prepared",
                "submitted",
                "screen",
                "technical",
                "offer",
                "rejected",
                "closed",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Eligibility check
            <select
              name="eligibility"
              defaultValue={record?.eligibility ?? "unknown"}
              className={field}
            >
              {["unknown", "eligible", "ineligible"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Checked on
            <input
              name="date"
              type="date"
              required
              defaultValue={record?.checkedOn}
              className={field}
            />
          </label>
          <label className="block text-sm">
            Exact role/source URL
            <input
              name="url"
              type="url"
              required
              defaultValue={record?.roleUrl}
              className={field}
            />
          </label>
          <label className="block text-sm">
            Receipt/message reference for actual stages
            <input
              name="confirmation"
              maxLength={500}
              defaultValue={record?.confirmation}
              className={field}
            />
          </label>
          <label className="block text-sm">
            Fit, uncertainty and next action
            <textarea
              name="note"
              required
              minLength={40}
              maxLength={2000}
              defaultValue={record?.note}
              className={field}
            />
          </label>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <button className="inline-action min-h-11" type="submit">
            Save actual stage
          </button>
        </form>
      )}
    </div>
  );
}

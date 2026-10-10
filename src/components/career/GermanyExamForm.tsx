"use client";
import { useState } from "react";
import type { GermanyRound, GermanyExamAttempt } from "@/lib/germany-execution";
const field =
  "mt-1 w-full min-h-11 rounded-lg border border-border bg-background p-2";
export default function GermanyExamForm({
  round,
  version,
  onSave,
}: {
  round: GermanyRound;
  version: string;
  onSave: (attempt: GermanyExamAttempt) => void;
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  return (
    <div className="space-y-3">
      <button
        className="inline-action min-h-11"
        onClick={() => {
          setOpen(!open);
          setMessage("");
        }}
      >
        Record an attempt
      </button>
      {message && <p role="status">{message}</p>}
      {open && (
        <form
          className="space-y-4 rounded-lg border border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const val = (key: string) => String(f.get(key) ?? "");
            try {
              const attempt: GermanyExamAttempt = {
                id: crypto.randomUUID(),
                roundId: round.id,
                track:
                  round.id === "R2"
                    ? (val("track") as GermanyExamAttempt["track"])
                    : "general",
                prompt: val("prompt"),
                promptVersion: version,
                startedAt: new Date(val("start") + ":00+05:30").toISOString(),
                finishedAt: new Date(val("end") + ":00+05:30").toISOString(),
                focusedMinutes: Number(val("minutes")),
                tools: val("tools") as GermanyExamAttempt["tools"],
                reviewerType: val(
                  "reviewerType",
                ) as GermanyExamAttempt["reviewerType"],
                reviewer:
                  val("reviewerType") === "self" ? "Self" : val("reviewer"),
                scores: round.dimensions.map((_, i) =>
                  val("score" + i) === "" ? null : Number(val("score" + i)),
                ),
                reasons: round.dimensions.map((_, i) => val("reason" + i)),
                criticalFailures: val("critical"),
                evidence: val("evidence"),
                repair: val("repair"),
                retakeDate: val("retake"),
              };
              onSave(attempt);
              setOpen(false);
              setError("");
              setMessage(
                "Attempt saved. Earlier attempts remain in the history.",
              );
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Check the attempt fields and save again.",
              );
            }
          }}
        >
          <p className="text-xs text-muted-foreground">
            Record the actual timed result. Blank scores remain unscored.
            Assistance is disclosed and does not establish unaided readiness.
          </p>
          <label className="block text-sm">
            Prompt/form and changed constraint
            <input
              name="prompt"
              required
              minLength={8}
              maxLength={300}
              className={field}
            />
          </label>
          {round.id === "R2" && (
            <label className="block text-sm">
              Practical track
              <select name="track" className={field}>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
              </select>
            </label>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Start time (IST)
              <input
                name="start"
                type="datetime-local"
                required
                className={field}
              />
            </label>
            <label className="block text-sm">
              End time (IST)
              <input
                name="end"
                type="datetime-local"
                required
                className={field}
              />
            </label>
          </div>
          <label className="block text-sm">
            Focused minutes
            <input
              name="minutes"
              type="number"
              min={1}
              required
              className={field}
            />
          </label>
          <label className="block text-sm">
            Tool policy
            <select name="tools" className={field}>
              <option value="unaided-runtime">
                Unaided · editor, runtime and tests only
              </option>
              <option value="official-docs">
                Official documentation · practical/take-home only
              </option>
              <option value="assisted">AI, hints or answer notes used</option>
            </select>
          </label>
          <label className="block text-sm">
            Assessment reviewer
            <select name="reviewerType" className={field}>
              <option value="self">Self-assessed</option>
              <option value="human">Independent human review</option>
            </select>
          </label>
          <label className="block text-sm">
            Human reviewer and feedback reference
            <input name="reviewer" maxLength={300} className={field} />
          </label>
          <p className="text-sm">
            Scores: 0 no usable result · 1 major gaps · 2 basic case with
            gaps/hints · 3 correct boundaries in time · 4 handles a changed
            constraint independently.
          </p>
          {round.dimensions.map((name, i) => (
            <div
              className="rounded-lg border border-border p-3 space-y-2"
              key={name}
            >
              <label className="block text-sm">
                {name} score
                <select name={"score" + i} className={field} defaultValue="">
                  <option value="">Unscored</option>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                {name} observation
                <textarea
                  name={"reason" + i}
                  maxLength={500}
                  className={field}
                />
              </label>
            </div>
          ))}
          <label className="block text-sm">
            Critical failures, if any
            <textarea name="critical" maxLength={1000} className={field} />
          </label>
          <label className="block text-sm">
            Saved artifact and checks
            <textarea
              name="evidence"
              required
              minLength={40}
              maxLength={2000}
              className={field}
            />
          </label>
          <label className="block text-sm">
            Next repair
            <textarea
              name="repair"
              required
              minLength={10}
              maxLength={1000}
              className={field}
            />
          </label>
          <label className="block text-sm">
            Next practice/retake date
            <input name="retake" type="date" required className={field} />
          </label>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <button type="submit" className="inline-action min-h-11">
            Save attempt
          </button>
        </form>
      )}
    </div>
  );
}

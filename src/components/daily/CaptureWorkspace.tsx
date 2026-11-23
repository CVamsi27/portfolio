"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTodos, useJournal, useGoalState } from "@/lib/tracker-store";
import { useUserPrefs, metricFor } from "@/lib/user-prefs";
import { calendarZone, validDay } from "@/lib/day-plan";
import { zonedDate } from "@/lib/routine-reminders";

const types = [
  ["task", "Task"],
  ["note", "Note"],
  ["metric", "Goal Metric"],
] as const;

export function safeReturn(value: string | null | undefined) {
  return value &&
    /^\/(hub|trackers|plan|todo|health|dashboard|review|goal|roadmap|archive)([/?#]|$)/.test(
      value,
    )
    ? value
    : "/hub";
}

export default function CaptureWorkspace({
  initialType = "",
  initialDate,
  fixedDate = false,
  returnTo = "/hub",
  onDirty,
}: {
  initialType?: string;
  initialDate?: string;
  fixedDate?: boolean;
  returnTo?: string;
  onDirty?: (dirty: boolean) => void;
}) {
  const { prefs } = useUserPrefs();
  const [type, setType] = useState(
    types.some(([id]) => id === initialType) ? initialType : "task",
  );
  const [date, setDate] = useState(
    validDay(initialDate)
      ? initialDate
      : zonedDate(Date.now(), calendarZone(prefs.timeZone)),
  );
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [priority, setPriority] = useState<"P1" | "P2" | "P3">("P2");
  const [tag, setTag] = useState<"Work" | "Deep Work" | "Goal" | "Personal">(
    "Work",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const tasks = useTodos();
  const journal = useJournal();
  const goal = useGoalState();
  const metric = metricFor(prefs);
  const back = safeReturn(returnTo);

  const dirty = (v: string) => {
    setText(v);
    onDirty?.(Boolean(v.trim() || amount));
  };

  const save = () => {
    setError("");
    if (!validDay(date)) {
      setError("Choose a valid date.");
      return;
    }
    try {
      if (type === "task") {
        if (!text.trim()) throw Error("Enter a task name.");
        tasks.setValue((previous) => [
          ...previous,
          {
            id: crypto.randomUUID(),
            text: text.trim(),
            date,
            priority,
            tag,
            done: false,
            createdAt: Date.now(),
          },
        ]);
        setMessage("Saved on this device.");
      } else if (type === "note") {
        if (!text.trim()) throw Error("Enter a note.");
        journal.setValue((previous) => ({
          ...previous,
          [date]: {
            win: previous[date]?.win ?? "",
            learned: previous[date]?.learned
              ? `${previous[date].learned}\n${text.trim()}`
              : text.trim(),
            focus: previous[date]?.focus ?? "",
            updatedAt: Date.now(),
          },
        }));
        setMessage("Saved on this device.");
      } else if (type === "metric") {
        const n = Number(amount);
        if (!Number.isFinite(n) || n < 0)
          throw Error(`Enter a valid number for ${metric.label}.`);
        goal.setValue((previous) => ({
          ...previous,
          metricByDay: { ...(previous?.metricByDay ?? {}), [date]: n },
        }));
        setMessage("Saved on this device.");
      }
      setText("");
      setAmount("");
      onDirty?.(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
    }
  };

  return (
    <div className="space-y-5" data-testid="capture-workspace">
      <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Capture type">
            {types.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={type === id}
                onClick={() => {
                  setType(id);
                  setError("");
                  setMessage("");
                }}
                className={`min-h-10 rounded-xl px-4 text-sm font-medium transition-colors ${
                  type === id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/70 bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Link
            href={`/log?view=journal&date=${date}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            Open Daily Reflection →
          </Link>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {!fixedDate && (
            <label className="field-label max-w-xs">
              Record date
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          )}

          {type === "task" && (
            <>
              <label className="field-label">
                Task name
                <Input
                  value={text}
                  onChange={(e) => dirty(e.target.value)}
                  placeholder="e.g. Follow up with Acme engineering manager"
                  maxLength={300}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <label className="field-label">
                  Priority
                  <select
                    className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as "P1" | "P2" | "P3")
                    }
                  >
                    <option value="P1">P1 · Urgent</option>
                    <option value="P2">P2 · Normal</option>
                    <option value="P3">P3 · Low</option>
                  </select>
                </label>
                <label className="field-label">
                  Category
                  <select
                    className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={tag}
                    onChange={(e) =>
                      setTag(
                        e.target.value as "Work" | "Deep Work" | "Goal" | "Personal",
                      )
                    }
                  >
                    <option value="Work">Career / Work</option>
                    <option value="Deep Work">Study / Deep Work</option>
                    <option value="Goal">Goal / Proof</option>
                    <option value="Personal">Personal</option>
                  </select>
                </label>
              </div>
            </>
          )}

          {type === "note" && (
            <label className="field-label">
              Note
              <Textarea
                rows={4}
                value={text}
                onChange={(e) => dirty(e.target.value)}
                placeholder="Capture an interview takeaway, architecture note, or follow-up detail…"
                maxLength={2000}
              />
            </label>
          )}

          {type === "metric" && (
            <label className="field-label max-w-xs">
              {metric.label} (target {metric.target})
              <Input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  onDirty?.(Boolean(e.target.value));
                }}
              />
            </label>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
              {message}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">
              {type === "task"
                ? "Save task"
                : type === "note"
                  ? "Save note"
                  : "Save metric"}
            </Button>
            <Link
              href={back}
              className="inline-flex min-h-10 items-center rounded-xl border border-border/70 px-4 text-sm font-medium text-foreground hover:bg-muted/50"
            >
              {back === "/hub" ? "Return to Today" : "Return to previous page"}
            </Link>
          </div>
        </form>
      </section>

      <p className="text-xs text-muted-foreground">
        Health metrics (steps, sleep, workouts, weight, hydration, heart rate)
        sync automatically from{" "}
        <Link href="/health" className="text-primary underline">
          Google Health Connect
        </Link>{" "}
        — manual food, water, and exercise logging has been removed.
      </p>
    </div>
  );
}

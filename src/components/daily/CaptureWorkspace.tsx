"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTodos, useJournal, useGoalState } from "@/lib/tracker-store";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useUserPrefs, metricFor } from "@/lib/user-prefs";
import {
  DEFAULT_WEIGHT_LOSS_STATE,
  inputToKg,
  type WeightLossState,
} from "@/lib/health";
import { calendarZone, validDay } from "@/lib/day-plan";
import { zonedDate } from "@/lib/routine-reminders";
import type { RecoveryEntry } from "@/components/personal/RecoveryTracker";
import FoodQuickCapture from "./FoodQuickCapture";
const types = [
  ["food", "Food"],
  ["water", "Water"],
  ["weight", "Weight"],
  ["exercise", "Exercise"],
  ["sleep", "Sleep & recovery"],
  ["task", "Task"],
  ["metric", "Goal metric"],
  ["note", "Note"],
] as const;
export function safeReturn(value: string | null | undefined) {
  return value &&
    /^\/(hub|trackers|plan|todo|health|food|weight-loss|workout-tracking|intermittent-fasting|dashboard|review|goal|roadmap|archive)([/?#]|$)/.test(
      value,
    )
    ? value
    : "/hub";
}
export default function CaptureWorkspace({
  initialType = "",
  initialDate,
  returnTo = "/hub",
  onDirty,
}: {
  initialType?: string;
  initialDate?: string;
  returnTo?: string;
  onDirty?: (dirty: boolean) => void;
}) {
  const { prefs } = useUserPrefs();
  const [type, setType] = useState(
    types.some(([id]) => id === initialType) ? initialType : "",
  );
  const [date, setDate] = useState(
    validDay(initialDate)
      ? initialDate
      : zonedDate(Date.now(), calendarZone(prefs.timeZone)),
  );
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [energy, setEnergy] = useState("");
  const [mood, setMood] = useState("");
  const [foodDirty, setFoodDirty] = useState(false);
  const [undoWater, setUndoWater] = useState(false);
  const tasks = useTodos(),
    journal = useJournal(),
    goal = useGoalState(),
    water = useSyncedStorage<Record<string, number>>("fasting:water", {}),
    weight = useSyncedStorage<WeightLossState>(
      "weight-loss",
      DEFAULT_WEIGHT_LOSS_STATE,
    ),
    recovery = useSyncedStorage<Record<string, RecoveryEntry>>(
      "recovery:entries",
      {},
      { accountScoped: true, records: true },
    );
  const metric = metricFor(prefs);
  const back = safeReturn(returnTo);
  const name =
    back.startsWith("/hub") || back.startsWith("/trackers")
      ? "Today"
      : "previous page";
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
    const n = Number(amount);
    try {
      if (type === "task") {
        if (!text.trim()) throw Error("Enter a task name.");
        tasks.setValue((previous) => [
          ...previous,
          {
            id: crypto.randomUUID(),
            text: text.trim(),
            date,
            priority: "P2",
            tag: "Personal",
            done: false,
            createdAt: Date.now(),
          },
        ]);
      } else if (type === "note") {
        if (!text.trim()) throw Error("Enter a note.");
        journal.setValue((previous) => ({
          ...previous,
          [date]: {
            win: previous[date]?.win ?? "",
            learned: previous[date]?.learned ?? "",
            focus: previous[date]?.focus
              ? [previous[date].focus, text.trim()].join("\n")
              : text.trim(),
            updatedAt: Date.now(),
          },
        }));
      } else if (type === "weight") {
        const kg = inputToKg(n, prefs.weightUnit);
        if (!amount.trim() || !Number.isFinite(kg) || kg < 20 || kg > 300)
          throw Error(`Enter a valid weight in ${prefs.weightUnit}.`);
        weight.setValue((previous) => ({
          ...previous,
          entries: {
            ...previous.entries,
            [date]: {
              ...previous.entries[date],
              weightKg: kg,
              updatedAt: Math.max(
                Date.now(),
                (previous.entries[date]?.updatedAt ?? 0) + 1,
              ),
            },
          },
        }));
      } else if (type === "metric") {
        if (!amount.trim() || !Number.isFinite(n) || n < 0)
          throw Error("Enter a non-negative amount.");
        goal.setValue((previous) => ({
          ...previous,
          metricByDay: {
            ...previous.metricByDay,
            [date]: (previous.metricByDay?.[date] ?? 0) + n,
          },
        }));
      } else if (type === "sleep") {
        if (!amount.trim() || !Number.isFinite(n) || n < 0 || n > 24)
          throw Error("Enter sleep between 0 and 24 hours.");
        recovery.setValue((previous) => ({
          ...previous,
          [date]: {
            id: date,
            date,
            energy: null,
            mood: "",
            ...(previous[date]?.deleted ? {} : previous[date]),
            sleepHours: n,
            ...(energy ? { energy: Number(energy) } : {}),
            ...(mood ? { mood } : {}),
            note: text.trim() || previous[date]?.note || "",
            deleted: false,
            updatedAt: Math.max(
              Date.now(),
              (previous[date]?.updatedAt ?? 0) + 1,
            ),
          },
        }));
      }
      setText("");
      setAmount("");
      setEnergy("");
      setMood("");
      onDirty?.(false);
      setMessage("Saved on this device.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to save. Your draft is retained.",
      );
    }
  };
  return (
    <div className="capture-workspace" data-testid="capture-workspace">
      {!type ? (
        <>
          <h2>What would you like to add?</h2>
          <div className="capture-type-grid">
            {types.map(([id, label]) => (
              <Button
                key={id}
                variant="outline"
                onClick={() => {
                  setType(id);
                  setMessage("");
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="workspace-heading">
            <h2>{types.find(([id]) => id === type)?.[1]}</h2>
            <Button
              variant="ghost"
              onClick={() => {
                if (
                  (text || amount || energy || mood || foodDirty) &&
                  !window.confirm("Discard the unsaved entry?")
                )
                  return;
                setType("");
                setText("");
                setAmount("");
                setEnergy("");
                setMood("");
                setFoodDirty(false);
                onDirty?.(false);
              }}
            >
              Change type
            </Button>
          </div>
          <label className="field-label">
            Date
            <Input
              aria-label="Record date"
              type="date"
              value={date}
              onChange={(e) => {
                if (validDay(e.target.value)) {
                  setDate(e.target.value);
                  setUndoWater(false);
                  setMessage("");
                }
              }}
            />
          </label>
          {type === "food" ? (
            <FoodQuickCapture
              date={date}
              onDirty={(value) => {
                setFoodDirty(value);
                onDirty?.(value);
              }}
            />
          ) : type === "exercise" ? (
            <>
              <p>Record sets and exercises in the workout workspace.</p>
              <Button asChild>
                <Link
                  href={`/workout-tracking?date=${date}&returnTo=${encodeURIComponent(back)}`}
                >
                  Open workout session
                </Link>
              </Button>
            </>
          ) : type === "water" ? (
            <>
              <p>
                {water.value[date] ?? 0} glasses recorded for {date}.
              </p>
              <Button
                onClick={() => {
                  water.setValue((p) => ({ ...p, [date]: (p[date] ?? 0) + 1 }));
                  setUndoWater(true);
                  setMessage("Added one glass.");
                }}
              >
                Add one glass
              </Button>
              {undoWater && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    water.setValue((p) => ({
                      ...p,
                      [date]: Math.max(0, (p[date] ?? 0) - 1),
                    }));
                    setUndoWater(false);
                    setMessage("Water entry undone.");
                  }}
                >
                  Undo water
                </Button>
              )}
            </>
          ) : (
            <form
              noValidate
              className="capture-form"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              {(type === "task" || type === "note" || type === "sleep") && (
                <label className="field-label">
                  {type === "task"
                    ? "Task name"
                    : type === "sleep"
                      ? "Optional note"
                      : "Note"}
                  <Input
                    aria-label={
                      type === "task"
                        ? "Task name"
                        : type === "sleep"
                          ? "Optional note"
                          : "Note"
                    }
                    value={text}
                    onChange={(e) => dirty(e.target.value)}
                    maxLength={2000}
                  />
                </label>
              )}
              {["weight", "metric", "sleep"].includes(type) && (
                <label className="field-label">
                  {type === "weight"
                    ? `Weight (${prefs.weightUnit})`
                    : type === "sleep"
                      ? "Sleep duration (hours)"
                      : metric.label}
                  <Input
                    aria-label={
                      type === "weight"
                        ? `Weight (${prefs.weightUnit})`
                        : type === "sleep"
                          ? "Sleep duration (hours)"
                          : metric.label
                    }
                    aria-invalid={Boolean(error)}
                    type="number"
                    step="any"
                    min="0"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      onDirty?.(Boolean(text || e.target.value));
                    }}
                  />
                </label>
              )}
              {type === "weight" && weight.value.entries[date] && (
                <p className="text-sm text-muted-foreground">
                  Saving corrects the existing reading for this date.
                </p>
              )}
              {type === "sleep" && (
                <details>
                  <summary>Optional recovery details</summary>
                  <label className="field-label">
                    Energy
                    <select
                      aria-label="Energy"
                      value={energy}
                      onChange={(e) => {
                        setEnergy(e.target.value);
                        onDirty?.(true);
                      }}
                    >
                      <option value="">Keep existing / not recorded</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} of 5
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-label">
                    Mood
                    <select
                      aria-label="Mood"
                      value={mood}
                      onChange={(e) => {
                        setMood(e.target.value);
                        onDirty?.(true);
                      }}
                    >
                      <option value="">Keep existing / not recorded</option>
                      {["Low", "Okay", "Good"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                </details>
              )}
              <Button type="submit">
                {type === "task"
                  ? "Save task"
                  : type === "note"
                    ? "Save note"
                    : type === "weight"
                      ? "Save weigh-in"
                      : type === "sleep"
                        ? "Save sleep"
                        : "Save goal metric"}
              </Button>
            </form>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <Link
        className="capture-return"
        href={back}
        onClick={(e) => {
          if (
            (text || amount || energy || mood || foodDirty) &&
            !window.confirm("Discard the unsaved entry?")
          )
            e.preventDefault();
        }}
      >
        Return to {name}
      </Link>
    </div>
  );
}

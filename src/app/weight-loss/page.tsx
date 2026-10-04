"use client";
import { useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import TrackerShell from "@/components/trackers/TrackerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useNow } from "@/lib/tracker-store";
import { dateKey, kgToDisplay } from "@/lib/trackers";
import {
  DEFAULT_WEIGHT_LOSS_STATE,
  displayWeight,
  inputToKg,
  type WeightLossState,
  type WeightEntry,
} from "@/lib/health";
import { useUserPrefs } from "@/lib/user-prefs";
import { progressDates } from "@/lib/personal-progress";
import TrendChart from "@/components/progress/TrendChart";
export default function WeightLossPage() {
  const { prefs } = useUserPrefs();
  const now = useNow(60_000);
  const today = dateKey(new Date(now));
  const {
    value: state,
    setValue,
    status,
  } = useSyncedStorage<WeightLossState>(
    "weight-loss",
    DEFAULT_WEIGHT_LOSS_STATE,
  );
  const [selectedDate, setDate] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const day = new URLSearchParams(window.location.search).get("date");
    return day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
  });
  const date = selectedDate || today;
  const current = state.entries[date];
  const [draft, setDraft] = useState<{
    date: string;
    weight: string;
    note: string;
  }>();
  const [targetDraft, setTarget] = useState<string>();
  const [range, setRange] = useState(30);
  const [all, setAll] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [removed, setRemoved] = useState<{
    date: string;
    entry: WeightEntry;
  }>();
  const weight =
    draft?.date === date
      ? draft.weight
      : current
        ? String(
            Math.round(kgToDisplay(current.weightKg, prefs.weightUnit) * 10) /
              10,
          )
        : "";
  const note = draft?.date === date ? draft.note : (current?.note ?? "");
  const target =
    targetDraft ??
    (state.targetKg
      ? String(
          Math.round(kgToDisplay(state.targetKg, prefs.weightUnit) * 10) / 10,
        )
      : "");
  const readings = Object.entries(state.entries ?? {})
    .filter(
      ([, entry]) => Number.isFinite(entry.weightKg) && entry.weightKg > 0,
    )
    .sort(([a], [b]) => b.localeCompare(a));
  const points = progressDates(date, range).map((day) => ({
    date: day,
    value:
      state.entries[day]?.weightKg > 0
        ? kgToDisplay(state.entries[day].weightKg, prefs.weightUnit)
        : null,
  }));
  const updateDraft = (changes: Partial<{ weight: string; note: string }>) =>
    setDraft({ date, weight, note, ...changes });
  const save = () => {
    const amount = Number(weight);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a positive weight.");
      return;
    }
    setValue((previous) => ({
      ...previous,
      entries: {
        ...previous.entries,
        [date]: {
          weightKg: inputToKg(amount, prefs.weightUnit),
          note: note.trim() || undefined,
          updatedAt: Math.max(
            Date.now(),
            (previous.entries[date]?.updatedAt ?? 0) + 1,
          ),
        },
      },
    }));
    setError("");
    setMessage(`Saved weigh-in for ${date}.`);
  };
  const saveTarget = () => {
    const amount = Number(target);
    if (target.trim() && (!Number.isFinite(amount) || amount <= 0)) {
      setError("Enter a positive target weight or leave it blank.");
      return;
    }
    setValue((previous) => ({
      ...previous,
      targetKg: target.trim() ? inputToKg(amount, prefs.weightUnit) : undefined,
    }));
    setError("");
    setMessage(
      target.trim() ? "Saved weight target." : "Removed weight target.",
    );
  };
  const remove = (day: string, entry: WeightEntry) => {
    setRemoved({ date: day, entry });
    setValue((previous) => {
      const entries = { ...previous.entries };
      delete entries[day];
      return { ...previous, entries };
    });
    if (day === date) setDraft(undefined);
    setMessage(`Removed weigh-in for ${day}.`);
  };
  const undo = () => {
    if (!removed) return;
    setValue((previous) =>
      previous.entries[removed.date]
        ? previous
        : {
            ...previous,
            entries: { ...previous.entries, [removed.date]: removed.entry },
          },
    );
    setRemoved(undefined);
    setMessage("Restored weigh-in.");
  };
  return (
    <RequireAuth>
      <TrackerShell
        icon="scale"
        title="Body and weight"
        subtitle="Record measurements, review dated trends and manage your own target."
      >
        <div className="body-workspace-grid">
          <section id="weight-entry" className="progress-panel">
            <header>
              <h2>
                {current
                  ? `Logged ${displayWeight(current.weightKg, prefs.weightUnit)}`
                  : "Record a weigh-in"}
              </h2>
            </header>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
              className="mt-4 space-y-4"
            >
              <label className="block text-sm font-medium">
                Record date
                <Input
                  type="date"
                  max={today}
                  value={date}
                  onChange={(event) => {
                    if (event.target.value) {
                      setDate(event.target.value);
                      setDraft(undefined);
                      setMessage("");
                    }
                  }}
                />
              </label>
              <label className="block text-sm font-medium">
                Weight ({prefs.weightUnit})
                <Input
                  aria-label={
                    date === today ? "Today's weight" : "Recorded weight"
                  }
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  inputMode="decimal"
                  value={weight}
                  onChange={(event) =>
                    updateDraft({ weight: event.target.value })
                  }
                  placeholder={prefs.weightUnit === "kg" ? "82.4" : "181.7"}
                />
              </label>
              <label className="block text-sm font-medium">
                Note (optional)
                <Input
                  value={note}
                  onChange={(event) =>
                    updateDraft({ note: event.target.value })
                  }
                  placeholder="Context you want to keep with this reading"
                />
              </label>
              <Button type="submit">Save weigh-in</Button>
            </form>
            <p className="progress-note">
              {status === "synced"
                ? "Synced to your account."
                : status === "error"
                  ? "Saved locally; sync needs attention."
                  : "Records are saved on this device."}
            </p>
            {message && (
              <p role="status" className="mt-3 text-sm text-primary">
                {message}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}
            {removed && (
              <Button variant="outline" className="mt-3" onClick={undo}>
                Undo weight removal
              </Button>
            )}
          </section>
          <section className="progress-panel">
            <header>
              <h2>Weight trend</h2>
              <div
                role="group"
                aria-label="Weight trend range"
                className="progress-segmented"
              >
                {[30, 90].map((days) => (
                  <button
                    type="button"
                    key={days}
                    aria-pressed={range === days}
                    onClick={() => setRange(days)}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </header>
            <div className="mt-4">
              <TrendChart
                label="Weight trend"
                unit={prefs.weightUnit}
                points={points}
              />
            </div>
            <p className="progress-note">
              Through {date}. Each point is a saved weigh-in; gaps are unlogged
              days.
            </p>
            <details className="mt-4">
              <summary>Optional weight target</summary>
              <form
                className="mt-2 flex flex-wrap items-end gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveTarget();
                }}
              >
                <label className="text-sm">
                  Target weight ({prefs.weightUnit})
                  <Input
                    type="number"
                    min="0.1"
                    step="any"
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    placeholder="Leave blank to remove"
                  />
                </label>
                <Button type="submit" variant="outline">
                  Save target
                </Button>
              </form>
            </details>
            <p className="progress-note">
              {state.targetKg
                ? `Saved target: ${displayWeight(state.targetKg, prefs.weightUnit)}`
                : "No target set."}
            </p>
          </section>
        </div>
        <section className="progress-panel" data-testid="weight-history">
          <header>
            <h2>Weigh-in history</h2>
            <span className="text-sm text-muted-foreground">
              {readings.length} readings
            </span>
          </header>
          {readings.length ? (
            <ul className="weight-history-list">
              {(all ? readings : readings.slice(0, 20)).map(([day, entry]) => (
                <li key={day}>
                  <div>
                    <p className="font-medium">
                      {day} · {displayWeight(entry.weightKg, prefs.weightUnit)}
                    </p>
                    {entry.note && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {entry.note}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDate(day);
                        setDraft(undefined);
                        document
                          .getElementById("weight-entry")
                          ?.scrollIntoView({ block: "start" });
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => remove(day, entry)}>
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="progress-note">
              Your first saved reading will appear here.
            </p>
          )}
          {readings.length > 20 && (
            <Button
              variant="ghost"
              onClick={() => setAll((previous) => !previous)}
            >
              {all ? "Show recent readings" : "Show all readings"}
            </Button>
          )}
        </section>
        <details className="progress-panel">
          <summary>Recovery and previous check-ins</summary>
          <p className="progress-note">
            Self-reported energy, sleep quality and soreness are observations.
            They are not a calculated readiness score.
          </p>
          <Link href="/health" className="progress-text-action">
            Record sleep and recovery →
          </Link>
          {Object.entries(state.recoveryByDay ?? {})
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 7)
            .map(([day, entry]) => (
              <p key={day} className="progress-note">
                {day} · Energy {entry.energy}/5 · Sleep quality {entry.sleep}/5
                · Soreness {entry.soreness}/5
              </p>
            ))}
        </details>
      </TrackerShell>
    </RequireAuth>
  );
}

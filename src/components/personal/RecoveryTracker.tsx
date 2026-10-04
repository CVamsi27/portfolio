"use client";
import { useState } from "react";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { zonedDate } from "@/lib/routine-reminders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export type RecoveryEntry = {
  id: string;
  date: string;
  sleepHours: number | null;
  energy: number | null;
  mood: string;
  note: string;
  updatedAt: number;
  deleted?: boolean;
};
export default function RecoveryTracker() {
  const [date, setDate] = useState(() => zonedDate(Date.now()));
  const store = useSyncedStorage<Record<string, RecoveryEntry>>(
    "recovery:entries",
    {},
    { accountScoped: true, records: true },
  );
  const record = store.value[date];
  const current = record && !record.deleted ? record : null;
  const [message, setMessage] = useState("");
  const update = (changes: Partial<RecoveryEntry>) => {
    store.setValue((previous) => ({
      ...previous,
      [date]: {
        id: date,
        date,
        sleepHours: null,
        energy: null,
        mood: "",
        note: "",
        ...(previous[date]?.deleted ? {} : previous[date]),
        ...changes,
        deleted: false,
        updatedAt: Math.max(Date.now(), (previous[date]?.updatedAt ?? 0) + 1),
      },
    }));
    setMessage("Saved on this device.");
  };
  return (
    <details className="rounded-xl border border-border p-4">
      <summary className="min-h-11 cursor-pointer font-semibold">
        Recovery · optional daily check-in
      </summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          Date
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          Sleep duration (hours)
          <Input
            type="number"
            min="0"
            max="24"
            step="0.25"
            value={current?.sleepHours ?? ""}
            onChange={(e) => {
              const value =
                e.target.value === "" ? null : Number(e.target.value);
              if (value === null || (value >= 0 && value <= 24))
                update({ sleepHours: value });
            }}
          />
        </label>
        <label className="space-y-1 text-sm">
          Energy (1–5)
          <select
            className="block min-h-11 w-full rounded-lg border border-border bg-background p-2"
            value={current?.energy ?? ""}
            onChange={(e) =>
              update({ energy: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">Unrecorded</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          Mood
          <Input
            value={current?.mood ?? ""}
            maxLength={100}
            onChange={(e) => update({ mood: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-sm sm:col-span-2">
          Recovery note
          <Input
            value={current?.note ?? ""}
            maxLength={1000}
            onChange={(e) => update({ note: e.target.value })}
          />
        </label>
      </div>
      {current && (
        <Button
          className="mt-3"
          variant="ghost"
          onClick={() => {
            store.setValue((previous) => ({
              ...previous,
              [date]: {
                ...previous[date],
                deleted: true,
                updatedAt: Math.max(Date.now(), previous[date].updatedAt + 1),
              },
            }));
            setMessage("Check-in removed.");
          }}
        >
          Remove check-in
        </Button>
      )}
      <p role="status" className="mt-2 text-xs text-muted-foreground">
        {store.status === "error"
          ? "Cloud sync unavailable; retry when connected."
          : message}
      </p>
    </details>
  );
}

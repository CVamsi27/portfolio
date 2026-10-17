"use client";

import { Droplets, Minus, Plus } from "lucide-react";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { dateKey } from "@/lib/trackers";

const TARGET_GLASSES = 8;
const ML_PER_GLASS = 250;

export default function HydrationTracker({ date }: { date?: string } = {}) {
  const today = date ?? dateKey();
  const { value, setValue } = useSyncedStorage<Record<string, number>>(
    "fasting:water",
    {},
  );
  const logs = value ?? {};
  const currentGlasses = logs[today] ?? 0;

  const currentMl = currentGlasses * ML_PER_GLASS;
  const percent = Math.min(
    100,
    Math.round((currentGlasses / TARGET_GLASSES) * 100),
  );

  const addGlass = () => {
    setValue({
      ...logs,
      [today]: currentGlasses + 1,
    });
  };

  const removeGlass = () => {
    if (currentGlasses <= 0) return;
    setValue({
      ...logs,
      [today]: Math.max(0, currentGlasses - 1),
    });
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-bold sm:text-lg">
            Daily Hydration
          </h3>
        </div>
        {logs[today] != null && (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {currentGlasses} glasses · {currentMl} ml
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-4">
          <div
            role="progressbar"
            aria-label="Water logged"
            aria-valuemin={0}
            aria-valuemax={Math.max(TARGET_GLASSES, currentGlasses)}
            aria-valuenow={currentGlasses}
            aria-valuetext={`${currentGlasses} glasses, ${currentMl} ml`}
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <details className="workspace-disclosure mt-3">
          <summary>Adjust total</summary>
          <label className="field-label">
            Glasses recorded
            <select
              aria-label="Glasses recorded"
              value={currentGlasses}
              onChange={(event) =>
                setValue({ ...logs, [today]: Number(event.target.value) })
              }
            >
              {Array.from(
                { length: Math.max(TARGET_GLASSES, currentGlasses) + 1 },
                (_, value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ),
              )}
            </select>
          </label>
        </details>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={removeGlass}
            disabled={currentGlasses <= 0}
            aria-label="Remove one glass of water"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-40"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={addGlass}
            aria-label="Add one glass of water"
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-3 font-mono text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> 250ml
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Droplets, Minus, Plus } from "lucide-react";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { dateKey } from "@/lib/trackers";
import { cn } from "@/lib/utils";

const TARGET_GLASSES = 8;
const ML_PER_GLASS = 250;

export default function HydrationTracker() {
  const today = dateKey();
  const { value, setValue } = useSyncedStorage<Record<string, number>>("fasting:water", {});
  const logs = value ?? {};
  const currentGlasses = logs[today] ?? 0;

  const currentMl = currentGlasses * ML_PER_GLASS;
  const targetMl = TARGET_GLASSES * ML_PER_GLASS;
  const percent = Math.min(100, Math.round((currentGlasses / TARGET_GLASSES) * 100));

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
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-[#49e7ff]" />
          <h3 className="font-display text-base font-bold sm:text-lg">Daily Hydration</h3>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {currentMl} / {targetMl} ml ({currentGlasses}/{TARGET_GLASSES} glasses)
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#49e7ff] transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold tabular-nums text-[#49e7ff]">
            {percent}%
          </span>
        </div>

        {/* Visual glass dots */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-1.5">
          {Array.from({ length: TARGET_GLASSES }, (_, i) => {
            const filled = i < currentGlasses;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setValue({
                    ...logs,
                    [today]: i + 1,
                  });
                }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-mono transition-colors",
                  filled
                    ? "border-[#49e7ff]/70 bg-[#49e7ff]/20 text-[#49e7ff] font-bold"
                    : "border-border/60 bg-muted/20 text-muted-foreground hover:border-[#49e7ff]/40",
                )}
                aria-label={`Set hydration to ${i + 1} glasses`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={removeGlass}
            disabled={currentGlasses <= 0}
            aria-label="Remove one glass of water"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-40"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={addGlass}
            aria-label="Add one glass of water"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#49e7ff] px-3 font-mono text-xs font-bold text-[#071014] transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> 250ml
          </button>
        </div>
      </div>
    </div>
  );
}

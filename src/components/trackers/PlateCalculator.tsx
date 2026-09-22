"use client";

import { useMemo, useState } from "react";
import { Calculator, X } from "lucide-react";
import { type WeightUnit } from "@/lib/trackers";
import { cn } from "@/lib/utils";

const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const LBS_PLATES = [45, 35, 25, 10, 5, 2.5];

export type PlateCount = {
  plate: number;
  count: number;
};

export function calculatePlates(
  totalWeight: number,
  unit: WeightUnit,
  barWeight: number,
): { perSide: number; plates: PlateCount[]; remainder: number } {
  if (totalWeight <= barWeight) {
    return { perSide: 0, plates: [], remainder: 0 };
  }

  const weightPerSide = (totalWeight - barWeight) / 2;
  const availablePlates = unit === "kg" ? KG_PLATES : LBS_PLATES;

  let remaining = weightPerSide;
  const plates: PlateCount[] = [];

  for (const plate of availablePlates) {
    if (remaining >= plate) {
      const count = Math.floor(remaining / plate);
      plates.push({ plate, count });
      remaining = Math.round((remaining - count * plate) * 100) / 100;
    }
  }

  return {
    perSide: weightPerSide,
    plates,
    remainder: remaining,
  };
}

export default function PlateCalculator({
  unit = "kg",
  defaultWeight,
  onClose,
}: {
  unit?: WeightUnit;
  defaultWeight?: number;
  onClose?: () => void;
}) {
  const barWeight = unit === "kg" ? 20 : 45;
  const [targetWeight, setTargetWeight] = useState<string>(
    defaultWeight ? String(defaultWeight) : unit === "kg" ? "100" : "225",
  );

  const numWeight = Number(targetWeight);
  const result = useMemo(() => {
    if (!Number.isFinite(numWeight) || numWeight <= 0) return null;
    return calculatePlates(numWeight, unit, barWeight);
  }, [numWeight, unit, barWeight]);

  const presets = unit === "kg" ? [60, 80, 100, 120, 140] : [135, 185, 225, 275, 315];

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold text-sm sm:text-base">Barbell Plate Calculator</h3>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
            {barWeight} {unit} bar
          </span>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close plate calculator"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-muted-foreground">
            Target weight ({unit}):
            <input
              type="number"
              step="0.5"
              min={barWeight}
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="mt-1 block w-32 rounded-lg border border-input bg-background px-3 py-1.5 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <div className="flex flex-wrap items-center gap-1.5 pt-4">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTargetWeight(String(p))}
                className={cn(
                  "rounded-md border px-2 py-1 font-mono text-xs transition-colors",
                  numWeight === p
                    ? "border-primary bg-primary text-primary-foreground font-bold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {result ? (
          <div className="mt-5 rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/40 pb-2">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Load per side
                </span>
                <p className="font-display text-2xl font-bold tabular-nums text-foreground">
                  {result.perSide} {unit}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground font-mono">
                Total on bar: {numWeight} {unit}
              </div>
            </div>

            {/* Visual Plate Display */}
            <div className="mt-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Plates for each side:
              </span>
              {result.plates.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">Empty bar — no additional plates needed.</p>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {result.plates.map(({ plate, count }) => (
                    <div
                      key={plate}
                      className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 shadow-sm"
                    >
                      <span className="font-display text-sm font-black tabular-nums text-primary">
                        {plate} {unit}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">× {count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {result.remainder > 0 ? (
              <p className="mt-3 text-[11px] text-amber-500 font-medium">
                Note: {result.remainder} {unit} remainder cannot be loaded with standard plate increments.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            Enter a valid target weight higher than the {barWeight} {unit} bar.
          </p>
        )}
      </div>
    </div>
  );
}

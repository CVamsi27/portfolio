"use client";

import { useMemo } from "react";
import { dateKey } from "@/lib/trackers";
import { cn } from "@/lib/utils";
import { Target } from "lucide-react";

interface ConsistencyGridProps {
  metricByDay: Record<string, number>;
  target: number;
  label?: string;
  days?: number;
  className?: string;
}

export default function ConsistencyGrid({
  metricByDay,
  target,
  label = "target",
  days = 28,
  className,
}: ConsistencyGridProps) {
  const cells = useMemo(() => {
    const list: {
      date: string;
      dayLabel: string;
      value: number;
      met: boolean;
      partial: boolean;
      isToday: boolean;
    }[] = [];
    const today = dateKey();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const value = metricByDay[key] ?? 0;
      list.push({
        date: key,
        dayLabel: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        value,
        met: value >= target,
        partial: value > 0 && value < target,
        isToday: key === today,
      });
    }
    return list;
  }, [metricByDay, target, days]);

  const metCount = useMemo(() => cells.filter((c) => c.met).length, [cells]);
  const consistencyPct = Math.round((metCount / days) * 100);

  return (
    <div className={cn("rounded-xl border border-border/70 bg-card/45 p-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="dossier-kicker">Consistency Grid / {days} Days</p>
          <p className="mt-1 font-display text-sm font-bold">
            {metCount} of {days} days hit ({consistencyPct}%)
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-border/70 bg-muted/20" />
            0
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-[#C8FF3D]/40 bg-[#C8FF3D]/25" />
            &lt; target
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#C8FF3D]" />
            Met ({target}+)
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-1.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, index) => (
          <span
            key={`${d}-${index}`}
            className="text-center font-mono text-[10px] font-semibold text-muted-foreground"
          >
            {d}
          </span>
        ))}
        {cells.map((cell) => {
          return (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.value} / ${target} ${label}`}
              className={cn(
                "group relative flex aspect-square items-center justify-center rounded border transition-all",
                cell.met
                  ? "border-[#C8FF3D] bg-[#C8FF3D] text-[#071014] font-bold shadow-[0_0_8px_rgba(200,255,61,0.25)]"
                  : cell.partial
                  ? "border-[#C8FF3D]/50 bg-[#C8FF3D]/15 text-[#C8FF3D] font-medium"
                  : "border-border/60 bg-muted/15 text-muted-foreground/50",
                cell.isToday && "ring-1 ring-primary ring-offset-1 ring-offset-background"
              )}
            >
              <span className="font-mono text-[9px] sm:text-[10px]">
                {cell.value > 0 ? cell.value : ""}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Target className="h-3.5 w-3.5 text-primary shrink-0" />
        Each block represents one day. High contrast indicates target achieved.
      </p>
    </div>
  );
}

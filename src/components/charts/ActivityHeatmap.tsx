"use client";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type HeatmapDay = {
  date: string;
  count: number;
  detail?: string;
};

function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted/60",
  1: "bg-emerald-500/25",
  2: "bg-emerald-500/50",
  3: "bg-emerald-500/75",
  4: "bg-emerald-500",
};

export default function ActivityHeatmap({
  days,
  title = "12-week execution consistency",
  subtitle = "Daily career actions, study chapters mastered, and focus sessions",
}: {
  days: HeatmapDay[];
  title?: string;
  subtitle?: string;
}) {
  const { weeks, activeDays, currentStreak, bestStreak } = useMemo(() => {
    const padded = [...days];
    let streak = 0;
    let best = 0;
    let active = 0;
    for (const d of padded) {
      if (d.count > 0) {
        active += 1;
        streak += 1;
        if (streak > best) best = streak;
      } else {
        streak = 0;
      }
    }
    let current = 0;
    for (let i = padded.length - 1; i >= 0; i -= 1) {
      if (padded[i].count > 0) current += 1;
      else if (i < padded.length - 1) break;
    }
    const grouped: HeatmapDay[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      grouped.push(padded.slice(i, i + 7));
    }
    return {
      weeks: grouped,
      activeDays: active,
      currentStreak: current,
      bestStreak: best,
    };
  }, [days]);

  return (
    <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
            {currentStreak}d streak
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
            Best {bestStreak}d · {activeDays}/{days.length} active
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-1.5" role="img" aria-label={`${activeDays} active days in the last ${days.length} days`}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {week.map((day) => {
                const lvl = levelFor(day.count);
                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.detail ?? `${day.count} actions`}`}
                    className={cn(
                      "h-3.5 w-3.5 rounded-[4px] transition-transform hover:scale-125",
                      LEVEL_CLASS[lvl],
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{days[0]?.date ?? ""}</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((lvl) => (
            <span
              key={lvl}
              className={cn("h-2.5 w-2.5 rounded-[3px]", LEVEL_CLASS[lvl])}
            />
          ))}
          <span>More</span>
        </div>
        <span>{days.at(-1)?.date ?? ""}</span>
      </div>
    </section>
  );
}

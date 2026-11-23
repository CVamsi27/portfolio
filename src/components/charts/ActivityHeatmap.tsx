"use client";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { shortProgressDate } from "@/components/progress/TrendChart";

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
  0: "bg-muted/55 hover:bg-muted",
  1: "bg-emerald-500/25 hover:bg-emerald-500/40",
  2: "bg-emerald-500/50 hover:bg-emerald-500/65",
  3: "bg-emerald-500/75 hover:bg-emerald-500/90",
  4: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.35)]",
};

const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

export default function ActivityHeatmap({
  days,
  title = "12-week execution consistency",
  subtitle = "Daily career actions, study chapters mastered, and focus sessions",
}: {
  days: HeatmapDay[];
  title?: string;
  subtitle?: string;
}) {
  const [selected, setSelected] = useState<HeatmapDay | null>(null);

  const {
    weeks,
    monthLabels,
    activeDays,
    currentStreak,
    bestStreak,
    totalActions,
    peakDay,
    latestActive,
  } = useMemo(() => {
    const padded = [...days];
    let streak = 0;
    let best = 0;
    let active = 0;
    let total = 0;
    let peak: HeatmapDay | null = null;
    let latest: HeatmapDay | null = null;
    for (const d of padded) {
      total += d.count;
      if (d.count > 0) {
        active += 1;
        streak += 1;
        latest = d;
        if (streak > best) best = streak;
        if (!peak || d.count > peak.count) peak = d;
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
    const months: Array<string> = [];
    let lastMonth = "";
    for (const week of grouped) {
      const first = week[0]?.date;
      const m = first
        ? new Intl.DateTimeFormat("en-US", {
            month: "short",
            timeZone: "UTC",
          }).format(new Date(`${first}T00:00:00Z`))
        : "";
      if (m && m !== lastMonth) {
        months.push(m);
        lastMonth = m;
      } else {
        months.push("");
      }
    }
    return {
      weeks: grouped,
      monthLabels: months,
      activeDays: active,
      currentStreak: current,
      bestStreak: best,
      totalActions: total,
      peakDay: peak,
      latestActive: latest,
    };
  }, [days]);

  const activePct = days.length
    ? Math.round((activeDays / days.length) * 100)
    : 0;
  const inspected = selected ?? latestActive;

  return (
    <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] tabular-nums">
          <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/12 px-2.5 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
            {currentStreak}d streak
          </span>
          <span className="rounded-lg border border-border/60 bg-background/70 px-2.5 py-0.5 text-muted-foreground">
            Best {bestStreak}d
          </span>
          <span className="rounded-lg border border-border/60 bg-background/70 px-2.5 py-0.5 text-muted-foreground">
            {activeDays}/{days.length}d ({activePct}%)
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="overflow-x-auto pb-1">
          <div className="inline-flex flex-col gap-1">
            {/* Month axis */}
            <div className="flex items-center gap-1.5 pl-8">
              {monthLabels.map((m, wi) => (
                <span
                  key={wi}
                  className="w-4 shrink-0 font-mono text-[9px] text-muted-foreground"
                >
                  {m}
                </span>
              ))}
            </div>

            <div
              className="inline-flex gap-1.5"
              role="img"
              aria-label={`${activeDays} active days in the last ${days.length} days`}
            >
              {/* Weekday axis */}
              <div className="flex w-6 flex-col justify-between py-0.5 pr-1 text-right font-mono text-[9px] text-muted-foreground">
                {WEEKDAY_LABELS.map((lbl, idx) => (
                  <span key={idx} className="h-4 leading-4">
                    {lbl}
                  </span>
                ))}
              </div>

              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1.5">
                  {week.map((day) => {
                    const lvl = levelFor(day.count);
                    const isSelected = selected?.date === day.date;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onMouseEnter={() => setSelected(day)}
                        onFocus={() => setSelected(day)}
                        onClick={() => setSelected(day)}
                        title={`${day.date}: ${day.detail ?? `${day.count} actions`}`}
                        className={cn(
                          "h-4 w-4 rounded-[4px] transition-all cursor-pointer",
                          LEVEL_CLASS[lvl],
                          isSelected &&
                            "ring-2 ring-primary ring-offset-1 ring-offset-card",
                        )}
                        aria-label={`${day.date}: ${day.detail ?? `${day.count} actions`}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right-hand Consistency Breakdown & Inspector */}
        <div className="space-y-3 min-w-0">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-muted/25 px-3 py-2.5">
              <p className="text-[10px] font-medium text-muted-foreground">
                Total actions
              </p>
              <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-foreground">
                {totalActions}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/25 px-3 py-2.5">
              <p className="text-[10px] font-medium text-muted-foreground">
                Active rate
              </p>
              <p className="mt-0.5 font-mono text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {activePct}%
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-border/50 bg-muted/25 px-3 py-2.5">
              <p className="text-[10px] font-medium text-muted-foreground">
                Peak day
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-foreground truncate">
                {peakDay
                  ? `${peakDay.count} · ${shortProgressDate(peakDay.date)}`
                  : "—"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-background/50 px-3.5 py-2.5 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {selected ? "Selected day" : "Latest active day"}
              </span>
              {inspected && (
                <span className="font-mono text-[11px] font-semibold text-foreground">
                  {shortProgressDate(inspected.date)} ({inspected.date})
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {inspected
                ? inspected.detail ?? `${inspected.count} recorded actions`
                : "Hover or tap any day square to inspect its exact career, study & focus breakdown."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground border-t border-border/40 pt-3">
        <span>{days[0]?.date ?? ""}</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((lvl) => (
            <span
              key={lvl}
              className={cn("h-3 w-3 rounded-[3px]", LEVEL_CLASS[lvl])}
            />
          ))}
          <span>More</span>
        </div>
        <span>{days.at(-1)?.date ?? ""}</span>
      </div>
    </section>
  );
}

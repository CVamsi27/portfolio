"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { usePersonalProgress } from "@/lib/use-personal-progress";
import {
  PROGRESS_METRICS,
  metricPoints,
  type ProgressMetric,
} from "@/lib/progress-presentation";
import TrendChart from "./TrendChart";
import { metricFor } from "@/lib/user-prefs";
import EmptyState from "@/components/trackers/EmptyState";

/** Positive, action-first copy for a chart that has no readings yet. */
const EMPTY_COPY: Record<ProgressMetric, { title: string; hint: string }> = {
  weight: {
    title: "Start your weight trend",
    hint: "Record a weigh-in to chart this range.",
  },
  sets: {
    title: "Record your working sets",
    hint: "Log sets in a workout to chart your training.",
  },
  energy: {
    title: "Chart your daily energy",
    hint: "Log foods to record calories.",
  },
  protein: {
    title: "Chart your protein",
    hint: "Log foods to record protein.",
  },
  exercise: {
    title: "Chart your movement",
    hint: "Log exercises to record active minutes.",
  },
  fasting: {
    title: "Chart your eating windows",
    hint: "Save a first and last meal time to record fasts.",
  },
  water: {
    title: "Chart your hydration",
    hint: "Record glasses of water to chart your intake.",
  },
  sleep: {
    title: "Chart your sleep",
    hint: "Record sleep to chart nightly hours.",
  },
  focus: {
    title: "Chart your focus minutes",
    hint: "Start a focus session to record deep work.",
  },
  study: {
    title: "Chart your study minutes",
    hint: "Complete study chapters to record learning.",
  },
  tasks: {
    title: "Chart your completions",
    hint: "Complete a task to record it here.",
  },
  goal: {
    title: "Log your goal metric",
    hint: "Record today's number to start the trend.",
  },
  routine: {
    title: "Chart your routines",
    hint: "Complete a routine to record it here.",
  },
  reflection: {
    title: "Chart your reflections",
    hint: "Write a reflection to record it here.",
  },
};

/**
 * The Progress page's single chart. The metric and range controls live inside
 * the panel they control; an empty range renders an actionable empty state
 * instead of negative boilerplate.
 */
export default function ProgressChart({
  metric,
  endDate,
  options,
  onMetric,
  range: controlledRange,
  onRangeChange,
}: {
  metric: ProgressMetric;
  endDate?: string;
  options?: ProgressMetric[];
  onMetric?: (metric: ProgressMetric) => void;
  range?: 7 | 30 | 90;
  onRangeChange?: (days: 7 | 30 | 90) => void;
}) {
  const params = useSearchParams();
  const currentPath = usePathname();
  const [internalRange, setInternalRange] = useState<7 | 30 | 90>(() => {
    const parsed = Number(params.get("range"));
    return parsed === 7 || parsed === 90 ? parsed : 30;
  });
  const range = controlledRange ?? internalRange;
  const setRange = (next: 7 | 30 | 90) => {
    if (onRangeChange) {
      onRangeChange(next);
    } else {
      setInternalRange(next);
    }
  };
  const { data, prefs, syncing, syncError } = usePersonalProgress(
    range,
    endDate,
  );
  const definition = PROGRESS_METRICS[metric];
  const unit =
    metric === "weight"
      ? prefs.weightUnit
      : metric === "goal"
        ? metricFor(prefs).label
        : definition.unit;
  const points = metricPoints(data.days, metric, prefs.weightUnit);
  const recorded = points.filter((point) => point.value !== null);
  const counts = ["tasks", "routine", "reflection", "sets"].includes(metric);
  const count = recorded.reduce((sum, point) => sum + (point.value ?? 0), 0);
  const empty = counts ? count === 0 : recorded.length === 0;
  const actionHref = `${definition.href}${definition.href.includes("?") ? "&" : "?"}date=${data.end}`;
  return (
    <section
      className={`min-w-0 rounded-2xl border border-border/70 bg-card/90 p-5 shadow-xs space-y-4${empty ? " is-empty" : ""}`}
      aria-label={`${definition.label} progress`}
      data-testid="progress-chart"
    >
      <div className="workspace-progress-heading flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            {definition.label}
          </h2>
          {!empty && (
            <p className="workspace-progress-period text-xs text-muted-foreground mt-0.5">
              {data.first} – {data.end}
              {syncing ? " · Syncing…" : ""}
            </p>
          )}
        </div>
        <div className="workspace-progress-controls flex flex-wrap items-center gap-2">
          {options && onMetric && (
            <label className="min-w-0">
              <span className="sr-only">Metric</span>
              <select
                className="h-9 rounded-xl border border-border/70 bg-background px-3 text-xs font-medium text-foreground shadow-2xs transition-colors hover:border-primary/40 focus:border-primary focus:outline-none"
                value={metric}
                onChange={(event) =>
                  onMetric(event.target.value as ProgressMetric)
                }
              >
                {options.map((id) => (
                  <option key={id} value={id}>
                    {PROGRESS_METRICS[id].label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="min-w-0">
            <span className="sr-only">Range</span>
            <select
              className="h-9 rounded-xl border border-border/70 bg-background px-3 text-xs font-medium text-foreground shadow-2xs transition-colors hover:border-primary/40 focus:border-primary focus:outline-none"
              value={range}
              onChange={(event) => {
                const next = Number(event.target.value) as 7 | 30 | 90;
                setRange(next);
                const url = new URL(window.location.href);
                url.searchParams.set("range", event.target.value);
                window.history.replaceState(null, "", url);
              }}
            >
              {[7, 30, 90].map((days) => (
                <option key={days} value={days}>
                  {days} days
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {empty ? (
        <EmptyState
          title={EMPTY_COPY[metric].title}
          hint={EMPTY_COPY[metric].hint}
          action={
            <Link className="inline-action" href={actionHref}>
              {definition.action}
            </Link>
          }
        />
      ) : (
        <>
          <TrendChart
            points={points}
            label={definition.label}
            unit={unit}
            bars={definition.bars}
          />
          <div className="workspace-progress-footer flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {counts
                ? `${count} ${unit} in this range`
                : `${recorded.length}/${range} dated readings · ${unit}`}
            </span>
            {definition.href.split("?")[0] !== currentPath && (
              <Link
                className="font-medium text-primary hover:underline"
                href={actionHref}
              >
                {definition.action}
              </Link>
            )}
          </div>
        </>
      )}
      {empty && syncing && (
        <p role="status" className="text-sm text-muted-foreground">
          Syncing…
        </p>
      )}
      {syncError && (
        <p role="status" className="text-sm text-muted-foreground">
          Showing saved device records. Cloud sync needs attention.
        </p>
      )}
    </section>
  );
}

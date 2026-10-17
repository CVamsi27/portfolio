"use client";
import { usePersonalProgress } from "@/lib/use-personal-progress";
import {
  PROGRESS_METRICS,
  metricPoints,
  type ProgressMetric,
} from "@/lib/progress-presentation";
import { metricFor } from "@/lib/user-prefs";
import PageSummary from "@/components/trackers/PageSummary";

/**
 * One-line reading of a page's metric for the selected day, e.g.
 * `82.0 kg · today`. Renders nothing when the day has no reading —
 * the page's lead chart became this honest summary.
 */
export default function MetricSummary({
  metric,
  endDate,
  context,
}: {
  metric: ProgressMetric;
  endDate?: string;
  /** Trailing context, e.g. `today` or the selected day. */
  context?: string;
}) {
  const { data, prefs } = usePersonalProgress(1, endDate);
  const points = metricPoints(data.days, metric, prefs.weightUnit);
  const recorded = points.filter(
    (point) => point.value !== null && point.value !== 0,
  );
  if (recorded.length === 0) return null;
  const point = recorded[recorded.length - 1];
  const value = point.value as number;
  const unit =
    metric === "weight"
      ? prefs.weightUnit
      : metric === "goal"
        ? metricFor(prefs).label
        : PROGRESS_METRICS[metric].unit;
  const SINGULAR: Record<string, string> = {
    tasks: "task",
    glasses: "glass",
    hours: "hour",
    entries: "entry",
  };
  const shownUnit = value === 1 ? (SINGULAR[unit] ?? unit) : unit;
  const reading =
    metric === "weight"
      ? `${value.toFixed(1)} ${shownUnit}`
      : `${value} ${shownUnit}`;
  return <PageSummary parts={[reading, context ?? point.date]} />;
}

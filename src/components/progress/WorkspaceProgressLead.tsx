"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { usePersonalProgress } from "@/lib/use-personal-progress";
import {
  PROGRESS_METRICS,
  metricPoints,
  progressMetric,
  type ProgressMetric,
} from "@/lib/progress-presentation";
import { validDay } from "@/lib/day-plan";
import TrendChart from "./TrendChart";
import { metricFor } from "@/lib/user-prefs";

export function ProgressLead({
  metric,
  endDate,
  options,
  onMetric,
}: {
  metric: ProgressMetric;
  endDate?: string;
  options?: ProgressMetric[];
  onMetric?: (metric: ProgressMetric) => void;
}) {
  const params = useSearchParams();
  const currentPath = usePathname();
  const [range, setRange] = useState(() =>
    [7, 30, 90].includes(Number(params.get("range")))
      ? Number(params.get("range"))
      : 30,
  );
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
  return (
    <section
      className={`workspace-progress-lead${empty ? " is-empty" : ""}`}
      aria-label={`${definition.label} progress`}
      data-testid="progress-lead"
    >
      <div className="workspace-progress-heading">
        <h2>
          {empty ? `No ${definition.label.toLowerCase()}` : definition.label}
        </h2>
        {empty &&
          currentPath === "/dashboard" &&
          definition.href.split("?")[0] !== currentPath && (
            <Link
              className="inline-action"
              href={`${definition.href}${definition.href.includes("?") ? "&" : "?"}date=${data.end}`}
            >
              {definition.action}
            </Link>
          )}
        <div className="workspace-progress-controls">
          {options && onMetric && (
            <label>
              <span className="sr-only">Metric</span>
              <select
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
          <label>
            <span className="sr-only">Range</span>
            <select
              value={range}
              onChange={(event) => {
                setRange(Number(event.target.value));
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
      {!empty && (
        <p className="workspace-progress-period">
          {data.first} – {data.end}
          {syncing ? " · Syncing…" : ""}
        </p>
      )}
      {!empty && (
        <TrendChart
          points={points}
          label={definition.label}
          unit={unit}
          bars={definition.bars}
        />
      )}
      {!empty && (
        <div className="workspace-progress-footer">
          <span>
            {counts
              ? `${count} ${unit} in this range`
              : `${recorded.length}/${range} dated readings · ${unit}`}
          </span>
          {definition.href.split("?")[0] !== currentPath && (
            <Link
              href={`${definition.href}${definition.href.includes("?") ? "&" : "?"}date=${data.end}`}
            >
              {definition.action}
            </Link>
          )}
        </div>
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

export default function WorkspaceProgressLead() {
  const path = usePathname(),
    params = useSearchParams();
  const [selected, setSelected] = useState<ProgressMetric | null>(null);
  const metric = progressMetric(path, params.get("view"));
  // Today and the selected Exams view place their chart within their own header flow.
  if (
    !metric ||
    path === "/plan" ||
    path === "/hub" ||
    path === "/trackers" ||
    (path === "/roadmap" && params.get("panel") === "exams")
  )
    return null;
  const options: ProgressMetric[] | undefined =
    path === "/health" && params.get("view") !== "recovery"
      ? ["weight", "energy", "sets", "exercise", "water", "sleep"]
      : path === "/workout-tracking"
        ? ["sets", "exercise"]
        : undefined;
  const selectedQuery = params.get("metric") as ProgressMetric | null;
  const chosen = options?.includes(selectedQuery!)
    ? selectedQuery!
    : selected && options?.includes(selected)
      ? selected
      : metric;
  return (
    <ProgressLead
      key={`${path}:${params.get("view")}`}
      metric={chosen}
      options={options}
      onMetric={(next) => {
        setSelected(next);
        const url = new URL(window.location.href);
        url.searchParams.set("metric", next);
        window.history.replaceState(null, "", url);
      }}
      endDate={validDay(params.get("date")) ? params.get("date")! : undefined}
    />
  );
}

"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { validDay } from "@/lib/day-plan";
import { usePersonalProgress } from "@/lib/use-personal-progress";
import {
  PROGRESS_METRICS,
  type ProgressMetric,
} from "@/lib/progress-presentation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ProgressLead } from "./WorkspaceProgressLead";
import ImportedHealthTrends from "./ImportedHealthTrends";
const health: ProgressMetric[] = [
  "weight",
  "energy",
  "protein",
  "exercise",
  "sets",
  "water",
  "sleep",
];
const work: ProgressMetric[] = ["focus", "study", "tasks", "goal", "routine"];
const legacy: Record<string, ProgressMetric> = {
  body: "weight",
  nutrition: "energy",
  wellbeing: "water",
  learning: "focus",
  goals: "goal",
};
export default function ProgressDashboard() {
  const params = useSearchParams();
  const hash =
    typeof window !== "undefined" ? window.location.hash.slice(1) : "";
  const initialMetric =
    legacy[params.get("metric") || hash] || params.get("metric") || "weight";
  const [view, setView] = useState(
    params.get("view") === "reflection"
      ? "reflection"
      : params.get("view") === "work" ||
          work.includes(initialMetric as ProgressMetric)
        ? "work"
        : "health",
  );
  const [metric, setMetric] = useState<ProgressMetric>(
    initialMetric in PROGRESS_METRICS
      ? (initialMetric as ProgressMetric)
      : "weight",
  );
  const [through, setThrough] = useState<string | undefined>(
    validDay(params.get("date")) ? params.get("date")! : undefined,
  );
  const { data } = usePersonalProgress(
    [7, 30, 90].includes(Number(params.get("range")))
      ? Number(params.get("range"))
      : 30,
    through,
  );
  const update = (nextView: string, nextMetric: ProgressMetric) => {
    setView(nextView);
    setMetric(nextMetric);
    const url = new URL(window.location.href);
    url.searchParams.set("view", nextView);
    url.searchParams.set("metric", nextMetric);
    url.hash = "";
    window.history.replaceState(null, "", url);
  };
  const chosen =
    view === "reflection"
      ? "reflection"
      : (view === "work" ? work : health).includes(metric)
        ? metric
        : view === "work"
          ? "focus"
          : "weight";
  const changeThrough = (date: string) => {
    if (!validDay(date)) return;
    const url = new URL(window.location.href);
    url.searchParams.set("date", date);
    window.history.replaceState(null, "", url);
    setThrough(date);
  };
  return (
    <div className="progress-workspace" data-testid="progress-dashboard">
      <div className="progress-range-toolbar">
        <label className="field-label">
          Through date
          <Input
            type="date"
            value={data.end}
            onInput={(event) => changeThrough(event.currentTarget.value)}
            onChange={(event) => changeThrough(event.currentTarget.value)}
          />
        </label>
        {through && (
          <button
            className="inline-action"
            onClick={() => {
              setThrough(undefined);
              const url = new URL(window.location.href);
              url.searchParams.delete("date");
              window.history.replaceState(null, "", url);
            }}
          >
            Back to today
          </button>
        )}
      </div>
      <ProgressLead
        metric={chosen}
        endDate={through}
        options={
          view === "reflection" ? undefined : view === "work" ? work : health
        }
        onMetric={(next) => update(view, next)}
      />
      <nav className="workspace-views" aria-label="Progress views">
        {[
          ["health", "Health"],
          ["work", "Work & learning"],
          ["reflection", "Reflection"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() =>
              update(
                id,
                id === "work"
                  ? "focus"
                  : id === "reflection"
                    ? "reflection"
                    : "weight",
              )
            }
          >
            {label}
          </button>
        ))}
      </nav>
      {view === "reflection" && (
        <section className="workspace-panel">
          <Link
            className="inline-action"
            href={`/log?view=journal&date=${data.end}&returnTo=${encodeURIComponent(`/dashboard?view=reflection&date=${data.end}`)}`}
          >
            Write or edit reflection
          </Link>
        </section>
      )}
      {view === "health" && (
        <details className="workspace-disclosure">
          <summary>Imported health records & sources</summary>
          <ImportedHealthTrends from={data.first} to={data.end} />
        </details>
      )}
    </div>
  );
}

"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { validDay } from "@/lib/day-plan";
import JournalWorkspace from "@/components/daily/JournalWorkspace";
const VisibleMetric = createContext("body");
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { usePersonalProgress } from "@/lib/use-personal-progress";
import { displayWeight } from "@/lib/health";
import { kgToDisplay } from "@/lib/trackers";
import { displayGoalTitle } from "@/lib/user-prefs";
import { NUTRIENTS, type NutrientKey } from "@/lib/nutrition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TrendChart, { shortProgressDate } from "./TrendChart";
const number = (value: number | null, unit = "") =>
  value === null
    ? "Not recorded"
    : `${Math.round(value * 10) / 10}${unit ? ` ${unit}` : ""}`;
function Panel({
  id,
  title,
  href,
  action,
  children,
}: {
  id: string;
  title: string;
  href: string;
  action: string;
  children: ReactNode;
}) {
  const visible = useContext(VisibleMetric);
  if (visible !== id) return null;
  return (
    <section id={id} className="progress-panel">
      <header>
        <h2>{title}</h2>
        <Link href={href} className="progress-panel-action">
          <Plus aria-hidden className="h-3.5 w-3.5" />
          {action}
        </Link>
      </header>
      {children}
    </section>
  );
}
function Reading({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div className="progress-reading">
      <p>{value}</p>
      <span>{label}</span>
    </div>
  );
}
export default function ProgressDashboard() {
  const params = useSearchParams();
  const legacyMetric =
    typeof window !== "undefined" ? window.location.hash.slice(1) : "";
  const [view, setView] = useState(
    () =>
      params.get("view") ||
      (["body", "nutrition", "exercise", "wellbeing"].includes(legacyMetric)
        ? "health"
        : ["learning", "goals"].includes(legacyMetric)
          ? "work"
          : "overview"),
  );
  const [selectedMetric, setSelectedMetric] = useState(
    () =>
      params.get("metric") ||
      (legacyMetric &&
      [
        "body",
        "nutrition",
        "exercise",
        "wellbeing",
        "learning",
        "goals",
      ].includes(legacyMetric)
        ? legacyMetric
        : "") ||
      (params.get("view") === "work" ? "learning" : "body"),
  );
  const choose = (nextView: string, metric?: string) => {
    setView(nextView);
    if (metric) setSelectedMetric(metric);
    const q = new URLSearchParams(window.location.search);
    q.set("view", nextView);
    if (metric) q.set("metric", metric);
    window.history.replaceState(null, "", `/dashboard?${q}`);
  };
  const [range, setRange] = useState(() =>
    [7, 30, 90].includes(Number(params.get("range")))
      ? Number(params.get("range"))
      : 30,
  );
  const [through, setThrough] = useState<string | undefined>(
    validDay(params.get("date")) ? params.get("date")! : undefined,
  );
  const {
    data: d,
    prefs,
    targets,
    weightTarget,
    milestones,
    tasks,
    syncing,
    syncError,
  } = usePersonalProgress(range, through);
  const periodUrl = (day: string | undefined, nextRange = range) => {
    const q = new URLSearchParams(window.location.search);
    if (day) q.set("date", day);
    else q.delete("date");
    q.set("range", String(nextRange));
    window.history.replaceState(null, "", `/dashboard?${q}`);
  };
  const shift = (direction: number) => {
    const date = new Date(`${d.end}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + range * direction);
    const day = date.toISOString().slice(0, 10);
    setThrough(day);
    periodUrl(day);
  };
  const points = (
    key: "energy" | "exercise" | "water" | "sleep" | "focus" | "study",
  ) => d.days.map((day) => ({ date: day.date, value: day[key] }));
  return (
    <div data-testid="progress-dashboard" className="progress-workspace">
      <nav className="workspace-views" aria-label="Progress views">
        {[
          ["overview", "Overview"],
          ["health", "Health"],
          ["work", "Work & learning"],
          ["reflection", "Reflection"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={view === id}
            className="inline-action"
            onClick={() => choose(id, id === "work" ? "learning" : "body")}
          >
            {label}
          </button>
        ))}
      </nav>
      {view === "reflection" && <JournalWorkspace />}
      {view !== "reflection" && (
        <>
          {view !== "overview" && (
            <label className="field-label">
              Progress metric
              <select
                aria-label="Progress metric"
                value={selectedMetric}
                onChange={(e) => choose(view, e.target.value)}
              >
                {(view === "health"
                  ? [
                      ["body", "Weight"],
                      ["nutrition", "Food and nutrients"],
                      ["exercise", "Exercise"],
                      ["wellbeing", "Water, sleep and fasting"],
                    ]
                  : [
                      ["learning", "Focus and study"],
                      ["goals", "Goals, tasks and routines"],
                    ]
                ).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="progress-range-toolbar">
            <div
              role="group"
              aria-label="Progress range"
              className="progress-segmented"
            >
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  aria-pressed={range === days}
                  onClick={() => {
                    setRange(days);
                    periodUrl(through, days);
                  }}
                >
                  {days} days
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm">
                Through date
                <Input
                  type="date"
                  value={d.end}
                  onChange={(e) => {
                    if (validDay(e.target.value)) {
                      setThrough(e.target.value);
                      periodUrl(e.target.value);
                    }
                  }}
                />
              </label>
              <Button
                variant="outline"
                aria-label="Previous progress period"
                onClick={() => shift(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                aria-label="Next progress period"
                onClick={() => shift(1)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              {through && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setThrough(undefined);
                    periodUrl(undefined);
                  }}
                >
                  Back to today
                </Button>
              )}
            </div>
          </div>
          <div className="progress-range-caption">
            <p>
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(`${d.first}T00:00:00Z`))}{" "}
              –{" "}
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(`${d.end}T00:00:00Z`))}{" "}
              · {range} calendar days
            </p>
            <p>
              {syncing
                ? "Updating saved records…"
                : syncError
                  ? "Some records could not sync. Showing available records."
                  : "Based on your saved records. Missing days remain gaps."}
            </p>
          </div>

          {view === "overview" && (
            <div className="progress-summary-grid">
              {[
                [
                  "body",
                  "Weight",
                  d.latestWeight
                    ? displayWeight(d.latestWeight.value, prefs.weightUnit)
                    : "Not recorded",
                  "health",
                ],
                ["nutrition", "Food", `${d.foodDays} days logged`, "health"],
                [
                  "exercise",
                  "Exercise",
                  `${d.workoutDays} days logged`,
                  "health",
                ],
                [
                  "wellbeing",
                  "Water and sleep",
                  `${d.waterDays} water days · ${d.sleepDays} sleep days`,
                  "health",
                ],
                [
                  "learning",
                  "Focus and learning",
                  `${Math.round(d.focusMinutes)} focus min · ${Math.round(d.studyMinutes)} study min`,
                  "work",
                ],
                [
                  "goals",
                  "Goals and routines",
                  `${d.completedTasks} tasks completed · ${d.journalDays} journal days`,
                  "work",
                ],
              ].map(([id, label, value, nextView]) => (
                <button
                  className="workspace-panel progress-summary-button"
                  key={id}
                  onClick={() => choose(nextView, id)}
                >
                  <strong>{label}</strong>
                  <span>{value}</span>
                  <small>Explore dated records →</small>
                </button>
              ))}
            </div>
          )}
          <VisibleMetric.Provider
            value={view === "overview" ? "none" : selectedMetric}
          >
            <div className="progress-panel-grid">
              <Panel
                id="body"
                title="Weight"
                href={`/weight-loss?date=${d.end}`}
                action="Log weight"
              >
                <div className="progress-readings">
                  <Reading
                    value={
                      d.latestWeight
                        ? displayWeight(d.latestWeight.value, prefs.weightUnit)
                        : "Not recorded"
                    }
                    label={
                      d.latestWeight
                        ? `Latest · ${shortProgressDate(d.latestWeight.date)}`
                        : "Add your first weigh-in"
                    }
                  />
                  <Reading
                    value={
                      d.weightChange === null
                        ? "—"
                        : displayWeight(d.weightChange, prefs.weightUnit)
                    }
                    label="Change between readings"
                  />
                </div>
                <TrendChart
                  label="Weight trend"
                  unit={prefs.weightUnit}
                  points={d.days.map((day) => ({
                    date: day.date,
                    value:
                      day.weight === null
                        ? null
                        : kgToDisplay(day.weight, prefs.weightUnit),
                  }))}
                />
                <p className="progress-note">
                  {d.weightCount} weigh-ins ·{" "}
                  {weightTarget
                    ? `Saved target: ${displayWeight(weightTarget, prefs.weightUnit)}`
                    : "No weight target set."}{" "}
                  {d.weightCount === 1
                    ? "A second reading is needed for a trend."
                    : ""}
                </p>
              </Panel>
              <Panel
                id="nutrition"
                title="Food and nutrients"
                href={`/food?date=${d.end}`}
                action="Log food"
              >
                <div className="progress-readings">
                  <Reading
                    value={number(d.nutrients.energy.average, "kcal")}
                    label="Average calories / known day"
                  />
                  <Reading
                    value={`${d.foodDays}/${range}`}
                    label={`Days with food logged · ${d.foodCount} entries`}
                  />
                </div>
                <TrendChart
                  label="Daily known calories"
                  unit="kcal"
                  bars
                  points={points("energy")}
                />
                <div className="progress-macro-row">
                  {(["protein", "carbs", "fat", "fibre"] as NutrientKey[]).map(
                    (key) => (
                      <div key={key}>
                        <span>{NUTRIENTS[key].label}</span>
                        <strong>
                          {number(
                            d.nutrients[key].average,
                            NUTRIENTS[key].unit,
                          )}
                        </strong>
                        <small>
                          {d.nutrients[key].recordedDays} known days
                        </small>
                      </div>
                    ),
                  )}
                </div>
                <p className="progress-note">
                  Recorded-day averages use known values only. Partial food
                  entries can understate totals.
                </p>
                <details className="progress-nutrient-detail">
                  <summary>All nutrients, coverage and saved targets</summary>
                  <div className="progress-table-scroll">
                    <table>
                      <caption className="sr-only">
                        Nutrient averages, known entry coverage and daily
                        targets
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Nutrient</th>
                          <th scope="col">Daily average</th>
                          <th scope="col">Coverage</th>
                          <th scope="col">Saved daily target</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Object.keys(NUTRIENTS) as NutrientKey[]).map(
                          (key) => {
                            const target = targets[key];
                            return (
                              <tr key={key}>
                                <th scope="row">{NUTRIENTS[key].label}</th>
                                <td>
                                  {number(
                                    d.nutrients[key].average,
                                    NUTRIENTS[key].unit,
                                  )}
                                </td>
                                <td>
                                  {d.nutrients[key].knownEntries}/{d.foodCount}{" "}
                                  entries
                                </td>
                                <td>
                                  {target && !target.deleted
                                    ? `${target.kind === "limit" ? "Limit" : "Reference"}: ${number(target.amount, NUTRIENTS[key].unit)}`
                                    : "Not set"}
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              </Panel>
              <Panel
                id="exercise"
                title="Exercise"
                href={`/workout-tracking?date=${d.end}`}
                action="Log exercise"
              >
                <div className="progress-readings">
                  <Reading
                    value={d.workoutDays}
                    label="Days with exercise recorded"
                  />
                  <Reading
                    value={d.setCount}
                    label={`${d.exerciseCount} exercise records · saved sets`}
                  />
                </div>
                <TrendChart
                  label="Daily exercise records"
                  unit="exercises"
                  bars
                  points={points("exercise")}
                />
                <details>
                  <summary>Sets, repetitions and recorded load</summary>
                  <ul className="progress-fact-list">
                    <li>
                      <span>Repetitions recorded</span>
                      <strong>{d.repCount}</strong>
                    </li>
                    <li>
                      <span>Known load × reps ({prefs.weightUnit})</span>
                      <strong>
                        {d.loadVolumeKg === null
                          ? "Not recorded"
                          : Math.round(
                              kgToDisplay(d.loadVolumeKg, prefs.weightUnit),
                            )}
                      </strong>
                    </li>
                    <li>
                      <span>Sets with a known load</span>
                      <strong>
                        {d.knownLoadSets}/{d.setCount}
                      </strong>
                    </li>
                  </ul>
                  <p className="progress-note">
                    External load only; body weight and unknown loads are not
                    estimated.
                  </p>
                </details>
                <p className="progress-note">
                  {number(d.exerciseMinutes, "min")} of recorded duration. Your
                  schedule: {prefs.workoutDaysPerWeek} days/week. Strength sets
                  do not imply a duration or calories burned.
                </p>
              </Panel>
              <Panel
                id="wellbeing"
                title="Water and sleep"
                href={`/health?date=${d.end}`}
                action="Update health"
              >
                <div className="progress-readings">
                  <Reading
                    value={
                      d.waterDays
                        ? number(d.waterTotal / d.waterDays, "glasses")
                        : "Not recorded"
                    }
                    label={`Average water · ${d.waterDays} logged days`}
                  />
                  <Reading
                    value={number(d.sleepAverage, "h")}
                    label={`Average sleep · ${d.sleepDays} logged days`}
                  />
                </div>
                <TrendChart
                  label="Daily water"
                  unit="glasses"
                  bars
                  points={points("water")}
                />
                <div className="progress-inline-actions">
                  <Link href="/intermittent-fasting">Log water</Link>
                  <Link href={`/health?date=${d.end}`}>Record sleep</Link>
                </div>
                <p className="progress-note">
                  {d.fastCount} completed fasts · {number(d.fastHours, "h")}{" "}
                  recorded. Unfinished fasts are excluded.
                </p>
                <details>
                  <summary>Sleep trend</summary>
                  <TrendChart
                    label="Sleep duration"
                    unit="hours"
                    points={points("sleep")}
                  />
                </details>
              </Panel>
              <Panel
                id="learning"
                title="Focus"
                href="/plan#focus-sprint"
                action="Start session"
              >
                <div className="progress-readings">
                  <Reading
                    value={`${d.focusMinutes} min`}
                    label={`${d.focusSessions} completed focus sessions`}
                  />
                  <Reading
                    value={`${d.studyMinutes} min`}
                    label={`${d.studySessions} saved study sessions`}
                  />
                </div>
                <TrendChart
                  label="Daily focus minutes"
                  unit="minutes"
                  bars
                  points={points("focus")}
                />
                <p className="progress-note">
                  Focus and study remain separate records. Cancelled sessions
                  are excluded.
                </p>
                <details>
                  <summary>Study progress</summary>
                  <TrendChart
                    label="Daily study minutes"
                    unit="minutes"
                    bars
                    points={points("study")}
                  />
                  <Link href="/roadmap" className="progress-text-action">
                    Open roadmap and study evidence →
                  </Link>
                </details>
              </Panel>
              <Panel
                id="goals"
                title="Goals and routines"
                href="/goal"
                action="Update goal"
              >
                <p className="progress-goal-title">{displayGoalTitle(prefs)}</p>
                <div className="progress-readings">
                  <Reading
                    value={
                      milestones.length
                        ? `${milestones.filter((item) => item.done).length}/${milestones.length}`
                        : "Not set"
                    }
                    label="Current goal milestones completed"
                  />
                  <Reading
                    value={d.completedTasks}
                    label="Tasks completed in this range"
                  />
                </div>
                <ul className="progress-fact-list">
                  <li>
                    <span>Tasks pending now</span>
                    <strong>{tasks.filter((item) => !item.done).length}</strong>
                  </li>
                  <li>
                    <span>Routine completion records</span>
                    <strong>{d.routineCompleted}</strong>
                  </li>
                  <li>
                    <span>Habit completion records</span>
                    <strong>{d.habitsCompleted}</strong>
                  </li>
                  {prefs.dailyMetricLabel && (
                    <li>
                      <span>{prefs.dailyMetricLabel} · recorded total</span>
                      <strong>{number(d.goalMetricTotal)}</strong>
                    </li>
                  )}
                </ul>
                <p className="progress-note">
                  Journal days recorded in this range: {d.journalDays}.
                </p>
                {(prefs.dailyMetricLabel || d.goalMetricDays > 0) && (
                  <details className="progress-details">
                    <summary>
                      Goal metric trend · {d.goalMetricDays} recorded days
                    </summary>
                    <TrendChart
                      label={prefs.dailyMetricLabel || "Goal metric"}
                      unit={prefs.dailyMetricLabel || "units"}
                      points={d.days.map((day) => ({
                        date: day.date,
                        value: day.goalMetric,
                      }))}
                    />
                  </details>
                )}
                <p className="progress-note">
                  Milestones and pending tasks are current snapshots. Completion
                  records use the selected date range.
                </p>
                <div className="progress-inline-actions">
                  <Link href="/todo">Manage tasks</Link>
                  <Link href="/routine">Routine history</Link>
                  <Link href="/review">Detailed review</Link>
                  <Link href="/log">Journal</Link>
                </div>
              </Panel>
            </div>
          </VisibleMetric.Provider>
        </>
      )}
    </div>
  );
}

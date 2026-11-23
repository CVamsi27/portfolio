"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Droplets,
  Flame,
  Footprints,
  HeartPulse,
  Moon,
  RefreshCw,
  Scale,
  Smartphone,
  WifiOff,
} from "lucide-react";
import { useUserPrefs } from "@/lib/user-prefs";
import { useNow } from "@/lib/tracker-store";
import { zonedDate } from "@/lib/routine-reminders";
import { displayWeight } from "@/lib/health";
import { calendarZone, validDay } from "@/lib/day-plan";
import { useHealthConnectSummary } from "@/lib/use-health-connect-summary";
import { Button } from "@/components/ui/button";
import DaySelector from "./DaySelector";
import HealthConnections from "@/components/health/HealthConnections";
import PageHeader from "@/components/trackers/PageHeader";
import MetricRingCard from "@/components/charts/MetricRingCard";
import MultiSeriesBarChart from "@/components/charts/MultiSeriesBarChart";
import SmoothTrendChart from "@/components/charts/SmoothTrendChart";
import { shortProgressDate } from "@/components/progress/TrendChart";

const STEP_GOAL = 8000;
const SLEEP_GOAL_MINS = 450; // 7.5 hours
const EXERCISE_GOAL_MINS = 45;

function fmtHours(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function HealthWorkspace() {
  const params = useSearchParams();
  const router = useRouter();
  const { prefs } = useUserPrefs();
  const now = useNow(30000);
  const today = zonedDate(now, calendarZone(prefs.timeZone));
  const date = validDay(params.get("date")) ? params.get("date")! : today;
  const rawView = params.get("view") ?? "today";
  const view =
    rawView === "connections" || rawView === "history" ? rawView : "today";
  const retiredNotice = params.get("notice") === "retired-manual";

  const [range, setRange] = useState<7 | 30 | 90>(30);
  const health = useHealthConnectSummary(
    view === "history" ? 30 : range,
    date,
  );

  const stepsBars = health.progress.steps.map((pt) => ({
    label: shortProgressDate(pt.date),
    date: pt.date,
    value: pt.value,
  }));

  const sleepBars = health.progress.sleep.map((pt) => {
    const stages = health.progress.sleepStagesByDate[pt.date];
    const hasStages =
      stages && stages.deep + stages.rem + stages.light + stages.sleeping > 0;
    return {
      label: shortProgressDate(pt.date),
      date: pt.date,
      value: pt.value !== null ? Number((pt.value / 60).toFixed(1)) : null,
      segments: hasStages
        ? [
            {
              key: "deep",
              label: "Deep",
              value: Number((stages.deep / 60).toFixed(2)),
              color: "#6366f1",
            },
            {
              key: "rem",
              label: "REM",
              value: Number((stages.rem / 60).toFixed(2)),
              color: "#8b5cf6",
            },
            {
              key: "light",
              label: "Light / Asleep",
              value: Number(((stages.light + stages.sleeping) / 60).toFixed(2)),
              color: "#38bdf8",
            },
          ].filter((s) => s.value > 0)
        : undefined,
    };
  });

  const exerciseBars = health.progress.exercise.map((pt) => ({
    label: shortProgressDate(pt.date),
    date: pt.date,
    value: pt.value,
  }));

  const historyRows = [...health.progress.steps]
    .map((pt, idx) => ({
      date: pt.date,
      steps: pt.value,
      sleep: health.progress.sleep[idx]?.value ?? null,
      weight: health.progress.weight[idx]?.value ?? null,
      exercise: health.progress.exercise[idx]?.value ?? null,
      calories: health.progress.active_calories[idx]?.value ?? null,
      hydration: health.progress.hydration[idx]?.value ?? null,
      restingHr: health.progress.resting_hr[idx]?.value ?? null,
    }))
    .filter(
      (row) =>
        row.steps !== null ||
        row.sleep !== null ||
        row.weight !== null ||
        row.exercise !== null ||
        row.calories !== null ||
        row.hydration !== null ||
        row.restingHr !== null,
    )
    .reverse();

  return (
    <div className="daily-workspace space-y-6" data-testid="health-workspace">
      <PageHeader
        compact
        eyebrow="Google Health Connect"
        title="Health"
        subtitle="Read-only daily metrics synced automatically from Google Health Connect."
        context={
          <DaySelector
            date={date}
            today={today}
            onChange={(day) =>
              router.replace(`/health?view=${view}&date=${day}`)
            }
          />
        }
      />

      {retiredNotice && (
        <div
          role="status"
          className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          Manual food, water, exercise, fasting, and weigh-in forms have been
          removed. All health tracking here syncs automatically from{" "}
          <strong>Google Health Connect</strong>. Historical records remain
          exportable in{" "}
          <Link href="/settings?view=data" className="text-primary underline">
            Settings → Data
          </Link>
          .
        </div>
      )}

      {/* Connection Status Banner */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/90 px-4 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          {health.connectedDevice ? (
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          ) : (
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <WifiOff className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {health.connectedDevice
                ? `Connected: ${health.connectedDevice.label}`
                : "Connect Google Health Connect"}
            </p>
            <p className="text-xs text-muted-foreground">
              {health.connectedDevice
                ? health.connectedDevice.lastSyncAt
                  ? `Last synced ${new Date(health.connectedDevice.lastSyncAt).toLocaleString()}`
                  : "Paired — open NOVA Health Sync on your Android phone and tap Sync now."
                : "Pair your Android phone (or import a Health Connect JSON export) to populate daily steps, sleep, workouts, and weight."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={health.refresh}
            disabled={health.loading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${health.loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {view !== "connections" && (
            <Link
              href={`/health?view=connections&date=${date}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Smartphone className="h-3.5 w-3.5" />
              {health.connectedDevice ? "Manage device" : "Pair device"}
            </Link>
          )}
        </div>
      </section>

      <nav className="workspace-views" aria-label="Health views">
        {(
          [
            ["today", "Overview & graphs"],
            ["history", "30-day log"],
            ["connections", "Google Health setup"],
          ] as const
        ).map(([id, label]) => (
          <Link
            key={id}
            aria-current={view === id ? "page" : undefined}
            href={`/health?view=${id}&date=${date}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {health.error && (
        <p role="alert" className="text-sm text-destructive">
          {health.error}
        </p>
      )}

      {view === "connections" ? (
        <HealthConnections date={date} />
      ) : view === "history" ? (
        <section className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Synced daily log
              </h2>
              <p className="text-xs text-muted-foreground">
                Last 30 days through {date} from Google Health Connect.
              </p>
            </div>
          </div>
          {historyRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
              No synced Google Health records in the last 30 days.{" "}
              <Link
                href={`/health?view=connections&date=${date}`}
                className="text-primary underline"
              >
                Pair your phone or import an archive
              </Link>
              .
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Steps</th>
                    <th className="py-2 pr-4 font-medium">Sleep</th>
                    <th className="py-2 pr-4 font-medium">Exercise</th>
                    <th className="py-2 pr-4 font-medium">Active kcal</th>
                    <th className="py-2 pr-4 font-medium">Weight</th>
                    <th className="py-2 font-medium">Resting HR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 tabular-nums">
                  {historyRows.map((row) => (
                    <tr key={row.date} className="hover:bg-muted/30">
                      <td className="py-2.5 pr-4 font-medium">
                        <Link
                          href={`/health?date=${row.date}`}
                          className="text-primary hover:underline"
                        >
                          {row.date}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4">
                        {row.steps !== null ? row.steps.toLocaleString() : "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        {row.sleep !== null ? fmtHours(row.sleep) : "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        {row.exercise !== null ? `${row.exercise}m` : "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        {row.calories !== null
                          ? `${Math.round(row.calories)} kcal`
                          : "—"}
                      </td>
                      <td className="py-2.5 pr-4">
                        {row.weight !== null
                          ? displayWeight(row.weight, prefs.weightUnit)
                          : "—"}
                      </td>
                      <td className="py-2.5">
                        {row.restingHr !== null
                          ? `${Math.round(row.restingHr)} bpm`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <div className="space-y-6">
          {/* Today's Vitals Bento */}
          <section
            aria-label={`Google Health vitals for ${date}`}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <MetricRingCard
              label="Daily steps"
              value={
                health.summary.todaySteps !== null
                  ? health.summary.todaySteps.toLocaleString()
                  : "—"
              }
              sublabel={
                health.summary.avgSteps !== null
                  ? `${range}d avg: ${Math.round(health.summary.avgSteps).toLocaleString()}`
                  : `Goal: ${STEP_GOAL.toLocaleString()} steps`
              }
              progress={{
                current: health.summary.todaySteps ?? 0,
                target: STEP_GOAL,
                unit: "steps",
              }}
              ring
              tone="emerald"
              icon={<Footprints className="h-4 w-4" />}
            />

            <MetricRingCard
              label="Sleep duration"
              value={
                health.summary.todaySleepMinutes !== null
                  ? fmtHours(health.summary.todaySleepMinutes)
                  : "—"
              }
              sublabel={
                health.summary.todaySleepStages
                  ? `Deep ${health.summary.todaySleepStages.deep}m · REM ${health.summary.todaySleepStages.rem}m`
                  : health.summary.avgSleepMinutes !== null
                    ? `${range}d avg: ${fmtHours(health.summary.avgSleepMinutes)}`
                    : "Target: 7h 30m"
              }
              progress={{
                current: health.summary.todaySleepMinutes ?? 0,
                target: SLEEP_GOAL_MINS,
              }}
              ring
              tone="violet"
              icon={<Moon className="h-4 w-4" />}
            />

            <MetricRingCard
              label="Synced exercise"
              value={
                health.summary.todayExerciseMinutes !== null
                  ? `${health.summary.todayExerciseMinutes} min`
                  : "—"
              }
              sublabel={
                health.summary.todayExerciseSessions.length > 0
                  ? health.summary.todayExerciseSessions
                      .map((s) => `${s.title || s.activityType} (${s.minutes}m)`)
                      .join(", ")
                  : health.summary.todayActiveCalories !== null
                    ? `${Math.round(health.summary.todayActiveCalories)} active kcal`
                    : "Auto-synced from Health Connect"
              }
              progress={{
                current: health.summary.todayExerciseMinutes ?? 0,
                target: EXERCISE_GOAL_MINS,
                unit: "min",
              }}
              ring
              tone="amber"
              icon={<Activity className="h-4 w-4" />}
            />

            <MetricRingCard
              label="Body weight"
              value={
                health.summary.latestWeight?.value != null
                  ? displayWeight(
                      health.summary.latestWeight.value,
                      prefs.weightUnit,
                    )
                  : "—"
              }
              sublabel={
                health.summary.latestWeight
                  ? `Synced ${health.summary.latestWeight.date}`
                  : "Waiting for Health Connect weigh-in"
              }
              delta={
                health.summary.weightDelta !== null
                  ? `${health.summary.weightDelta > 0 ? "+" : ""}${health.summary.weightDelta} kg vs prior`
                  : null
              }
              tone="sky"
              icon={<Scale className="h-4 w-4" />}
            />
          </section>

          {/* Optional Extended Vitals Row (Active Calories, Hydration, Resting HR) */}
          {(health.summary.todayActiveCalories !== null ||
            health.summary.todayHydrationMl !== null ||
            health.summary.todayRestingHr !== null) && (
            <section className="grid gap-4 sm:grid-cols-3">
              {health.summary.todayActiveCalories !== null && (
                <MetricRingCard
                  label="Active calories"
                  value={`${Math.round(health.summary.todayActiveCalories)} kcal`}
                  sublabel="Health Connect daily aggregate"
                  tone="amber"
                  icon={<Flame className="h-4 w-4" />}
                />
              )}
              {health.summary.todayHydrationMl !== null && (
                <MetricRingCard
                  label="Synced hydration"
                  value={`${(health.summary.todayHydrationMl / 1000).toFixed(1)} L`}
                  sublabel={`${Math.round(health.summary.todayHydrationMl)} ml via Health Connect`}
                  progress={{
                    current: health.summary.todayHydrationMl,
                    target: 2500,
                    unit: "ml",
                  }}
                  tone="sky"
                  icon={<Droplets className="h-4 w-4" />}
                />
              )}
              {health.summary.todayRestingHr !== null && (
                <MetricRingCard
                  label="Resting heart rate"
                  value={`${Math.round(health.summary.todayRestingHr)} bpm`}
                  sublabel="Synced from wearable via Health Connect"
                  tone="rose"
                  icon={<HeartPulse className="h-4 w-4" />}
                />
              )}
            </section>
          )}

          {/* Range Toolbar + Multi-Chart Graphs Grid */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Health trends ({health.from} → {health.to})
              </h2>
              <p className="text-xs text-muted-foreground">
                Every graph reads directly from Google Health Connect — missing
                days stay honest gaps.
              </p>
            </div>
            <div className="inline-flex rounded-xl border border-border/70 bg-card p-1">
              {([7, 30, 90] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRange(days)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                    range === days
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-border/70 bg-card/90 p-5">
              <MultiSeriesBarChart
                title="Daily steps"
                subtitle="Google Health Connect priority aggregate"
                data={stepsBars}
                unit="steps"
                goal={STEP_GOAL}
                goalLabel="8k goal"
                barColor="fill-emerald-500"
                emptyCopy="No synced steps in this range. Connect your Android phone under Google Health setup."
              />
            </section>

            <section className="rounded-2xl border border-border/70 bg-card/90 p-5">
              <MultiSeriesBarChart
                title="Nightly sleep & stages"
                subtitle="Hours asleep with Deep / REM / Light breakdown when available"
                data={sleepBars}
                unit="hrs"
                goal={7.5}
                goalLabel="7.5h target"
                barColor="fill-violet-500"
                legend={[
                  { label: "Deep", color: "#6366f1" },
                  { label: "REM", color: "#8b5cf6" },
                  { label: "Light / Asleep", color: "#38bdf8" },
                ]}
                emptyCopy="No synced sleep sessions in this range."
              />
            </section>

            <section className="rounded-2xl border border-border/70 bg-card/90 p-5">
              <SmoothTrendChart
                title="Weight trend"
                subtitle="Synced readings with 7-day moving average"
                points={health.progress.weight}
                unit="kg"
                stroke="#0ea5e9"
                emptyCopy="No synced weight readings in this range."
              />
            </section>

            <section className="rounded-2xl border border-border/70 bg-card/90 p-5">
              <MultiSeriesBarChart
                title="Exercise minutes"
                subtitle="Workouts synced from Google Health Connect"
                data={exerciseBars}
                unit="min"
                goal={EXERCISE_GOAL_MINS}
                goalLabel="45m target"
                barColor="fill-amber-500"
                emptyCopy="No synced exercise sessions in this range yet."
              />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

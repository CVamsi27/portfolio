"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Briefcase,
  Clock,
  Footprints,
  ArrowUpRight,
} from "lucide-react";
import { shiftDay, validDay } from "@/lib/day-plan";
import { usePersonalProgress } from "@/lib/use-personal-progress";
import { useCareerWorkflow } from "@/lib/career-workflow-store";
import { careerReview } from "@/lib/career-workflow";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useHealthConnectSummary } from "@/lib/use-health-connect-summary";
import type { CompletedChapterRecord } from "@/lib/study-focus";
import curriculum from "@/data/career-curriculum.json";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/trackers/PageHeader";
import MetricRingCard from "@/components/charts/MetricRingCard";
import HiringFunnelChart from "@/components/charts/HiringFunnelChart";
import StudyStackBars from "@/components/charts/StudyStackBars";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import MultiSeriesBarChart from "@/components/charts/MultiSeriesBarChart";
import SmoothTrendChart from "@/components/charts/SmoothTrendChart";
import { shortProgressDate } from "./TrendChart";
import ProgressChart from "./ProgressChart";
import ImportedHealthTrends from "./ImportedHealthTrends";
import CareerOutcomesSummary from "@/components/career/CareerOutcomesSummary";
import {
  PROGRESS_METRICS,
  type ProgressMetric,
} from "@/lib/progress-presentation";

const HEALTH_METRICS: ProgressMetric[] = [
  "weight",
  "energy",
  "protein",
  "exercise",
  "sets",
  "water",
  "sleep",
];
const WORK_METRICS: ProgressMetric[] = [
  "focus",
  "study",
  "tasks",
  "goal",
  "routine",
];
const LEGACY_METRICS: Record<string, ProgressMetric> = {
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
    LEGACY_METRICS[params.get("metric") || hash] ||
    params.get("metric") ||
    "weight";
  const [view, setView] = useState(
    params.get("view") === "reflection"
      ? "reflection"
      : params.get("view") === "work" ||
          WORK_METRICS.includes(initialMetric as ProgressMetric)
        ? "work"
        : "health",
  );
  const [metric, setMetric] = useState<ProgressMetric>(
    initialMetric in PROGRESS_METRICS
      ? (initialMetric as ProgressMetric)
      : "weight",
  );
  const [range, setRange] = useState<7 | 30 | 90>(() => {
    const r = Number(params.get("range"));
    return r === 7 || r === 90 ? r : 30;
  });
  const [through, setThrough] = useState<string | undefined>(
    validDay(params.get("date")) ? params.get("date")! : undefined,
  );
  const updateMetricView = (nextView: string, nextMetric: ProgressMetric) => {
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
      : (view === "work" ? WORK_METRICS : HEALTH_METRICS).includes(metric)
        ? metric
        : view === "work"
          ? "focus"
          : "weight";

  const { data } = usePersonalProgress(range, through);
  const { data: heatData } = usePersonalProgress(84, through);
  const workflow = useCareerWorkflow();
  const health = useHealthConnectSummary(range, data.end);
  const { value: completedChapters } = useSyncedStorage<
    CompletedChapterRecord[]
  >("study:completed_chapters", []);

  const completedIdSet = useMemo(
    () => new Set((completedChapters ?? []).map((c) => c.chapterId)),
    [completedChapters],
  );

  const essentialTotal = useMemo(
    () =>
      curriculum.days
        .flatMap((d) => d.chapters ?? [])
        .filter((c) => c.rolePriority === "Essential").length,
    [],
  );

  const essentialDone = useMemo(
    () =>
      curriculum.days
        .flatMap((d) => d.chapters ?? [])
        .filter(
          (c) => c.rolePriority === "Essential" && completedIdSet.has(c.id),
        ).length,
    [completedIdSet],
  );

  const review = useMemo(
    () => careerReview(workflow.activities.value, data.end),
    [workflow.activities.value, data.end],
  );

  const allActivities = useMemo(
    () =>
      Object.values(workflow.activities.value).filter((a) => !a.deleted),
    [workflow.activities.value],
  );

  const funnelStages = useMemo(() => {
    const inRange = allActivities.filter(
      (a) => a.date >= data.first && a.date <= data.end,
    );
    const countKind = (k: string) =>
      inRange.filter((a) => a.kind === k).length;
    return [
      {
        id: "applied",
        label: "Applications submitted",
        count: countKind("application"),
        target: Math.round((range / 7) * 15),
        tone: "primary" as const,
      },
      {
        id: "outreach",
        label: "Warm / referral & contract outreach",
        count: countKind("outreach") + countKind("proposal"),
        target: Math.round((range / 7) * 15),
        tone: "sky" as const,
      },
      {
        id: "conversations",
        label: "Replies & live conversations",
        count: countKind("conversation"),
        tone: "violet" as const,
      },
      {
        id: "interviews",
        label: "Interviews booked",
        count: countKind("interview"),
        tone: "amber" as const,
      },
      {
        id: "agreements",
        label: "Offers / paid agreements",
        count: countKind("agreement") + countKind("payment"),
        tone: "emerald" as const,
      },
    ];
  }, [allActivities, data.first, data.end, range]);

  const weeklyFocusMinutes = useMemo(() => {
    const weekStart = shiftDay(data.end, -6);
    return data.days
      .filter((d) => d.date >= weekStart && d.date <= data.end)
      .reduce((sum, d) => sum + (d.focus ?? 0) + (d.study ?? 0), 0);
  }, [data.days, data.end]);

  const focusBars = useMemo(
    () =>
      data.days.map((d) => {
        const focusM = d.focus ?? 0;
        const studyM = d.study ?? 0;
        const total = focusM + studyM;
        return {
          label: shortProgressDate(d.date),
          date: d.date,
          value: total > 0 ? total : null,
          segments:
            total > 0
              ? [
                  {
                    key: "focus",
                    label: "Deep focus",
                    value: focusM,
                    color: "#6366f1",
                  },
                  {
                    key: "study",
                    label: "Study Bible",
                    value: studyM,
                    color: "#10b981",
                  },
                ].filter((s) => s.value > 0)
              : undefined,
        };
      }),
    [data.days],
  );

  const heatmapDays = useMemo(() => {
    const careerByDay = new Map<string, number>();
    for (const act of allActivities) {
      careerByDay.set(act.date, (careerByDay.get(act.date) ?? 0) + 1);
    }
    const chaptersByDay = new Map<string, number>();
    for (const ch of completedChapters ?? []) {
      const dayKey = ch.completedAt?.slice(0, 10);
      if (dayKey)
        chaptersByDay.set(dayKey, (chaptersByDay.get(dayKey) ?? 0) + 1);
    }
    return heatData.days.map((d) => {
      const careerN = careerByDay.get(d.date) ?? 0;
      const studyN = chaptersByDay.get(d.date) ?? 0;
      const focusN = d.focus && d.focus >= 25 ? 1 : 0;
      const taskN = d.tasks ?? 0;
      const total = careerN + studyN + focusN + taskN;
      return {
        date: d.date,
        count: total,
        detail: `${careerN} career · ${studyN} chapters · ${d.focus ?? 0}m focus · ${taskN} tasks`,
      };
    });
  }, [heatData.days, allActivities, completedChapters]);

  const stepsBars = useMemo(
    () =>
      health.progress.steps.map((pt) => ({
        label: shortProgressDate(pt.date),
        date: pt.date,
        value: pt.value,
      })),
    [health.progress.steps],
  );

  const changeThrough = (date: string) => {
    if (!validDay(date)) return;
    const url = new URL(window.location.href);
    url.searchParams.set("date", date);
    window.history.replaceState(null, "", url);
    setThrough(date);
  };

  return (
    <div
      className="progress-workspace space-y-6"
      data-testid="progress-dashboard"
    >
      <PageHeader
        compact
        eyebrow="Analytics & progress"
        title="Progress"
        subtitle="Clear trends across hiring, deep study, consistency, and Google Health Connect."
        context={
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Through date</span>
              <Input
                type="date"
                className="h-9 w-auto rounded-xl"
                value={data.end}
                onInput={(event) => changeThrough(event.currentTarget.value)}
                onChange={(event) => changeThrough(event.currentTarget.value)}
              />
            </label>
            {through && (
              <button
                type="button"
                className="rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs font-medium text-primary hover:border-primary/40"
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
        }
      />

      {/* Top 4 Executive KPI Cards */}
      <section
        aria-label="Key performance indicators"
        className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricRingCard
          label="Weekly applications"
          value={`${review.applications}`}
          sublabel={`${review.outreaches} outreach · ${review.interviews} interviews`}
          progress={{ current: review.applications, target: 15, unit: "apps" }}
          ring
          tone="primary"
          icon={<Briefcase className="h-4 w-4" />}
          href="/roadmap?view=opportunities"
        />
        <MetricRingCard
          label="Study Bible essential"
          value={`${essentialDone}/${essentialTotal}`}
          sublabel={`${completedIdSet.size} total chapters mastered`}
          progress={{ current: essentialDone, target: essentialTotal }}
          ring
          tone="emerald"
          icon={<BookOpen className="h-4 w-4" />}
          href="/roadmap?view=study"
        />
        <MetricRingCard
          label="Focus & study (7d)"
          value={`${(weeklyFocusMinutes / 60).toFixed(1)}h`}
          sublabel="Against 32h weekly capacity"
          progress={{ current: weeklyFocusMinutes / 60, target: 32, unit: "hrs" }}
          ring
          tone="violet"
          icon={<Clock className="h-4 w-4" />}
          href="/plan?view=focus"
        />
        <MetricRingCard
          label="Google Health avg"
          value={
            health.summary.avgSteps !== null
              ? `${Math.round(health.summary.avgSteps).toLocaleString()}`
              : "—"
          }
          sublabel={
            health.summary.avgSleepMinutes !== null
              ? `steps/d · ${(health.summary.avgSleepMinutes / 60).toFixed(1)}h avg sleep`
              : "Connect Google Health on Health tab"
          }
          progress={{
            current: health.summary.avgSteps ?? 0,
            target: 8000,
            unit: "steps",
          }}
          ring
          tone="sky"
          icon={<Footprints className="h-4 w-4" />}
          href="/health"
        />
      </section>

      {/* Primary Interactive Trend Explorer */}
      <div className="space-y-3">
        <nav
          className="workspace-views"
          aria-label="Progress views"
        >
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
                updateMetricView(
                  id,
                  id === "work" ? "focus" : "weight",
                )
              }
            >
              {label}
            </button>
          ))}
        </nav>

        <ProgressChart
          metric={chosen}
          endDate={through}
          range={range}
          onRangeChange={(days) => setRange(days)}
          options={
            view === "reflection"
              ? undefined
              : view === "work"
                ? WORK_METRICS
                : HEALTH_METRICS
          }
          onMetric={(next) => updateMetricView(view, next)}
        />

        {view === "reflection" && (
          <section className="rounded-2xl border border-border/70 bg-card/90 px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="inline-action"
                href={`/log?view=journal&date=${data.end}&returnTo=${encodeURIComponent(`/dashboard?view=reflection&date=${data.end}`)}`}
              >
                Write or edit reflection
              </Link>
              <Link className="inline-action" href={`/review?date=${data.end}`}>
                Open the weekly review
              </Link>
            </div>
          </section>
        )}

        {view === "health" && (
          <details className="workspace-disclosure">
            <summary>Imported health records & sources</summary>
            <ImportedHealthTrends from={data.first} to={data.end} />
          </details>
        )}
      </div>

      {/* Compact Career Outcomes Strip */}
      <CareerOutcomesSummary date={data.end} />

      {/* Primary Analytics Bento Grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="min-w-0">
          <HiringFunnelChart
            stages={funnelStages}
            title={`Hiring funnel (${data.first} → ${data.end})`}
            subtitle="Recorded actual sends, outreach, conversations, and interviews"
          />
        </div>
        <div className="min-w-0">
          <StudyStackBars completedIds={completedIdSet} essentialOnly />
        </div>
      </div>

      {/* Consistency Heatmap */}
      <ActivityHeatmap days={heatmapDays} />

      {/* Deep Work + Google Health Trends Grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-border/70 bg-card/90 p-5">
          <MultiSeriesBarChart
            title="Daily focus & study minutes"
            subtitle={`${data.first} → ${data.end}`}
            data={focusBars}
            unit="min"
            goal={360}
            goalLabel="6h day"
            legend={[
              { label: "Deep focus", color: "#6366f1" },
              { label: "Study Bible", color: "#10b981" },
            ]}
            emptyCopy="Start a focus session on Plan or master a study chapter to populate this chart."
          />
        </section>

        <section className="min-w-0 rounded-2xl border border-border/70 bg-card/90 p-5">
          <MultiSeriesBarChart
            title="Google Health · Daily steps"
            subtitle="Auto-synced priority aggregate"
            data={stepsBars}
            unit="steps"
            goal={8000}
            goalLabel="8k goal"
            barColor="fill-emerald-500"
            emptyCopy="Pair your Android phone in Health → Google Health setup to see step trends."
            headerAction={
              <Link
                href={`/health?view=connections&date=${data.end}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Connect Google Health →
              </Link>
            }
          />
        </section>

        <section className="min-w-0 rounded-2xl border border-border/70 bg-card/90 p-5 lg:col-span-2">
          <SmoothTrendChart
            title="Google Health · Body weight trend"
            subtitle="Synced readings with 7-day moving average"
            points={health.progress.weight}
            unit="kg"
            stroke="#0ea5e9"
            emptyCopy="Weight readings synced via Google Health Connect will chart automatically here."
            headerAction={
              <Link
                href={`/health?view=connections&date=${data.end}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Google Health setup →
              </Link>
            }
          />
        </section>
      </div>

      {/* Review Shortcuts */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/90 px-5 py-4">
        <div>
          <p className="text-sm font-semibold">Close the weekly feedback loop</p>
          <p className="text-xs text-muted-foreground">
            Audit conversion rates, capture interview lessons, and pick Monday&apos;s #1 priority.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/review?date=${data.end}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Open Weekly Review <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/log?view=journal&date=${data.end}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border/70 bg-background px-4 text-xs font-medium text-foreground hover:border-primary/40"
          >
            Write Daily Reflection
          </Link>
        </div>
      </section>
    </div>
  );
}

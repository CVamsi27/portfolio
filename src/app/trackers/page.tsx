"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TrackerShell from "@/components/trackers/TrackerShell";
import Ring, { type RingSegment } from "@/components/trackers/Ring";
import MiniBars from "@/components/trackers/MiniBars";
import EmptyState from "@/components/trackers/EmptyState";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { useUserPrefs, metricFor, GOAL_CATEGORIES, displayGoalTitle } from "@/lib/user-prefs";
import {
  type FastHistoryEntry,
  type Todo,
  buildRecentActivity,
  buildWeekReview,
  calculateStreak,
  dateKey,
  fastHoursByDay,
  formatDelta,
  milestonesFor,
  protocolById,
  relativeTime,
  weeklyWorkoutStats,
} from "@/lib/trackers";
import {
  useFasting,
  useFastingHistory,
  useGoalState,
  useJournal,
  useMigrateFasting,
  useMigrateGoal,
  useMigrateTodos,
  useMigrateWorkouts,
  useNow,
  useTodos,
  useWorkouts,
} from "@/lib/tracker-store";
import { MOTIVATION_QUOTES } from "@/lib/trackers";
import Questionnaire from "@/components/Questionnaire";
import InstallPrompt from "@/components/InstallPrompt";
import { TrackerIcon, type TrackerIconName } from "@/components/trackers/icons";
import { computeFastingState } from "@/lib/trackers";
import SignalPanel from "@/components/trackers/SignalPanel";
import StoryPanel from "@/components/trackers/StoryPanel";
import { buildDailyChapter, buildNextAction } from "@/lib/command-deck";
import { cn } from "@/lib/utils";
import ActionBlock from "@/components/editorial/ActionBlock";
import {
  Activity,
  Dumbbell,
  Flag,
  ListChecks,
  Plus,
  Sparkles,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";

export default function TrackersHub() {
  useMigrateWorkouts();
  useMigrateFasting();
  useMigrateTodos();
  useMigrateGoal();
  const { prefs, isSetup } = useUserPrefs();
  const [showQ, setShowQ] = useState(false);
  const now = useNow(30_000);

  const { value: fasting, setValue: setFasting } = useFasting();
  const { value: fastHistory } = useFastingHistory();
  const { value: todos, setValue: setTodos } = useTodos();
  const { value: goal, setValue: setGoal } = useGoalState();
  const { value: workouts } = useWorkouts();
  const { value: journal } = useJournal();

  const fastSt = fasting ?? { protocolId: "16-8", phase: "fasting" as const, startedAt: null };
  const fastHist = useMemo(() => (fastHistory ?? []) as FastHistoryEntry[], [fastHistory]);
  const todoList = useMemo(() => (todos ?? []) as Todo[], [todos]);
  const goalSt = useMemo(() => goal ?? { metricByDay: {}, milestonesByCategory: {} }, [goal]);
  const workoutLogs = useMemo(() => workouts ?? {}, [workouts]);
  const journalMap = useMemo(() => journal ?? {}, [journal]);

  const today = dateKey();
  const metric = metricFor(prefs);
  const todayMetric = goalSt.metricByDay?.[today] ?? 0;

  // ── ring segment values ──
  const protocol = protocolById(fastSt.protocolId);
  const derived = computeFastingState(fastSt, now, protocol.fastHours);
  const fastedToday = fastHist.some((h) => (h.mealDate ?? dateKey(new Date(h.end))) === today) || (derived.running && !derived.complete && fastSt.phase === "fasting" && derived.pct > 0.5);
  const fastSeg = fastedToday ? 1 : derived.running && fastSt.phase === "fasting" ? derived.pct / 100 : 0;

  const workoutDone = Object.values(workoutLogs[today] ?? {}).some((l) => l?.done);

  const todayTodos = todoList.filter((t) => t.date === today || (t.date < today && !t.done));
  const doneTodos = todayTodos.filter((t) => t.done).length;
  const todoSeg = todayTodos.length ? doneTodos / todayTodos.length : 0;

  const nextPriorityTodo = todayTodos
    .filter((t) => !t.done && (t.priority === "P1" || t.priority === "P2"))
    .sort((a, b) => (a.priority === b.priority ? a.createdAt - b.createdAt : a.priority === "P1" ? -1 : 1))[0];

  const goalMeta = GOAL_CATEGORIES.find((gc) => gc.id === prefs.goalCategory) ?? GOAL_CATEGORIES[0];
  const goalSeg = Math.min(1, metric.target ? todayMetric / metric.target : 0);

  const ringPct = Math.round(((fastSeg + (workoutDone ? 1 : 0) + todoSeg + goalSeg) / 4) * 100);

  const nextAction = buildNextAction({
    fastRunning: fastSt.startedAt !== null,
    fastLogged: fastedToday,
    workoutDone,
    todoCount: todayTodos.length,
    doneTodos,
    goalPct: goalSeg * 100,
    metricLabel: metric.label,
    nextTask: nextPriorityTodo?.text,
  });
  const nextActionHref = nextAction.startsWith("Protect") || nextAction.startsWith("Log today's")
    ? "/intermittent-fasting"
    : nextAction === "Log the session"
      ? "/workout-tracking"
      : nextAction.startsWith("Write")
        ? "/motivation"
        : nextAction.startsWith("Log ")
          ? "/goal"
          : "/todo";
  const dailyChapter = buildDailyChapter({
    goalTitle: displayGoalTitle(prefs),
    goalLabel: goalMeta.label,
    goalPct: goalSeg * 100,
    ringPct,
    nextAction,
    today,
  });

  const segments: RingSegment[] = [
    { value: fastSeg, color: "#3b82f6", label: "Fasting" },
    { value: workoutDone ? 1 : 0, color: "#10b981", label: "Workout" },
    { value: todoSeg, color: "#f59e0b", label: "Tasks" },
    { value: goalSeg, color: "#d946ef", label: "Goal" },
  ];

  // ── analytics for cards ──
  const weekFastBars = useMemo(() => fastHoursByDay(fastHist, 7, new Date(now)), [fastHist, now]);
  const volumeBars = useMemo(
    () => weeklyWorkoutStats(workoutLogs, 4, new Date(now)).map((w) => ({ label: w.label, value: w.volumeKg })),
    [workoutLogs, now],
  );
  const fastStreak = calculateStreak(fastHist.map((h) => h.mealDate ?? dateKey(new Date(h.end))));
  const workoutStreak = calculateStreak(
    Object.entries(workoutLogs)
      .filter(([, day]) => Object.values(day).some((l) => l?.done))
      .map(([d]) => d),
  );
  const taskStreak = calculateStreak(
    Object.entries(
      todoList.reduce<Record<string, number>>((acc, t) => {
        if (t.done && t.completedAt) {
          const k = new Date(t.completedAt).toISOString().slice(0, 10);
          acc[k] = (acc[k] ?? 0) + 1;
        }
        return acc;
      }, {}),
    )
      .filter(([, n]) => n > 0)
      .map(([k]) => k),
  );

  const milestones = milestonesFor(goalSt, prefs.goalCategory);
  const milestonesDone = milestones.filter((m) => m.done).length;

  const quote = useMemo(() => {
    const deck = MOTIVATION_QUOTES[prefs.motivationStyle] ?? MOTIVATION_QUOTES.discipline;
    let h = 0;
    for (const c of today) h = (h * 31 + c.charCodeAt(0)) % 997;
    return deck[h % deck.length];
  }, [prefs.motivationStyle, today]);

  const weekReview = useMemo(
    () =>
      buildWeekReview(
        {
          fastHistory: fastHist,
          workouts: workoutLogs,
          todos: todoList,
          metricByDay: goalSt.metricByDay ?? {},
          journal: journalMap,
        },
        new Date(now),
      ),
    [fastHist, workoutLogs, todoList, goalSt.metricByDay, journalMap, now],
  );

  const activity = useMemo(
    () =>
      buildRecentActivity(
        {
          fastHistory: fastHist,
          workouts: workoutLogs,
          todos: todoList,
          metricByDay: goalSt.metricByDay ?? {},
          metricLabel: metric.label,
          journal: journalMap,
        },
        now,
      ),
    [fastHist, workoutLogs, todoList, goalSt.metricByDay, metric.label, journalMap, now],
  );

  // ── quick actions ──
  const [quickTask, setQuickTask] = useState("");
  const [quickMetric, setQuickMetric] = useState("");
  const addQuickTask = () => {
    const v = quickTask.trim();
    if (!v) return;
    const t: Todo = {
      id: `t_${Date.now().toString(36)}`,
      text: v,
      done: false,
      date: today,
      priority: "P2",
      tag: "Goal",
      createdAt: Date.now(),
    };
    setTodos([...todoList, t]);
    setQuickTask("");
  };
  const toggleFast = () => {
    if (fastSt.startedAt !== null) {
      // end current phase
      if (fastSt.phase === "fasting" && !fastedToday) {
        const hours = (now - fastSt.startedAt) / 3600_000;
        if (hours >= 0.25) {
          setFasting({ ...fastSt, startedAt: null });
          // log handled on the fasting page; hub just stops the clock
          return;
        }
      }
      setFasting({ ...fastSt, startedAt: null });
    } else {
      setFasting({ protocolId: fastSt.protocolId, phase: "fasting", startedAt: Date.now() });
    }
  };
  const logQuickMetric = () => {
    const n = Number(quickMetric);
    if (!Number.isFinite(n) || n === 0) return;
    setGoal({ ...goalSt, metricByDay: { ...(goalSt.metricByDay ?? {}), [today]: todayMetric + n } });
    setQuickMetric("");
  };

  if (!isSetup || showQ) {
    return (
      <RequireAuth>
        <Questionnaire onComplete={() => setShowQ(false)} />
        <TrackerShell icon="hub" title="Trackers" subtitle="Setting up your personalized dashboard...">
          <div />
        </TrackerShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <TrackerShell
        icon="hub"
        title={prefs.name ? `Welcome back, ${prefs.name}` : "Command Center"}
        subtitle={`${displayGoalTitle(prefs)} · four daily anchors, one momentum ring.`}
      >
        {/* ── Install banner (shown only when the browser offers it) ── */}
        <InstallPrompt />

        <ActionBlock
          eyebrow="Daily transmission // next move"
          title={dailyChapter.nextAction}
          description={dailyChapter.summary}
          primary={
            <Link
              href={nextActionHref}
              className="inline-flex min-h-11 items-center justify-center border border-[#C8FF3D] bg-[#C8FF3D] px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#071014] transition-transform hover:-translate-y-0.5"
            >
              Log this move
            </Link>
          }
          secondary={
            <Link
              href="/motivation"
              className="inline-flex min-h-11 items-center justify-center border border-current/30 px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-[#49E7FF] hover:text-[#49E7FF]"
            >
              Enter focus
            </Link>
          }
        />

        {/* ── Daily episode: goal first, then the next move ── */}
        <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <StoryPanel
            eyebrow={dailyChapter.eyebrow}
            title={<span data-testid="command-deck-title">{dailyChapter.title}</span>}
            tone="signal"
            action={
              <Link href="/goal" className="text-xs font-semibold text-primary hover:underline">
                Open goal →
              </Link>
            }
          >
            <p>{dailyChapter.summary}</p>
            <div data-testid="next-action" className="mt-5 border-l-2 border-primary pl-4">
              <p className="dossier-kicker">Next move</p>
              <p className="mt-1 text-base font-semibold text-foreground">{dailyChapter.nextAction}</p>
            </div>
          </StoryPanel>

          <div data-testid="momentum-signal">
            <SignalPanel
              label="Momentum signal"
              value={ringPct === 0 ? "No signal" : `${ringPct}%`}
              detail={`${ringPct}% daily momentum across fasting, movement, tasks, and the goal metric.`}
              progress={ringPct}
              tone="red"
            />
            <Card className="mt-4">
              <CardContent className="flex flex-col items-center gap-5 p-5">
                <Ring segments={segments} size={210} thickness={13}>
                  <span className="font-display text-4xl font-bold tabular-nums">{ringPct}%</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Daily momentum
                  </span>
                </Ring>
                <SegmentLegend
                  items={[
                    { label: "Fasting", value: fastSeg, color: "#3b82f6", detail: fastedToday ? "Window complete ✓" : derived.running && fastSt.phase === "fasting" ? `${Math.floor(derived.elapsedMs / 3600000)}h ${Math.floor((derived.elapsedMs % 3600000) / 60000)}m in` : "Not started" },
                    { label: "Workout", value: workoutDone ? 1 : 0, color: "#10b981", detail: workoutDone ? "Session logged ✓" : "No session yet" },
                    { label: "Tasks", value: todoSeg, color: "#f59e0b", detail: todayTodos.length ? `${doneTodos}/${todayTodos.length} done` : "No tasks today" },
                    { label: "Goal", value: goalSeg, color: "#d946ef", detail: `${todayMetric}/${metric.target} ${metric.label.toLowerCase()}` },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <StoryPanel eyebrow="Command inputs" title="Quick actions" tone="archive">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex gap-2">
              <Input
                className="h-9"
                placeholder="+ Quick add task…"
                value={quickTask}
                onChange={(e) => setQuickTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addQuickTask()}
              />
              <Button size="sm" className="h-9" onClick={addQuickTask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                className="h-9 tabular-nums"
                type="number"
                min={0}
                placeholder={`+ Log ${metric.label.toLowerCase()}…`}
                value={quickMetric}
                onChange={(e) => setQuickMetric(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && logQuickMetric()}
              />
              <Button size="sm" className="h-9" onClick={logQuickMetric}>
                <TrendingUp className="h-4 w-4" />
              </Button>
            </div>
            <Button variant={fastSt.startedAt !== null ? "secondary" : "default"} className="h-9" onClick={toggleFast}>
              <Timer className="mr-1.5 h-4 w-4" />
              {fastSt.startedAt !== null
                ? `End ${fastSt.phase === "fasting" ? "fast" : "window"}`
                : "Start fast"}
            </Button>
            <Link href="/workout-tracking">
              <Button variant="outline" className="h-9 w-full">
                <Dumbbell className="mr-1.5 h-4 w-4" /> Log workout session
              </Button>
            </Link>
          </div>
        </StoryPanel>

        {/* ── Streak row ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Fast streak", v: `${fastStreak}d`, Icon: Timer, c: "text-blue-500" },
            { l: "Gym streak", v: `${workoutStreak}d`, Icon: Dumbbell, c: "text-emerald-500" },
            { l: "Task streak", v: `${taskStreak}d`, Icon: ListChecks, c: "text-amber-500" },
            { l: "Milestones", v: `${milestonesDone}/${milestones.length}`, Icon: Flag, c: "text-fuchsia-500" },
          ].map((s) => (
            <Card key={s.l}>
              <CardContent className="flex items-center gap-2.5 p-4">
                <s.Icon className={cn("h-5 w-5 shrink-0", s.c)} />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{s.l}</p>
                  <p className="font-display truncate text-lg font-bold tabular-nums">{s.v}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Metric cards ── */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display font-bold">Fasting</h2>
                <Link href="/intermittent-fasting" className="text-xs text-primary hover:underline">
                  open →
                </Link>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {fastSt.startedAt !== null
                  ? fastSt.phase === "fasting"
                    ? `${Math.floor(derived.elapsedMs / 3600000)}h ${Math.floor((derived.elapsedMs % 3600000) / 60000)}m`
                    : "Eating window"
                  : "Idle"}
                <span className="ml-1.5 text-xs font-medium text-muted-foreground">/ {protocol.fastHours}h target</span>
              </p>
              <MiniBars className="mt-3" data={weekFastBars} unit="h" height={48} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display font-bold">Workout volume</h2>
                <Link href="/workout-tracking" className="text-xs text-primary hover:underline">
                  open →
                </Link>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {weeklyWorkoutStats(workoutLogs, 1, new Date(now))[0]?.sessions ?? 0}
                <span className="ml-1.5 text-xs font-medium text-muted-foreground">sessions this week</span>
              </p>
              <MiniBars className="mt-3" data={volumeBars} height={48} />
            </CardContent>
          </Card>
        </div>

        {/* ── Week in review ── */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display font-bold">Week in review</h2>
              <span className="text-xs text-muted-foreground">
                {weekReview.activeDays}/7 active days · {weekReview.journalEntries} reflections
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <ReviewStat label="Fast hours" value={weekReview.fastHours} prev={weekReview.prevFastHours} unit="h" decimals />
              <ReviewStat label="Sessions" value={weekReview.sessions} prev={weekReview.prevSessions} />
              <ReviewStat label="Volume" value={weekReview.volumeKg} prev={weekReview.prevVolumeKg} unit="kg" />
              <ReviewStat label="Tasks done" value={weekReview.tasksCompleted} prev={weekReview.prevTasksCompleted} />
              <ReviewStat label={metric.label} value={weekReview.metricTotal} prev={weekReview.prevMetricTotal} />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Deltas vs the previous 7 days</p>
          </CardContent>
        </Card>

        {/* ── Goal trajectory + quote ── */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="flex items-center gap-2 font-display font-bold"><TrackerIcon name={goalMeta.iconName} className="h-4 w-4 text-primary" /> {displayGoalTitle(prefs)}</h2>
                <Link href="/goal" className="text-xs text-primary hover:underline">
                  open →
                </Link>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {metric.label}: <strong className="text-foreground tabular-nums">{todayMetric}</strong> / {metric.target} today
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all"
                  style={{ width: `${Math.min(100, (todayMetric / Math.max(1, metric.target)) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {milestonesDone}/{milestones.length} milestones · {Math.round((milestonesDone / Math.max(1, milestones.length)) * 100)}% roadmap
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display font-bold">Fuel for today</h2>
                <Link href="/motivation" className="text-xs text-primary hover:underline">
                  open →
                </Link>
              </div>
              <blockquote className="mt-2 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{quote.text}&rdquo;
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">{quote.tag}</span>
              </blockquote>
            </CardContent>
          </Card>
        </div>

        {/* ── Recent activity ── */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-display font-bold">Last 48 hours</h2>
            </div>
            {activity.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  icon={Zap}
                  title="No activity yet"
                  hint="Complete a fast, log a workout, finish tasks or journal — your recent wins land here."
                />
              </div>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {activity.map((ev) => (
                  <li key={ev.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">
                      <ActivityDot kind={ev.kind} /> {ev.title}
                      {ev.detail ? <span className="text-muted-foreground"> · {ev.detail}</span> : null}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{relativeTime(ev.at, now)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Quick links + setup ── */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { href: "/intermittent-fasting", icon: "timer", label: "Fasting" },
              { href: "/workout-tracking", icon: "workout", label: "Workouts" },
              { href: "/goal", icon: "flag", label: "Goal" },
              { href: "/todo", icon: "todo", label: "Todo" },
              { href: "/motivation", icon: "flame", label: "Motivation" },
              { href: "/share", icon: "share", label: "Share" },
            ] as { href: string; icon: TrackerIconName; label: string }[]
          )
            .filter((l) => l.href !== "/intermittent-fasting" || prefs.fastingEnabled)
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
              >
                <TrackerIcon name={l.icon} className="h-3.5 w-3.5" />
                {l.label}
              </Link>
            ))}
          <button
            onClick={() => setShowQ(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5" /> Re-run setup
          </button>
        </div>
      </TrackerShell>
    </RequireAuth>
  );
}

function SegmentLegend({
  items,
}: {
  items: { label: string; value: number; color: string; detail: string }[];
}) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn("h-2.5 w-2.5 shrink-0 rounded-full", it.value <= 0 && "opacity-30")}
            style={{ backgroundColor: it.color, boxShadow: it.value > 0 ? `0 0 8px ${it.color}` : undefined }}
          />
          <span className="w-16 shrink-0 text-xs font-semibold">{it.label}</span>
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, it.value * 100)}%`, backgroundColor: it.color }}
            />
          </div>
          <span className="w-36 shrink-0 text-right text-[11px] text-muted-foreground">{it.detail}</span>
        </li>
      ))}
    </ul>
  );
}

function ActivityDot({ kind }: { kind: string }) {
  const colors: Record<string, string> = {
    fast: "bg-blue-500",
    workout: "bg-emerald-500",
    todo: "bg-amber-500",
    goal: "bg-fuchsia-500",
    journal: "bg-violet-500",
  };
  return <span aria-hidden className={cn("mr-1.5 inline-block h-2 w-2 rounded-full", colors[kind] ?? "bg-muted-foreground")} />;
}

function ReviewStat({
  label,
  value,
  prev,
  unit = "",
  decimals = false,
}: {
  label: string;
  value: number;
  prev: number;
  unit?: string;
  decimals?: boolean;
}) {
  const delta = formatDelta(value, prev, unit);
  return (
    <div className="rounded-xl border border-border/60 px-3 py-2.5">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="font-display mt-0.5 text-lg font-bold tabular-nums">{decimals ? value.toFixed(1) : value}{unit}</p>
      <p className={cn("text-[11px] font-semibold tabular-nums", delta.good ? "text-emerald-500" : "text-red-500")}>{delta.text} vs last wk</p>
    </div>
  );
}

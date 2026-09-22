"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PersonalShell from "@/components/trackers/PersonalShell";
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
  calculateStreak,
  dateKey,
  fastHoursByDay,
  milestonesFor,
  normalizeWeeklyCommitments,
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
import Questionnaire from "@/components/Questionnaire";
import InstallPrompt from "@/components/InstallPrompt";
import { TrackerIcon } from "@/components/trackers/icons";
import { computeFastingState } from "@/lib/trackers";
import ActionQueue, { type ActionQueueRow } from "@/components/trackers/ActionQueue";
import WeekPulse, { type WeekPulseDay } from "@/components/trackers/WeekPulse";
import FocusSprint from "@/components/trackers/FocusSprint";
import TodayHeader from "@/components/trackers/TodayHeader";
import NextMoveCard from "@/components/trackers/NextMoveCard";
import ProgressRail from "@/components/trackers/ProgressRail";
import UpNextLane from "@/components/trackers/UpNextLane";
import TodayDetails from "@/components/trackers/TodayDetails";
import MiniBars from "@/components/trackers/MiniBars";
import { buildNextAction, buildUpNextCue } from "@/lib/command-deck";
import { focusMinutesForDates, type FocusSession } from "@/lib/focus-sprint";
import { cn } from "@/lib/utils";
import { DEFAULT_WEIGHT_LOSS_STATE, type WeightLossState } from "@/lib/health";
import { Activity, Dumbbell, Flag, ListChecks, Plus, Scale, Sparkles, Timer, TrendingUp, Zap } from "lucide-react";

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
  const { value: focusSessions } = useSyncedStorage<FocusSession[]>("focus:sessions", []);
  const { value: weightLoss } = useSyncedStorage<WeightLossState>("weight-loss", DEFAULT_WEIGHT_LOSS_STATE);

  const fastSt = fasting ?? { protocolId: "16-8", phase: "fasting" as const, startedAt: null };
  const fastHist = useMemo(() => (fastHistory ?? []) as FastHistoryEntry[], [fastHistory]);
  const todoList = useMemo(() => (todos ?? []) as Todo[], [todos]);
  const goalSt = useMemo(() => goal ?? { metricByDay: {}, milestonesByCategory: {} }, [goal]);
  const workoutLogs = useMemo(() => workouts ?? {}, [workouts]);
  const journalMap = useMemo(() => journal ?? {}, [journal]);
  const focusHistory = useMemo(() => focusSessions ?? [], [focusSessions]);
  const weightLossState = useMemo(() => weightLoss ?? DEFAULT_WEIGHT_LOSS_STATE, [weightLoss]);

  const today = dateKey();
  const metric = metricFor(prefs);
  const todayMetric = goalSt.metricByDay?.[today] ?? 0;
  const protocol = protocolById(fastSt.protocolId);
  const derived = computeFastingState(fastSt, now, protocol.fastHours);
  const fastedToday = fastHist.some((entry) => (entry.mealDate ?? dateKey(new Date(entry.end))) === today) ||
    (derived.running && !derived.complete && fastSt.phase === "fasting" && derived.pct > 0.5);
  const workoutDone = Object.values(workoutLogs[today] ?? {}).some((entry) => entry?.done);
  const todayTodos = todoList.filter((todo) => todo.date === today || (todo.date < today && !todo.done));
  const doneTodos = todayTodos.filter((todo) => todo.done).length;
  const nextPriorityTodo = todayTodos
    .filter((todo) => !todo.done && (todo.priority === "P1" || todo.priority === "P2"))
    .sort((a, b) => (a.priority === b.priority ? a.createdAt - b.createdAt : a.priority === "P1" ? -1 : 1))[0];
  const goalMeta = GOAL_CATEGORIES.find((category) => category.id === prefs.goalCategory) ?? GOAL_CATEGORIES[0];
  const weightLossGoal = prefs.goalCategory === "weightloss";
  const weightLoggedToday = Boolean(weightLossState.entries[today]);
  const goalPercent = weightLossGoal ? (weightLoggedToday ? 100 : 0) : Math.min(100, metric.target ? (todayMetric / metric.target) * 100 : 0);
  const milestones = milestonesFor(goalSt, prefs.goalCategory);
  const nextMilestone = milestones.find((milestone) => !milestone.done)?.title;
  const currentWeekOf = (() => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
    return dateKey(day);
  })();
  const weeklyCommitment = normalizeWeeklyCommitments(goalSt).find((commitment) => commitment.weekOf === currentWeekOf && commitment.status !== "closed");
  const recovery = weightLossState.recoveryByDay[today];
  const recoveryCue = weightLossGoal
    ? !recovery
      ? { title: "Recovery check-in", detail: "Read your energy, sleep, and soreness before choosing today’s intensity.", href: "/weight-loss" }
      : recovery.energy <= 2 || recovery.sleep <= 2 || recovery.soreness >= 4
        ? { title: "Choose a lighter day", detail: "Your recovery signals are asking for a gentler pace. Keep the routine, reduce the load, and reassess tomorrow.", href: "/weight-loss" }
        : undefined
    : undefined;
  const fastPercent = fastedToday ? 100 : derived.running && fastSt.phase === "fasting" ? derived.pct : 0;
  const taskPercent = todayTodos.length ? (doneTodos / todayTodos.length) * 100 : 0;
  const momentumPercent = Math.round((fastPercent + (workoutDone ? 100 : 0) + taskPercent + goalPercent) / 4);
  const completedAnchors = [fastedToday, workoutDone, todayTodos.length > 0 && doneTodos === todayTodos.length, goalPercent >= 100].filter(Boolean).length;
  const nextAction = buildNextAction({
    fastRunning: fastSt.startedAt !== null,
    fastLogged: fastedToday,
    workoutDone,
    todoCount: todayTodos.length,
    doneTodos,
    goalPct: goalPercent,
    metricLabel: metric.label,
    nextTask: nextPriorityTodo?.text,
    weightLossGoal,
    weightLoggedToday,
    weeklyCommitment: weeklyCommitment ? { text: weeklyCommitment.text, completed: weeklyCommitment.status === "completed" } : undefined,
    nextMilestone,
  });
  const upNextCue = buildUpNextCue({ nextAction, recoveryCue, nextMilestone });

  const [quickTask, setQuickTask] = useState("");
  const [quickMetric, setQuickMetric] = useState("");
  const addQuickTask = () => {
    const text = quickTask.trim();
    if (!text) return;
    setTodos([...todoList, { id: `t_${Date.now().toString(36)}`, text, done: false, date: today, priority: "P2", tag: "Goal", createdAt: Date.now() }]);
    setQuickTask("");
  };
  const logQuickMetric = () => {
    const value = Number(quickMetric);
    if (!Number.isFinite(value) || value === 0) return;
    setGoal({ ...goalSt, metricByDay: { ...(goalSt.metricByDay ?? {}), [today]: todayMetric + value } });
    setQuickMetric("");
  };
  const toggleFast = () => setFasting(fastSt.startedAt !== null ? { ...fastSt, startedAt: null } : { protocolId: fastSt.protocolId, phase: "fasting", startedAt: now });

  const actionQueue: ActionQueueRow[] = [
    { id: "fasting", label: fastSt.startedAt !== null ? "Protect the current fast" : fastedToday ? "Meal window logged" : "Log today’s meal window", detail: fastSt.startedAt !== null ? `${protocol.fastHours}h target in progress` : fastedToday ? "Today’s anchor is complete" : "Set the first and last meal times", href: "/intermittent-fasting", tone: "cyan", complete: fastedToday },
    { id: "workout", label: workoutDone ? "Workout session logged" : "Complete today’s workout", detail: workoutDone ? "Movement anchor complete" : "Open the suggested session", href: "/workout-tracking", tone: "lime", complete: workoutDone },
    { id: "task", label: nextPriorityTodo?.text ?? todayTodos.find((todo) => !todo.done)?.text ?? todayTodos.find((todo) => todo.done)?.text ?? "Add today’s first task", detail: todayTodos.length ? `${doneTodos}/${todayTodos.length} task${todayTodos.length === 1 ? "" : "s"} done` : "Give the day one concrete move", href: "/todo", tone: "amber", complete: todayTodos.length > 0 && doneTodos === todayTodos.length },
    { id: "goal", label: weightLossGoal ? (weightLoggedToday ? "Daily weigh-in recorded" : "Log today’s weigh-in") : goalPercent >= 100 ? "Daily goal target reached" : `Log ${metric.label.toLowerCase()}`, detail: weightLossGoal ? (weightLoggedToday ? "Health anchor complete for today" : "One honest check-in is enough") : `${todayMetric}/${metric.target} ${metric.label.toLowerCase()} today`, href: weightLossGoal ? "/weight-loss" : "/goal", tone: "violet", complete: goalPercent >= 100 },
  ];

  const weekPulse = useMemo<WeekPulseDay[]>(() => Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const key = dateKey(day);
    return {
      key,
      label: day.toLocaleDateString("en-US", { weekday: "narrow" }),
      activityCount: [fastHist.some((entry) => (entry.mealDate ?? dateKey(new Date(entry.end))) === key), Object.values(workoutLogs[key] ?? {}).some((entry) => entry?.done), todoList.some((todo) => todo.done && todo.completedAt && dateKey(new Date(todo.completedAt)) === key), Boolean(goalSt.metricByDay?.[key]), Boolean(journalMap[key]?.updatedAt)].filter(Boolean).length,
      focusMinutes: focusMinutesForDates(focusHistory, key),
      isToday: key === today,
    };
  }), [fastHist, focusHistory, goalSt.metricByDay, journalMap, now, today, todoList, workoutLogs]);
  const activity = buildRecentActivity({ fastHistory: fastHist, workouts: workoutLogs, todos: todoList, metricByDay: goalSt.metricByDay ?? {}, metricLabel: metric.label, journal: journalMap }, now);
  const fastStreak = calculateStreak(fastHist.map((entry) => entry.mealDate ?? dateKey(new Date(entry.end))));
  const workoutStreak = calculateStreak(Object.entries(workoutLogs).filter(([, day]) => Object.values(day).some((entry) => entry?.done)).map(([day]) => day));
  const taskStreak = calculateStreak(Object.entries(todoList.reduce<Record<string, number>>((acc, todo) => { if (todo.done && todo.completedAt) { const key = dateKey(new Date(todo.completedAt)); acc[key] = (acc[key] ?? 0) + 1; } return acc; }, {})).filter(([, count]) => count > 0).map(([key]) => key));

  if (!isSetup || showQ) {
    return <RequireAuth><Questionnaire onComplete={() => setShowQ(false)} /><PersonalShell icon="hub" title="Set up Today" subtitle="A few choices will shape your next move." showBack={false}><div /></PersonalShell></RequireAuth>;
  }

  return (
    <RequireAuth>
      <PersonalShell showBack={false} showDock title={null}>
        <TodayHeader name={prefs.name} goalTitle={displayGoalTitle(prefs)} />
        <InstallPrompt />
        <NextMoveCard action={nextAction} summary={`Your ${goalMeta.label.toLowerCase()} plan is at ${Math.round(goalPercent)}% today. One useful move is enough to keep the sequence alive.`} />
        <ProgressRail percent={momentumPercent} completed={completedAnchors} total={4} />
        <UpNextLane cue={upNextCue} />
        <FocusSprint label={nextAction.title} compact />
        {recoveryCue ? <Card variant="dossier" data-testid="recovery-cue"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="dossier-kicker">Health signal</p><h2 className="mt-1 font-display text-lg font-bold">{recoveryCue.title}</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{recoveryCue.detail}</p></div><Link href={recoveryCue.href} className="shrink-0 text-xs font-bold uppercase tracking-[0.12em] text-primary hover:underline">Open check-in →</Link></CardContent></Card> : null}

        <TodayDetails>
          <section className="border border-border/70 bg-card/45 p-4"><div className="flex items-baseline justify-between gap-3"><div><span className="dossier-kicker">Log a signal</span><span className="mt-1 block font-display text-base font-bold">Keep the record honest.</span></div><Link href="/log" className="text-xs font-bold uppercase tracking-[0.12em] text-primary hover:underline">Open Log →</Link></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="flex gap-2"><Input className="h-10" placeholder="Add a task…" value={quickTask} onChange={(event) => setQuickTask(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addQuickTask()} /><Button size="sm" className="h-10" onClick={addQuickTask} aria-label="Add task"><Plus className="h-4 w-4" /></Button></div><div className="flex gap-2"><Input className="h-10 tabular-nums" type="number" min={0} placeholder={`Log ${metric.label.toLowerCase()}…`} value={quickMetric} onChange={(event) => setQuickMetric(event.target.value)} onKeyDown={(event) => event.key === "Enter" && logQuickMetric()} /><Button size="sm" className="h-10" onClick={logQuickMetric} aria-label={`Log ${metric.label}`}><TrendingUp className="h-4 w-4" /></Button></div><Button variant={fastSt.startedAt !== null ? "secondary" : "default"} className="h-10" onClick={toggleFast}><Timer className="mr-1.5 h-4 w-4" />{fastSt.startedAt !== null ? "End fast" : "Start fast"}</Button><Link href="/workout-tracking"><Button variant="outline" className="h-10 w-full"><Dumbbell className="mr-1.5 h-4 w-4" /> Log workout</Button></Link></div></section>

          <ActionQueue rows={actionQueue} />
          <WeekPulse days={weekPulse} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[{ label: "Fast streak", value: `${fastStreak}d`, icon: Timer, color: "text-[#32b8c8]" }, { label: "Workout streak", value: `${workoutStreak}d`, icon: Dumbbell, color: "text-[#c9ff4f]" }, { label: "Task streak", value: `${taskStreak}d`, icon: ListChecks, color: "text-amber-400" }, { label: "Milestones", value: `${milestones.filter((milestone) => milestone.done).length}/${milestones.length}`, icon: Flag, color: "text-[#32b8c8]" }].map((stat) => <Card variant="dossier" key={stat.label}><CardContent className="flex items-center gap-2.5 p-4"><stat.icon className={cn("h-5 w-5 shrink-0", stat.color)} /><div className="min-w-0"><p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</p><p className="font-display text-lg font-bold tabular-nums">{stat.value}</p></div></CardContent></Card>)}</div>
          <div className="grid gap-3 sm:grid-cols-2"><Card variant="dossier"><CardContent className="p-5"><div className="flex items-baseline justify-between"><h2 className="font-display font-bold">Fasting</h2><Link href="/intermittent-fasting" className="text-xs text-primary hover:underline">Open →</Link></div><p className="mt-2 font-display text-2xl font-bold tabular-nums">{fastSt.startedAt !== null && fastSt.phase === "fasting" ? `${Math.floor(derived.elapsedMs / 3600000)}h ${Math.floor((derived.elapsedMs % 3600000) / 60000)}m` : "Idle"}<span className="ml-1.5 text-xs font-medium text-muted-foreground">/ {protocol.fastHours}h target</span></p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-[#32b8c8]" style={{ width: `${fastPercent}%` }} /></div><div className="mt-3"><MiniBars data={fastHoursByDay(fastHist, 7, new Date(now))} unit="h" height={42} /></div></CardContent></Card><Card variant="dossier"><CardContent className="p-5"><div className="flex items-baseline justify-between"><h2 className="font-display font-bold">Workout volume</h2><Link href="/workout-tracking" className="text-xs text-primary hover:underline">Open →</Link></div><p className="mt-2 font-display text-2xl font-bold tabular-nums">{weeklyWorkoutStats(workoutLogs, 1, new Date(now))[0]?.sessions ?? 0}<span className="ml-1.5 text-xs font-medium text-muted-foreground">sessions this week</span></p></CardContent></Card></div>
          <Card variant="dossier"><CardContent className="p-5"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /><h2 className="font-display font-bold">Last 48 hours</h2></div>{activity.length === 0 ? <div className="mt-3"><EmptyState icon={Zap} title="No activity yet" hint="Complete a fast, log a workout, finish a task, or write a note." /></div> : <ul className="mt-3 space-y-1.5">{activity.map((event) => <li key={event.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm"><span className="min-w-0 truncate"><ActivityDot kind={event.kind} /> {event.title}{event.detail ? <span className="text-muted-foreground"> · {event.detail}</span> : null}</span><span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{relativeTime(event.at, now)}</span></li>)}</ul>}</CardContent></Card>
          <div className="flex flex-wrap items-center gap-2">{[{ href: "/goal", icon: "flag" as const, label: "Goals" }, { href: "/weight-loss", icon: "scale" as const, label: "Health" }, { href: "/archive", icon: "archive" as const, label: "Archive" }, { href: "/more", icon: "settings" as const, label: "More" }].map((link) => <Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-2 text-sm transition-colors hover:border-primary/60"><TrackerIcon name={link.icon} className="h-3.5 w-3.5" />{link.label}</Link>)}<button onClick={() => setShowQ(true)} className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"><Sparkles className="h-3.5 w-3.5" /> Re-run setup</button></div>
        </TodayDetails>
      </PersonalShell>
    </RequireAuth>
  );
}

function ActivityDot({ kind }: { kind: string }) {
  const colors: Record<string, string> = { fast: "bg-[#32b8c8]", workout: "bg-[#c9ff4f]", todo: "bg-amber-400", goal: "bg-[#32b8c8]", journal: "bg-[#32b8c8]" };
  return <span aria-hidden className={cn("mr-1.5 inline-block h-2 w-2 rounded-full", colors[kind] ?? "bg-muted-foreground")} />;
}

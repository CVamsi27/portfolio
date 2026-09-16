"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TrackerShell from "@/components/trackers/TrackerShell";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { useSyncedStorage, useLocalValue } from "@/lib/use-synced-storage";
import { useUserPrefs, GOAL_CATEGORIES } from "@/lib/user-prefs";
import { FASTING_PROTOCOLS, dateKey, GOAL_MILESTONES } from "@/lib/trackers";
import { TrackerIcon, type TrackerIconName } from "@/components/trackers/icons";
import { ArrowRight, Flame, Dumbbell, ListChecks, Flag, Timer, TrendingUp, Zap } from "lucide-react";
import Questionnaire from "@/components/Questionnaire";

type FastState = { protocolId: string; phase: string; elapsedSec: number; running: boolean };
type Todo = { id: string; text: string; done: boolean; date: string };
type GoalState = { checks: boolean[]; appsByDay: Record<string, number> };
type LogMap = Record<string, Record<string, { done: boolean }>>;
type HistoryEntry = { date: string; hours: number };

function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <Link href={
      label === "Fasting" ? "/intermittent-fasting" :
      label === "Workouts" ? "/workout-tracking" :
      label === "Todos" ? "/todo" :
      "/goal"
    } className="group">
      <Card className="transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/40">
        <CardContent className="flex items-center gap-3 p-4">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-md`}>
            <Icon className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <p className="truncate font-display text-lg font-bold">{value}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TrackersHub() {
  const { prefs, isSetup } = useUserPrefs();
  const [showQ, setShowQ] = useState(false);

  const { value: fasting } = useSyncedStorage<FastState>("fasting", { protocolId: "16-8", phase: "fasting", elapsedSec: 0, running: false });
  const { value: todos } = useSyncedStorage<Todo[]>("todos", []);
  const { value: goal } = useSyncedStorage<GoalState>("goal", { checks: [], appsByDay: {} });
  const { value: workouts } = useSyncedStorage<LogMap>("workouts", {});
  const { value: history } = useSyncedStorage<HistoryEntry[]>("fasting:history", []);
  const { value: favs } = useSyncedStorage<string[]>("motivation:favs", []);

  const safe = (v: unknown, d: any) => v ?? d;
  const today = dateKey();

  const fastingData = safe(fasting, { protocolId: "16-8", phase: "fasting", elapsedSec: 0, running: false }) as FastState;
  const todoData = safe(todos, []) as Todo[];
  const goalData = safe(goal, { checks: [], appsByDay: {} }) as GoalState;
  const workoutData = safe(workouts, {}) as LogMap;
  const historyData = safe(history, []) as HistoryEntry[];
  const favsData = safe(favs, []) as string[];

  const protocol = FASTING_PROTOCOLS.find((p) => p.id === fastingData.protocolId) ?? FASTING_PROTOCOLS[1];

  const todayTodos = todoData.filter((t) => t.date === today);
  const doneToday = todayTodos.filter((t) => t.done).length;
  const todoPct = todayTodos.length ? Math.round((doneToday / todayTodos.length) * 100) : 0;

  const goalChecks = (goalData.checks ?? []).filter(Boolean).length;
  const goalTotal = (GOAL_MILESTONES[prefs.goalCategory] ?? GOAL_MILESTONES.relocation).length;
  const goalPct = goalTotal ? Math.round((goalChecks / goalTotal) * 100) : 0;

  const workoutDays = Object.keys(workoutData).length;
  const thisWeekSessions = useMemo(() => {
    let n = 0;
    const now = new Date();
    const day = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day);
    for (let i = 0; i <= day; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const k = d.toISOString().slice(0, 10);
      if (workoutData[k] && Object.values(workoutData[k]).some((c) => c.done)) n++;
    }
    return n;
  }, [workoutData]);

  const weekFastHours = useMemo(
    () => historyData.slice(-7).reduce((a, h) => a + h.hours, 0),
    [historyData],
  );

  const weeklyApps = useMemo(() => {
    let total = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      total += (goalData.appsByDay?.[k] as number) ?? 0;
    }
    return total;
  }, [goalData.appsByDay]);

  const goalMeta = GOAL_CATEGORIES.find((g) => g.id === prefs.goalCategory) ?? GOAL_CATEGORIES[0];

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
      title={prefs.name ? `Welcome back, ${prefs.name}` : "Your Dashboard"}
      subtitle={`Tracking ${goalMeta.icon} ${prefs.goalTitle || goalMeta.label} · ${prefs.motivationStyle} motivation`}
    >
      {/* quick stats grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {prefs.fastingEnabled && (
          <MiniStat
            icon={Timer}
            label="Fasting"
            value={fastingData.running
              ? `${(fastingData.elapsedSec / 3600).toFixed(1)}h / ${protocol.fastHours}h`
              : fastingData.phase === "eating"
                ? "In eating window"
                : "Ready to start"
            }
            color="from-blue-500 to-violet-600"
          />
        )}
        <MiniStat
          icon={Dumbbell}
          label="Workouts"
          value={thisWeekSessions > 0 ? `${thisWeekSessions} sessions this week` : "No sessions yet"}
          color="from-emerald-500 to-teal-600"
        />
        <MiniStat
          icon={ListChecks}
          label="Todos"
          value={todayTodos.length > 0 ? `${doneToday}/${todayTodos.length} done today` : "No tasks today"}
          color="from-amber-500 to-orange-600"
        />
        <MiniStat
          icon={Flag}
          label="Goal"
          value={`${goalChecks}/${goalTotal} milestones · ${weeklyApps} apps/wk`}
          color="from-rose-500 to-pink-600"
        />
      </div>

      {/* streaks & analytics */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="mx-auto h-6 w-6 text-amber-500" />
            <p className="font-display mt-2 text-2xl font-bold">{weekFastHours.toFixed(0)}h</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Fast hours (7d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto h-6 w-6 text-emerald-500" />
            <p className="font-display mt-2 text-2xl font-bold">{weeklyApps}</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Apps this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="mx-auto h-6 w-6 text-primary" />
            <p className="font-display mt-2 text-2xl font-bold">{favsData.length}</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Saved quotes</p>
          </CardContent>
        </Card>
      </div>

      {/* goal progress */}
      {goalChecks > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">{goalMeta.icon} {prefs.goalTitle || goalMeta.label}</h2>
              <span className="text-sm font-semibold tabular-nums text-primary">{goalPct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all" style={{ width: `${goalPct}%` }} />
            </div>
            <Link href="/goal" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View details <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* workout weekly bar */}
      {workoutDays > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="font-display font-bold">Workout consistency</h2>
            <div className="mt-3 flex items-end gap-1.5">
              {[3, 2, 1, 0].map((w) => {
                let n = 0;
                const now = new Date();
                const day = (now.getDay() + 6) % 7;
                const monday = new Date(now);
                monday.setDate(now.getDate() - day);
                for (let i = 0; i < 7; i++) {
                  const d = new Date(monday);
                  d.setDate(monday.getDate() + i - w * 7);
                  const k = d.toISOString().slice(0, 10);
                  if (workoutData[k] && Object.values(workoutData[k]).some((c) => c.done)) n++;
                }
                return (
                  <div key={w} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-primary to-fuchsia-500"
                      style={{ height: `${Math.max(6, n * 18)}px`, opacity: n ? 1 : 0.3 }}
                    />
                    <span className="text-[10px] text-muted-foreground">{w === 0 ? "This" : `${w}w ago`}</span>
                  </div>
                );
              })}
            </div>
            <Link href="/workout-tracking" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              Log today's workout <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* quick links */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: "/intermittent-fasting", icon: "timer" as TrackerIconName, label: "Fasting" },
          { href: "/motivation", icon: "flame" as TrackerIconName, label: "Motivation" },
          { href: "/goal", icon: "flag" as TrackerIconName, label: "Goal" },
          { href: "/workout-tracking", icon: "workout" as TrackerIconName, label: "Workouts" },
          { href: "/todo", icon: "todo" as TrackerIconName, label: "Todo" },
          { href: "/share", icon: "share" as TrackerIconName, label: "Share" },
        ].filter((l) => !l.href.includes("fasting") || prefs.fastingEnabled).map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
          >
            <TrackerIcon name={l.icon} className="h-3.5 w-3.5" />
            {l.label}
          </Link>
        ))}
      </div>

      {/* re-run questionnaire */}
      <button
        onClick={() => setShowQ(true)}
        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Re-run setup questionnaire
      </button>
    </TrackerShell>
    </RequireAuth>
  );
}

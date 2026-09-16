"use client";

import { useMemo, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import Stat from "@/components/trackers/Stat";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { SyncBadge } from "@/components/auth/AuthButton";
import { WORKOUT_EXERCISES } from "@/lib/trackers";
import { cn } from "@/lib/utils";

type DayLog = Record<string, { sets: string; done: boolean; minutes?: string }>;
type LogMap = Record<string, DayLog>;

function weekDays(offsetWeeks = 0): Date[] {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}
const keyOf = (d: Date) => d.toISOString().slice(0, 10);

function parseSets(s: string): number[] {
  return s
    .split(/[,+\s]+/)
    .map((x) => parseInt(x, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export default function WorkoutPage() {
  const { value: logs, setValue: setLogs, status } = useSyncedStorage<LogMap>(
    "workouts",
    {},
  );
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState(keyOf(new Date()));

  const days = useMemo(() => weekDays(weekOffset), [weekOffset]);
  const dayLog: DayLog = logs[selected] ?? {};

  const setCell = (exId: string, patch: Partial<DayLog[string]>) => {
    const prev = dayLog[exId] ?? { sets: "", done: false as boolean, minutes: "" };
    return setLogs({
      ...logs,
      [selected]: { ...dayLog, [exId]: { ...prev, ...patch } },
    });
  };

  const doneCount = WORKOUT_EXERCISES.filter((e) => dayLog[e.id]?.done).length;
  const dayPct = Math.round((doneCount / WORKOUT_EXERCISES.length) * 100);

  const weekStats = useMemo(() => {
    let sessions = 0;
    let sets = 0;
    let reps = 0;
    days.forEach((d) => {
      const l = logs[keyOf(d)];
      if (!l) return;
      const anyDone = Object.values(l).some((c) => c.done);
      if (anyDone) sessions++;
      Object.entries(l).forEach(([exId, cell]) => {
        const ex = WORKOUT_EXERCISES.find((e) => e.id === exId);
        if (!cell.done) return;
        if (ex?.unit === "minutes") {
          reps += Number(cell.minutes || 0) * 10; // cardio-equivalent
        } else {
          const arr = parseSets(cell.sets);
          sets += arr.length;
          reps += arr.reduce((a, b) => a + b, 0);
        }
      });
    });
    return { sessions, sets, reps };
  }, [days, logs]);

  const last4Weeks = useMemo(
    () =>
      [3, 2, 1, 0].map((w) => {
        let n = 0;
        weekDays(-w).forEach((d) => {
          const l = logs[keyOf(d)];
          if (l && Object.values(l).some((c) => c.done)) n++;
        });
        return { label: w === 0 ? "This wk" : `${w}w ago`, n };
      }),
    [logs],
  );

  return (
    <RequireAuth>
    <TrackerShell
      icon="💪"
      title="Workout Tracking"
      subtitle="Full Body list, daily logging, weekly analytics. Log sets like “9, 7” — progress is computed against your baselines."
      badge={<SyncBadge status={status} />}
    >
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>← Prev</Button>
            <p className="text-sm font-semibold">
              {weekOffset === 0 ? "This week" : weekOffset > 0 ? `+${weekOffset} wk` : `${weekOffset} wk`}
            </p>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>Next →</Button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const k = keyOf(d);
              const logged = logs[k] && Object.values(logs[k]).some((c) => c.done);
              const isSel = k === selected;
              return (
                <button
                  key={k}
                  onClick={() => setSelected(k)}
                  className={cn(
                    "rounded-lg border px-1 py-2 text-center transition-colors",
                    isSel
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-border/60 hover:bg-accent",
                  )}
                >
                  <span className="block text-[10px] uppercase text-muted-foreground">
                    {d.toLocaleDateString("en", { weekday: "narrow" })}
                  </span>
                  <span className="block text-sm tabular-nums">{d.getDate()}</span>
                  <span className={cn("mx-auto mt-1 block h-1.5 w-1.5 rounded-full", logged ? "bg-emerald-500" : "bg-muted") } />
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Done today" value={`${doneCount}/${WORKOUT_EXERCISES.length}`} />
            <Stat label="Sessions wk" value={`${weekStats.sessions}`} />
            <Stat label="Sets wk" value={`${weekStats.sets}`} />
            <Stat label="Reps wk" value={`${weekStats.reps}`} accent />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${dayPct}%` }} />
          </div>
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {selected} · {dayPct}% complete
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="font-semibold">Full Body · {selected}</h2>
          {WORKOUT_EXERCISES.map((ex) => {
            const cell = dayLog[ex.id] ?? { sets: "", done: false, minutes: "" };
            const base = ex.unit === "minutes" ? `${ex.baselineMinutes} min` : ex.baseline.length ? ex.baseline.join(" : ") : "—";
            return (
              <div
                key={ex.id}
                className={cn(
                  "rounded-xl border p-3 transition-colors",
                  cell.done ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Base: {base} · {ex.hint}
                    </p>
                  </div>
                  <button
                    onClick={() => setCell(ex.id, { done: !cell.done })}
                    aria-label={`Mark ${ex.name} done`}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border text-sm transition-colors",
                      cell.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40 hover:border-foreground",
                    )}
                  >
                    {cell.done ? "✓" : ""}
                  </button>
                </div>
                {ex.unit === "minutes" ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Minutes (e.g. 8)"
                      value={cell.minutes ?? ""}
                      onChange={(e) => setCell(ex.id, { minutes: e.target.value })}
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">min</span>
                  </div>
                ) : (
                  <Input
                    className="mt-2 tabular-nums"
                    placeholder='Sets e.g. "9, 7"'
                    value={cell.sets}
                    onChange={(e) => setCell(ex.id, { sets: e.target.value })}
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold">Progress vs baseline</h2>
          <ul className="mt-3 space-y-2">
            {WORKOUT_EXERCISES.filter((e) => e.unit === "reps").map((ex) => {
              // latest logged total
              let latest = 0;
              let latestDate = "";
              Object.entries(logs).forEach(([d, l]) => {
                const arr = parseSets(l[ex.id]?.sets ?? "");
                const tot = arr.reduce((a, b) => a + b, 0);
                if (tot > 0 && d >= latestDate) {
                  latest = tot;
                  latestDate = d;
                }
              });
              const base = ex.baseline.reduce((a, b) => a + b, 0);
              const pct = base ? Math.min(100, Math.round((latest / base) * 100)) : latest > 0 ? 100 : 0;
              return (
                <li key={ex.id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{ex.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {latest || "—"} / {base || "new"} reps
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-end gap-2">
            {last4Weeks.map((w) => (
              <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold tabular-nums">{w.n}</span>
                <div
                  className="w-full rounded-md bg-emerald-500/80"
                  style={{ height: `${Math.max(6, w.n * 18)}px`, opacity: w.n ? 1 : 0.3 }}
                />
                <span className="text-[10px] text-muted-foreground">{w.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">Sessions per week · last 4 weeks</p>
        </CardContent>
      </Card>
    </TrackerShell>
    </RequireAuth>
  );
}

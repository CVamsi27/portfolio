"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Dumbbell,
  FileText,
  HeartPulse,
  ListChecks,
  Plus,
  Scale,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useFasting, useGoalState, useJournal, useNow, useTodos } from "@/lib/tracker-store";
import { computeFastingState, dateKey, protocolById, type Todo, type TodoPriority } from "@/lib/trackers";
import { metricFor, useUserPrefs } from "@/lib/user-prefs";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { DEFAULT_WEIGHT_LOSS_STATE, inputToKg, type WeightLossState } from "@/lib/health";
import { cn } from "@/lib/utils";

const SCALE = [1, 2, 3, 4, 5] as const;

export default function LogCapture() {
  const { prefs } = useUserPrefs();
  const now = useNow(10_000);
  const { value: todos, setValue: setTodos } = useTodos();
  const { value: journal, setValue: setJournal } = useJournal();
  const { value: fasting, setValue: setFasting } = useFasting();
  const { value: goal, setValue: setGoal } = useGoalState();
  const { value: weightState, setValue: setWeightState } = useSyncedStorage<WeightLossState>(
    "weight-loss",
    DEFAULT_WEIGHT_LOSS_STATE,
  );

  const [task, setTask] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("P2");
  const [note, setNote] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [metricInput, setMetricInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const today = dateKey();
  const safeTodos = todos ?? [];
  const safeJournal = journal ?? {};
  const safeGoal = goal ?? { metricByDay: {}, milestonesByCategory: {} };
  const safeWeight = weightState ?? DEFAULT_WEIGHT_LOSS_STATE;

  const metric = metricFor(prefs);
  const todayMetric = safeGoal.metricByDay?.[today] ?? 0;

  const fastSt = fasting ?? { protocolId: "16-8", phase: "fasting" as const, startedAt: null };
  const protocol = protocolById(fastSt.protocolId);
  const fastDerived = computeFastingState(fastSt, now, protocol.fastHours);
  const isFasting = fastSt.startedAt !== null;

  const currentWeightEntry = safeWeight.entries[today];
  const recovery = safeWeight.recoveryByDay[today];

  const saveTask = () => {
    const text = task.trim();
    if (!text) return;
    const next: Todo = {
      id: `t_${Date.now().toString(36)}`,
      text,
      done: false,
      date: today,
      priority,
      tag: "Goal",
      createdAt: Date.now(),
    };
    setTodos([...safeTodos, next]);
    setTask("");
    setMessage("Task added to Today");
  };

  const saveNote = () => {
    const text = note.trim();
    if (!text) return;
    const previous = safeJournal[today];
    setJournal({
      ...safeJournal,
      [today]: {
        win: previous?.win ?? "",
        learned: previous?.learned ?? "",
        focus: text,
        updatedAt: Date.now(),
      },
    });
    setNote("");
    setMessage("Note saved to Today");
  };

  const toggleFast = () => {
    if (isFasting) {
      setFasting({ ...fastSt, startedAt: null });
      setMessage("Fast ended and saved to history");
    } else {
      setFasting({ protocolId: fastSt.protocolId, phase: "fasting", startedAt: Date.now() });
      setMessage("Fasting window started");
    }
  };

  const saveWeight = () => {
    const nextWeight = Number(weightInput);
    if (!Number.isFinite(nextWeight) || nextWeight <= 0) return;
    setWeightState({
      ...safeWeight,
      entries: {
        ...safeWeight.entries,
        [today]: {
          weightKg: inputToKg(nextWeight, prefs.weightUnit),
          updatedAt: now,
        },
      },
    });
    setWeightInput("");
    setMessage("Weigh-in recorded for today");
  };

  const saveRecovery = (field: "energy" | "sleep" | "soreness", score: (typeof SCALE)[number]) => {
    const updatedAt = now;
    const existing = recovery ?? { energy: 3, sleep: 3, soreness: 3, updatedAt };
    setWeightState({
      ...safeWeight,
      recoveryByDay: {
        ...safeWeight.recoveryByDay,
        [today]: { ...existing, [field]: score, updatedAt },
      },
    });
    setMessage(`Recovery ${field} score recorded (${score}/5)`);
  };

  const logGoalMetric = (delta: number) => {
    if (!Number.isFinite(delta) || delta === 0) return;
    setGoal({
      ...safeGoal,
      metricByDay: {
        ...(safeGoal.metricByDay ?? {}),
        [today]: Math.max(0, todayMetric + delta),
      },
    });
    setMessage(`Logged +${delta} ${metric.label.toLowerCase()}`);
  };

  return (
    <section data-testid="log-capture" className="space-y-4">
      {message ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400">
          <Check className="h-4 w-4" />
          <span role="status">{message}</span>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Task capture */}
        <div className="border border-border/70 bg-card/60 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ListChecks className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-lg font-bold">Task</h2>
                <p className="mt-1 text-sm text-muted-foreground">Give Today one concrete move.</p>
              </div>
            </div>
            <div className="flex gap-1">
              {(["P1", "P2", "P3"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "rounded px-2 py-0.5 font-mono text-[10px] font-bold transition-colors",
                    priority === p
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              aria-label="Task to log"
              className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. Send the application"
              value={task}
              onChange={(event) => setTask(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && saveTask()}
            />
            <button
              type="button"
              onClick={saveTask}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground hover:opacity-95"
            >
              Save
            </button>
          </div>
        </div>

        {/* Fasting Quick Action */}
        <div className="border border-border/70 bg-card/60 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Timer className="mt-0.5 h-5 w-5 text-[#49e7ff]" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold">Fasting</h2>
                  <span className="rounded-full bg-[#49e7ff]/10 px-2 py-0.5 font-mono text-[10px] text-[#49e7ff]">
                    {protocol.fastHours}h protocol
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isFasting
                    ? `Fasting in progress · ${Math.floor(fastDerived.elapsedMs / 3600000)}h ${Math.floor((fastDerived.elapsedMs % 3600000) / 60000)}m`
                    : "Currently idle · Start when your meal window closes"}
                </p>
              </div>
            </div>
            <Link
              href="/intermittent-fasting"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Open fasting page"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFast}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-xs font-bold transition-all",
                isFasting
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : "bg-[#49e7ff] text-[#071014] hover:opacity-95",
              )}
            >
              <Timer className="h-3.5 w-3.5" />
              {isFasting ? "End Fast Window" : "Start Fast Now"}
            </button>
            <Link
              href="/intermittent-fasting"
              className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              View History
            </Link>
          </div>
        </div>

        {/* Weight & Recovery Quick Action */}
        <div className="border border-border/70 bg-card/60 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Scale className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-lg font-bold">Weight & Recovery</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentWeightEntry
                    ? `Today: ${currentWeightEntry.weightKg} kg logged`
                    : "One 15-second check-in keeps decisions honest."}
                </p>
              </div>
            </div>
            <Link
              href="/weight-loss"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Open weight loss page"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              type="number"
              step="0.1"
              min="20"
              max="300"
              aria-label="Today's weight"
              className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={`Weigh-in (${prefs.weightUnit})…`}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveWeight()}
            />
            <button
              type="button"
              onClick={saveWeight}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground hover:opacity-95"
            >
              Log
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground">Energy:</span>
            <div className="flex gap-1">
              {SCALE.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => saveRecovery("energy", s)}
                  className={cn(
                    "h-6 w-6 rounded-full border text-[10px] font-bold transition-colors",
                    recovery?.energy === s
                      ? "border-[#c8ff3d] bg-[#c8ff3d] text-[#071014]"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground ml-2">Sleep:</span>
            <div className="flex gap-1">
              {SCALE.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => saveRecovery("sleep", s)}
                  className={cn(
                    "h-6 w-6 rounded-full border text-[10px] font-bold transition-colors",
                    recovery?.sleep === s
                      ? "border-[#49e7ff] bg-[#49e7ff] text-[#071014]"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Goal / Metric Quick Action */}
        <div className="border border-border/70 bg-card/60 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <TrendingUp className="mt-0.5 h-5 w-5 text-[#c8ff3d]" />
              <div>
                <h2 className="font-display text-lg font-bold">Goal Progress</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Today: {todayMetric} / {metric.target} {metric.label.toLowerCase()}
                </p>
              </div>
            </div>
            <Link href="/goal" className="text-muted-foreground hover:text-foreground" aria-label="Open goals page">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => logGoalMetric(1)}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border px-3 text-xs font-bold hover:border-primary hover:text-primary"
            >
              <Plus className="h-3 w-3" /> 1 {metric.label}
            </button>
            <button
              type="button"
              onClick={() => logGoalMetric(5)}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border px-3 text-xs font-bold hover:border-primary hover:text-primary"
            >
              <Plus className="h-3 w-3" /> 5 {metric.label}
            </button>
            <div className="flex gap-1">
              <input
                type="number"
                min="1"
                placeholder="Custom…"
                value={metricInput}
                onChange={(e) => setMetricInput(e.target.value)}
                className="w-20 rounded-lg border border-input bg-background px-2 py-1.5 text-xs tabular-nums outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const val = Number(metricInput);
                  if (val > 0) {
                    logGoalMetric(val);
                    setMetricInput("");
                  }
                }}
                className="rounded-lg bg-primary px-2.5 text-xs font-bold text-primary-foreground"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Quick Launcher Card */}
      <Link
        href="/workout-tracking"
        className="group flex items-center justify-between border border-border/70 bg-card/60 p-4 transition-colors hover:border-primary/70 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <Dumbbell className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-bold">Workout Session</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Open today&apos;s structured split, record sets, weights & rest timers.
            </p>
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>

      {/* Note & Reflection Capture */}
      <div className="border border-border/70 bg-card/60 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-bold">Note & Reflection</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Capture one thought, win, or focus before it slips away.
            </p>
          </div>
        </div>
        <textarea
          aria-label="Note to log"
          className="mt-4 min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="What should you remember from today?"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <button
          type="button"
          onClick={saveNote}
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground hover:opacity-95"
        >
          <Check className="h-3.5 w-3.5" /> Save note
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        {prefs.goalTitle || "Your captures stay private and sync through your existing tracker store when connected."}
      </p>
    </section>
  );
}

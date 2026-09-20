"use client";

import { useEffect, useMemo, useState } from "react";
import TrackerShell from "@/components/trackers/TrackerShell";
import Stat from "@/components/trackers/Stat";
import Segmented from "@/components/trackers/Segmented";
import Modal from "@/components/trackers/Modal";
import EmptyState from "@/components/trackers/EmptyState";
import MiniBars from "@/components/trackers/MiniBars";
import RestTimer from "@/components/trackers/RestTimer";
import RequireAuth from "@/components/auth/RequireAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { SyncBadge } from "@/components/auth/AuthButton";
import { useUserPrefs, type CustomSplitDay } from "@/lib/user-prefs";
import {
  type Exercise,
  type ExerciseLog,
  type WeightUnit,
  dateKey,
  displayToKg,
  est1RM,
  exercisesForDay,
  formatWeight,
  kgToDisplay,
  lastSessionFor,
  prFor,
  splitDayTabs,
  suggestedDayId,
  weeklyWorkoutStats,
  workoutSessionDates,
} from "@/lib/trackers";
import {
  type ExerciseLibrary,
  useExerciseLibrary,
  useMigrateWorkouts,
  useWorkouts,
} from "@/lib/tracker-store";
import { cn } from "@/lib/utils";
import SignalPanel from "@/components/trackers/SignalPanel";
import StoryPanel from "@/components/trackers/StoryPanel";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  History,
  Pencil,
  Plus,
  Trash2,
  Timer as TimerIcon,
  X,
} from "lucide-react";

type DayLog = Record<string, ExerciseLog>;

export default function WorkoutPage() {
  useMigrateWorkouts();
  const { prefs, setPrefs } = useUserPrefs();
  const { value: logs, setValue: setLogs, status } = useWorkouts();
  const { value: library, setValue: setLibrary } = useExerciseLibrary();

  const safeLogs = useMemo(() => logs ?? {}, [logs]);
  const safeLibrary: ExerciseLibrary = useMemo(() => library ?? {}, [library]);
  const unit: WeightUnit = prefs.weightUnit === "lbs" ? "lbs" : "kg";

  const tabs = useMemo(
    () => splitDayTabs(prefs.workoutSplit, prefs.customSplitDays as CustomSplitDay[]),
    [prefs.workoutSplit, prefs.customSplitDays],
  );
  const suggested = useMemo(() => suggestedDayId(tabs), [tabs]);

  const [activeDay, setActiveDay] = useState<string | null>(null);
  const dayId = activeDay ?? suggested;
  const exercises = useMemo(
    () => exercisesForDay(prefs.workoutSplit, dayId, safeLibrary),
    [prefs.workoutSplit, dayId, safeLibrary],
  );

  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState(() => dateKey());
  const [restTimer, setRestTimer] = useState<{ seconds: number } | null>(null);
  const [exModal, setExModal] = useState<{ mode: "add" } | { mode: "edit"; index: number } | null>(null);

  // Custom split day builder state
  const [dayBuilderOpen, setDayBuilderOpen] = useState(false);
  const [newDayLabel, setNewDayLabel] = useState("");

  const today = dateKey();
  const dayLog: DayLog = safeLogs[selected] ?? {};
  const doneCount = exercises.filter((e) => dayLog[e.id]?.done).length;
  const dayPct = exercises.length ? Math.round((doneCount / exercises.length) * 100) : 0;

  // ── log mutation helpers ──
  const updateCell = (exId: string, patch: Partial<ExerciseLog>) => {
    const prev = dayLog[exId] ?? { done: false, sets: [] };
    setLogs({ ...safeLogs, [selected]: { ...dayLog, [exId]: { ...prev, ...patch } } });
  };

  const toggleDone = (exId: string) => {
    const cell = dayLog[exId];
    const wasDone = cell?.done;
    const next: ExerciseLog = {
      done: !wasDone,
      sets: cell?.sets ?? [],
      minutes: cell?.minutes,
    };
    // Completing a set-heavy exercise with no sets yet seeds the target rows.
    if (!wasDone && next.sets.length === 0) {
      const ex = exercises.find((e) => e.id === exId);
      if (ex?.unit === "reps") {
        next.sets = Array.from({ length: ex.targetSets }, () => ({
          reps: ex.targetReps ?? 10,
          weightKg: ex.suggestedWeightKg ?? null,
        }));
      }
    }
    updateCell(exId, next);
    if (!wasDone) setRestTimer({ seconds: 90 });
  };

  const setSetField = (exId: string, idx: number, field: "reps" | "weightKg", value: number | null) => {
    const cell = dayLog[exId];
    if (!cell) return;
    const sets = cell.sets.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    updateCell(exId, { sets });
  };

  const addSet = (exId: string) => {
    const cell = dayLog[exId];
    const ex = exercises.find((e) => e.id === exId);
    const last = cell?.sets[cell.sets.length - 1];
    const seed = last ?? { reps: ex?.targetReps ?? 10, weightKg: ex?.suggestedWeightKg ?? null };
    updateCell(exId, { sets: [...(cell?.sets ?? []), { ...seed }] });
  };

  const removeSet = (exId: string, idx: number) => {
    const cell = dayLog[exId];
    if (!cell) return;
    updateCell(exId, { sets: cell.sets.filter((_, i) => i !== idx) });
  };

  const setMinutes = (exId: string, minutes: number) => updateCell(exId, { minutes, done: true });

  const prefillLastSession = (exId: string) => {
    const last = lastSessionFor(safeLogs, exId, selected);
    if (!last) return;
    updateCell(exId, { sets: last.sets.map((s) => ({ ...s })), done: true });
  };

  // ── exercise library CRUD ──
  const saveExercise = (ex: Exercise, mode: "add" | "edit", editIndex?: number) => {
    const current = exercisesForDay(prefs.workoutSplit, dayId, safeLibrary);
    let next: Exercise[];
    if (mode === "add") {
      next = [...current, ex];
    } else {
      next = current.map((e, i) => (i === editIndex ? ex : e));
    }
    setLibrary({ ...safeLibrary, [dayId]: next });
  };

  const deleteExercise = (index: number) => {
    const current = exercisesForDay(prefs.workoutSplit, dayId, safeLibrary);
    setLibrary({ ...safeLibrary, [dayId]: current.filter((_, i) => i !== index) });
  };

  const moveExercise = (index: number, dir: -1 | 1) => {
    const current = exercisesForDay(prefs.workoutSplit, dayId, safeLibrary);
    const j = index + dir;
    if (j < 0 || j >= current.length) return;
    const next = [...current];
    [next[index], next[j]] = [next[j], next[index]];
    setLibrary({ ...safeLibrary, [dayId]: next });
  };

  // ── custom split day builder ──
  const addCustomDay = () => {
    const label = newDayLabel.trim() || `Day ${prefs.customSplitDays.length + 1}`;
    const id = `day-${Date.now().toString(36)}`;
    setPrefs({ ...prefs, customSplitDays: [...prefs.customSplitDays, { id, label }] });
    setNewDayLabel("");
    setActiveDay(id);
  };

  const renameCustomDay = (id: string, label: string) => {
    setPrefs({
      ...prefs,
      customSplitDays: prefs.customSplitDays.map((d) => (d.id === id ? { ...d, label } : d)),
    });
  };

  const deleteCustomDay = (id: string) => {
    if (prefs.customSplitDays.length <= 1) return;
    const next = prefs.customSplitDays.filter((d) => d.id !== id);
    setPrefs({ ...prefs, customSplitDays: next });
    const libNext = { ...safeLibrary };
    delete libNext[id];
    setLibrary(libNext);
    if (dayId === id) setActiveDay(next[0]?.id ?? null);
  };

  // ── stats ──
  const weekSessions = useMemo(() => weeklyWorkoutStats(safeLogs, 1)[0]?.sessions ?? 0, [safeLogs]);
  const volumeBars = useMemo(
    () => weeklyWorkoutStats(safeLogs, 4).map((w) => ({ label: w.label, value: w.volumeKg })),
    [safeLogs],
  );
  const sessionDates = useMemo(() => new Set(workoutSessionDates(safeLogs)), [safeLogs]);
  const weekDaysForStrip = useMemo(() => {
    const out: Date[] = [];
    const now = new Date();
    const day = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + weekOffset * 7);
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      out.push(d);
    }
    return out;
  }, [weekOffset]);

  const prs = useMemo(() => {
    return exercises
      .map((e) => ({ ex: e, pr: prFor(safeLogs, e.id) }))
      .filter((x) => x.pr !== null)
      .sort((a, b) => b.pr!.e1rm - a.pr!.e1rm);
  }, [exercises, safeLogs]);

  return (
    <RequireAuth>
      <TrackerShell
        icon="workout"
        title="Workout Tracking"
        subtitle="Split-aware sessions with structured set logging, last-session prefill, PR tracking and a built-in rest timer."
        badge={<SyncBadge status={status} />}
      >
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.6fr]">
          <StoryPanel
            eyebrow="Current chapter"
            title={tabs.find((t) => t.id === dayId)?.label ?? "Training session"}
            action={<a href="#exercise-logger" className="dossier-back-link">Log sets</a>}
          >
            {dayPct === 100
              ? "Session complete. Record the win, then let recovery set up the next progression."
              : `${doneCount} of ${exercises.length} exercises complete. Follow the suggested day and build the next rep.`}
          </StoryPanel>
          <SignalPanel
            label="Session signal"
            value={`${dayPct}%`}
            detail={`${weekSessions} session${weekSessions === 1 ? "" : "s"} logged`}
            progress={dayPct}
            tone="lime"
          />
        </div>
        {/* ── Header controls: split day tabs + unit toggle ── */}
        <Card variant="dossier" id="exercise-logger">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {prefs.workoutSplit === "push-pull-legs"
                  ? "Push · Pull · Legs"
                  : prefs.workoutSplit === "upper-lower"
                    ? "Upper · Lower"
                    : prefs.workoutSplit === "custom"
                      ? "Custom split"
                      : "Full Body"}
              </p>
              <div className="flex items-center gap-2">
                {prefs.workoutSplit === "custom" && (
                  <Button variant="outline" size="sm" onClick={() => setDayBuilderOpen(true)}>
                    <Dumbbell className="mr-1 h-3.5 w-3.5" /> Days
                  </Button>
                )}
                <Segmented
                  label="Weight unit"
                  variant="soft"
                  options={[
                    { value: "kg", label: "kg" },
                    { value: "lbs", label: "lbs" },
                  ]}
                  value={unit}
                  onChange={(u) => setPrefs({ ...prefs, weightUnit: u as WeightUnit })}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveDay(t.id)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                    dayId === t.id
                      ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    t.id === suggested && dayId !== t.id && "ring-1 ring-primary/40",
                  )}
                  title={t.label}
                >
                  {t.short}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {tabs.find((t) => t.id === dayId)?.label} · ring marks today&apos;s suggestion
            </p>
          </CardContent>
        </Card>

        {/* ── Week strip ── */}
        <Card variant="dossier">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Prev
              </Button>
              <p className="text-sm font-semibold">
                {weekOffset === 0 ? "This week" : weekOffset > 0 ? `+${weekOffset} wk` : `${weekOffset} wk`}
              </p>
              <Button variant="outline" size="sm" disabled={weekOffset >= 0} onClick={() => setWeekOffset((w) => w + 1)}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {weekDaysForStrip.map((d) => {
                const k = dateKey(d);
                const isToday = k === today;
                const logged = sessionDates.has(k);
                const isSel = k === selected;
                return (
                  <button
                    key={k}
                    onClick={() => setSelected(k)}
                    className={cn(
                      "rounded-xl border px-1 py-2 text-center transition-all",
                      isSel ? "border-primary bg-primary/10 font-semibold shadow-sm" : "border-border/60 hover:bg-accent",
                      isToday && !isSel && "ring-1 ring-primary/40",
                    )}
                  >
                    <span className="block text-[10px] uppercase text-muted-foreground">
                      {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                    </span>
                    <span className="block text-sm tabular-nums">{d.getDate()}</span>
                    <span className={cn("mx-auto mt-1 block h-1.5 w-1.5 rounded-full", logged ? "bg-emerald-500" : "bg-muted")} />
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Done today" value={`${doneCount}/${exercises.length}`} />
              <Stat label="Sessions wk" value={`${weekSessions}`} />
              <Stat label="Complete" value={`${dayPct}%`} accent />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all" style={{ width: `${dayPct}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* ── Exercise logger ── */}
        <Card variant="dossier">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">Session · {selected}</h2>
              <Button variant="outline" size="sm" onClick={() => setExModal({ mode: "add" })}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Exercise
              </Button>
            </div>

            {exercises.length === 0 ? (
              <EmptyState
                icon={Dumbbell}
                title="No exercises on this day yet"
                hint="Add your first exercise — name, target sets and reps. It becomes part of this split day."
                action={
                  <Button size="sm" onClick={() => setExModal({ mode: "add" })}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add exercise
                  </Button>
                }
              />
            ) : (
              exercises.map((ex, idx) => (
                <ExerciseCard
                  key={ex.id}
                  ex={ex}
                  index={idx}
                  log={dayLog[ex.id]}
                  unit={unit}
                  logs={safeLogs}
                  selected={selected}
                  onToggle={() => toggleDone(ex.id)}
                  onSetField={(i, f, v) => setSetField(ex.id, i, f, v)}
                  onAddSet={() => addSet(ex.id)}
                  onRemoveSet={(i) => removeSet(ex.id, i)}
                  onMinutes={(m) => setMinutes(ex.id, m)}
                  onPrefill={() => prefillLastSession(ex.id)}
                  onEdit={() => setExModal({ mode: "edit", index: idx })}
                  onDelete={() => deleteExercise(idx)}
                  onMove={(dir) => moveExercise(idx, dir)}
                  onRest={(s) => setRestTimer({ seconds: s })}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* ── PRs + volume ── */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Card variant="dossier">
            <CardContent className="p-5">
              <h2 className="font-display font-bold">Personal records</h2>
              {prs.length === 0 ? (
                <div className="mt-3">
                  <EmptyState icon={History} title="No PRs yet" hint="Log weighted sets — your best lift per exercise shows up here." />
                </div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {prs.slice(0, 6).map(({ ex, pr }) => (
                    <li key={ex.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate font-medium">{ex.name}</span>
                      <span className="shrink-0 text-right">
                        <span className="font-display font-bold tabular-nums text-primary">{formatWeight(pr!.weightKg, unit)}</span>
                        <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                          ×{pr!.reps} · e1RM {Math.round(kgToDisplay(pr!.e1rm, unit))}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card variant="dossier">
            <CardContent className="p-5">
              <h2 className="font-display font-bold">Weekly volume</h2>
              <p className="text-xs text-muted-foreground">Total kg lifted per week (reps count for bodyweight)</p>
              <MiniBars className="mt-3" data={volumeBars} height={72} highlightLast />
              <p className="mt-2 text-xs text-muted-foreground">
                {formatWeight(volumeBars[3]?.value ?? 0, unit).replace(" kg", " kg total").replace(" lbs", " lbs total")} this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Exercise add/edit modal ── */}
        {exModal && (
          <ExerciseModal
            mode={exModal.mode}
            initial={exModal.mode === "edit" ? exercises[exModal.index] : undefined}
            unit={unit}
            onClose={() => setExModal(null)}
            onSave={(ex) => {
              saveExercise(ex, exModal.mode, exModal.mode === "edit" ? exModal.index : undefined);
              setExModal(null);
            }}
          />
        )}

        {/* ── Custom split day builder ── */}
        <Modal
          open={dayBuilderOpen}
          onClose={() => setDayBuilderOpen(false)}
          title="Custom split days"
          footer={
            <div className="flex gap-2">
              <Input
                placeholder="New day name (e.g. Arms & Core)"
                value={newDayLabel}
                onChange={(e) => setNewDayLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomDay()}
              />
              <Button size="sm" onClick={addCustomDay}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          }
        >
          <ul className="space-y-2">
            {prefs.customSplitDays.map((d) => (
              <li key={d.id} className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2">
                <Input
                  className="h-8 text-sm"
                  value={d.label}
                  onChange={(e) => renameCustomDay(d.id, e.target.value)}
                />
                <button
                  onClick={() => deleteCustomDay(d.id)}
                  aria-label={`Delete ${d.label}`}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Each day gets its own tab and its own exercise list. Deleting a day removes its exercises too.
          </p>
        </Modal>

        {/* ── Rest timer ── */}
        {restTimer && (
          <RestTimer
            seconds={restTimer.seconds}
            onClose={() => setRestTimer(null)}
          />
        )}
      </TrackerShell>
    </RequireAuth>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise card: structured set rows + last-session prefill
// ─────────────────────────────────────────────────────────────────────────────

function ExerciseCard({
  ex,
  index,
  log,
  unit,
  logs,
  selected,
  onToggle,
  onSetField,
  onAddSet,
  onRemoveSet,
  onMinutes,
  onPrefill,
  onEdit,
  onDelete,
  onMove,
  onRest,
}: {
  ex: Exercise;
  index: number;
  log: ExerciseLog | undefined;
  unit: WeightUnit;
  logs: Record<string, DayLog>;
  selected: string;
  onToggle: () => void;
  onSetField: (idx: number, field: "reps" | "weightKg", value: number | null) => void;
  onAddSet: () => void;
  onRemoveSet: (idx: number) => void;
  onMinutes: (m: number) => void;
  onPrefill: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onRest: (seconds: number) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const last = useMemo(() => lastSessionFor(logs, ex.id, selected), [logs, ex.id, selected]);
  const done = log?.done ?? false;
  const isMinutes = ex.unit === "minutes";

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-all",
        done ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <span className="truncate">{ex.name}</span>
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {ex.tag}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {isMinutes
              ? `Target: ${ex.targetMinutes ?? 0} min`
              : `Target: ${ex.targetSets} × ${ex.targetReps}${ex.suggestedWeightKg ? ` @ ${formatWeight(ex.suggestedWeightKg, unit)}` : ""}`}{" "}
            · {ex.hint}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setShowActions((v) => !v)}
            aria-label="Exercise options"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onToggle}
            aria-label={`Mark ${ex.name} done`}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border text-sm transition-all active:scale-90",
              done ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40 hover:border-foreground",
            )}
          >
            {done ? <Check className="h-4 w-4" /> : ""}
          </button>
        </div>
      </div>

      {/* last session hint + prefill */}
      {last && !done && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            <History className="mr-1 inline h-3 w-3" />
            Last: {last.sets.map((s) => `${formatWeight(s.weightKg, unit)} × ${s.reps}`).join(", ")}{" "}
            <span className="tabular-nums">({last.date.slice(5)})</span>
          </p>
          <button
            onClick={onPrefill}
            className="shrink-0 text-xs font-semibold text-primary transition-colors hover:underline"
          >
            Prefill
          </button>
        </div>
      )}

      {/* minutes input */}
      {isMinutes ? (
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder={`Minutes (target ${ex.targetMinutes ?? 0})`}
            value={log?.minutes ?? ""}
            onChange={(e) => onMinutes(Number(e.target.value) || 0)}
            className="tabular-nums"
          />
          <span className="shrink-0 text-xs text-muted-foreground">min</span>
        </div>
      ) : (
        log?.sets && log.sets.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            {log.sets.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Set {i + 1}
                </span>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  placeholder="kg"
                  className="h-8 w-24 tabular-nums"
                  aria-label={`Set ${i + 1} weight`}
                  value={s.weightKg == null ? "" : kgToDisplay(s.weightKg, unit)}
                  onChange={(e) => {
                    const v = e.target.value === "" ? null : displayToKg(Number(e.target.value) || 0, unit);
                    onSetField(i, "weightKg", v);
                  }}
                />
                <span className="shrink-0 text-xs text-muted-foreground">{unit} ×</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="reps"
                  className="h-8 w-20 tabular-nums"
                  aria-label={`Set ${i + 1} reps`}
                  value={s.reps || ""}
                  onChange={(e) => onSetField(i, "reps", Number(e.target.value) || 0)}
                />
                <button
                  onClick={() => onRemoveSet(i)}
                  aria-label={`Remove set ${i + 1}`}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-0.5">
              <Button variant="outline" size="sm" onClick={onAddSet}>
                <Plus className="mr-1 h-3 w-3" /> Set
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onRest(90)}>
                <Clock className="mr-1 h-3 w-3" /> Rest 90s
              </Button>
            </div>
          </div>
        )
      )}

      {showActions && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/40 p-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onMove(-1)} disabled={index === 0}>
            <ArrowUp className="mr-1 h-3 w-3" /> Up
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onMove(1)}>
            <ArrowDown className="mr-1 h-3 w-3" /> Down
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-500">
            <Trash2 className="mr-1 h-3 w-3" /> Delete
          </Button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise add/edit modal
// ─────────────────────────────────────────────────────────────────────────────

function ExerciseModal({
  mode,
  initial,
  unit,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  initial?: Exercise;
  unit: WeightUnit;
  onClose: () => void;
  onSave: (ex: Exercise) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [tag, setTag] = useState<Exercise["tag"]>(initial?.tag ?? "compound");
  const [targetSets, setTargetSets] = useState(String(initial?.targetSets ?? 3));
  const [targetReps, setTargetReps] = useState(String(initial?.targetReps ?? 10));
  const [targetMinutes, setTargetMinutes] = useState(String(initial?.targetMinutes ?? 8));
  const [isMinutes, setIsMinutes] = useState(initial?.unit === "minutes");
  const [weight, setWeight] = useState(
    initial?.suggestedWeightKg != null ? String(Math.round(kgToDisplay(initial.suggestedWeightKg, unit) * 10) / 10) : "",
  );
  const [hint, setHint] = useState(initial?.hint ?? "");

  const valid = name.trim().length > 0;

  const save = () => {
    if (!valid) return;
    const ex: Exercise = {
      id: initial?.id ?? `ex_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      unit: isMinutes ? "minutes" : "reps",
      targetSets: Math.max(1, Number(targetSets) || 3),
      targetReps: isMinutes ? undefined : Math.max(1, Number(targetReps) || 10),
      targetMinutes: isMinutes ? Math.max(1, Number(targetMinutes) || 8) : undefined,
      suggestedWeightKg: weight === "" ? undefined : displayToKg(Number(weight) || 0, unit),
      tag,
      hint: hint.trim(),
    };
    onSave(ex);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === "add" ? "Add exercise" : "Edit exercise"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={!valid}>
            {mode === "add" ? "Add exercise" : "Save changes"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input className="mt-1.5" placeholder="e.g. Incline Dumbbell Press" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <div className="mt-1.5">
            <Segmented
              label="Exercise type"
              variant="soft"
              options={[
                { value: "reps", label: "Weight × Reps" },
                { value: "minutes", label: "Timed" },
              ]}
              value={isMinutes ? "minutes" : "reps"}
              onChange={(v) => setIsMinutes(v === "minutes")}
            />
          </div>
        </div>
        {!isMinutes ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Target sets</label>
              <Input className="mt-1.5 tabular-nums" type="number" min={1} max={10} value={targetSets} onChange={(e) => setTargetSets(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Target reps</label>
              <Input className="mt-1.5 tabular-nums" type="number" min={1} max={50} value={targetReps} onChange={(e) => setTargetReps(e.target.value)} />
            </div>
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium">Target minutes</label>
            <Input className="mt-1.5 tabular-nums" type="number" min={1} max={120} value={targetMinutes} onChange={(e) => setTargetMinutes(e.target.value)} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Suggested weight ({unit})</label>
            <Input className="mt-1.5 tabular-nums" type="number" min={0} step="0.5" placeholder="optional" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <div className="mt-1.5">
              <Segmented
                label="Exercise category"
                variant="soft"
                options={[
                  { value: "compound", label: "Compound" },
                  { value: "isolation", label: "Isolation" },
                ]}
                value={tag === "compound" ? "compound" : "isolation"}
                onChange={(v) => setTag(v as Exercise["tag"])}
              />
            </div>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Hint</label>
          <Input className="mt-1.5" placeholder="e.g. Elbows tucked, control the negative" value={hint} onChange={(e) => setHint(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
